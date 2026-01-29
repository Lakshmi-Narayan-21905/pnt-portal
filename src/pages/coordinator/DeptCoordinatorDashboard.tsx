import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DeptCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    // In a real app, these stats would come from an API
    const stats = {
        totalStudents: 120, // Placeholder
        placedStudents: 85, // Placeholder
        pendingVerifications: 5 // Placeholder
    };

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
                    <p className="text-sm text-gray-400 mt-2">Offers received</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Pending Verifications</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{stats.pendingVerifications}</p>
                    <p className="text-sm text-gray-400 mt-2">Action required</p>
                </div>
            </div>
        </div>
    );
};

export default DeptCoordinatorDashboard;
