import React, { useState, useEffect } from 'react';
import { useAlert } from '../../contexts/AlertContext';
import { Plus, Upload, Eye, EyeOff, Pencil, Trash2, Download } from 'lucide-react';
import { UserService } from '../../services/userService';
import { AdminAuthService } from '../../services/adminAuthService';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';
import Modal from '../../components/ui/Modal';
import * as XLSX from 'xlsx';

const DeptCoordinators: React.FC = () => {
    const { showAlert, showConfirm } = useAlert();
    const { userProfile } = useAuth();
    const [coordinators, setCoordinators] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCoord, setSelectedCoord] = useState<UserProfile | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        section: '',
    });

    const fetchCoordinators = async () => {
        if (!userProfile?.department) return;
        setLoading(true);
        try {
            const allCoordinators = await UserService.getUsersByRole('CLASS_COORDINATOR');
            const deptCoordinators = allCoordinators.filter(u => u.department === userProfile.department);
            setCoordinators(deptCoordinators);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoordinators();
    }, [userProfile]);

    const handleEdit = (coord: UserProfile) => {
        setFormData({
            email: coord.email,
            password: '', // Don't show password
            displayName: coord.displayName,
            section: coord.section || '',
        });
        setSelectedCoord(coord);
        setEditMode(true);
        setIsAddModalOpen(true);
    };

    const handleDelete = async (uid: string, name: string) => {
        if (!await showConfirm(`Are you sure you want to delete coordinator ${name}? This cannot be undone.`, 'Delete Coordinator', 'Yes, Delete', 'delete')) return;

        try {
            await UserService.deleteUserProfile(uid);
            await showAlert('Coordinator deleted successfully', 'success', 'Deleted');
            fetchCoordinators();
        } catch (error: any) {
            console.error(error);
            await showAlert('Failed to delete: ' + error.message, 'error', 'Error');
        }
    };

    const handleCreateCoordinator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.department) return;
        setCreating(true);
        try {
            if (editMode && selectedCoord) {
                // Update existing
                await UserService.updateUserProfile(selectedCoord.uid, {
                    displayName: formData.displayName,
                    section: formData.section.toUpperCase(),
                });
                // Note: Not updating email/password here as it requires Admin auth specialized calls usually
                // or re-authentication. For now assuming simple profile update.
                await showAlert('Coordinator updated successfully', 'success', 'Success');
            } else {
                // Create new
                const newUser = await AdminAuthService.createUser(
                    formData.email,
                    formData.password
                );

                await UserService.createUserProfile({
                    uid: newUser.uid,
                    email: formData.email,
                    displayName: formData.displayName,
                    role: 'CLASS_COORDINATOR',
                    department: userProfile.department,
                    section: formData.section.toUpperCase(),
                    profileCompleted: true,
                    createdAt: Date.now()
                });
                await showAlert('Class Coordinator created successfully', 'success', 'Success');
            }

            setIsAddModalOpen(false);
            setFormData({ email: '', password: '', displayName: '', section: '' });
            setEditMode(false);
            setSelectedCoord(null);
            fetchCoordinators();
        } catch (error: any) {
            console.error(error);
            await showAlert('Operation failed: ' + error.message, 'error', 'Error');
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

            if (await showConfirm(`Found ${data.length} records. Create Class Coordinators for ${userProfile.department}?`, 'Confirm Upload', 'Yes, Create')) {
                setCreating(true);
                let successCount = 0;
                for (const row of data) {
                    try {
                        const email = row.email || row.username;
                        const pwd = row.password || 'password123';
                        const name = row.displayName || row.name || 'Coordinator';

                        const newUser = await AdminAuthService.createUser(email, pwd);
                        await UserService.createUserProfile({
                            uid: newUser.uid,
                            email,
                            role: 'CLASS_COORDINATOR',
                            displayName: name,
                            department: userProfile.department,
                            section: row.section ? row.section.toString().toUpperCase() : '',
                            profileCompleted: true,
                            createdAt: Date.now()
                        });
                        successCount++;
                    } catch (err) {
                        console.error("Failed for row:", row, err);
                    }
                }
                setCreating(false);
                setIsUploadModalOpen(false);
                fetchCoordinators();
                await showAlert(`Successfully created ${successCount} coordinators.`, 'success', 'Success');
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Class Coordinators</h1>
                    <p className="text-sm text-gray-500">Department: {userProfile?.department}</p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={() => {
                            const exportData = coordinators.map(c => ({
                                Name: c.displayName,
                                Email: c.email,
                                Department: c.department,
                                Section: c.section
                            }));
                            import('../../utils/excelParser').then(mod => {
                                mod.ExcelParser.exportToExcel(exportData, `${userProfile?.department}_Coordinators`);
                            });
                        }}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        title="Export Coordinators"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-brand-lavender-light text-brand-lavender-dark font-medium rounded-lg hover:bg-brand-lavender-lilac/50 transition border border-brand-lavender-lilac/30"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Excel
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-brand-lavender-primary text-white font-bold rounded-lg hover:bg-brand-lavender-dark transition shadow-lg shadow-brand-lavender-primary/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Coordinator
                    </button>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md shadow-sm border border-white/60 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-brand-lavender-light/30">
                    <thead className="bg-brand-lavender-ice/50">
                        <tr>

                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-lavender-light/30">
                        {loading ? (

                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : coordinators.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">No coordinators found.</td></tr>

                        ) : (
                            coordinators.map((coord) => (
                                <tr key={coord.uid} className="hover:bg-brand-lavender-ice/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-brand-lavender-light flex items-center justify-center text-brand-lavender-primary font-bold shadow-sm border border-brand-lavender-lilac/30">
                                                {coord.displayName?.charAt(0)}
                                            </div>
                                            <div className="ml-4 text-sm font-medium text-gray-900">{coord.displayName}</div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coord.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coord.department} {coord.section ? `(${coord.section})` : ''}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(coord)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coord.uid, coord.displayName)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditMode(false); setFormData({ email: '', password: '', displayName: '', section: '' }); }} title={`${editMode ? 'Edit' : 'Add'} Class Coordinator`}>
                <form onSubmit={handleCreateCoordinator} className="space-y-4">
                    <input required placeholder="Display Name" className="input-field" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                    <input placeholder="Section (Optional)" className="input-field" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />

                    {!editMode && (
                        <>
                            <input required type="email" placeholder="Email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    className="input-field pr-10"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </>
                    )}


                    <button disabled={creating} type="submit" className="w-full btn-primary mt-4">
                        {creating ? 'Processing...' : (editMode ? 'Update Coordinator' : 'Create Coordinator')}

                    </button>
                </form>
            </Modal>
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Bulk Upload Class Coordinators">
                <div className="space-y-4 text-center">
                    <div className="border-2 border-dashed border-brand-lavender-lilac/50 rounded-xl p-8 bg-brand-lavender-ice/30">
                        <Upload className="mx-auto h-12 w-12 text-brand-lavender-lilac" />
                        <p className="mt-2 text-sm text-gray-600">Upload Excel file with columns: email, password, displayName, section</p>
                        <input type="file" onChange={handleFileUpload} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-lavender-light file:text-brand-lavender-dark hover:file:bg-brand-lavender-lilac transition cursor-pointer" />
                    </div>
                    {creating && <p className="text-brand-lavender-primary font-medium">Processing file... Please wait...</p>}
                </div>
            </Modal>
        </div>
    );
};

export default DeptCoordinators;
