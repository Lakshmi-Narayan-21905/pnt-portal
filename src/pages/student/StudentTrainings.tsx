import React, { useState, useEffect } from 'react';
import { TrainingService } from '../../services/trainingService';
import { useAuth } from '../../contexts/AuthContext';
import type { Training } from '../../types';
import { GraduationCap, Calendar, CheckCircle } from 'lucide-react';

const StudentTrainings: React.FC = () => {
    const { userProfile } = useAuth();
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);

    useEffect(() => {
        fetchTrainings();
    }, []);

    const fetchTrainings = async () => {
        try {
            const data = await TrainingService.getAllTrainings();
            // Sort by start date (upcoming first)
            data.sort((a, b) => a.startDate - b.startDate);
            setTrainings(data);
        } catch (error) {
            console.error("Error fetching trainings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (trainingId: string) => {
        if (!userProfile?.uid) return;
        if (!window.confirm("Are you sure you want to register for this training?")) return;

        setRegistering(trainingId);
        try {
            await TrainingService.registerForTraining(trainingId, userProfile.uid);
            setTrainings(prev => prev.map(t =>
                t.id === trainingId
                    ? { ...t, participants: [...(t.participants || []), userProfile.uid] }
                    : t
            ));
            alert("Registered successfully!");
        } catch (error) {
            console.error("Error registering:", error);
            alert("Failed to register. Please try again.");
        } finally {
            setRegistering(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading trainings...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <GraduationCap className="mr-3 text-indigo-600" />
                Training Programs
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trainings.map(training => {
                    const isRegistered = training.participants?.includes(userProfile?.uid || '');
                    const isCompleted = training.endDate < Date.now();

                    return (
                        <div key={training.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{training.title}</h3>
                                <p className="text-sm text-gray-600 mb-4">Trainer: {training.trainer}</p>
                                <p className="text-gray-600 mb-6 text-sm line-clamp-3">{training.description}</p>

                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>{new Date(training.startDate).toLocaleDateString()} - {new Date(training.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs bg-gray-100 rounded-full px-3 py-1 font-medium text-gray-600">
                                    Year: {training.eligibility.year}
                                </span>

                                {isRegistered ? (
                                    <span className="flex items-center text-green-600 text-sm font-medium">
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Registered
                                    </span>
                                ) : isCompleted ? (
                                    <span className="text-gray-400 text-sm font-medium">Completed</span>
                                ) : (
                                    <button
                                        onClick={() => handleRegister(training.id)}
                                        disabled={registering === training.id}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        {registering === training.id ? 'Joining...' : 'Register'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {trainings.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadowcol-span-1 md:col-span-2">
                    <p className="text-gray-500 text-lg">No upcoming training programs.</p>
                </div>
            )}
        </div>
    );
};

export default StudentTrainings;
