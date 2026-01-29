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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-blue-50 rounded-lg mr-4">
                        <Building2 className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Active Drives</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeDrives}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-purple-50 rounded-lg mr-4">
                        <Users className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Coordinators</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.coordinators}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-green-50 rounded-lg mr-4">
                        <Calendar className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Upcoming Interviews</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.upcomingInterviews}</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Company Drives</h2>
                </div>
                <div className="p-6">
                    {recentDrives.length === 0 ? (
                        <div className="text-center text-gray-500">No recent activity found.</div>
                    ) : (
                        <div className="space-y-4">
                            {recentDrives.map(drive => (
                                <div key={drive.id} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                                    <div>
                                        <h4 className="font-medium text-gray-800">{drive.name}</h4>
                                        <p className="text-sm text-gray-500">{drive.roles.join(', ')}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-indigo-600 block">{new Date(drive.driveDate).toLocaleDateString()}</span>
                                        <span className="text-xs text-gray-400">{drive.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlacementHeadDashboard;
