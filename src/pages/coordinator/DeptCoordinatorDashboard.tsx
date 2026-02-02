import React, { useEffect, useState } from 'react';
import { Users, Building2, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';

const DeptCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        placedStudents: 0, // Not fully tracked yet
        totalDrives: 0,
        inTraining: 0
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
                    totalStudents: students.length,
                    placedStudents: placed,
                    totalDrives: companies.length,
                    inTraining: 0 // Placeholder as per previous fix pattern
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 bg-brand-lavender-ice rounded-lg mr-4">
                        <Users className="w-8 h-8 text-brand-lavender-primary" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 bg-brand-lavender-ice rounded-lg mr-4">
                        <Building2 className="w-8 h-8 text-brand-lavender-deep" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Placements</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.placedStudents}</p>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 bg-brand-lavender-ice rounded-lg mr-4">
                        <GraduationCap className="w-8 h-8 text-brand-lavender-purple" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">In Training</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.inTraining}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeptCoordinatorDashboard;
