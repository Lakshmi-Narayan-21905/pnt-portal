import React, { useEffect, useState } from 'react';
import { Users, Briefcase, GraduationCap, TrendingUp, AlertCircle, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';
import type { UserProfile } from '../../types';

const DeptCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalStudents: 0,
        placedStudents: 0,
        placementPercentage: 0,
        totalCoordinators: 0,
        readiness: { ready: 0, partial: 0, notReady: 0 },
        trainingCoverage: 0,
        enrolledCount: 0,
        weakSections: [] as { section: string, pct: number, issue: string }[],
        sectionReadiness: [] as { section: string, ready: number, partial: number, notReady: number }[]
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!userProfile?.department) return;
            setLoading(true);

            try {
                const [allStudents, allCoordinators, allCompanies, allTrainings] = await Promise.all([
                    UserService.getUsersByRole('STUDENT'),
                    UserService.getUsersByRole('CLASS_COORDINATOR'),
                    CompanyService.getAllCompanies(),
                    TrainingService.getAllTrainings()
                ]);

                // Filter for this department
                const deptStudents = allStudents.filter(u => u.department === userProfile.department);
                const deptCoordinators = allCoordinators.filter(u => u.department === userProfile.department);

                // --- 1. KPI Cards ---
                const totalStudents = deptStudents.length;
                const placedStudents = deptStudents.filter(s => s.placementStatus === 'PLACED').length;
                const placementPercentage = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;
                const totalCoordinators = deptCoordinators.length;

                // --- 2. Readiness & Training ---
                const trainingsParticipants = new Set<string>();
                allTrainings.forEach(t => {
                    t.participants?.forEach(uid => trainingsParticipants.add(uid));
                });

                const enrolledCount = deptStudents.filter(s => trainingsParticipants.has(s.uid)).length;
                const trainingCoverage = totalStudents > 0 ? Math.round((enrolledCount / totalStudents) * 100) : 0;

                // Global Readiness Logic
                const now = Date.now();
                const eligibleCompanies = allCompanies.filter(c => c.driveDate > now || c.targetYear >= 2026);

                let globalReady = 0, globalPartial = 0, globalNotReady = 0;

                // --- 3. Section Logic & Readiness ---
                const sectionMap: Record<string, UserProfile[]> = {};

                // Helper to check readiness
                const checkReadiness = (student: UserProfile) => {
                    const eligibleDrivesCount = eligibleCompanies.filter(c => {
                        const isDeptEligible = c.eligibilityCriteria?.branches?.includes(student.department || '');
                        const isCgpaEligible = (student.cgpa || 0) >= (c.eligibilityCriteria?.minCGPA || 0);

                        const hArrears = student.historyOfArreas || 0;
                        const sArrears = student.standingArreas || 0;
                        const maxH = c.eligibilityCriteria?.historyOfArrears ?? 100;
                        const maxS = c.eligibilityCriteria?.standingArrears ?? 100;

                        return isDeptEligible && isCgpaEligible && hArrears <= maxH && sArrears <= maxS;
                    }).length;

                    const isTrained = trainingsParticipants.has(student.uid);

                    if (eligibleDrivesCount > 0 && isTrained) return 'READY';
                    if (eligibleDrivesCount > 0) return 'PARTIAL';
                    return 'NOT_READY';
                };

                // Group by section and categorize global status same time
                deptStudents.forEach(s => {
                    const sec = s.section || 'Unassigned';
                    if (!sectionMap[sec]) sectionMap[sec] = [];
                    sectionMap[sec].push(s);

                    const status = checkReadiness(s);
                    if (status === 'READY') globalReady++;
                    else if (status === 'PARTIAL') globalPartial++;
                    else globalNotReady++;
                });

                // Calculate stats per section
                const sectionStats = Object.entries(sectionMap).map(([section, students]) => {
                    // Weak Section Logic
                    const p = students.filter(s => s.placementStatus === 'PLACED').length;
                    const pct = students.length > 0 ? Math.round((p / students.length) * 100) : 0;

                    let issue = '';
                    const avgCGPA = students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / students.length;
                    const trainingRate = students.filter(s => trainingsParticipants.has(s.uid)).length / students.length;

                    if (avgCGPA < 7.0) issue = 'Low Avg CGPA';
                    else if (trainingRate < 0.5) issue = 'Low Training';
                    else issue = 'Need Visits';

                    // Section Readiness Logic
                    let secReady = 0, secPartial = 0, secNotReady = 0;
                    students.forEach(s => {
                        const status = checkReadiness(s);
                        if (status === 'READY') secReady++;
                        else if (status === 'PARTIAL') secPartial++;
                        else secNotReady++;
                    });

                    return {
                        section,
                        pct,
                        issue,
                        count: students.length,
                        readiness: { ready: secReady, partial: secPartial, notReady: secNotReady }
                    };
                });

                // Weak Sections: Sort by placement % ascending (weakest first)
                const weakSections = sectionStats.sort((a, b) => a.pct - b.pct).slice(0, 3).map(s => ({
                    section: s.section,
                    pct: s.pct,
                    issue: s.issue
                }));

                // Section Readiness Data (Sorted by Section Name usually, or Readiness... let's do Name)
                const sectionReadiness = sectionStats.sort((a, b) => a.section.localeCompare(b.section)).map(s => ({
                    section: s.section,
                    ready: s.readiness.ready,
                    partial: s.readiness.partial,
                    notReady: s.readiness.notReady
                }));

                setStats({
                    totalStudents,
                    placedStudents,
                    placementPercentage,
                    totalCoordinators,
                    readiness: { ready: globalReady, partial: globalPartial, notReady: globalNotReady },
                    trainingCoverage,
                    enrolledCount,
                    weakSections,
                    sectionReadiness
                });

            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userProfile]);

    const COLORS = ['#22c55e', '#eab308', '#ef4444'];

    return (
        <div className="p-4 lg:h-screen lg:overflow-hidden flex flex-col bg-gray-50/50">
            {/* Header */}
            <div className="mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Department Overview</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{userProfile?.department} Department</p>
                </div>
                <div className="text-xs text-gray-400">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-medium uppercase">Total Students</p>
                        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalStudents}</h3>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-medium uppercase">Placed</p>
                        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.placedStudents}</h3>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                        <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-medium uppercase">Placement %</p>
                        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : `${stats.placementPercentage}%`}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-medium uppercase">Coordinators</p>
                        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalCoordinators}</h3>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                        <UserCheck className="w-5 h-5 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Row 2: Readiness & Training */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 flex-1 min-h-0">
                {/* Readiness Donut */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        Placement Readiness
                    </h3>
                    <div className="flex-1 flex items-center">
                        <div className="w-1/2 h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Ready', value: stats.readiness.ready },
                                            { name: 'Partial', value: stats.readiness.partial },
                                            { name: 'Not Ready', value: stats.readiness.notReady },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {COLORS.map((color, index) => (
                                            <Cell key={`cell-${index}`} fill={color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 text-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-gray-600">Ready</span>
                                </div>
                                <span className="font-bold text-gray-800">{stats.readiness.ready}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span className="text-gray-600">Partial</span>
                                </div>
                                <span className="font-bold text-gray-800">{stats.readiness.partial}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-gray-600">Not Ready</span>
                                </div>
                                <span className="font-bold text-gray-800">{stats.readiness.notReady}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Training Coverage */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        Training Coverage
                    </h3>

                    <div className="mb-2 flex justify-between text-sm">
                        <span className="text-gray-500">Students Enrolled</span>
                        <span className="font-bold text-gray-800">{stats.enrolledCount} / {stats.totalStudents}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
                        <div
                            className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${stats.trainingCoverage}%` }}
                        ></div>
                    </div>

                    <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700 border border-indigo-100">
                        <p className="font-semibold mb-1">Insight:</p>
                        {stats.trainingCoverage < 50
                            ? "Coverage is low. Urge coordinators to push for enrollment."
                            : stats.trainingCoverage > 80
                                ? "Excellent coverage! Focus on advanced modules."
                                : "Good progress. Target remaining students."
                        }
                    </div>
                </div>
            </div>

            {/* Row 3: Action Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">

                {/* Weak Sections */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            Weak Sections (Attention Needed)
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 rounded-l-lg">Section</th>
                                    <th className="px-3 py-2">Placement %</th>
                                    <th className="px-3 py-2 rounded-r-lg">Primary Issue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.weakSections.length > 0 ? (
                                    stats.weakSections.map((sec, i) => (
                                        <tr key={sec.section} className="hover:bg-gray-50">
                                            <td className="px-3 py-3 font-semibold text-gray-800">{sec.section}</td>
                                            <td className="px-3 py-3">
                                                <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-bold">
                                                    {sec.pct}%
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-gray-500 text-xs">{sec.issue}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-4 text-center text-gray-400 text-xs">
                                            All sections performing well!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section Readiness Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-500" />
                            Section Readiness Status
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 rounded-l-lg">Section</th>
                                    <th className="px-3 py-2 font-bold text-green-600">Ready</th>
                                    <th className="px-3 py-2 font-bold text-yellow-600">Partial</th>
                                    <th className="px-3 py-2 rounded-r-lg font-bold text-red-600">Not Ready</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.sectionReadiness.length > 0 ? (
                                    stats.sectionReadiness.map((item, i) => (
                                        <tr key={item.section} className="hover:bg-gray-50">
                                            <td className="px-3 py-3 font-medium text-gray-800">{item.section}</td>
                                            <td className="px-3 py-3 font-bold text-green-600 bg-green-50/50">{item.ready}</td>
                                            <td className="px-3 py-3 font-bold text-yellow-600 bg-yellow-50/50">{item.partial}</td>
                                            <td className="px-3 py-3 font-bold text-red-600 bg-red-50/50">{item.notReady}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-4 text-center text-gray-400 text-xs">
                                            No section data found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DeptCoordinatorDashboard;
