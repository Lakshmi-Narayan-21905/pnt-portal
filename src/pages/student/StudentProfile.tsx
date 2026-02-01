import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentPageContainer from '../../components/student/StudentPageContainer';

const StudentProfile: React.FC = () => {
    const { userProfile } = useAuth();

    return (
        <StudentPageContainer title="My Profile" subtitle="Your personal and academic details">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Personal Details Card */}
                <div className="bg-white/70 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden border border-white/60">
                    <div className="px-6 py-5 border-b border-gray-200/50 bg-white/40">
                        <h3 className="text-lg leading-6 font-bold text-gray-800">Personal Details</h3>
                        <p className="mt-1 text-sm text-gray-500">Contact information and basic details.</p>
                    </div>
                    <div className="p-0">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0 text-sm">
                            <div className="px-6 py-4 border-b border-gray-100 md:border-b-0 md:border-r">
                                <dt className="font-medium text-gray-500 mb-1">Full Name</dt>
                                <dd className="text-gray-900 font-semibold">{userProfile?.displayName}</dd>
                            </div>
                            <div className="px-6 py-4 border-b border-gray-100 md:border-b-0">
                                <dt className="font-medium text-gray-500 mb-1">Email Address</dt>
                                <dd className="text-gray-900">{userProfile?.email}</dd>
                            </div>
                            <div className="px-6 py-4 border-b border-gray-100 md:border-b-0 md:border-t md:border-r">
                                <dt className="font-medium text-gray-500 mb-1">Phone</dt>
                                <dd className="text-gray-900">{userProfile?.phone || '-'}</dd>
                            </div>
                            <div className="px-6 py-4 md:border-t border-gray-100">
                                <dt className="font-medium text-gray-500 mb-1">Address</dt>
                                <dd className="text-gray-900">{userProfile?.address || '-'}</dd>
                            </div>
                        </dl>
                    </div>
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
