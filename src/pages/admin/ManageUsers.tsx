import React, { useState, useEffect } from 'react';
import { Users, Plus, Upload, Search, Download, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { UserService } from '../../services/userService';
import { AdminAuthService } from '../../services/adminAuthService';
import type { UserProfile, UserRole } from '../../types';
import Modal from '../../components/ui/Modal';
import { useAlert } from '../../contexts/AlertContext';
import * as XLSX from 'xlsx';
import { DEPARTMENTS } from '../../utils/constants';

const ROLES: { id: UserRole; label: string }[] = [
    { id: 'PLACEMENT_HEAD', label: 'Placement Heads' },
    { id: 'TRAINING_HEAD', label: 'Training Heads' },
    { id: 'DEPT_COORDINATOR', label: 'Dept. Coordinators' },
    { id: 'CLASS_COORDINATOR', label: 'Class Coordinators' },
    { id: 'STUDENT', label: 'Students' },
];

const ManageUsers: React.FC = () => {
    const [activeTab, setActiveTab] = useState<UserRole>('PLACEMENT_HEAD');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const { showAlert, showConfirm } = useAlert();

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        department: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await UserService.getUsersByRole(activeTab);
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const handleEdit = (user: UserProfile) => {
        setFormData({
            email: user.email,
            password: '', // Don't show password
            displayName: user.displayName,
            department: user.department || '',
        });
        setSelectedUser(user);
        setEditMode(true);
        setIsAddModalOpen(true);
    };

    const handleDelete = async (uid: string, name: string) => {
        if (!await showConfirm(`Are you sure you want to delete ${name}? This cannot be undone.`, 'Delete User', 'Yes, Delete', 'delete')) return;

        try {
            await UserService.deleteUserProfile(uid);
            await showAlert('User deleted successfully', 'success', 'Deleted');
            fetchUsers();
        } catch (error: any) {
            console.error(error);
            await showAlert('Failed to delete: ' + error.message, 'error', 'Error');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            if (editMode && selectedUser) {
                // Update Existing
                await UserService.updateUserProfile(selectedUser.uid, {
                    displayName: formData.displayName,
                    department: formData.department || '',
                });
                await showAlert('User updated successfully', 'success', 'Success');
            } else {
                // Create New
                // 1. Create Auth User
                const user = await AdminAuthService.createUser(
                    formData.email,
                    formData.password
                );

                // 2. Create Firestore Profile
                await UserService.createUserProfile({
                    uid: user.uid,
                    email: formData.email,
                    displayName: formData.displayName,
                    role: activeTab, // Use activeTab for role
                    department: formData.department || '',
                    profileCompleted: true, // Heads are pre-verified
                    createdAt: Date.now()
                });
                await showAlert('User created successfully', 'success', 'Success');
            }

            setIsAddModalOpen(false);
            setFormData({ email: '', password: '', displayName: '', department: '' }); // Reset form data
            setEditMode(false);
            setSelectedUser(null);
            fetchUsers();

        } catch (error: any) {
            console.error(error);
            await showAlert('Operation failed: ' + error.message, 'error', 'Error');
        } finally {
            setCreating(false);
        }
    };

    // Excel Upload Logic
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            if (await showConfirm(`Found ${data.length} records. Create users?`, 'Confirm Upload', 'Yes, Create')) {
                setCreating(true);
                let successCount = 0;
                for (const row of data as any[]) {
                    try {
                        const email = row.email || row.username;
                        const pwd = row.password || 'password123';
                        const name = row.displayName || row.name || 'User';
                        const dept = row.department;

                        const userCredential = await AdminAuthService.createUser(email, pwd);
                        await UserService.createUserProfile({
                            uid: userCredential.uid,
                            email,
                            role: activeTab,
                            displayName: name,
                            department: dept,
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
                fetchUsers();
                await showAlert(`Successfully created ${successCount} users.`, 'success', 'Batch Complete');
            }
        };
        reader.readAsBinaryString(file);
    };

    // Only allow adding for Heads as per request, but let's be flexible visually
    const canAdd = ['PLACEMENT_HEAD', 'TRAINING_HEAD'].includes(activeTab);

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>

                {canAdd && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                const exportData = users.map(u => ({
                                    Name: u.displayName,
                                    Email: u.email,
                                    Department: u.department,
                                    Role: activeTab
                                }));
                                import('../../utils/excelParser').then(mod => {
                                    mod.ExcelParser.exportToExcel(exportData, `${activeTab}_List`);
                                });
                            }}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
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
                            onClick={() => {
                                setEditMode(false);
                                setFormData({ email: '', password: '', displayName: '', department: '' });
                                setIsAddModalOpen(true);
                            }}
                            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    {ROLES.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setActiveTab(role.id)}
                            className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === role.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
                        >
                            {role.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* User List */}
            <div className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-indigo-50/50 backdrop-blur-sm border-b border-indigo-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900/70 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900/70 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900/70 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900/70 uppercase tracking-wider">Role</th>
                                {canAdd && <th className="px-6 py-4 text-right text-xs font-semibold text-indigo-900/70 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-4 text-center">Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center">No users found for this role.</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.uid} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                    <span className="font-bold">{user.displayName?.charAt(0)}</span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {activeTab.replace('_', ' ')}
                                            </span>
                                        </td>
                                        {canAdd && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 hover:bg-indigo-100 rounded transition"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.uid, user.displayName)}
                                                    className="text-red-600 hover:text-red-900 p-1 hover:bg-red-100 rounded transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit User Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditMode(false); }} title={`${editMode ? 'Edit' : 'Add'} ${ROLES.find(r => r.id === activeTab)?.label}`}>
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <input required placeholder="Display Name" className="input-field" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />

                    {!editMode && (
                        <input required type="email" placeholder="Email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    )}

                    {!editMode && (
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
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
                        <select
                            className="input-field"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                        >
                            <option value="">Select Department</option>
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <button disabled={creating} type="submit" className="w-full btn-primary mt-4">
                        {creating ? 'Processing...' : (editMode ? 'Update User' : 'Create User')}
                    </button>
                </form>
            </Modal>

            {/* Upload Modal */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Bulk Upload">
                <div className="space-y-4 text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-1 text-sm text-gray-500">Upload Excel file with columns: email, password, displayName, department</p>
                        <input type="file" onChange={handleFileUpload} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                    </div>
                    {creating && <p className="text-blue-600">Processing file... Please wait...</p>}
                </div>
            </Modal>
        </div>
    );
};

export default ManageUsers;
