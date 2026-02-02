import React, { useState, useEffect } from 'react';
import { useAlert } from '../../contexts/AlertContext';
import { Plus, Upload, Trash2, Search, FileText, Pencil } from 'lucide-react';
import { PlacementRecordService } from '../../services/placementRecordService';
import { UserService } from '../../services/userService';
import type { PlacementRecord } from '../../types';
import Modal from '../../components/ui/Modal';
import * as XLSX from 'xlsx';
import { DEPARTMENTS } from '../../utils/constants';

interface PreviewRecord {
    name: string;
    rollNo: string;
    department: string;
    companyName: string;
    package?: string;
    status: 'PENDING' | 'VALID' | 'ERROR';
    message?: string;
}

const PlacementRecords: React.FC = () => {
    const { showAlert, showConfirm } = useAlert();
    const [records, setRecords] = useState<PlacementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const [selectedRecord, setSelectedRecord] = useState<PlacementRecord | null>(null);
    const [editMode, setEditMode] = useState(false);

    // Manual Form
    const [formData, setFormData] = useState({
        name: '',
        rollNo: '',
        department: '', // Dropdown
        companyName: '',
        package: '',
        academicYear: new Date().getFullYear().toString()
    });

    // Upload & Preview
    const [previewData, setPreviewData] = useState<PreviewRecord[]>([]);
    const [processing, setProcessing] = useState(false);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await PlacementRecordService.getAllRecords();
            setRecords(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleEdit = (record: PlacementRecord) => {
        setSelectedRecord(record);
        setFormData({
            name: record.name,
            rollNo: record.rollNo,
            department: record.department,
            companyName: record.companyName,
            package: record.package || '',
            academicYear: record.academicYear || new Date().getFullYear().toString()
        });
        setEditMode(true);
        setIsAddModalOpen(true);
    };

    // Auto-save (Create or Update)
    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editMode && selectedRecord) {
                // Update
                await PlacementRecordService.updateRecord(selectedRecord.id, {
                    name: formData.name,
                    rollNo: formData.rollNo,
                    department: formData.department,
                    companyName: formData.companyName,
                    package: formData.package,
                    academicYear: formData.academicYear
                });
                await showAlert('Record updated successfully', 'success', 'Success');
            } else {
                // Create
                await PlacementRecordService.addRecord({
                    name: formData.name,
                    rollNo: formData.rollNo,
                    department: formData.department,
                    companyName: formData.companyName,
                    package: formData.package,
                    academicYear: formData.academicYear
                });
                await showAlert('Record added successfully', 'success', 'Success');
            }

            setIsAddModalOpen(false);
            setEditMode(false);
            setSelectedRecord(null);
            setFormData({ name: '', rollNo: '', department: '', companyName: '', package: '', academicYear: new Date().getFullYear().toString() });
            fetchRecords();
        } catch (error: any) {
            console.error(error);
            await showAlert('Failed to save record: ' + error.message, 'error', 'Error');
        } finally {
            setProcessing(false);
        }
    };

    // Excel Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[] = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                // Must handle async inside non-async callback carefully, or just ignore await here since it's fire-and-forget UI
                showAlert("File is empty", "error", "Empty File");
                return;
            }

            // Simple validation logic
            // Allow sloppy headers: "Name" or "Student Name", "Roll No" or "Roll Number", "Dept" or "Department"
            // We map them manually

            const mappedData: PreviewRecord[] = data.map(row => {
                // Try to find fields case-insensitively
                const getField = (keys: string[]) => {
                    const rowKeys = Object.keys(row);
                    const found = rowKeys.find(k => keys.includes(k.toLowerCase().replace(/[\s_.]/g, '')));
                    return found ? row[found] : undefined;
                };

                const name = getField(['name', 'studentname', 'fullname']);
                const rollNo = getField(['rollno', 'regno', 'rollnumber', 'register number']);
                const dept = getField(['dept', 'department', 'branch']);
                const company = getField(['company', 'companyname', 'placedin']);
                const pkg = getField(['package', 'ctc', 'salary']);

                let status: 'PENDING' | 'VALID' | 'ERROR' = 'VALID';
                let message = '';

                if (!name || !rollNo || !dept || !company) {
                    status = 'ERROR';
                    message = 'Missing required fields';
                }

                return {
                    name: name || '',
                    rollNo: rollNo || '',
                    department: dept || '',
                    companyName: company || '',
                    package: pkg ? pkg.toString() : '',
                    status,
                    message
                };
            });

            setPreviewData(mappedData);
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const processUpload = async () => {
        setProcessing(true);
        try {
            const validRecords = previewData.filter(r => r.status === 'VALID');
            if (validRecords.length === 0) {
                await showAlert("No valid records to upload.", "warning", "No Valid Data");
                setProcessing(false);
                return;
            }

            await PlacementRecordService.bulkCreateRecords(validRecords.map(r => ({
                name: r.name,
                rollNo: r.rollNo,
                department: r.department,
                companyName: r.companyName,
                package: r.package,
                academicYear: new Date().getFullYear().toString() // Default to current year for upload
            })));

            // Update User Placement Status for all uploaded students
            // parallel execution
            await Promise.all(validRecords.map(r =>
                UserService.updateUserStatusByRollNo(r.rollNo, 'PLACED')
            ));

            await showAlert(`Successfully uploaded ${validRecords.length} records and updated student statuses.`, 'success', 'Upload Complete');
            setIsUploadModalOpen(false);
            setPreviewData([]);
            fetchRecords();
        } catch (error: any) {
            console.error(error);
            await showAlert('Bulk upload failed: ' + error.message, 'error', 'Upload Failed');
        } finally {
            setProcessing(false);
        }
    };

    // Delete
    const handleDelete = async (id: string) => {
        if (await showConfirm("Are you sure you want to delete this record?", "Confirm Delete", "Yes, Delete", 'delete')) {
            try {
                // Check if this is the last record for this student
                const recordToDelete = records.find(r => r.id === id);

                if (recordToDelete) {
                    const otherRecords = records.filter(r =>
                        r.rollNo.toLowerCase() === recordToDelete.rollNo.toLowerCase() && r.id !== id
                    );

                    if (otherRecords.length === 0) {
                        // Revert status to UNPLACED
                        await UserService.updateUserStatusByRollNo(recordToDelete.rollNo, 'UNPLACED');
                    }
                }

                await PlacementRecordService.deleteRecord(id);
                fetchRecords();
                await showAlert("Record deleted successfully.", "success", "Deleted");
            } catch (error) {
                console.error(error);
                await showAlert("Failed to delete record.", "error", "Error");
            }
        }
    };

    const filteredRecords = records.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Placement Records</h1>
                <div className="flex space-x-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Excel
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Record
                    </button>
                    <button
                        onClick={() => {
                            const exportData = filteredRecords.map(r => ({
                                Name: r.name,
                                RollNo: r.rollNo,
                                Department: r.department,
                                Company: r.companyName,
                                Package: r.package
                            }));
                            import('../../utils/excelParser').then(mod => {
                                mod.ExcelParser.exportToExcel(exportData, 'Placement_Records');
                            });
                        }}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        title="Export Records"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-emerald-50/50 backdrop-blur-sm border-b border-emerald-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-900/70 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-900/70 uppercase tracking-wider">Roll No</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-900/70 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-900/70 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-900/70 uppercase tracking-wider">Package (LPA)</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-emerald-900/70 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredRecords.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center">No records found.</td></tr>
                        ) : (
                            filteredRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.rollNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.companyName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.package || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                                        <button onClick={() => handleEdit(record)} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditMode(false); }} title={`${editMode ? 'Edit' : 'Add'} Placement Record`}>
                <form onSubmit={handleSaveRecord} className="space-y-4">
                    <input required placeholder="Student Name" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <input required placeholder="Roll Number" className="input-field" value={formData.rollNo} onChange={e => setFormData({ ...formData, rollNo: e.target.value })} />
                    <select required className="input-field" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input required placeholder="Company Name" className="input-field" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                    <input placeholder="Package (LPA) - Optional" className="input-field" value={formData.package} onChange={e => setFormData({ ...formData, package: e.target.value })} />

                    <button disabled={processing} type="submit" className="w-full btn-primary mt-4">
                        {processing ? 'Saving...' : (editMode ? 'Update Record' : 'Save Record')}
                    </button>
                </form>
            </Modal>

            {/* Upload Modal */}
            <Modal isOpen={isUploadModalOpen} onClose={() => { setIsUploadModalOpen(false); setPreviewData([]); }} title="Upload Placement Records">
                {previewData.length === 0 ? (
                    <div className="space-y-4 text-center">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-1 text-sm text-gray-500">Upload Excel with headers: Name, Roll No, Dept, Company, Package</p>
                            <input type="file" onChange={handleFileUpload} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <h4 className="font-semibold">Preview ({previewData.length} rows)</h4>
                            <span className="text-sm text-gray-500">{previewData.filter(r => r.status === 'VALID').length} Valid</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Roll No</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Company</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.map((row, idx) => (
                                        <tr key={idx} className={row.status === 'ERROR' ? 'bg-red-50' : ''}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{row.name}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{row.rollNo}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{row.companyName}</td>
                                            <td className="px-4 py-2 text-xs">
                                                <span className={`px-2 py-1 rounded-full font-semibold ${row.status === 'VALID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {row.message || 'Valid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setPreviewData([])} className="px-4 py-2 border rounded-lg">Cancel</button>
                            <button onClick={processUpload} disabled={processing || previewData.every(p => p.status === 'ERROR')} className="btn-primary">
                                {processing ? 'Uploading...' : 'Confirm Upload'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PlacementRecords;
