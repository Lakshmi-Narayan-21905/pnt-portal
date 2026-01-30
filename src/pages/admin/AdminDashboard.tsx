import React, { useEffect, useState } from 'react';
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Students</h3>
                    <p className="text-3xl font-bold text-primary-600 mt-2">{stats.totalStudents}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Active Drives</h3>
                    <p className="text-3xl font-bold text-primary-600 mt-2">{stats.activeDrives}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Trainings</h3>
                    <p className="text-3xl font-bold text-primary-600 mt-2">{stats.totalTrainings}</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
