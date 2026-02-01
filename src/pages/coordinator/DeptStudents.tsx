import React, { useState, useEffect } from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import { UserService } from '../../services/userService';
import { AdminAuthService } from '../../services/adminAuthService';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';
import Modal from '../../components/ui/Modal';
import * as XLSX from 'xlsx';

interface PreviewData {
    displayName: string;
    email: string;
    password?: string;
    section?: string;
    status: 'PENDING' | 'EXISTING' | 'SUCCESS' | 'ERROR';
    message?: string;
}

const DeptStudents: React.FC = () => {
    const { userProfile } = useAuth();
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        section: '',
    });

    const [previewData, setPreviewData] = useState<PreviewData[]>([]);
    const [uploadStats, setUploadStats] = useState({ total: 0, success: 0, skipped: 0, failed: 0 });

    const fetchStudents = async () => {
        if (!userProfile?.department) return;
        setLoading(true);
        try {
            // Fetch all students and filter by department
            // In a production app, we should have a query for this, but reusing getByRole is fine for now
            const allStudents = await UserService.getUsersByRole('STUDENT');
            const deptStudents = allStudents.filter(u => u.department === userProfile.department);
            setStudents(deptStudents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [userProfile]);

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.department) return;

        setCreating(true);
        try {
            const newUser = await AdminAuthService.createUser(
                formData.email,
                formData.password
            );

            await UserService.createUserProfile({
                uid: newUser.uid,
                email: formData.email,
                displayName: formData.displayName,
                role: 'STUDENT',
                department: userProfile.department, // Auto-assign Coordinator's Dept
                section: formData.section.toUpperCase(),
                profileCompleted: false,
                createdAt: Date.now()
            });

            setIsAddModalOpen(false);
            setFormData({ email: '', password: '', displayName: '', section: '' });
            fetchStudents();
            alert('Student created successfully');
        } catch (error: any) {
            console.error(error);
            alert('Failed to create student: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userProfile?.department) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data: any[] = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                alert("The uploaded file is empty.");
                return;
            }

            // Validate Columns
            const firstRow = data[0];
            const headers = Object.keys(firstRow);
            const requiredColumns = [
                { id: 'email', aliases: ['email', 'username'] },
                { id: 'password', aliases: ['password'] },
                { id: 'displayName', aliases: ['displayName', 'name'] },
                { id: 'section', aliases: ['section'] }
            ];

            const missingColumns = requiredColumns.filter(col =>
                !col.aliases.some(alias => headers.includes(alias))
            );

            if (missingColumns.length > 0) {
                const missingNames = missingColumns.map(c => c.aliases.join(' or ')).join(', ');
                alert(`Error: The following required columns are missing: ${missingNames}.\nPlease ensure your Excel file matches the required format.`);
                e.target.value = ''; // Reset input
                return;
            }

            // Map and duplicate check against LOCAL list
            const mappedData: PreviewData[] = data.map(row => {
                const email = row.email || row.username;
                const exists = students.some(s => s.email.toLowerCase() === email?.toLowerCase());
                return {
                    displayName: row.displayName || row.name || 'Student',
                    email: email,
                    password: row.password || 'password123',
                    section: row.section ? row.section.toString().toUpperCase() : '',
                    status: exists ? 'EXISTING' : 'PENDING',
                    message: exists ? 'Already in Department' : ''
                };
            });

            setPreviewData(mappedData);
            setUploadStats({ total: mappedData.length, success: 0, skipped: 0, failed: 0 });
            e.target.value = ''; // Reset input to allow re-selection
        };
        reader.readAsBinaryString(file);
    };

    const processUpload = async () => {
        setCreating(true);
        let success = 0;
        let skipped = 0;
        let failed = 0;

        const newPreviewData = [...previewData];

        for (let i = 0; i < newPreviewData.length; i++) {
            const row = newPreviewData[i];

            // Skip if already marked existing locally
            if (row.status === 'EXISTING' || row.status === 'SUCCESS') {
                if (row.status === 'EXISTING') skipped++;
                continue;
            }

            try {
                // Attempt Create
                const newUser = await AdminAuthService.createUser(row.email, row.password || 'password123');

                await UserService.createUserProfile({
                    uid: newUser.uid,
                    email: row.email,
                    role: 'STUDENT',
                    displayName: row.displayName,
                    department: userProfile!.department,
                    section: row.section,
                    profileCompleted: false, // Default for bulk upload
                    createdAt: Date.now()
                });

                newPreviewData[i] = { ...row, status: 'SUCCESS', message: 'Created' };
                success++;
            } catch (error: any) {
                console.error("Upload error for", row.email, error);

                // Handle duplicate auth user
                if (error.code === 'auth/email-already-in-use' || error.message.includes('email-already-in-use')) {
                    newPreviewData[i] = { ...row, status: 'EXISTING', message: 'Email already in Auth' };
                    skipped++;
                } else {
                    newPreviewData[i] = { ...row, status: 'ERROR', message: error.message };
                    failed++;
                }
            }
            // Update UI incrementally if list is huge (optional, here we do it per item or at end, doing per item for feedback)
            setPreviewData([...newPreviewData]);
        }

        setUploadStats({ total: previewData.length, success, skipped, failed });
        setCreating(false);
        fetchStudents();

        if (failed === 0) {
            alert(`Upload Complete!\nSuccess: ${success}\nSkipped: ${skipped}`);
            // Optional: Close modal if all good. 
            // setIsUploadModalOpen(false); 
        } else {
            alert(`Upload Complete with Errors.\nSuccess: ${success}\nSkipped: ${skipped}\nFailed: ${failed}`);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Students</h1>
                    <p className="text-sm text-gray-500">Department: {userProfile?.department}</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            const exportData = students.map(s => ({
                                Name: s.displayName,
                                Email: s.email,
                                Section: s.section,
                                Status: s.profileCompleted ? 'Verified' : 'Pending',
                                CGPA: s.cgpa || 0,
                                Arrears: s.standingArreas || 0
                            }));
                            import('../../utils/excelParser').then(mod => {
                                mod.ExcelParser.exportToExcel(exportData, `${userProfile?.department}_Students`);
                            });
                        }}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        title="Export Student List"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
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
                        Add Student
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center">No students found.</td></tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.uid}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className="flex items-center cursor-pointer group"
                                            onClick={() => setSelectedStudent(student)}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                                {student.displayName?.charAt(0)}
                                            </div>
                                            <div className="ml-4 text-sm font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {student.displayName}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.section || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.profileCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {student.profileCompleted ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Student Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Student">
                <form onSubmit={handleCreateStudent} className="space-y-4">
                    <input required placeholder="Display Name" className="input-field" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                    <input placeholder="Section " className="input-field" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                    <input required type="email" placeholder="Email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input required type="password" placeholder="Password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />

                    <button disabled={creating} type="submit" className="w-full btn-primary mt-4">
                        {creating ? 'Creating...' : 'Create Student'}
                    </button>
                </form>
            </Modal>

            {/* Student Details Modal */}
            <Modal
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                title="Student Profile"
                size="2xl"
            >
                {selectedStudent && (
                    <div className="space-y-6">
                        {/* Personal Details */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-100 pb-1">Personal Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Roll No</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.rollNo}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Full Name</span>
                                    <span className="font-medium text-gray-900 break-words">{selectedStudent.displayName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Email</span>
                                    <span className="font-medium text-gray-900 break-all">{selectedStudent.email}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Phone</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.phone || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Address</span>
                                    <span className="font-medium text-gray-900 break-words">{selectedStudent.address || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Academic Details */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-100 pb-1">Academic Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">Department</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.department}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">Section</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.section || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">CGPA</span>
                                    <span className="font-bold text-indigo-700">{selectedStudent.cgpa || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">Standing Arrears</span>
                                    <span className="font-bold text-red-600">{selectedStudent.standingArreas || 0}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">History of Arrears</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.historyOfArreas || 0}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">10th Mark</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.tenthMark}%</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">12th Mark</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.twelfthMark}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Upload Modal */}
            <Modal isOpen={isUploadModalOpen} onClose={() => { setIsUploadModalOpen(false); setPreviewData([]); }} title="Bulk Upload Students">
                {previewData.length === 0 ? (
                    <div className="space-y-4 text-center">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-1 text-sm text-gray-500">Upload Excel file with columns: email, password, displayName, section</p>
                            <input type="file" onChange={handleFileUpload} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <span className="text-sm font-medium">Total: {uploadStats.total}</span>
                            <div className="space-x-4 text-sm">
                                <span className="text-green-600">Success: {uploadStats.success}</span>
                                <span className="text-yellow-600">Skipped: {uploadStats.skipped}</span>
                                <span className="text-red-600">Failed: {uploadStats.failed}</span>
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.map((row, idx) => (
                                        <tr key={idx} className={row.status === 'EXISTING' ? 'bg-yellow-50' : row.status === 'SUCCESS' ? 'bg-green-50' : ''}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{row.displayName}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{row.email}</td>
                                            <td className="px-4 py-2 text-xs">
                                                <span className={`px-2 py-1 rounded-full font-semibold
                                                    ${row.status === 'PENDING' ? 'bg-gray-100 text-gray-800' : ''}
                                                    ${row.status === 'EXISTING' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                    ${row.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : ''}
                                                    ${row.status === 'ERROR' ? 'bg-red-100 text-red-800' : ''}
                                                `}>
                                                    {row.message || row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                            <button
                                onClick={() => setPreviewData([])}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                                disabled={creating}
                            >
                                Cancel / Re-upload
                            </button>
                            <button
                                onClick={processUpload}
                                disabled={creating || previewData.every(r => r.status !== 'PENDING')}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Processing...' : 'Confirm Upload'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DeptStudents;
