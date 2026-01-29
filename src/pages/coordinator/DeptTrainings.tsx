import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, User } from 'lucide-react';
import { TrainingService } from '../../services/trainingService';
import type { Training } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const DeptTrainings: React.FC = () => {
    const { userProfile } = useAuth();
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Training Programs</h1>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.length === 0 && <p className="text-gray-500">No training programs scheduled.</p>}
                    {trainings.map((training) => {
                        const isEligible = userProfile?.department && training.eligibility.branches.includes(userProfile.department);
                        return (
                            <div key={training.id} className={`bg-white p-6 rounded-xl shadow-sm border ${isEligible ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'} hover:shadow-md transition`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${isEligible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {isEligible ? 'Eligible' : 'Other Dept'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{training.title}</h3>
                                <p className="text-sm font-medium text-gray-600 mb-4">{training.trainer}</p>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{training.description}</p>

                                <div className="flex items-center text-sm text-gray-500 border-t pt-4">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(training.startDate).toLocaleDateString()} - {new Date(training.endDate).toLocaleDateString()}
                                </div>

                                <div className="mt-4 pt-2 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Eligibility</h4>
                                    <p className="text-xs text-gray-600 mt-1">Branches: {training.eligibility.branches.join(', ')}</p>
                                    <p className="text-xs text-gray-600">Year: {training.eligibility.year}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <User className="w-4 h-4 mr-1" />
                                        <span>{training.participants?.length || 0} Participants</span>
                                    </div>
                                    {/* Future: View Participants Button */}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default DeptTrainings;
