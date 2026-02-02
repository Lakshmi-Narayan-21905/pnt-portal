import React, { useEffect, useState } from 'react';
import { Users, Building2, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';

const AdminDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeDrives: 0,
        totalTrainings: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Parallel fetch for performance
                const [students, companies, trainings] = await Promise.all([
                    UserService.getUsersByRole('STUDENT'),
                    CompanyService.getAllCompanies(),
                    TrainingService.getAllTrainings()
                ]);

                const now = Date.now();
                const activeDrives = companies.filter(c => c.deadline && c.deadline > now).length;

                setStats({
                    totalStudents: students.length,
                    activeDrives: activeDrives,
                    totalTrainings: trainings.length
                });
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.displayName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    className="bg-indigo-50/50 p-6 rounded-2xl shadow-md border border-indigo-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center group relative overflow-hidden min-w-[280px]"
                    style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="p-4 bg-white rounded-xl mr-4 border border-indigo-100 shadow-sm group-hover:shadow-md transition-all">
                        <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-indigo-900/60 text-sm font-bold uppercase tracking-wider">Total Students</h3>
                        <p className="text-4xl font-extrabold text-indigo-950 mt-1">{stats.totalStudents}</p>
                    </div>
                </div>

                <div
                    className="bg-blue-50/50 p-6 rounded-2xl shadow-md border border-blue-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center group relative overflow-hidden min-w-[280px]"
                    style={{ animation: 'fadeInUp 0.5s ease-out 0.1s forwards', opacity: 0 }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="p-4 bg-white rounded-xl mr-4 border border-blue-100 shadow-sm group-hover:shadow-md transition-all">
                        <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-blue-900/60 text-sm font-bold uppercase tracking-wider">Active Drives</h3>
                        <p className="text-4xl font-extrabold text-blue-950 mt-1">{stats.activeDrives}</p>
                    </div>
                </div>

                <div
                    className="bg-emerald-50/50 p-6 rounded-2xl shadow-md border border-emerald-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center group relative overflow-hidden min-w-[280px]"
                    style={{ animation: 'fadeInUp 0.5s ease-out 0.2s forwards', opacity: 0 }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="p-4 bg-white rounded-xl mr-4 border border-emerald-100 shadow-sm group-hover:shadow-md transition-all">
                        <GraduationCap className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-emerald-900/60 text-sm font-bold uppercase tracking-wider">Total Trainings</h3>
                        <p className="text-4xl font-extrabold text-emerald-950 mt-1">{stats.totalTrainings}</p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
