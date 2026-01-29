import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Building2, Calendar } from 'lucide-react';

const PlacementHeadDashboard: React.FC = () => {
    const { userProfile } = useAuth();

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
                        <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-purple-50 rounded-lg mr-4">
                        <Users className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Coordinators</h3>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-green-50 rounded-lg mr-4">
                        <Calendar className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Upcoming Interviews</h3>
                        <p className="text-2xl font-bold text-gray-900">5</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Company Drives</h2>
                </div>
                <div className="p-6 text-center text-gray-500">
                    No recent activity found.
                </div>
            </div>
        </div>
    );
};

export default PlacementHeadDashboard;
