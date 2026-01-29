import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
    const { userProfile } = useAuth();

    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Welcome Back, {userProfile?.displayName?.split(' ')[0]}!</h1>
                <p className="text-gray-600 mt-2">Here's an overview of your placement journey.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Active Drives</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">0</p>
                    <p className="text-xs text-gray-400 mt-1">Companies hiring now</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">My Applications</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">0</p>
                    <p className="text-xs text-gray-400 mt-1">Applied so far</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Upcoming Trainings</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">0</p>
                    <p className="text-xs text-gray-400 mt-1">Scheduled sessions</p>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recommended for You</h2>
                <div className="text-center py-8 text-gray-500">
                    No recommendations yet. Complete your profile to get matched!
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
