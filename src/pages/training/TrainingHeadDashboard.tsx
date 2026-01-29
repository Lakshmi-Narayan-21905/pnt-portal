import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, GraduationCap, Calendar } from 'lucide-react';
import { TrainingService } from '../../services/trainingService';

const TrainingHeadDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        activeTrainings: 0,
        upcomingTrainings: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const trainings = await TrainingService.getAllTrainings();
            const now = Date.now();
            const active = trainings.filter(t => t.startDate <= now && t.endDate >= now).length;
            const upcoming = trainings.filter(t => t.startDate > now).length;
            setStats({ activeTrainings: active, upcomingTrainings: upcoming });
        };
        fetchStats();
    }, []);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Training Dashboard</h1>
                <p className="text-gray-600 mt-1">Monitor training programs and student progress.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-green-50 rounded-lg mr-4">
                        <GraduationCap className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Active Programs</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeTrainings}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-purple-50 rounded-lg mr-4">
                        <Users className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Coordinators</h3>
                        <p className="text-2xl font-bold text-gray-900">--</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-blue-50 rounded-lg mr-4">
                        <Calendar className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Upcoming Programs</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.upcomingTrainings}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingHeadDashboard;
