import React, { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import type { UserProfile } from '../../types';
import { UserService } from '../../services/userService';
import { AdminAuthService } from '../../services/adminAuthService';
import Modal from '../../components/ui/Modal';
import { DEPARTMENTS } from '../../utils/constants';

const ManageCoordinators: React.FC = () => {
    const [coordinators, setCoordinators] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        department: ''
    });

    const fetchCoordinators = async () => {
        setLoading(true);
        try {
            const data = await UserService.getUsersByRole('DEPT_COORDINATOR');
            setCoordinators(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoordinators();
    }, []);

    const handleCreateCoordinator = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const uid = await AdminAuthService.createUser(formData.email, formData.password);
            await UserService.createUserProfile({
                uid,
                email: formData.email,
                role: 'DEPT_COORDINATOR',
                displayName: formData.displayName,
                department: formData.department,
                profileCompleted: true
            });
            setIsModalOpen(false);
            setFormData({ email: '', password: '', displayName: '', department: '' });
            fetchCoordinators();
            alert('Coordinator created successfully');
        } catch (error: any) {
            alert('Failed: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Placement Coordinators</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Coordinator
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
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
                                            <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                <Users className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{coord.displayName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coord.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coord.email}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Dept Coordinator">
                <form onSubmit={handleCreateCoordinator} className="space-y-4">
                    <input required placeholder="Full Name" className="input-field" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                    <input required type="email" placeholder="Email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input required type="password" placeholder="Password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                            required
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
                        {creating ? 'Creating...' : 'Create Coordinator'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default ManageCoordinators;
