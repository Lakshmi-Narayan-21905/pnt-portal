import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Building2 } from 'lucide-react';
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
                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 hover:shadow-lg hover:shadow-brand-orange-primary/5 transition flex items-center">
                    <div className="p-4 bg-brand-orange-ice rounded-lg mr-4 border border-brand-orange-light/20">
                        <Users className="w-8 h-8 text-brand-orange-primary" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase">My Students</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 hover:shadow-lg hover:shadow-brand-orange-primary/5 transition flex items-center">
                    <div className="p-4 bg-brand-orange-ice rounded-lg mr-4 border border-brand-orange-light/20">
                        <CheckCircle className="w-8 h-8 text-brand-orange-primary" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Placed Students</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.placedStudents}</p>
                        <p className="text-xs text-brand-orange-deep mt-1">Offers (Pending)</p>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 hover:shadow-lg hover:shadow-brand-orange-primary/5 transition flex items-center">
                    <div className="p-4 bg-brand-orange-ice rounded-lg mr-4 border border-brand-orange-light/20">
                        <Building2 className="w-8 h-8 text-brand-orange-primary" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Total Drives</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDrives}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassCoordinatorDashboard;
