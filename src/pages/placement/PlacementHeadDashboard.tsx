import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Building2,
    Briefcase,
    BarChart3,
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus,
    Download,
    Search
} from 'lucide-react';
import { CompanyService } from '../../services/companyService';
import { UserService } from '../../services/userService';
import { PlacementRecordService } from '../../services/placementRecordService';
import type { Company, UserProfile, PlacementRecord } from '../../types';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { formatDate } from '../../utils/dateUtils';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
const STATUS_COLORS = {
    placed: '#10B981',
    unplaced: '#EF4444',
    offered: '#F59E0B'
};

import { useTheme } from '../../hooks/useTheme';

const PlacementHeadDashboard: React.FC = () => {
    const theme = useTheme();

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Data State
    const [companies, setCompanies] = useState<Company[]>([]);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [placementRecords, setPlacementRecords] = useState<PlacementRecord[]>([]);
    const [deptCoordinators, setDeptCoordinators] = useState<UserProfile[]>([]);

    // Computed Stats
    const [stats, setStats] = useState({
        activeDrives: 0,
        totalCompanies: 0,
        totalCoordinators: 0,
        totalStudents: 0,
        placedCount: 0,
        upcomingInterviews: 0
    });

    // Chart Data
    const [chartData, setChartData] = useState<{
        driveStatus: { name: string; value: number; color: string }[];
        drivesOverTime: { name: string; count: number }[];
        studentsPerDrive: { name: string; fullName: string; count: number }[];
        placementStatus: { name: string; value: number; color: string }[];
        placementsByDept: { name: string; count: number }[];
        placementsOverTime: any[]; // Keeping generic for now as it's empty
        salaryDistribution: { name: string; count: number }[];
        topRecruiters: { name: string; count: number }[];
        eligibilityOverview: { name: string; value: number; color: string }[];
    }>({
        driveStatus: [],
        drivesOverTime: [],
        studentsPerDrive: [],
        placementStatus: [],
        placementsByDept: [],
        placementsOverTime: [],
        salaryDistribution: [],
        topRecruiters: [],
        eligibilityOverview: []
    });

    // Alerts
    const [alerts, setAlerts] = useState<{ type: string; message: string; date?: string }[]>([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [allCompanies, allStudents, allRecords, allDeptCoords] = await Promise.all([
                CompanyService.getAllCompanies(),
                UserService.getAllStudents(),
                PlacementRecordService.getAllRecords(),
                UserService.getUsersByRole('DEPT_COORDINATOR')
            ]);

            setCompanies(allCompanies);
            setStudents(allStudents);
            setPlacementRecords(allRecords);
            setDeptCoordinators(allDeptCoords);

            processAnalytics(allCompanies, allStudents, allRecords, allDeptCoords);

        } catch (error) {
            console.error("Dashboard Data Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const processAnalytics = (
        comps: Company[],
        studs: UserProfile[],
        recs: PlacementRecord[],
        coords: UserProfile[]
    ) => {
        const now = Date.now();

        // --- 1. KPI Logic ---
        const activeDrives = comps.filter(c => c.deadline > now);
        const upcomingInterviews = comps.filter(c => c.driveDate > now && c.driveDate <= now + 7 * 24 * 60 * 60 * 1000); // Next 7 days

        // Count placed students based on records OR student status. 
        // Using Records is more accurate for "Offers", Student Status for "Individuals Placed"
        // const placedStudentIds = new Set(recs.map(r => r.rollNo.toLowerCase()));
        const placedCount = studs.filter(s => s.placementStatus === 'PLACED').length;

        setStats({
            activeDrives: activeDrives.length,
            totalCompanies: comps.length,
            totalCoordinators: coords.length,
            totalStudents: studs.length,
            placedCount: placedCount,
            upcomingInterviews: upcomingInterviews.length
        });

        // --- 2. Chart Logic ---

        // A. Drive Status Distribution
        const upcomingDrives = comps.filter(c => c.driveDate > now);
        const completedDrives = comps.filter(c => c.driveDate < now);
        const driveStatusData = [
            { name: 'Active (Open)', value: activeDrives.length, color: '#10B981' },
            { name: 'Upcoming (Scheduled)', value: upcomingDrives.length, color: '#3B82F6' },
            { name: 'Completed', value: completedDrives.length, color: '#6B7280' }
        ].filter(d => d.value > 0);

        // B. Drives Over Time
        const drivesTimeMap: Record<string, number> = {};
        comps.forEach(c => {
            const date = new Date(c.driveDate);
            const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            drivesTimeMap[key] = (drivesTimeMap[key] || 0) + 1;
        });
        const drivesOverTime = Object.entries(drivesTimeMap)
            .map(([name, count]) => ({ name, count }))
        // Sort roughly by date (this is rudimentary sorting, can be improved)
        // Ideally we convert to timestamp, sort, then format back.
        // For now, assuming insertion order or basic iteration often yields roughly chronologically if data is sequential.
        // Let's rely on data volume.

        // C. Students Registered per Drive (Top 10)
        const studentsPerDrive = [...comps]
            .map(c => ({ name: c.name.substring(0, 10) + '..', fullName: c.name, count: c.applicants?.length || 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // D. Placement Status Distribution
        const unplacedCount = studs.length - placedCount;
        const placementStatusData = [
            { name: 'Placed', value: placedCount, color: STATUS_COLORS.placed },
            { name: 'Unplaced', value: unplacedCount, color: STATUS_COLORS.unplaced }
        ];

        // E. Placements by Department (Headcount of Placed Students)
        const placementsByDeptMap: Record<string, number> = {};
        const uniquePlacedStudents = new Set<string>();

        // Use records to determine unique placed students.
        // This handles cases where student profile status might not be updated but a record exists.
        recs.forEach(r => {
            // Identify student by roll number.
            const studentId = r.rollNo?.toLowerCase();
            if (studentId && !uniquePlacedStudents.has(studentId)) {
                uniquePlacedStudents.add(studentId);
                const d = r.department || 'Unknown';
                placementsByDeptMap[d] = (placementsByDeptMap[d] || 0) + 1;
            }
        });

        const placementsByDept = Object.entries(placementsByDeptMap).map(([name, count]) => ({ name, count }));

        // F. Salary & Offer Analytics - Package Distribution
        // bucket: <3, 3-5, 5-10, 10+
        const salaryBuckets = { '< 3 LPA': 0, '3-5 LPA': 0, '5-10 LPA': 0, '10+ LPA': 0 };
        const companiesByOfferCount: Record<string, number> = {};

        recs.forEach(r => {
            // Salary
            const pkgStr = r.package?.toLowerCase().replace(/[a-z\s]/g, '') || '0';
            const pkg = parseFloat(pkgStr);
            if (!isNaN(pkg) && pkg > 0) {
                if (pkg < 3) salaryBuckets['< 3 LPA']++;
                else if (pkg < 5) salaryBuckets['3-5 LPA']++;
                else if (pkg < 10) salaryBuckets['5-10 LPA']++;
                else salaryBuckets['10+ LPA']++;
            }

            // Top Recruiters
            companiesByOfferCount[r.companyName] = (companiesByOfferCount[r.companyName] || 0) + 1;
        });

        const salaryDistribution = Object.entries(salaryBuckets).map(([name, count]) => ({ name, count }));
        const topRecruiters = Object.entries(companiesByOfferCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // G. Eligibility Overview (Student Batch Health)
        const eligibleCount = studs.filter(s =>
            (s.cgpa && s.cgpa >= 6.0) &&
            (s.standingArreas === 0 || s.standingArreas === undefined)
        ).length;
        const eligibilityOverview = [
            { name: 'Placement Ready (>6 CGPA, 0 Arrears)', value: eligibleCount, color: '#10B981' },
            { name: 'Needs Improvement', value: studs.length - eligibleCount, color: '#F59E0B' }
        ];


        setChartData({
            driveStatus: driveStatusData,
            drivesOverTime,
            studentsPerDrive,
            placementStatus: placementStatusData,
            placementsByDept,
            placementsOverTime: [], // Skipping for now as record dates aren't reliably parsed without specific logic
            salaryDistribution,
            topRecruiters,
            eligibilityOverview
        });

        // --- 3. Alerts Generation ---
        const newAlerts: { type: string; message: string; date?: string }[] = [];

        // Drive closing soon
        comps.forEach(c => {
            const timeLeft = c.deadline - now;
            const hoursLeft = timeLeft / (1000 * 60 * 60);
            if (timeLeft > 0 && hoursLeft < 48) {
                newAlerts.push({
                    type: 'deadline',
                    message: `Deadline for ${c.name} ends in ${Math.ceil(hoursLeft)} hours.`,
                    date: formatDate(c.deadline)
                });
            }
        });

        // Pending Verifications
        const pendingVerifications = studs.filter(s => s.profileStatus === 'APPROVAL_PENDING').length;
        if (pendingVerifications > 0) {
            newAlerts.push({
                type: 'action',
                message: `${pendingVerifications} student profiles waiting for approval.`
            });
        }

        // Low registrations (Active drives with < 10 applicants)
        activeDrives.forEach(c => {
            if ((c.applicants?.length || 0) < 10) {
                newAlerts.push({
                    type: 'warning',
                    message: `Low registration for ${c.name} (${c.applicants?.length || 0} students).`
                });
            }
        });

        setAlerts(newAlerts.slice(0, 5)); // Top 5 alerts
    };

    const handleExport = (type: 'students' | 'drives') => {
        if (type === 'students') {
            const data = students.map(s => ({
                Name: s.displayName,
                RollNo: s.rollNo,
                Dept: s.department,
                CGPA: s.cgpa,
                Status: s.placementStatus
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Students");
            XLSX.writeFile(wb, "Student_List.xlsx");
        } else {
            const data = companies.map(c => ({
                Company: c.name,
                Type: c.type,
                DriveDate: formatDate(c.driveDate),
                Applicants: c.applicants?.length || 0
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Drives");
            XLSX.writeFile(wb, "Drives_List.xlsx");
        }
    };


    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">

            {/* 1. Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Placement Dashboard</h1>
                    <p className="text-gray-600 mt-1">Overview of recruitment drives, student placements, and records.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate('../students')} className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition">
                        <Search className="w-4 h-4 mr-2" /> Find Student
                    </button>
                    <div className="flex rounded-md shadow-sm">

                        <button onClick={() => handleExport('drives')} className="flex items-center px-4 py-2 border border-green-200 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all    ">
                            <Download className="w-4 h-4 mr-2" /> Drive Data
                        </button>
                    </div>

                    <button onClick={() => navigate('../companies')} className="flex items-center px-4 py-2 bg-brand-green-primary text-white rounded-lg hover:bg-brand-green-dark shadow-lg shadow-brand-green-primary/30 transition">
                        <Plus className="w-4 h-4 mr-2" /> Schedule Drive
                    </button>
                </div>
            </div>

            {/* 2. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPISmall title="Active Drives" value={stats.activeDrives} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" border={theme.borderLeft} />
                <KPISmall title="Total Companies" value={stats.totalCompanies} icon={Building2} color="text-blue-500" bg="bg-blue-50" border={theme.borderLeft} />
                <KPISmall title="Placed Students" value={stats.placedCount} icon={Briefcase} color="text-purple-500" bg="bg-purple-50" border={theme.borderLeft} />
                <KPISmall title="Total Students" value={stats.totalStudents} icon={Users} color="text-gray-500" bg="bg-gray-50" border={theme.borderLeft} />
                <KPISmall title="Coordinators" value={stats.totalCoordinators} icon={Users} color="text-indigo-500" bg="bg-indigo-50" border={theme.borderLeft} />
                <KPISmall title="Interviews (7d)" value={stats.upcomingInterviews} icon={Clock} color="text-orange-500" bg="bg-orange-50" border={theme.borderLeft} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 3. Alerts & Notifications (Top Priority) */}
                <div className={`bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-gray-400" /> Action Required
                        </h3>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {alerts.length === 0 ? (
                            <p className="text-gray-400 text-sm italic">No urgent alerts at this time.</p>
                        ) : alerts.map((alert, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border text-sm flex gap-3 ${alert.type === 'deadline' ? 'bg-red-50 border-red-100 text-red-700' :
                                alert.type === 'action' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' :
                                    'bg-blue-50 border-blue-100 text-blue-700'
                                }`}>
                                <div className="mt-0.5"><AlertCircle className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-semibold">{alert.message}</p>
                                    {alert.date && <p className="text-xs opacity-75 mt-1">{alert.date}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Drive Status & Funnel */}
                <div className={`bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} p-6`}>
                    <h3 className="font-bold text-gray-800 mb-6">Recruitment Drive Status</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.driveStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.driveStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Placement Status */}
                <div className={`bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} p-6`}>
                    <h3 className="font-bold text-gray-800 mb-6">Student Placement Status</h3>
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.placementStatus}
                                    cx="50%"
                                    cy="70%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.placementStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[65%] left-0 right-0 text-center transform -translate-y-1/2">
                            <p className="text-3xl font-bold text-gray-800">{Math.round((stats.placedCount / (stats.totalStudents || 1)) * 100)}%</p>
                            <p className="text-xs text-gray-500">Placement Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Recruitment Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} p-6`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800">Top Recruiters (Offers)</h3>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.topRecruiters} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#4B5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: '#F3F4F6' }} />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20}>
                                    {chartData.topRecruiters.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} p-6`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800">Highest Registration Drives</h3>
                        <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.studentsPerDrive}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{ fill: '#6B7280', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            {/* 7. Department & Salary  */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className={`lg:col-span-2 bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} p-6`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800">Students Placed by Department</h3>
                        <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.placementsByDept}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40}>
                                    {chartData.placementsByDept.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}             </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} p-6`}>
                    <h3 className="font-bold text-gray-800 mb-6">Package Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.salaryDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="count"
                                >
                                    {chartData.salaryDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 8. Recent Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Drives List */}
                <div className={`bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} overflow-hidden`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Live & Upcoming Drives</h3>
                        <button onClick={() => navigate('../companies')} className="text-xs text-blue-600 font-medium hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/50 text-gray-500 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Company</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Applicants</th>
                                    <th className="px-4 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {companies
                                    .filter(c => c.driveDate >= Date.now())
                                    .sort((a, b) => a.driveDate - b.driveDate)
                                    .slice(0, 5)
                                    .map(c => (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{c.name}</div>
                                                <div className="text-xs text-gray-500">{c.type}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {formatDate(c.driveDate)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                    {c.applicants?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => navigate(`../companies/${c.id}`)} className="text-gray-400 hover:text-blue-600">
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Placements List */}
                <div className={`bg-white/70 backdrop-blur-md rounded-xl shadow-md border ${theme.border} overflow-hidden`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Recent Placements</h3>
                        <button onClick={() => navigate('../records')} className="text-xs text-blue-600 font-medium hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/50 text-gray-500 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Student</th>
                                    <th className="px-4 py-3 font-medium">Company</th>
                                    <th className="px-4 py-3 font-medium">Package</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {placementRecords.slice(0, 5).map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{r.name}</div>
                                            <div className="text-xs text-gray-500">{r.department}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{r.companyName}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold border border-green-100">
                                                {r.package}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {placementRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic">No records found.</td>
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

// --- Helper Components ---

interface KPISmallProps {
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border?: string;
}

const KPISmall: React.FC<KPISmallProps> = ({ title, value, icon: Icon, color, bg, border }) => (
    <div className={`p-5 rounded-xl border ${border || 'border-gray-100'} bg-white/70 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between group border-l-4`}>

        <div>
            <p className={`text-xs font-bold uppercase tracking-wide mb-1 opacity-70 ${color.replace('text-', 'text-')}`}>{title}</p>
            <p className={`text-3xl font-bold ${color.replace('500', '900').replace('600', '900')}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
    </div>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);


export default PlacementHeadDashboard;