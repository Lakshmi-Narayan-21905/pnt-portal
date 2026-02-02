import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentPageContainer from '../../components/student/StudentPageContainer';

import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';

const StudentProfile: React.FC = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();

    return (

        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                <button
                    onClick={() => navigate('/student/complete-profile')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Personal Details</h3>
                </div>
                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userProfile?.displayName}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userProfile?.email}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Roll Number</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 uppercase">{userProfile?.rollNo || '-'}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userProfile?.phone || '-'}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Address</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userProfile?.address || '-'}</dd>
                        </div>
                    </dl>

                </div>

                {/* Academic Details Card */}
                <div className="bg-white/70 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden border border-white/60">
                    <div className="px-6 py-5 border-b border-gray-200/50 bg-white/40">
                        <h3 className="text-lg leading-6 font-bold text-gray-800">Academic Details</h3>
                        <p className="mt-1 text-sm text-gray-500">Current educational status and performance.</p>
                    </div>
                    <div className="p-0">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 text-sm">
                            <div className="px-6 py-4 border-b sm:border-b-0 sm:border-r border-gray-100">
                                <dt className="font-medium text-gray-500 mb-1">Department</dt>
                                <dd className="text-gray-900 font-semibold">{userProfile?.department}</dd>
                            </div>
                            {userProfile?.section && (
                                <div className="px-6 py-4 border-b sm:border-b-0 sm:border-r border-gray-100">
                                    <dt className="font-medium text-gray-500 mb-1">Section</dt>
                                    <dd className="text-gray-900 font-semibold">{userProfile?.section}</dd>
                                </div>
                            )}
                            <div className="px-6 py-4 border-b sm:border-b-0 sm:border-r border-gray-100">
                                <dt className="font-medium text-gray-500 mb-1">CGPA</dt>
                                <dd className="text-2xl font-bold text-blue-600">{userProfile?.cgpa || '-'}</dd>
                            </div>
                            <div className="px-6 py-4 border-b sm:border-b-0 border-gray-100">
                                <dt className="font-medium text-gray-500 mb-1">Standing Arrears</dt>
                                <dd className={`text-lg font-bold ${Number(userProfile?.standingArreas) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {userProfile?.standingArreas || 0}
                                </dd>
                            </div>

                            {/* Row 2 */}
                            <div className="px-6 py-4 sm:border-t sm:border-r border-gray-100">
                                <dt className="font-medium text-gray-500 mb-1">10th Mark</dt>
                                <dd className="text-gray-900">{userProfile?.tenthMark}%</dd>
                            </div>
                            <div className="px-6 py-4 sm:border-t sm:border-r border-gray-100">
                                <dt className="font-medium text-gray-500 mb-1">12th Mark</dt>
                                <dd className="text-gray-900">{userProfile?.twelfthMark}%</dd>
                            </div>
                            <div className="px-6 py-4 sm:border-t lg:col-span-2 border-gray-100">
                                <dt className="font-medium text-gray-500 mb-1">History of Arrears</dt>
                                <dd className="text-gray-900">{userProfile?.historyOfArreas || 0}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </StudentPageContainer>
    );
};

export default StudentProfile;
