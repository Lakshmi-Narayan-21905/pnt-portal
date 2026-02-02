import React, { useState, useEffect } from 'react';
import { Users, Plus, Eye, EyeOff, Download, Search } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
            const user = await AdminAuthService.createUser(
                formData.email,
                formData.password
            );

            await UserService.createUserProfile({
                uid: user.uid,
                email: formData.email,
                displayName: formData.displayName,
                role: 'DEPT_COORDINATOR',
                department: formData.department,
                profileCompleted: true,
                createdAt: Date.now()
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
                <div className="flex items-center space-x-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search coordinators..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-64 transition"
                        />
                    </div>
                    <button
                        onClick={() => {
                            const exportData = coordinators.map(c => ({
                                Name: c.displayName,
                                Email: c.email,
                                Department: c.department
                            }));
                            import('../../utils/excelParser').then(mod => {
                                mod.ExcelParser.exportToExcel(exportData, 'Coordinators_List');
                            });
                        }}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        title="Export List"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Export
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Coordinator
                    </button>
                </div>

            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coordinators.filter(coord =>
                        coord.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        coord.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        coord.department?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && <p className="text-gray-500 col-span-full text-center">No coordinators found.</p>}
                    {coordinators.filter(coord =>
                        coord.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        coord.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        coord.department?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((coord) => (
                        <div key={coord.uid} className="bg-white/60 backdrop-blur-xl p-6 rounded-xl shadow-sm border border-white/50 flex flex-col items-center hover:shadow-lg hover:shadow-brand-green-emerald/10 transition group">
                            <div className="w-20 h-20 rounded-full bg-brand-green-ice flex items-center justify-center mb-4 relative shadow-inner">
                                {coord.photoURL ? (
                                    <img src={coord.photoURL} alt={coord.displayName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-brand-green-primary">{coord.displayName.charAt(0)}</span>
                                )}
                                <div className="absolute bottom-0 right-0 p-1.5 bg-brand-green-primary rounded-full border-2 border-white shadow-sm">
                                    <Users className="w-3 h-3 text-white" />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900">{coord.displayName}</h3>
                            <p className="text-gray-500 text-sm mb-3">{coord.email}</p>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-brand-green-ice text-brand-green-dark text-xs font-semibold rounded-full border border-brand-green-mint/20">
                                    {coord.department}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Dept Coordinator">
                <form onSubmit={handleCreateCoordinator} className="space-y-4">
                    <input required placeholder="Full Name" className="input-field" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
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

                    <button disabled={creating} type="submit" className="w-full py-2.5 bg-brand-green-primary text-white font-bold rounded-lg hover:bg-brand-green-dark transition shadow-lg shadow-brand-green-primary/30 mt-4 disabled:opacity-70">
                        {creating ? 'Creating...' : 'Create Coordinator'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default ManageCoordinators;
