import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Calendar } from 'lucide-react';
import { TrainingService } from '../../services/trainingService';
import type { Training } from '../../types';

const DeptTrainings: React.FC = () => {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    const handleCardClick = (training: Training) => {
        navigate(`${training.id}`);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Training Programs</h1>

            {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.length === 0 && <p className="text-gray-500">No active training programs.</p>}
                    {trainings.map((training) => (
                        <div
                            key={training.id}
                            onClick={() => handleCardClick(training)}
                            className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 hover:shadow-lg hover:shadow-brand-lavender-primary/5 transition cursor-pointer relative group"
                        >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-xs bg-brand-lavender-light text-brand-lavender-deep px-2 py-1 rounded">
                                Click for details
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-lavender-ice rounded-lg border border-brand-lavender-lilac/20">
                                    <GraduationCap className="w-6 h-6 text-brand-lavender-primary" />
                                </div>
                                <span className="px-2 py-1 text-xs rounded-full font-medium bg-brand-lavender-light text-brand-lavender-deep">
                                    Year {training.eligibility.year}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{training.title}</h3>
                            <p className="text-gray-500 text-sm mb-4">by {training.trainer}</p>

                            <div className="flex justify-between items-center border-t border-brand-lavender-lilac/20 pt-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-2 text-brand-lavender-purple" />
                                    {new Date(training.startDate).toLocaleDateString()}
                                </div>
                                <div className="text-sm font-medium text-brand-lavender-deep bg-brand-lavender-light px-3 py-1 rounded-full">
                                    {training.participants?.length || 0} Reg.
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeptTrainings;
