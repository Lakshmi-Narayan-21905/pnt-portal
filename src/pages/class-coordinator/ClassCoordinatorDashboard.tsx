import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';

const ClassCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        placedStudents: 0,
        totalDrives: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!userProfile?.department) return; // Add section check if available
            try {
                const allStudents = await UserService.getUsersByRole('STUDENT');
                // Filter by department AND section if section is available in coordinator profile
                const classStudents = allStudents.filter(u =>
                    u.department === userProfile.department &&
                    (!userProfile.section || u.section === userProfile.section)
                );

                const companies = await CompanyService.getAllCompanies();

                setStats({
                    totalStudents: classStudents.length,
                    placedStudents: 0,
                    totalDrives: companies.length
                });

            } catch (error) {
                console.error("Error fetching class stats:", error);
            }
        };
        fetchStats();
    }, [userProfile]);

    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.displayName}</p>
                <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">{userProfile?.department} {userProfile?.section ? `- Section ${userProfile.section}` : ''}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">My Students</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalStudents}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Placed Students</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.placedStudents}</p>
                    <p className="text-sm text-gray-400 mt-2">Offers (Pending)</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Drives</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{stats.totalDrives}</p>
                </div>
            </div>
        </div>
    );
};

export default ClassCoordinatorDashboard;
