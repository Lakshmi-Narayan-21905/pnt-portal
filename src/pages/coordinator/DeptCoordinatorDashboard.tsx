import React, { useEffect, useState } from 'react';
import { Users, Building2, GraduationCap, Briefcase, TrendingUp, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';


const DeptCoordinatorDashboard: React.FC = () => {
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
                // Fetch all students (including Coordinators joined as students)
                const [allStudents, companies, trainings] = await Promise.all([
                    UserService.getAllStudents(),
                    CompanyService.getAllCompanies(),
                    TrainingService.getAllTrainings()
                ]);

                const dept = userProfile.department;

                // Filter by department
                const deptMembers = allStudents.filter(u => u.department === dept);

                // Identify which are explicitly Class Coordinators (separate collection, but merged in getAllStudents)
                // However, the `getAllStudents` returns UserProfile with role 'STUDENT' or 'CLASS_COORDINATOR'.
                // If we want to count Coordinators separately, we can filter by role if it's available in UserProfile.
                // Assuming UserProfile has a `role` field.
                // Wait, UserProfile usually does have a role.
                // Let's check `user.ts` types or `userService`.
                // In `UserService.getAllStudents`, it merges arrays. 
                // The `getUsersByRole` returns `...doc.data()`.
                // The document data usually contains the role if it was stored.
                // If not, we might lose that distinction if we rely solely on `getAllStudents`.
                // But for "Total Students" count, we want the sum.
                // For "Class Coordinators" count, we might need to filter by role if available.
                // Or just keep a separate fetch for counts if strictly needed?
                // The prompt says "fetch placement details from both students and class coordinators".
                // So `deptMembers` should include both.

                const deptClassCoords = deptMembers.filter(u => u.role === 'CLASS_COORDINATOR');

                // Placement stats
                const placed = deptMembers.filter(s => s.placementStatus === 'PLACED').length;
                const offered = deptMembers.filter(s => s.placementStatus === 'OFFERED').length;

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
                    const deptApplicants = deptMembers.filter(s => applicants.includes(s.uid));
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
                    const deptParticipants = deptMembers.filter(s => participants.includes(s.uid));
                    inTrainingCount += deptParticipants.length;
                });

                setStats({
                    totalStudents: deptMembers.length,
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <StatCard icon={Users} title="Total Students" value={stats.totalStudents} color="bg-purple-500" />
                <StatCard icon={UserCheck} title="Class Coordinators" value={stats.totalCoordinators} color="bg-indigo-500" />
                <StatCard icon={Briefcase} title="Placed Students" value={stats.placedStudents} color="bg-green-500" />
            </div>

            {/* Analytics Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Placement Analytics */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Placement Analytics</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        {/* Placement Rate - Pie Chart */}
                        <div className="min-h-[220px] flex flex-col items-center justify-center relative">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2">Placement Status</h3>
                            <div className="w-full h-[220px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Placed', value: stats.placedStudents },
                                                { name: 'Unplaced', value: Math.max(0, stats.totalStudents - stats.placedStudents) }
                                            ]}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell key="cell-placed" fill="#22c55e" /> {/* Green */}
                                            <Cell key="cell-unplaced" fill="#e5e7eb" /> {/* Gray */}
                                        </Pie>
                                        <Tooltip />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text - manually positioned to match cy="45%" */}
                                <div className="absolute inset-x-0 top-0 h-[88%] flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-gray-800">
                                        {stats.totalStudents > 0 ? Math.round((stats.placedStudents / stats.totalStudents) * 100) : 0}%
                                    </span>
                                    <span className="text-xs text-gray-500">Placed</span>
                                </div>
                            </div>
                        </div>

                        {/* Drives Activity - Bar Chart */}
                        <div className="min-h-[200px] flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2 text-center">Drive Activity</h3>
                            <div className="w-full h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Eligible', value: stats.deptEligibleDrives, fill: '#3b82f6' }, // Blue
                                            { name: 'Active', value: stats.activeDrives, fill: '#8b5cf6' },   // Purple
                                            { name: 'Opted', value: stats.optedInStudents, fill: '#10b981' }, // Emerald
                                        ]}
                                        margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                                            {
                                                [
                                                    { name: 'Eligible', fill: '#3b82f6' },
                                                    { name: 'Active', fill: '#8b5cf6' },
                                                    { name: 'Opted', fill: '#10b981' }
                                                ].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Training Analytics */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Training Analytics</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        {/* Coverage - Bar Chart */}
                        <div className="min-h-[200px] flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2 text-center">Coverage</h3>
                            <div className="w-full h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Total', value: stats.totalStudents, fill: '#94a3b8' }, // Slate
                                            { name: 'Enrolled', value: stats.studentsInTraining, fill: '#0d9488' }, // Teal
                                        ]}
                                        margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                            <Cell key="cell-total" fill="#94a3b8" />
                                            <Cell key="cell-enrolled" fill="#0d9488" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="text-center mt-[-10px]">
                                    <span className="text-xs font-bold text-teal-600">
                                        {stats.totalStudents > 0 ? Math.round((stats.studentsInTraining / stats.totalStudents) * 100) : 0}% Coverage
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Program Activity - Bar Chart */}
                        <div className="min-h-[200px] flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2 text-center">Programs</h3>
                            <div className="w-full h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Eligible', value: stats.deptEligibleTrainings, fill: '#14b8a6' }, // Teal
                                            { name: 'Active', value: stats.activeTrainings, fill: '#06b6d4' },   // Cyan
                                        ]}
                                        margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                                            <Cell key="cell-eligible" fill="#14b8a6" />
                                            <Cell key="cell-active" fill="#06b6d4" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
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
