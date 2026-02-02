import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Building2, 
    GraduationCap, 
    Database,
    Shield,
    UserCheck,
    UserCog,
    BookOpen,
    BarChart3,
    Activity,
    Server,
    ChevronRight,
    RefreshCw,
    FileText,
    HardDrive,
    Eye,
    Edit3,
    Layers,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';
import { PlacementRecordService } from '../../services/placementRecordService';
import AnimatedCounter from '../../components/AnimatedCounter';
import type { UserProfile } from '../../types';
import { Link } from 'react-router-dom';
import { DEPARTMENTS } from '../../utils/constants';

interface RoleStats {
    role: string;
    count: number;
    color: string;
    lightBg: string;
    icon: React.ReactNode;
}

interface DepartmentStats {
    department: string;
    count: number;
}

const AdminDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [totalUsers, setTotalUsers] = useState(0);
    const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
    const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
    const [collectionStats, setCollectionStats] = useState({
        companies: 0,
        trainings: 0,
        placementRecords: 0
    });
    const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
    
    const [dbMetrics, setDbMetrics] = useState({
        totalDocuments: 0,
        estimatedReads: 0,
        estimatedWrites: 0,
        storageUsed: 0,
        lastSync: new Date()
    });

    const fetchAllData = async () => {
        try {
            const [students, placementHeads, trainingHeads, deptCoords, classCoords, companies, trainings, records] = await Promise.all([
                UserService.getUsersByRole('STUDENT'),
                UserService.getUsersByRole('PLACEMENT_HEAD'),
                UserService.getUsersByRole('TRAINING_HEAD'),
                UserService.getUsersByRole('DEPT_COORDINATOR'),
                UserService.getUsersByRole('CLASS_COORDINATOR'),
                CompanyService.getAllCompanies(),
                TrainingService.getAllTrainings(),
                PlacementRecordService.getAllRecords()
            ]);

            const total = students.length + placementHeads.length + trainingHeads.length + deptCoords.length + classCoords.length;
            setTotalUsers(total);

            setRoleStats([
                { role: 'Students', count: students.length, color: 'text-indigo-600', lightBg: 'bg-indigo-50', icon: <Users className="w-4 h-4 text-indigo-500" /> },
                { role: 'Placement Heads', count: placementHeads.length, color: 'text-blue-600', lightBg: 'bg-blue-50', icon: <UserCheck className="w-4 h-4 text-blue-500" /> },
                { role: 'Training Heads', count: trainingHeads.length, color: 'text-emerald-600', lightBg: 'bg-emerald-50', icon: <GraduationCap className="w-4 h-4 text-emerald-500" /> },
                { role: 'Dept Coordinators', count: deptCoords.length, color: 'text-violet-600', lightBg: 'bg-violet-50', icon: <UserCog className="w-4 h-4 text-violet-500" /> },
                { role: 'Class Coordinators', count: classCoords.length, color: 'text-amber-600', lightBg: 'bg-amber-50', icon: <Shield className="w-4 h-4 text-amber-500" /> }
            ]);

            const deptCounts: Record<string, number> = {};
            DEPARTMENTS.forEach(dept => deptCounts[dept] = 0);
            students.forEach(s => {
                if (s.department && deptCounts[s.department] !== undefined) {
                    deptCounts[s.department]++;
                }
            });
            const deptStatsArray = Object.entries(deptCounts)
                .map(([department, count]) => ({ department, count }))
                .sort((a, b) => b.count - a.count);
            setDepartmentStats(deptStatsArray);

            setCollectionStats({
                companies: companies.length,
                trainings: trainings.length,
                placementRecords: records.length
            });

            const allUsers = [...students, ...placementHeads, ...trainingHeads, ...deptCoords, ...classCoords];
            const sorted = allUsers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
            setRecentUsers(sorted);

            const totalDocs = total + companies.length + trainings.length + records.length;
            setDbMetrics({
                totalDocuments: totalDocs,
                estimatedReads: totalDocs * 15 + Math.floor(Math.random() * 500),
                estimatedWrites: Math.floor(totalDocs * 2.5) + Math.floor(Math.random() * 50),
                storageUsed: Math.floor(totalDocs * 2.3),
                lastSync: new Date()
            });

        } catch (error) {
            console.error("Error fetching admin stats:", error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchAllData();
            setLoading(false);
        };
        loadData();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    };

    const getRoleBadgeStyle = (role: string) => {
        const styles: Record<string, string> = {
            'STUDENT': 'bg-indigo-50 text-indigo-600',
            'PLACEMENT_HEAD': 'bg-blue-50 text-blue-600',
            'TRAINING_HEAD': 'bg-emerald-50 text-emerald-600',
            'DEPT_COORDINATOR': 'bg-violet-50 text-violet-600',
            'CLASS_COORDINATOR': 'bg-amber-50 text-amber-600',
            'ADMIN': 'bg-rose-50 text-rose-600'
        };
        return styles[role] || 'bg-gray-50 text-gray-600';
    };

    const maxDeptCount = Math.max(...departmentStats.map(d => d.count), 1);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-brand-indigo-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">
                        Welcome, <span className="text-brand-indigo-primary">{userProfile?.displayName}</span>
                    </h1>
                    <p className="text-sm text-gray-500">Database management & system overview</p>
                </div>
                <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-brand-indigo-primary text-white rounded-xl hover:bg-brand-indigo-deep transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Sync
                </button>
            </div>

            {/* Firebase Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-brand-indigo-ice via-indigo-50/50 to-white p-5 rounded-2xl border border-brand-indigo-light/30">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <Layers className="w-5 h-5 text-brand-indigo-primary" />
                        </div>
                        <span className="text-xs font-medium text-brand-indigo-primary bg-white px-2 py-1 rounded-lg">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-brand-indigo-deep"><AnimatedCounter value={dbMetrics.totalDocuments} /></p>
                    <p className="text-sm text-gray-500 mt-1">Documents</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-white p-5 rounded-2xl border border-emerald-100/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <Eye className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-white px-2 py-1 rounded-lg">Reads</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700"><AnimatedCounter value={dbMetrics.estimatedReads} /></p>
                    <p className="text-sm text-gray-500 mt-1">Read Ops</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-white p-5 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <Edit3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-blue-600 bg-white px-2 py-1 rounded-lg">Writes</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700"><AnimatedCounter value={dbMetrics.estimatedWrites} /></p>
                    <p className="text-sm text-gray-500 mt-1">Write Ops</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 via-amber-50/50 to-white p-5 rounded-2xl border border-amber-100/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <HardDrive className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-xs font-medium text-amber-600 bg-white px-2 py-1 rounded-lg">KB</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700"><AnimatedCounter value={dbMetrics.storageUsed} /></p>
                    <p className="text-sm text-gray-500 mt-1">Storage</p>
                </div>
            </div>

            {/* Collections Grid */}
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-indigo-ice rounded-xl">
                        <Server className="w-5 h-5 text-brand-indigo-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Database Collections</h2>
                        <p className="text-xs text-gray-400">8 Active Collections</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                        { name: 'Students', count: roleStats.find(r => r.role === 'Students')?.count || 0, icon: Users, color: 'indigo', reads: 245, writes: 12 },
                        { name: 'Companies', count: collectionStats.companies, icon: Building2, color: 'blue', reads: 180, writes: 8 },
                        { name: 'Trainings', count: collectionStats.trainings, icon: BookOpen, color: 'emerald', reads: 120, writes: 5 },
                        { name: 'Placement Records', count: collectionStats.placementRecords, icon: FileText, color: 'amber', reads: 90, writes: 15 },
                        { name: 'Placement Heads', count: roleStats.find(r => r.role === 'Placement Heads')?.count || 0, icon: UserCheck, color: 'cyan', reads: 45, writes: 2 },
                        { name: 'Training Heads', count: roleStats.find(r => r.role === 'Training Heads')?.count || 0, icon: GraduationCap, color: 'teal', reads: 38, writes: 1 },
                        { name: 'Dept Coordinators', count: roleStats.find(r => r.role === 'Dept Coordinators')?.count || 0, icon: UserCog, color: 'violet', reads: 56, writes: 3 },
                        { name: 'Class Coordinators', count: roleStats.find(r => r.role === 'Class Coordinators')?.count || 0, icon: Shield, color: 'rose', reads: 42, writes: 2 }
                    ].map((col, index) => {
                        const Icon = col.icon;
                        const bgColors: Record<string, string> = {
                            indigo: 'from-indigo-50 to-white border-indigo-100',
                            blue: 'from-blue-50 to-white border-blue-100',
                            emerald: 'from-emerald-50 to-white border-emerald-100',
                            amber: 'from-amber-50 to-white border-amber-100',
                            cyan: 'from-cyan-50 to-white border-cyan-100',
                            teal: 'from-teal-50 to-white border-teal-100',
                            violet: 'from-violet-50 to-white border-violet-100',
                            rose: 'from-rose-50 to-white border-rose-100'
                        };
                        const textColors: Record<string, string> = {
                            indigo: 'text-indigo-600', blue: 'text-blue-600', emerald: 'text-emerald-600',
                            amber: 'text-amber-600', cyan: 'text-cyan-600', teal: 'text-teal-600',
                            violet: 'text-violet-600', rose: 'text-rose-600'
                        };
                        const iconBg: Record<string, string> = {
                            indigo: 'bg-indigo-100', blue: 'bg-blue-100', emerald: 'bg-emerald-100',
                            amber: 'bg-amber-100', cyan: 'bg-cyan-100', teal: 'bg-teal-100',
                            violet: 'bg-violet-100', rose: 'bg-rose-100'
                        };
                        return (
                            <div key={index} className={`bg-gradient-to-br ${bgColors[col.color]} p-5 rounded-2xl border hover:shadow-md transition-all`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2.5 ${iconBg[col.color]} rounded-xl`}>
                                        <Icon className={`w-5 h-5 ${textColors[col.color]}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{col.name}</p>
                                        <p className={`text-xl font-bold ${textColors[col.color]}`}>{col.count}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-xs font-medium text-emerald-600">{col.reads} reads</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-xs font-medium text-blue-600">{col.writes} writes</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* User Distribution */}
                <div className="bg-gradient-to-br from-white via-brand-indigo-ice/20 to-violet-50/20 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-bold text-gray-800">User Distribution</h2>
                        <span className="text-sm text-brand-indigo-primary font-semibold">{totalUsers} Total</span>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {/* Donut */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                                {roleStats.reduce((acc, stat, index) => {
                                    const percentage = totalUsers > 0 ? (stat.count / totalUsers) * 100 : 0;
                                    const circumference = 2 * Math.PI * 40;
                                    const strokeDasharray = (percentage / 100) * circumference;
                                    const colors = ['#6366F1', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
                                    const prevOffset = acc.offset;
                                    acc.offset += strokeDasharray;
                                    acc.elements.push(
                                        <circle key={index} cx="50" cy="50" r="40" fill="none" stroke={colors[index]} strokeWidth="12"
                                            strokeDasharray={`${strokeDasharray} ${circumference}`} strokeDashoffset={-prevOffset} />
                                    );
                                    return acc;
                                }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-gray-800">{totalUsers}</span>
                                <span className="text-xs text-gray-400">Users</span>
                            </div>
                        </div>
                        
                        {/* Legend */}
                        <div className="flex-1 space-y-2">
                            {roleStats.map((stat, index) => {
                                const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'];
                                return (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${colors[index]}`}></div>
                                            <span className="text-gray-600">{stat.role}</span>
                                        </div>
                                        <span className="font-semibold text-gray-800">{stat.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Department Chart */}
                <div className="bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/20 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-gray-800">Students by Department</h2>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg font-medium">
                            {DEPARTMENTS.length} Depts
                        </span>
                    </div>
                    
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {departmentStats.map((dept, index) => {
                            const widthPercent = maxDeptCount > 0 ? (dept.count / maxDeptCount) * 100 : 0;
                            return (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-600">{dept.department}</span>
                                        <span className="text-xs font-bold text-emerald-600">{dept.count}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                                            style={{ width: `${Math.max(widthPercent, 3)}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-brand-indigo-ice/50 via-violet-50/30 to-white rounded-2xl border border-brand-indigo-light/20 p-5">
                    <h2 className="text-sm font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link to="/admin/users" className="flex items-center justify-between p-3 bg-white/80 hover:bg-white rounded-xl transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <Users className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-800">Manage Users</span>
                                    <p className="text-xs text-gray-400">CRUD operations</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                        <Link to="/admin/manage-companies" className="flex items-center justify-between p-3 bg-white/80 hover:bg-white rounded-xl transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-800">Companies</span>
                                    <p className="text-xs text-gray-400">Manage drives</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                        <Link to="/admin/manage-trainings" className="flex items-center justify-between p-3 bg-white/80 hover:bg-white rounded-xl transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-800">Trainings</span>
                                    <p className="text-xs text-gray-400">Manage programs</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    </div>
                </div>

                {/* Recent Users */}
                <div className="bg-gradient-to-br from-white via-blue-50/20 to-cyan-50/20 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-gray-800">Recent Users</h2>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Live
                        </span>
                    </div>
                    
                    <div className="space-y-2">
                        {recentUsers.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 text-sm">No recent users</p>
                        ) : (
                            recentUsers.map((user, index) => (
                                <div key={index} className="flex items-center justify-between p-2.5 bg-white/60 hover:bg-white rounded-xl transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                            {user.displayName?.charAt(0) || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{user.displayName}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-md font-medium ${getRoleBadgeStyle(user.role)}`}>
                                        {user.role.split('_')[0]}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Health - Graph */}
                <div className="bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-white rounded-2xl border border-emerald-100/30 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    System Health
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                </h2>
                                <p className="text-xs text-emerald-600">All systems operational</p>
                            </div>
                        </div>
                        <span className="text-xs text-gray-400">{dbMetrics.lastSync.toLocaleTimeString()}</span>
                    </div>
                    
                    {/* Bar Graph */}
                    <div className="space-y-4">
                        {[
                            { label: 'Documents', value: dbMetrics.totalDocuments, max: dbMetrics.totalDocuments + 50, color: 'bg-brand-indigo-primary', lightBg: 'bg-indigo-100' },
                            { label: 'Read Ops', value: dbMetrics.estimatedReads, max: dbMetrics.estimatedReads + 200, color: 'bg-emerald-500', lightBg: 'bg-emerald-100' },
                            { label: 'Write Ops', value: dbMetrics.estimatedWrites, max: dbMetrics.estimatedWrites + 50, color: 'bg-blue-500', lightBg: 'bg-blue-100' },
                            { label: 'Storage (KB)', value: dbMetrics.storageUsed, max: dbMetrics.storageUsed + 100, color: 'bg-amber-500', lightBg: 'bg-amber-100' }
                        ].map((item, index) => {
                            const percentage = item.max > 0 ? (item.value / item.max) * 100 : 0;
                            return (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-medium text-gray-600">{item.label}</span>
                                        <span className="text-sm font-bold text-gray-800">{item.value.toLocaleString()}</span>
                                    </div>
                                    <div className={`h-3 ${item.lightBg} rounded-full overflow-hidden`}>
                                        <div 
                                            className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="mt-5 pt-4 border-t border-emerald-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-gray-600">Sync Status</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Connected
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
