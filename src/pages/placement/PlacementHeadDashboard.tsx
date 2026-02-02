import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Building2, Calendar } from 'lucide-react';
import { CompanyService } from '../../services/companyService';
import { UserService } from '../../services/userService';

const PlacementHeadDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        activeDrives: 0,
        coordinators: 0,
        upcomingInterviews: 0
    });
    const [recentDrives, setRecentDrives] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch stats - Only Dept Coordinators as requested
                const [companies, deptCoords] = await Promise.all([
                    CompanyService.getAllCompanies(),
                    UserService.getUsersByRole('DEPT_COORDINATOR')
                ]);

                const now = Date.now();
                const active = companies.filter(c => c.deadline && c.deadline > now).length;
                // Assuming driveDate > now counts as upcoming interview/drive
                const upcoming = companies.filter(c => c.driveDate && c.driveDate > now).length;

                setStats({
                    activeDrives: active,
                    coordinators: deptCoords.length,
                    upcomingInterviews: upcoming
                });

                // Get recent drives (sort by createdAt or driveDate descending)
                const recent = [...companies].sort((a, b) => b.driveDate - a.driveDate).slice(0, 3);
                setRecentDrives(recent);

            } catch (error) {
                console.error("Error fetching placement stats:", error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Placement Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage drives, coordinators, and student placements.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 bg-blue-50 rounded-lg mr-4">
                        <Building2 className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Active Drives</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeDrives}</p>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 bg-teal-50 rounded-lg mr-4">
                        <Users className="w-8 h-8 text-teal-600" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Coordinators</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.coordinators}</p>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 bg-green-50 rounded-lg mr-4">
                        <Calendar className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Upcoming Interviews</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.upcomingInterviews}</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default PlacementHeadDashboard;
