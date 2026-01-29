import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { TrainingService } from '../../services/trainingService';
import type { Training } from '../../types';
import Modal from '../../components/ui/Modal';
import { DEPARTMENTS } from '../../utils/constants';

const ManageTrainings: React.FC = () => {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        trainer: '',
        branches: '', // comma separated
        year: 1,
        startDate: '',
        endDate: ''
    });

    const handleBranchToggle = (dept: string) => {
        const currentBranches = formData.branches ? formData.branches.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (currentBranches.includes(dept)) {
            setFormData({ ...formData, branches: currentBranches.filter(b => b !== dept).join(', ') });
        } else {
            setFormData({ ...formData, branches: [...currentBranches, dept].join(', ') });
        }
    };

    const fetchTrainings = async () => {
        setLoading(true);
        try {
            const data = await TrainingService.getAllTrainings();
            setTrainings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await TrainingService.addTraining({
                title: formData.title,
                description: formData.description,
                trainer: formData.trainer,
                eligibility: {
                    branches: formData.branches.split(',').map(b => b.trim()),
                    year: Number(formData.year)
                },
                startDate: new Date(formData.startDate).getTime(),
                endDate: new Date(formData.endDate).getTime()
            });
            setIsModalOpen(false);
            fetchTrainings();
            setFormData({
                title: '', description: '', trainer: '', branches: '', year: 1, startDate: '', endDate: ''
            });
        } catch (error) {
            alert('Failed to add training');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this training?')) {
            await TrainingService.deleteTraining(id);
            fetchTrainings();
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Training Programs</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Training
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                        ) : trainings.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center">No trainings found.</td></tr>
                        ) : (
                            trainings.map((training) => (
                                <tr key={training.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <GraduationCap className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{training.title}</div>
                                                <div className="text-xs text-gray-500">{training.eligibility?.branches?.join(', ')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{training.trainer}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(training.startDate).toLocaleDateString()} - {new Date(training.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDelete(training.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Training Program">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Training Title" className="input-field" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    <input required placeholder="Trainer / Organization" className="input-field" value={formData.trainer} onChange={e => setFormData({ ...formData, trainer: e.target.value })} />
                    <textarea required placeholder="Description" className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Branches</label>
                        <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                            {DEPARTMENTS.map(dept => {
                                const isChecked = formData.branches.split(',').map(s => s.trim()).includes(dept);
                                return (
                                    <label key={dept} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleBranchToggle(dept)}
                                            className="rounded text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">{dept}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Target Year:</label>
                        <select className="input-field w-20" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500">Start Date</label>
                            <input required type="date" className="input-field" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">End Date</label>
                            <input required type="date" className="input-field" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary mt-4">Create Training</button>
                </form>
            </Modal>
        </div>
    );
};

export default ManageTrainings;
