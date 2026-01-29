import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ClassCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    // Placeholder stats
    const stats = {
        totalStudents: 60,
        placedStudents: 45,
        pendingVerifications: 2
    };

    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.displayName}</p>
                <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">{userProfile?.department}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">My Students</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalStudents}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Placed Students</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.placedStudents}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Pending Verifications</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{stats.pendingVerifications}</p>
                </div>
            </div>
        </div>
    );
};

export default ClassCoordinatorDashboard;
