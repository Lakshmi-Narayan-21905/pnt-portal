import React, { useEffect, useState } from 'react';
import { Users, Building2, GraduationCap, Briefcase, TrendingUp, UserCheck, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';

import { useTheme } from '../../hooks/useTheme';

const DeptCoordinatorDashboard: React.FC = () => {
    const theme = useTheme();
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCoordinators: 0,
        placedStudents: 0,
        offeredStudents: 0,
        // Placement Analytics
        activeDrives: 0,
        deptEligibleDrives: 0,
        optedInStudents: 0,
        // Training Analytics
        activeTrainings: 0,
        deptEligibleTrainings: 0,
        studentsInTraining: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!userProfile?.department) return;
            setLoading(true);
            try {
                // Fetch students from BOTH students AND class_coordinators collections
                const [allStudents, allClassCoords, companies, trainings] = await Promise.all([
                    UserService.getUsersByRole('STUDENT'),
                    UserService.getUsersByRole('CLASS_COORDINATOR'),
                    CompanyService.getAllCompanies(),
                    TrainingService.getAllTrainings()
                ]);

                const dept = userProfile.department;

                // Filter by department
                const deptStudents = allStudents.filter(u => u.department === dept);
                const deptClassCoords = allClassCoords.filter(u => u.department === dept);

                // Placement stats
                const placed = deptStudents.filter(s => s.placementStatus === 'PLACED').length;
                const offered = deptStudents.filter(s => s.placementStatus === 'OFFERED').length;

                // Active drives (not expired)
                const now = Date.now();
                const activeDrives = companies.filter(c => c.deadline > now);

                // Drives eligible for this department
                const deptEligibleDrives = companies.filter(c => {
                    const branches = c.eligibilityCriteria?.branches || [];
                    return branches.length === 0 || branches.includes(dept);
                });

                // Count students opted in for dept-eligible drives
                let optedInCount = 0;
                deptEligibleDrives.forEach(company => {
                    const applicants = company.applicants || [];
                    const deptApplicants = deptStudents.filter(s => applicants.includes(s.uid));
                    optedInCount += deptApplicants.length;
                });

                // Training stats - eligible for this department
                const deptEligibleTrainings = trainings.filter(t => {
                    const branches = t.eligibility?.branches || [];
                    return branches.length === 0 || branches.includes(dept);
                });

                // Active trainings (ongoing or upcoming)
                const activeTrainings = trainings.filter(t => t.endDate > now);

                // Count students in dept-eligible trainings
                let inTrainingCount = 0;
                deptEligibleTrainings.forEach(training => {
                    const participants = training.participants || [];
                    const deptParticipants = deptStudents.filter(s => participants.includes(s.uid));
                    inTrainingCount += deptParticipants.length;
                });

                setStats({
                    totalStudents: deptStudents.length + deptClassCoords.length,
                    totalCoordinators: deptClassCoords.length,
                    placedStudents: placed,
                    offeredStudents: offered,
                    activeDrives: activeDrives.length,
                    deptEligibleDrives: deptEligibleDrives.length,
                    optedInStudents: optedInCount,
                    activeTrainings: activeTrainings.length,
                    deptEligibleTrainings: deptEligibleTrainings.length,
                    studentsInTraining: inTrainingCount
                });

            } catch (error) {
                console.error("Error fetching dept stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [userProfile]);

    const StatCard = ({ icon: Icon, title, value, subtitle, color }: { icon: any, title: string, value: number | string, subtitle?: string, color: string }) => (
        <div className={`bg-white border border-gray-100 p-3 sm:p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg transition-all duration-300 overflow-hidden`}>
            <div className="flex items-center justify-between gap-2">
                <div className={`p-2 sm:p-3 ${color} rounded-xl flex-shrink-0`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{loading ? '...' : value}</p>
                    <h3 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</h3>
                    {subtitle && <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.displayName}</p>
                <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">{userProfile?.department} Department</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <StatCard icon={Users} title="Total Students" value={stats.totalStudents} color="bg-purple-500" />
                <StatCard icon={UserCheck} title="Class Coordinators" value={stats.totalCoordinators} color="bg-indigo-500" />
                <StatCard icon={Briefcase} title="Placed Students" value={stats.placedStudents} color="bg-green-500" />
                <StatCard icon={Target} title="Offered" value={stats.offeredStudents} subtitle="Awaiting joining" color="bg-amber-500" />
            </div>

            {/* Analytics Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Placement Analytics */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Placement Analytics</h2>

                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-blue-700">{loading ? '...' : stats.deptEligibleDrives}</p>
                            <p className="text-sm text-blue-600 font-medium">Eligible Drives</p>
                            <p className="text-xs text-blue-400">For your department</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-green-700">{loading ? '...' : stats.optedInStudents}</p>
                            <p className="text-sm text-green-600 font-medium">Students Opted In</p>
                            <p className="text-xs text-green-400">Across all drives</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-purple-700">{loading ? '...' : stats.activeDrives}</p>
                            <p className="text-sm text-purple-600 font-medium">Total Drives</p>
                            <p className="text-xs text-purple-400">Total drives</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-amber-700">
                                {loading ? '...' : stats.totalStudents > 0 ? Math.round((stats.placedStudents / stats.totalStudents) * 100) + '%' : '0%'}
                            </p>
                            <p className="text-sm text-amber-600 font-medium">Placement Rate</p>
                            <p className="text-xs text-amber-400">Department average</p>
                        </div>
                    </div>
                </div>


                {/* Training Analytics */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Training Analytics</h2>

                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="bg-emerald-50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-emerald-700">{loading ? '...' : stats.deptEligibleTrainings}</p>
                            <p className="text-sm text-emerald-600 font-medium">Eligible Programs</p>
                            <p className="text-xs text-emerald-400">For your department</p>
                        </div>
                        <div className="bg-teal-50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-teal-700">{loading ? '...' : stats.studentsInTraining}</p>
                            <p className="text-sm text-teal-600 font-medium">Students Enrolled</p>
                            <p className="text-xs text-teal-400">Total registrations</p>
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-cyan-700">{loading ? '...' : stats.activeTrainings}</p>
                            <p className="text-sm text-cyan-600 font-medium">Active Trainings</p>
                            <p className="text-xs text-cyan-400">Ongoing/Upcoming</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-indigo-700">
                                {loading ? '...' : stats.totalStudents > 0 ? Math.round((stats.studentsInTraining / stats.totalStudents) * 100) + '%' : '0%'}
                            </p>
                            <p className="text-sm text-indigo-600 font-medium">Training Coverage</p>
                            <p className="text-xs text-indigo-400">Of total students</p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Quick Stats Summary */}
            <div className="mt-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Department Summary</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white/20 backdrop-blur rounded-lg p-2 sm:p-3 text-center">
                        <p className="text-xl sm:text-2xl font-bold">{loading ? '...' : stats.totalStudents}</p>
                        <p className="text-sm opacity-90">Total Members</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{loading ? '...' : stats.placedStudents + stats.offeredStudents}</p>
                        <p className="text-sm opacity-90">Placed/Offered</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{loading ? '...' : stats.deptEligibleDrives + stats.deptEligibleTrainings}</p>
                        <p className="text-sm opacity-90">Total Opportunities</p>

                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{loading ? '...' : stats.optedInStudents + stats.studentsInTraining}</p>
                        <p className="text-sm opacity-90">Total Participations</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeptCoordinatorDashboard;
