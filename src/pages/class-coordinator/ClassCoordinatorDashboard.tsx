import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';

import { useTheme } from '../../hooks/useTheme';

const ClassCoordinatorDashboard: React.FC = () => {
    const theme = useTheme();
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
                <div className={`bg-white border border-l-4 ${theme.borderLeft} p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center hover:shadow-[0_8px_24px_rgba(249,115,22,0.15)] hover:border-orange-200 transition-all duration-300 group`}>
                    <div className="p-4 bg-orange-50 rounded-xl shadow-sm mr-4 group-hover:bg-orange-100 transition-colors">
                        <Users className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-orange-900/70 text-sm font-bold uppercase tracking-wider">My Students</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                    </div>
                </div>

                <div className={`bg-white border border-l-4 ${theme.borderLeft} p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center hover:shadow-[0_8px_24px_rgba(249,115,22,0.15)] hover:border-orange-200 transition-all duration-300 group`}>
                    <div className="p-4 bg-orange-50 rounded-xl shadow-sm mr-4 group-hover:bg-orange-100 transition-colors">
                        <CheckCircle className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-orange-900/70 text-sm font-bold uppercase tracking-wider">Placed Students</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.placedStudents}</p>
                        <p className="text-xs text-orange-600 font-medium mt-1">Offers Received</p>
                    </div>
                </div>

                <div className={`bg-white border border-l-4 ${theme.borderLeft} p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center hover:shadow-[0_8px_24px_rgba(249,115,22,0.15)] hover:border-orange-200 transition-all duration-300 group`}>
                    <div className="p-4 bg-orange-50 rounded-xl shadow-sm mr-4 group-hover:bg-orange-100 transition-colors">
                        <Building2 className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-orange-900/70 text-sm font-bold uppercase tracking-wider">Total Drives</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDrives}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassCoordinatorDashboard;
