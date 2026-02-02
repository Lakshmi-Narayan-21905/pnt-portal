import React, { useEffect, useState } from 'react';
import {
    Users,
    Activity,
    Database,
    Server,
    Download,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';
import { PlacementRecordService } from '../../services/placementRecordService';
import type { UserProfile, Company, Training, PlacementRecord } from '../../types';
import {
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

import { useTheme } from '../../hooks/useTheme'; // Added import

const AdminDashboard: React.FC = () => {
    const theme = useTheme(); // Init hook
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // Raw Data
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [placements, setPlacements] = useState<PlacementRecord[]>([]);

    // Analytics State
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalCollections: 4,
        dbWritesToday: 0,
        totalStorage: 0,
        errorRate: 0,
    });

    const [chartData, setChartData] = useState<{
        usersByRole: any[];
        userGrowth: any[];
        dbActivity: any[];
        collectionSizes: any[];
    }>({
        usersByRole: [],
        userGrowth: [],
        dbActivity: [],
        collectionSizes: []
    });

    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchSystemData();
    }, []);

    const fetchSystemData = async () => {
        setLoading(true);
        try {
            const [allUsers, allCompanies, allTrainings, allPlacements] = await Promise.all([
                UserService.getUsersByRole('STUDENT').then(s =>
                    UserService.getUsersByRole('PLACEMENT_HEAD').then(ph =>
                        UserService.getUsersByRole('TRAINING_HEAD').then(th =>
                            UserService.getUsersByRole('DEPT_COORDINATOR').then(dc =>
                                [...s, ...ph, ...th, ...dc]
                            )
                        )
                    )
                ),
                CompanyService.getAllCompanies(),
                TrainingService.getAllTrainings(),
                PlacementRecordService.getAllRecords()
            ]);

            setUsers(allUsers);
            setCompanies(allCompanies);
            setTrainings(allTrainings);
            setPlacements(allPlacements);

            processAnalytics(allUsers, allCompanies, allTrainings, allPlacements);
            setLastRefresh(new Date());

        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const processAnalytics = (
        users: UserProfile[],
        companies: Company[],
        trainings: Training[],
        placements: PlacementRecord[]
    ) => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startOfDayTs = startOfDay.getTime();

        // 1. KPI Stats
        const newUsersToday = users.filter(u => u.createdAt && u.createdAt >= startOfDayTs).length;
        const newPlacementsToday = placements.filter(p => p.createdAt && p.createdAt >= startOfDayTs).length;

        const dbWritesProxy = newUsersToday + newPlacementsToday;
        const activeUsers = users.filter(u => u.profileCompleted).length;

        setStats({
            totalUsers: users.length,
            activeUsers: activeUsers,
            totalCollections: 4,
            dbWritesToday: dbWritesProxy,
            totalStorage: users.length + companies.length + trainings.length + placements.length,
            errorRate: 0
        });

        // 2. Charts: Users by Role
        const roleCounts: Record<string, number> = {};
        users.forEach(u => {
            const role = u.role.replace('_', ' ');
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
        const usersByRole = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

        // 3. User Growth & Activity
        const activityMap: Record<string, { users: number, placements: number }> = {};
        [...users].forEach(u => {
            if (u.createdAt) {
                const d = new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                if (!activityMap[d]) activityMap[d] = { users: 0, placements: 0 };
                activityMap[d].users++;
            }
        });
        [...placements].forEach(p => {
            if (p.createdAt) {
                const d = new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                if (!activityMap[d]) activityMap[d] = { users: 0, placements: 0 };
                activityMap[d].placements++;
            }
        });
        const dbActivity = Object.entries(activityMap).slice(-14).map(([name, data]) => ({
            name,
            users: data.users,
            placements: data.placements,
            total: data.users + data.placements
        }));

        // 4. Collection Sizes
        const collectionSizes = [
            { name: 'Users', count: users.length, color: '#6366F1' },
            { name: 'Companies', count: companies.length, color: '#10B981' },
            { name: 'Trainings', count: trainings.length, color: '#F59E0B' },
            { name: 'Records', count: placements.length, color: '#EF4444' }
        ];

        setChartData({ usersByRole, userGrowth: [], dbActivity, collectionSizes });

        // 5. Recent Logs
        const logs = [
            ...users.map(u => ({ type: 'User Joined', name: u.displayName, role: u.role, date: u.createdAt })),
            ...placements.map(p => ({ type: 'Placement Recorded', name: p.name, role: p.companyName, date: p.createdAt }))
        ]
            .filter(l => l.date)
            .sort((a, b) => (b.date || 0) - (a.date || 0))
            .slice(0, 10);

        setRecentLogs(logs);
    };

    const handleExport = () => {
        const data = [
            { Metric: 'Total Users', Value: stats.totalUsers },
            { Metric: 'Active Users', Value: stats.activeUsers },
            { Metric: 'Total Documents', Value: stats.totalStorage },
            { Metric: 'DB Writes (24h)', Value: stats.dbWritesToday },
            { Metric: 'Companies', Value: companies.length },
            { Metric: 'Trainings', Value: trainings.length }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "System_Health");
        XLSX.writeFile(wb, "System_Health_Report.xlsx");
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-indigo-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">

            {/* 1. Header & Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">System Overview</h1>
                    <p className="text-gray-600 mt-1 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        System Status: Operational
                        <span className="text-xs text-gray-400 ml-2">Last updated: {lastRefresh.toLocaleTimeString()}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchSystemData} className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition">
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </button>
                    <button onClick={handleExport} className="flex items-center px-4 py-2 bg-brand-indigo-primary text-white rounded-lg hover:bg-brand-indigo-dark shadow-lg shadow-brand-indigo-primary/30 transition">
                        <Download className="w-4 h-4 mr-2" /> Export Logs
                    </button>
                </div>
            </div>


            {/* 2. Global KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard title="Total Users" value={stats.totalUsers} subtext={`${stats.activeUsers} Verified`} icon={Users} color="text-indigo-600" bg="bg-indigo-50" border={theme.borderLeft} />
                <KPICard title="Total Docs" value={stats.totalStorage} subtext="Across 4 Collections" icon={Database} color="text-blue-600" bg="bg-blue-50" border={theme.borderLeft} />
                <KPICard title="Writes (24h)" value={stats.dbWritesToday} subtext="New Records Created" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" border={theme.borderLeft} />
            </div>

            {/* 3. User Analytics & DB Growth */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-6">User Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.usersByRole}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.usersByRole.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    verticalAlign="bottom"
                                    height={80}
                                    iconSize={8}
                                    wrapperStyle={{
                                        paddingTop: '20px',
                                        fontSize: '10px',
                                        width: '100%'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-6">Database Growth (Writes)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.dbActivity}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="total" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 4. Collection Overview & System Logs Stacked */}
            <div className="grid grid-cols-1 gap-6">

                {/* Collection Overview */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Collection Overview</h3>
                        <Database className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/50 text-gray-500 border-b">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Collection Name</th>
                                    <th className="px-6 py-3 font-medium">Doc Count</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Health</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {chartData.collectionSizes.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{c.count}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {c.count > 0 ? 'Active' : 'Empty'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[100px] ml-auto">
                                                <div
                                                    className={`h-1.5 rounded-full ${c.count > 0 ? 'bg-green-500' : 'bg-gray-400'}`}
                                                    style={{ width: c.count > 0 ? '100%' : '0%' }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Logs (Now full width since Insights are gone) */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800">Recent System Events</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/50 text-gray-500 border-b">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Timestamp</th>
                                    <th className="px-6 py-3 font-medium">Event Type</th>
                                    <th className="px-6 py-3 font-medium">Entity</th>
                                    <th className="px-6 py-3 font-medium">Role/Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentLogs.length === 0 ? (
                                    <tr><td colSpan={4} className="p-6 text-center text-gray-400">No recent events found.</td></tr>
                                ) : recentLogs.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                                            {new Date(log.date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${log.type === 'User Joined' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{log.name}</td>
                                        <td className="px-6 py-3 text-gray-600">{log.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                </div>

            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

// --- Helper Components ---
interface KPICardProps {
    title: string;
    value: number | string;
    subtext: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtext, icon: Icon, color, bg, border }) => (
    <div className={`bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border ${border || 'border-gray-100'} border-l-4 flex items-start justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 group`}>
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
            <p className="text-xs text-gray-400 mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-lg ${bg} ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

export default AdminDashboard;
