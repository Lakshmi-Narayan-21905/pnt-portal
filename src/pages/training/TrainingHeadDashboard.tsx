import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import {
    Users,
    GraduationCap,
    Calendar,
    TrendingUp,
    PieChart as PieIcon,
    BarChart3,
    AlertCircle,
    Plus,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    Search
} from 'lucide-react';

import { TrainingService } from '../../services/trainingService';
import { UserService } from '../../services/userService';
import type { Training, UserProfile } from '../../types';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { formatDate } from '../../utils/dateUtils';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
const STATUS_COLORS = {
    active: '#10B981',   // Emerald 500
    upcoming: '#3B82F6', // Blue 500
    completed: '#6B7280' // Gray 500
};

import { useTheme } from '../../hooks/useTheme';

const TrainingHeadDashboard: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Data State
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [coordinators, setCoordinators] = useState<{ dept: UserProfile[], class: UserProfile[] }>({ dept: [], class: [] });

    // Computed Stats
    const [stats, setStats] = useState({
        activeCount: 0,
        upcomingCount: 0,
        completedCount: 0,
        totalCoordinators: 0,
        uniqueStudentsCovered: 0,
        deptCoordCount: 0,
        classCoordCount: 0
    });

    // Chart Data
    const [chartData, setChartData] = useState<{
        statusData: { name: string; value: number; color: string }[];
        timelineData: { name: string; count: number }[];
        participationData: { name: string; count: number; fullName: string }[];
        deptCoordData: { name: string; count: number }[];
        yearDistribution: { name: string; value: number }[];
    }>({
        statusData: [],
        timelineData: [],
        participationData: [],
        deptCoordData: [],
        yearDistribution: []
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [allTrainings, deptCoords, classCoords] = await Promise.all([
                TrainingService.getAllTrainings(),
                UserService.getUsersByRole('DEPT_COORDINATOR'),
                UserService.getUsersByRole('CLASS_COORDINATOR')
            ]);

            setTrainings(allTrainings);
            setCoordinators({ dept: deptCoords, class: classCoords });

            processAnalytics(allTrainings, deptCoords, classCoords);
        } catch (error) {
            console.error("Dashboard Data Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const processAnalytics = (allTrainings: Training[], deptCoords: UserProfile[], classCoords: UserProfile[]) => {
        const now = Date.now();

        // 1. Program Status Logic
        const active = allTrainings.filter(t => t.startDate <= now && t.endDate >= now);
        const upcoming = allTrainings.filter(t => t.startDate > now);
        const completed = allTrainings.filter(t => t.endDate < now);

        // 2. Student Coverage (Unique IDs)
        const allParticipants = new Set<string>();
        allTrainings.forEach(t => t.participants?.forEach(uid => allParticipants.add(uid)));

        // 3. Status Chart Data
        const statusData = [
            { name: 'Active', value: active.length, color: STATUS_COLORS.active },
            { name: 'Upcoming', value: upcoming.length, color: STATUS_COLORS.upcoming },
            { name: 'Completed', value: completed.length, color: STATUS_COLORS.completed }
        ].filter(d => d.value > 0);

        // 4. Timeline Data (Monthly)
        const timelineMap: Record<string, number> = {};
        allTrainings.sort((a, b) => a.startDate - b.startDate).forEach(t => {
            const date = new Date(t.startDate);
            const key = date.toLocaleString('default', { month: 'short', year: '2-digit' }); // e.g. "Jan 24"
            timelineMap[key] = (timelineMap[key] || 0) + 1;
        });
        const timelineData = Object.entries(timelineMap).map(([name, count]) => ({ name, count }));

        // 5. Participants per Training (Top 10)
        const participationData = [...allTrainings]
            .map(t => ({ name: t.title.substring(0, 15) + (t.title.length > 15 ? '...' : ''), count: t.participants?.length || 0, fullName: t.title }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 6. Coordinators by Dept
        const coordMap: Record<string, number> = {};
        deptCoords.forEach(c => {
            const d = c.department || 'Unknown';
            coordMap[d] = (coordMap[d] || 0) + 1;
        });
        const deptCoordData = Object.entries(coordMap).map(([name, count]) => ({ name, count }));

        // 7. Year Distribution (Target Audience)
        const yearMap = { '1st': 0, '2nd': 0, '3rd': 0, '4th': 0 };
        allTrainings.forEach(t => {
            const y = t.eligibility.year;
            if (y === 1) yearMap['1st']++;
            else if (y === 2) yearMap['2nd']++;
            else if (y === 3) yearMap['3rd']++;
            else if (y === 4) yearMap['4th']++;
        });
        const yearDistribution = Object.entries(yearMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

        // Set State
        setStats({
            activeCount: active.length,
            upcomingCount: upcoming.length,
            completedCount: completed.length,
            totalCoordinators: deptCoords.length + classCoords.length,
            uniqueStudentsCovered: allParticipants.size,
            deptCoordCount: deptCoords.length,
            classCoordCount: classCoords.length
        });

        setChartData({
            statusData,
            timelineData,
            participationData,
            deptCoordData,
            yearDistribution
        });
    };

    const handleExportCoordinators = () => {
        const data = [...coordinators.dept, ...coordinators.class].map(c => ({
            Name: c.displayName,
            Email: c.email,
            Role: c.role,
            Department: c.department || 'N/A'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Coordinators");
        XLSX.writeFile(wb, "Coordinators_List.xlsx");
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header & Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Training Dashboard</h1>
                    <p className="text-gray-600 mt-1">Overview of training programs and performance metrics.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate('../trainings')} className="flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-primary transition-all">
                        <Search className="w-4 h-4 mr-2" /> Find Student
                    </button>
                    <button onClick={handleExportCoordinators} className="flex items-center px-4 py-2 border border-green-200 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all">
                        <Download className="w-4 h-4 mr-2" /> Export Coords
                    </button>
                    <button onClick={() => navigate('../trainings')} className="flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-green-primary hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-primary transition-shadow shadow-brand-green-primary/30">
                        <Plus className="w-4 h-4 mr-2" /> Create Program
                    </button>
                </div>
            </div>

            {/* KPI Cards Row 1: Programs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard
                    title="Active Programs"
                    value={stats.activeCount}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    border={`${theme.borderLeft} border-emerald-100`}
                />
                <KPICard
                    title="Upcoming Programs"
                    value={stats.upcomingCount}
                    icon={Clock}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    border={`${theme.borderLeft} border-blue-100`}
                />
                <KPICard
                    title="Total Trainings"
                    value={trainings.length}
                    icon={GraduationCap}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    border={`${theme.borderLeft} border-purple-100`}
                />
            </div>

            {/* KPI Cards Row 2: Coordinators (Smaller / Concise) */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/50 p-4 rounded-xl border ${theme.border}`}>
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Coordinators</p>
                        <p className="text-xl font-bold text-gray-800">{stats.totalCoordinators}</p>
                    </div>
                </div>
                <div className="border-l border-gray-200 pl-6">
                    <p className="text-sm text-gray-500">Dept Coordinators</p>
                    <p className="text-lg font-semibold text-gray-700">{stats.deptCoordCount}</p>
                </div>
                <div className="border-l border-gray-200 pl-6">
                    <p className="text-sm text-gray-500">Class Coordinators</p>
                    <p className="text-lg font-semibold text-gray-700">{stats.classCoordCount}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Status Distribution (Donut) */}
                <div className={`bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border ${theme.border}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-700">Program Status</h3>
                        <PieIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Timeline (Area/Line) - Spans 2 Cols */}
                <div className={`lg:col-span-2 bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border ${theme.border}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-700">Training Frequency (Monthly)</h3>
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.timelineData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Top Programs by Participation */}
                <div className={`lg:col-span-3 bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border ${theme.border}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-700">Highest Participation Programs</h3>
                        <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.participationData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#4B5563', fontSize: 13 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24} name="Participants">
                                    {chartData.participationData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Active Programs Report Table */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border ${theme.border} overflow-hidden`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">Active Training Programs Report</h3>
                    </div>
                    <span className="text-sm text-gray-500">Live programs requiring attention</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Trainer / Org</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Students</th>
                                <th className="px-6 py-4">Eligibility</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {trainings.filter(t => t.startDate <= Date.now() && t.endDate >= Date.now()).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        No active training programs at the moment.
                                    </td>
                                </tr>
                            ) : (
                                trainings
                                    .filter(t => t.startDate <= Date.now() && t.endDate >= Date.now())
                                    .map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{t.title}</div>
                                                <div className="text-xs text-gray-500">ID: {t.id.substring(0, 6)}...</div>
                                            </td>
                                            <td className="px-6 py-4">{t.trainer}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900">{formatDate(t.startDate)}</span>
                                                    <span className="text-xs text-gray-400">to {formatDate(t.endDate)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden flex-1 max-w-[60px]">
                                                        <div className="h-full bg-blue-500 w-[50%]"></div> {/* Mock progress */}
                                                    </div>
                                                    <span className="font-medium">{t.participants?.length || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs border border-purple-100">
                                                    Year {t.eligibility.year}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`../trainings/${t.id}`)}
                                                    className="text-brand-green-primary hover:text-brand-green-dark font-medium text-xs border border-brand-green-primary/20 bg-brand-green-ice/50 px-3 py-1.5 rounded-lg transition"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Helper Components
interface KPICardProps {
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, color, bg, border }) => (
    <div className={`p-6 rounded-xl shadow-md border ${border} border-l-4 bg-white/70 backdrop-blur-md hover:shadow-lg transition-all duration-300 group`}>
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            {/* Optional Trend Indicator could go here */}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);

export default TrainingHeadDashboard;
