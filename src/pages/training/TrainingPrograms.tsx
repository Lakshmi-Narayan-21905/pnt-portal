import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Plus, Calendar, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { TrainingService } from '../../services/trainingService';
import { useAlert } from '../../contexts/AlertContext';
import type { Training } from '../../types';
import Modal from '../../components/ui/Modal';
import { DEPARTMENTS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';

const TrainingPrograms: React.FC = () => {
    const theme = useTheme();
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const navigate = useNavigate();
    const { showAlert } = useAlert();

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

        const start = new Date(formData.startDate).getTime();
        const end = new Date(formData.endDate).getTime();

        if (isNaN(start) || isNaN(end)) {
            await showAlert("Invalid Date Selection", "error", "Please select valid dates");
            return;
        }

        if (end < start) {
            await showAlert("End Date cannot be before Start Date", "warning", "Invalid Date Range");
            return;
        }

        setSubmitting(true);
        try {
            const trainingPayload = {
                title: formData.title,
                description: formData.description,
                trainer: formData.trainer,
                eligibility: {
                    branches: formData.branches.split(',').map(b => b.trim()),
                    year: Number(formData.year)
                },
                startDate: start,
                endDate: end
            };

            if (editingId) {
                await TrainingService.updateTraining(editingId, trainingPayload);
            } else {
                await TrainingService.addTraining(trainingPayload);
            }

            handleCloseModal();
            fetchTrainings();
            await showAlert(editingId ? 'Training updated successfully!' : 'Training created successfully!', 'success', 'Success');
        } catch (error) {
            await showAlert('Failed to save training program.', 'error', 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (e: React.MouseEvent, training: Training) => {
        e.stopPropagation();
        setEditingId(training.id);
        setFormData({
            title: training.title,
            description: training.description,
            trainer: training.trainer,
            branches: training.eligibility.branches ? training.eligibility.branches.join(', ') : '',
            year: training.eligibility.year,
            startDate: new Date(training.startDate).toISOString().split('T')[0],
            endDate: new Date(training.endDate).toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this training program?')) {
            try {
                await TrainingService.deleteTraining(id);
                fetchTrainings();
            } catch (error) {
                console.error("Delete failed", error);
                alert("Failed to delete training");
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            title: '', description: '', trainer: '', branches: '', year: 1, startDate: '', endDate: ''
        });
    };

    const handleCardClick = (training: Training) => {
        navigate(`${training.id}`);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Training Programs</h1>
                <div className="flex items-center space-x-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search trainings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-primary focus:border-transparent outline-none w-64 transition"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-brand-green-primary text-white rounded-lg hover:bg-brand-green-dark transition shadow-lg shadow-brand-green-primary/30"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Training
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.filter(training =>
                        training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        training.trainer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        training.eligibility?.branches?.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).length === 0 && <p className="text-gray-500">No active training programs.</p>}
                    {trainings.filter(training =>
                        training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        training.trainer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        training.eligibility?.branches?.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map((training) => (
                        <div
                            key={training.id}
                            onClick={() => handleCardClick(training)}
                            className={`bg-white/60 backdrop-blur-xl p-6 rounded-xl shadow-sm border ${theme.border} hover:shadow-lg hover:shadow-brand-green-emerald/10 transition cursor-pointer relative group flex flex-col h-full`}
                        >

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-green-ice rounded-lg">
                                    <GraduationCap className="w-6 h-6 text-brand-green-primary" />
                                </div>
                            </div>

                            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={(e) => handleEdit(e, training)}
                                    className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition"
                                    title="Edit"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, training.id)}
                                    className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-red-50 hover:text-red-600 transition"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{training.title}</h3>
                            <p className="text-gray-500 text-sm mb-4">by {training.trainer}</p>

                            <div className="mt-auto flex justify-between items-center border-t border-brand-green-mint/20 pt-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-2 text-brand-green-emerald" />
                                    {new Date(training.startDate).toLocaleDateString()}
                                </div>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Year {training.eligibility.year}
                                </span>
                                <div className="text-sm font-medium text-brand-green-dark bg-brand-green-ice px-3 py-1 rounded-full border border-brand-green-mint/30">
                                    {training.participants?.length || 0} Reg.
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Edit Training Program" : "Add Training Program"}>
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
                            <input required type="date" min={formData.startDate} className="input-field w-full" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        </div>
                    </div>

                    <button disabled={submitting} type="submit" className="w-full btn-primary mt-6 py-2.5 flex justify-center items-center">
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                {editingId ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (editingId ? 'Update Training' : 'Create Training')}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default TrainingPrograms;
