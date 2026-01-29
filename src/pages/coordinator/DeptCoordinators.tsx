import React, { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import { UserService } from '../../services/userService';
import { AdminAuthService } from '../../services/adminAuthService';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';
import Modal from '../../components/ui/Modal';
import * as XLSX from 'xlsx';

const DeptCoordinators: React.FC = () => {
    const { userProfile } = useAuth();
    const [coordinators, setCoordinators] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);

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

    const handleCreateCoordinator = async (e: React.FormEvent) => {
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
                role: 'CLASS_COORDINATOR',
                department: userProfile.department,
                section: formData.section.toUpperCase(),
                profileCompleted: true, // Coordinators created by Dept Head are auto-verified
                createdAt: Date.now()
            });

            setIsAddModalOpen(false);
            setFormData({ email: '', password: '', displayName: '', section: '' });
            fetchCoordinators();
            alert('Class Coordinator created successfully');
        } catch (error: any) {
            console.error(error);
            alert('Failed to create coordinator: ' + error.message);
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

            if (confirm(`Found ${data.length} records. Create Class Coordinators for ${userProfile.department}?`)) {
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
                alert(`Successfully created ${successCount} coordinators.`);
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

                <div className="flex space-x-2">
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
                        Add Coordinator
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                        ) : coordinators.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center">No coordinators found.</td></tr>
                        ) : (
                            coordinators.map((coord) => (
                                <tr key={coord.uid}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {coord.displayName?.charAt(0)}
                                            </div>
                                            <div className="ml-4 text-sm font-medium text-gray-900">{coord.displayName}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coord.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coord.department} {coord.section ? `(${coord.section})` : ''}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Class Coordinator">
                <form onSubmit={handleCreateCoordinator} className="space-y-4">
                    <input required placeholder="Display Name" className="input-field" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                    <input placeholder="Section (Optional)" className="input-field" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                    <input required type="email" placeholder="Email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input required type="password" placeholder="Password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />

                    <button disabled={creating} type="submit" className="w-full btn-primary mt-4">
                        {creating ? 'Creating...' : 'Create Coordinator'}
                    </button>
                </form>
            </Modal>
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Bulk Upload Class Coordinators">
                <div className="space-y-4 text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-1 text-sm text-gray-500">Upload Excel file with columns: email, password, displayName, section</p>
                        <input type="file" onChange={handleFileUpload} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                    </div>
                    {creating && <p className="text-blue-600">Processing file... Please wait...</p>}
                </div>
            </Modal>
        </div>
    );
};

export default DeptCoordinators;
