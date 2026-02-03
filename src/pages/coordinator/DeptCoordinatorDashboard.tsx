import React, { useEffect, useState } from 'react';
import { Users, Briefcase, GraduationCap, TrendingUp, AlertCircle, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';
import type { UserProfile } from '../../types';

import { useTheme } from '../../hooks/useTheme';

const DeptCoordinatorDashboard: React.FC = () => {
    const theme = useTheme();
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
        atRiskStudents: [] as any[],
        nextDriveStats: null as any
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
                const deptStudents = [...allStudents, ...allCoordinators].filter(u => u.department === userProfile.department);
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

                // --- 3. At Risk Students ---
                // Criteria: Unplaced AND (CGPA < 6.0 OR Arrears > 0)
                const atRiskStudents = deptStudents
                    .filter(s => s.placementStatus !== 'PLACED' && ((s.cgpa || 0) < 6.0 || (s.standingArreas || 0) > 0 || (s.historyOfArreas || 0) > 0))
                    .map(s => {
                        let issue = '';
                        if ((s.standingArreas || 0) > 0) issue = `${s.standingArreas} Standing Arrears`;
                        else if ((s.historyOfArreas || 0) > 0) issue = 'History of Arrears';
                        else issue = 'Low CGPA';
                        return { ...s, issue };
                    })
                    .slice(0, 5); // Top 5

                // --- 4. Next Drive Readiness ---
                // Find next upcoming drive
                const nextCompany = allCompanies
                    .filter(c => c.driveDate > now)
                    .sort((a, b) => a.driveDate - b.driveDate)[0];

                let nextDriveStats = null;

                if (nextCompany) {
                    const eligibleStudents = deptStudents.filter(s => {
                        // Basic Eligibility Check
                        const isDeptEligible = nextCompany.eligibilityCriteria?.branches?.includes(s.department || '');
                        const isCgpaEligible = (s.cgpa || 0) >= (nextCompany.eligibilityCriteria?.minCGPA || 0);
                        const hArrears = s.historyOfArreas || 0;
                        const sArrears = s.standingArreas || 0;
                        const maxH = nextCompany.eligibilityCriteria?.historyOfArrears ?? 100;
                        const maxS = nextCompany.eligibilityCriteria?.standingArrears ?? 100;

                        return isDeptEligible && isCgpaEligible && hArrears <= maxH && sArrears <= maxS;
                    });

                    const readyCount = eligibleStudents.filter(s => trainingsParticipants.has(s.uid)).length;

                    nextDriveStats = {
                        name: nextCompany.name,
                        date: nextCompany.driveDate,
                        totalEligible: eligibleStudents.length,
                        ready: readyCount,
                        notReady: eligibleStudents.length - readyCount
                    };
                }

                setStats({
                    totalStudents,
                    placedStudents,
                    placementPercentage,
                    totalCoordinators,
                    readiness: { ready: globalReady, partial: globalPartial, notReady: globalNotReady },
                    trainingCoverage,
                    enrolledCount,
                    atRiskStudents,
                    nextDriveStats
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
                <div className={`bg-white p-4 rounded-xl shadow-sm border ${theme.border} flex items-center justify-between`}>
                    <div>
                        <p className="text-gray-500 text-xs font-medium uppercase">Total Students</p>
                        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalStudents}</h3>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                    </div>
                </div>

                <div className={`bg-white p-4 rounded-xl shadow-sm border ${theme.border} flex items-center justify-between`}>
                    <div>
                        <p className="text-gray-500 text-xs font-medium uppercase">Placed</p>
                        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.placedStudents}</h3>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                        <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                </div>

                <div className={`bg-white p-4 rounded-xl shadow-sm border ${theme.border} flex items-center justify-between`}>
                    <div>
                        <p className="text-gray-500 text-xs font-medium uppercase">Placement %</p>
                        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : `${stats.placementPercentage}%`}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                </div>

                <div className={`bg-white p-4 rounded-xl shadow-sm border ${theme.border} flex items-center justify-between`}>
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
                <div className={`bg-white rounded-xl shadow-sm border ${theme.border} p-4 flex flex-col`}>
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
                <div className={`bg-white rounded-xl shadow-sm border ${theme.border} p-4 flex flex-col justify-center`}>
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

            {/* Row 3: At Risk & Next Drive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">

                {/* At Risk Students */}
                <div className={`bg-white rounded-xl shadow-sm border ${theme.border} p-4 flex flex-col`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            At Risk Students <span className="text-xs font-normal text-gray-500">(Unplaced & Low Stats)</span>
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 rounded-l-lg">Name</th>
                                    <th className="px-3 py-2">CGPA</th>
                                    <th className="px-3 py-2 rounded-r-lg">Issue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {/* @ts-ignore */}
                                {stats.atRiskStudents && stats.atRiskStudents.length > 0 ? (
                                    // @ts-ignore
                                    stats.atRiskStudents.map((student, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-3 py-3 font-semibold text-gray-800">
                                                {student.displayName}
                                                <span className="block text-xs text-gray-400">{student.section}</span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`font-mono font-bold ${student.cgpa < 6 ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {student.cgpa || '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-red-500 text-xs font-medium">{student.issue}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-4 text-center text-gray-400 text-xs">
                                            No high-risk students found!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Next Drive Readiness */}
                <div className={`bg-white rounded-xl shadow-sm border ${theme.border} p-4 flex flex-col`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            Next Drive Readiness
                        </h3>
                        {/* @ts-ignore */}
                        {stats.nextDriveStats && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                                {/* @ts-ignore */}
                                {stats.nextDriveStats.name}
                            </span>
                        )}
                    </div>

                    {/* @ts-ignore */}
                    {stats.nextDriveStats ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-gray-500">Eligible Students</span>
                                {/* @ts-ignore */}
                                <span className="font-bold text-gray-900">{stats.nextDriveStats.totalEligible}</span>
                            </div>

                            {/* @ts-ignore */}
                            {stats.nextDriveStats.totalEligible > 0 ? (
                                <>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-600">Ready (Trained)</span>
                                                {/* @ts-ignore */}
                                                <span className="font-bold text-green-600">{stats.nextDriveStats.ready}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full"
                                                    // @ts-ignore
                                                    style={{ width: `${(stats.nextDriveStats.ready / stats.nextDriveStats.totalEligible) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-600">Not Ready (Untrained)</span>
                                                {/* @ts-ignore */}
                                                <span className="font-bold text-red-600">{stats.nextDriveStats.notReady}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-red-500 h-2 rounded-full"
                                                    // @ts-ignore
                                                    style={{ width: `${(stats.nextDriveStats.notReady / stats.nextDriveStats.totalEligible) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-4">
                                        <p className="text-xs text-yellow-800">
                                            <strong>Action:</strong> Ensure the {
                                                // @ts-ignore
                                                stats.nextDriveStats.notReady
                                            } untrained students complete their training before {
                                                // @ts-ignore
                                                new Date(stats.nextDriveStats.date).toLocaleDateString()
                                            }.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-xs">
                                    No students meet eligibility criteria for this drive.
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-8">
                            <Briefcase className="w-8 h-8 opacity-20" />
                            <p className="text-xs">No upcoming drives scheduled.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DeptCoordinatorDashboard;
