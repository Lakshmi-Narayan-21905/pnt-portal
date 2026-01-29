import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';

const DeptCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        placedStudents: 0, // Not fully tracked yet
        totalDrives: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!userProfile?.department) return;
            try {
                // Fetch all students (filtered in memory or by query, here getting all due to service limitation but filtering in memory)
                // Optimized: create a query based method later. For now, get all.
                const allStudents = await UserService.getUsersByRole('STUDENT');
                const deptStudents = allStudents.filter(u => u.department === userProfile.department);
                const companies = await CompanyService.getAllCompanies();

                setStats({
                    totalStudents: deptStudents.length,
                    placedStudents: 0, // Placeholder as we don't have placement status yet
                    totalDrives: companies.length
                });

            } catch (error) {
                console.error("Error fetching dept stats:", error);
            }
        };
        fetchStats();
    }, [userProfile]);

    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.displayName}</p>
                <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">{userProfile?.department} Department</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Students</h3>
                    <p className="text-3xl font-bold text-primary-600 mt-2">{stats.totalStudents}</p>
                    <p className="text-sm text-gray-400 mt-2">In your department</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Placed Students</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.placedStudents}</p>
                    <p className="text-sm text-gray-400 mt-2">Offers received (Pending)</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Drives</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{stats.totalDrives}</p>
                    <p className="text-sm text-gray-400 mt-2">Opportunities</p>
                </div>
            </div>
        </div>
    );
};

export default DeptCoordinatorDashboard;
