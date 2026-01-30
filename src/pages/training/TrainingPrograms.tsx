import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Plus, Calendar } from 'lucide-react';
import { TrainingService } from '../../services/trainingService';
import type { Training } from '../../types';
import Modal from '../../components/ui/Modal';
import { DEPARTMENTS } from '../../utils/constants';

const TrainingPrograms: React.FC = () => {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

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

    const handleCardClick = (training: Training) => {
        navigate(`${training.id}`);
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

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.length === 0 && <p className="text-gray-500">No active training programs.</p>}
                    {trainings.map((training) => (
                        <div
                            key={training.id}
                            onClick={() => handleCardClick(training)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer relative group"
                        >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-xs bg-gray-100 px-2 py-1 rounded">
                                Click for details
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <GraduationCap className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-700">
                                    Year {training.eligibility.year}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{training.title}</h3>
                            <p className="text-gray-500 text-sm mb-4">by {training.trainer}</p>

                            <div className="flex justify-between items-center border-t pt-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(training.startDate).toLocaleDateString()}
                                </div>
                                <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    {training.participants?.length || 0} Reg.
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Training Program">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-2">
                    <input required placeholder="Training Title" className="input-field w-full" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    <input required placeholder="Trainer / Organization" className="input-field w-full" value={formData.trainer} onChange={e => setFormData({ ...formData, trainer: e.target.value })} />
                    <textarea required placeholder="Description" rows={3} className="input-field w-full" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Branches</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto bg-white">
                            {DEPARTMENTS.map(dept => {
                                const isChecked = formData.branches.split(',').map(s => s.trim()).includes(dept);
                                return (
                                    <label key={dept} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
                        <select className="input-field w-full" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}>
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input required type="date" className="input-field w-full" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input required type="date" className="input-field w-full" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary mt-6 py-2.5">Create Training</button>
                </form>
            </Modal>
        </div>
    );
};

export default TrainingPrograms;
