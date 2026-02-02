import React, { useEffect, useState } from 'react';
import { 
    Users, 
    CheckCircle, 
    Building2, 
    BookOpen,
    TrendingUp,
    Award,
    UserCheck,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    Target,
    BarChart3,
    Calendar,
    Star,
    Activity,
    PieChart,
    FileCheck,
    Clock,
    Percent,
    ArrowUpRight,
    GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';
import { PlacementRecordService } from '../../services/placementRecordService';
import AnimatedCounter from '../../components/AnimatedCounter';
import type { UserProfile, Company, Training } from '../../types';
import { Link } from 'react-router-dom';

interface PlacementStatusData {
    placed: number;
    offered: number;
    unplaced: number;
}

interface CGPADistribution {
    range: string;
    count: number;
    color: string;
    bgColor: string;
}

const ClassCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [, setTrainings] = useState<Training[]>([]);
    const [placementRecords, setPlacementRecords] = useState<{ id: string; rollNo: string }[]>([]);
    
    const [placementStatus, setPlacementStatus] = useState<PlacementStatusData>({ placed: 0, offered: 0, unplaced: 0 });
    const [cgpaDistribution, setCgpaDistribution] = useState<CGPADistribution[]>([]);
    const [profileStats, setProfileStats] = useState({ completed: 0, pending: 0, verified: 0, incomplete: 0 });
    const [upcomingDrives, setUpcomingDrives] = useState<Company[]>([]);
    const [activeTrainings, setActiveTrainings] = useState<Training[]>([]);
    const [topPerformers, setTopPerformers] = useState<UserProfile[]>([]);
    const [arrearsStats, setArrearsStats] = useState({ zero: 0, one: 0, twoPlus: 0 });

    const fetchAllData = async () => {
        if (!userProfile?.department) return;
        
        try {
            const [allStudents, allCompanies, allTrainings, allRecords] = await Promise.all([
                UserService.getUsersByRole('STUDENT'),
                CompanyService.getAllCompanies(),
                TrainingService.getAllTrainings(),
                PlacementRecordService.getAllRecords()
            ]);

            // Filter students by department and section
            const classStudents = allStudents.filter(u =>
                u.department === userProfile.department &&
                (!userProfile.section || u.section === userProfile.section)
            );
            setStudents(classStudents);
            setCompanies(allCompanies);
            setTrainings(allTrainings);

            // Filter placement records for class students
            const studentRollNos = classStudents.map(s => s.rollNo).filter(Boolean);
            const classRecords = allRecords.filter(r => studentRollNos.includes(r.rollNo));
            setPlacementRecords(classRecords);

            // Calculate placement status
            const placed = classStudents.filter(s => s.placementStatus === 'PLACED').length;
            const offered = classStudents.filter(s => s.placementStatus === 'OFFERED').length;
            const unplaced = classStudents.length - placed - offered;
            setPlacementStatus({ placed, offered, unplaced });

            // Profile completion stats
            const completed = classStudents.filter(s => s.profileCompleted).length;
            const verified = classStudents.filter(s => s.profileStatus === 'VERIFIED').length;
            const pending = classStudents.filter(s => s.profileStatus === 'APPROVAL_PENDING').length;
            const incomplete = classStudents.length - completed;
            setProfileStats({ completed, pending, verified, incomplete });

            // Arrears statistics
            const zeroArrears = classStudents.filter(s => !s.standingArreas || s.standingArreas === 0).length;
            const oneArrear = classStudents.filter(s => s.standingArreas === 1).length;
            const twoPlusArrears = classStudents.filter(s => s.standingArreas && s.standingArreas >= 2).length;
            setArrearsStats({ zero: zeroArrears, one: oneArrear, twoPlus: twoPlusArrears });

            // CGPA Distribution
            const cgpaRanges: CGPADistribution[] = [
                { range: '9.0 - 10', count: 0, color: '#10B981', bgColor: 'bg-emerald-500' },
                { range: '8.0 - 8.9', count: 0, color: '#14B8A6', bgColor: 'bg-teal-500' },
                { range: '7.0 - 7.9', count: 0, color: '#F59E0B', bgColor: 'bg-amber-500' },
                { range: '6.0 - 6.9', count: 0, color: '#F97316', bgColor: 'bg-orange-500' },
                { range: 'Below 6', count: 0, color: '#EF4444', bgColor: 'bg-red-500' }
            ];
            classStudents.forEach(s => {
                const cgpa = s.cgpa || 0;
                if (cgpa >= 9) cgpaRanges[0].count++;
                else if (cgpa >= 8) cgpaRanges[1].count++;
                else if (cgpa >= 7) cgpaRanges[2].count++;
                else if (cgpa >= 6) cgpaRanges[3].count++;
                else cgpaRanges[4].count++;
            });
            setCgpaDistribution(cgpaRanges);

            // Upcoming drives (future drive dates)
            const now = Date.now();
            const dept = userProfile.department || '';
            const upcoming = allCompanies
                .filter(c => c.driveDate > now && c.eligibilityCriteria.branches.includes(dept))
                .sort((a, b) => a.driveDate - b.driveDate)
                .slice(0, 6);
            setUpcomingDrives(upcoming);

            // Active trainings
            const active = allTrainings
                .filter(t => t.endDate > now && t.eligibility.branches.includes(dept))
                .slice(0, 4);
            setActiveTrainings(active);

            // Top performers (by CGPA)
            const top = [...classStudents]
                .filter(s => s.cgpa && s.cgpa > 0)
                .sort((a, b) => (b.cgpa || 0) - (a.cgpa || 0))
                .slice(0, 6);
            setTopPerformers(top);

        } catch (error) {
            console.error("Error fetching class stats:", error);
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            if (!userProfile?.department) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            await fetchAllData();
            if (isMounted) {
                setLoading(false);
            }
        };
        
        loadData();
        
        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.uid]);

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

    const getEligibleCount = (company: Company) => {
        return students.filter(s => {
            const cgpa = s.cgpa || 0;
            const arrears = s.standingArreas || 0;
            return cgpa >= company.eligibilityCriteria.minCGPA && arrears <= company.eligibilityCriteria.standingArrears;
        }).length;
    };

    const totalStudents = students.length;
    const avgCGPA = students.length > 0 
        ? (students.reduce((sum, s) => sum + (s.cgpa || 0), 0) / students.filter(s => s.cgpa).length).toFixed(2)
        : '0.00';
    const placementRate = totalStudents > 0 
        ? Math.round((placementStatus.placed / totalStudents) * 100) 
        : 0;
    const profileCompletionRate = totalStudents > 0 
        ? Math.round((profileStats.completed / totalStudents) * 100) 
        : 0;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-orange-light border-t-brand-orange-primary rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-lg text-gray-500 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-[1800px] mx-auto space-y-8 pb-10">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-gray-100">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                            Welcome back, <span className="text-brand-orange-primary">{userProfile?.displayName}</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-gray-500 font-medium">{userProfile?.department}</span>
                            {userProfile?.section && (
                                <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-brand-orange-ice to-orange-100 text-brand-orange-deep text-sm font-semibold rounded-full border border-brand-orange-light/30">
                                    Section {userProfile.section}
                                </span>
                            )}
                            <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center px-6 py-3 text-sm font-semibold bg-gradient-to-r from-brand-orange-primary to-orange-500 text-white rounded-xl hover:from-brand-orange-deep hover:to-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>

                {/* Primary Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Students */}
                    <div className="bg-gradient-to-br from-brand-orange-ice via-orange-50 to-white p-6 rounded-2xl border border-brand-orange-light/30 hover:shadow-lg hover:shadow-orange-100 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-brand-orange-light/20">
                                <Users className="w-6 h-6 text-brand-orange-primary" />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-medium">
                                <ArrowUpRight className="w-3 h-3" />
                                Active
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-gray-800 mb-1">
                            <AnimatedCounter value={totalStudents} />
                        </p>
                        <p className="text-sm text-gray-500 font-medium">Total Students</p>
                    </div>

                    {/* Placed Students */}
                    <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-white p-6 rounded-2xl border border-emerald-100 hover:shadow-lg hover:shadow-emerald-100 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-100">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg text-xs font-bold">
                                {placementRate}%
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-emerald-700 mb-1">
                            <AnimatedCounter value={placementStatus.placed} />
                        </p>
                        <p className="text-sm text-gray-500 font-medium">Students Placed</p>
                    </div>

                    {/* Avg CGPA */}
                    <div className="bg-gradient-to-br from-violet-50 via-purple-50/50 to-white p-6 rounded-2xl border border-violet-100 hover:shadow-lg hover:shadow-violet-100 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-violet-100">
                                <TrendingUp className="w-6 h-6 text-violet-600" />
                            </div>
                            <div className="flex items-center gap-1 text-violet-700 bg-violet-100 px-2 py-1 rounded-lg text-xs font-bold">
                                Class Avg
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-violet-700 mb-1">{avgCGPA}</p>
                        <p className="text-sm text-gray-500 font-medium">Average CGPA</p>
                    </div>

                    {/* Upcoming Drives */}
                    <div className="bg-gradient-to-br from-blue-50 via-cyan-50/50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg hover:shadow-blue-100 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-1 rounded-lg text-xs font-bold">
                                Upcoming
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-blue-700 mb-1">
                            <AnimatedCounter value={upcomingDrives.length} />
                        </p>
                        <p className="text-sm text-gray-500 font-medium">Active Drives</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Placement Status Chart */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-orange-ice rounded-xl">
                                    <PieChart className="w-5 h-5 text-brand-orange-primary" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Placement Status</h2>
                            </div>
                            <span className="text-sm text-gray-400 font-medium">{totalStudents} Students</span>
                        </div>
                        
                        <div className="flex items-center gap-10">
                            {/* Donut Chart */}
                            <div className="relative w-48 h-48 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="16" />
                                    {(() => {
                                        const data = [
                                            { value: placementStatus.placed, color: '#10B981' },
                                            { value: placementStatus.offered, color: '#F59E0B' },
                                            { value: placementStatus.unplaced, color: '#CBD5E1' }
                                        ];
                                        let offset = 0;
                                        const circumference = 2 * Math.PI * 38;
                                        
                                        return data.map((item, index) => {
                                            const percentage = totalStudents > 0 ? (item.value / totalStudents) * 100 : 0;
                                            const strokeDasharray = (percentage / 100) * circumference;
                                            const prevOffset = offset;
                                            offset += strokeDasharray;
                                            
                                            return (
                                                <circle
                                                    key={index}
                                                    cx="50"
                                                    cy="50"
                                                    r="38"
                                                    fill="none"
                                                    stroke={item.color}
                                                    strokeWidth="16"
                                                    strokeDasharray={`${strokeDasharray} ${circumference}`}
                                                    strokeDashoffset={-prevOffset}
                                                    className="transition-all duration-700"
                                                />
                                            );
                                        });
                                    })()}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-gray-800">{placementRate}%</span>
                                    <span className="text-xs text-gray-400 font-medium">Placed</span>
                                </div>
                            </div>
                            
                            {/* Legend */}
                            <div className="flex-1 space-y-5">
                                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                                        <span className="text-gray-700 font-medium">Placed</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-emerald-600">{placementStatus.placed}</span>
                                        <span className="text-xs text-gray-400 ml-2">
                                            ({totalStudents > 0 ? Math.round((placementStatus.placed / totalStudents) * 100) : 0}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                                        <span className="text-gray-700 font-medium">Offered</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-amber-600">{placementStatus.offered}</span>
                                        <span className="text-xs text-gray-400 ml-2">
                                            ({totalStudents > 0 ? Math.round((placementStatus.offered / totalStudents) * 100) : 0}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                                        <span className="text-gray-700 font-medium">Unplaced</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-gray-600">{placementStatus.unplaced}</span>
                                        <span className="text-xs text-gray-400 ml-2">
                                            ({totalStudents > 0 ? Math.round((placementStatus.unplaced / totalStudents) * 100) : 0}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CGPA Distribution Chart */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-100 rounded-xl">
                                    <BarChart3 className="w-5 h-5 text-violet-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">CGPA Distribution</h2>
                            </div>
                            <span className="text-sm bg-violet-100 text-violet-700 px-3 py-1 rounded-lg font-semibold">
                                Avg: {avgCGPA}
                            </span>
                        </div>
                        
                        <div className="space-y-5">
                            {cgpaDistribution.map((range, index) => {
                                const maxCount = Math.max(...cgpaDistribution.map(d => d.count), 1);
                                const widthPercent = (range.count / maxCount) * 100;
                                const percentage = totalStudents > 0 ? Math.round((range.count / totalStudents) * 100) : 0;
                                return (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${range.bgColor}`}></div>
                                                <span className="text-sm font-semibold text-gray-700">{range.range}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold text-gray-800">{range.count}</span>
                                                <span className="text-xs text-gray-400 w-10 text-right">({percentage}%)</span>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${range.bgColor} rounded-full transition-all duration-700`}
                                                style={{ width: `${Math.max(widthPercent, 4)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Secondary Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100 text-center hover:shadow-md transition-all">
                        <UserCheck className="w-6 h-6 text-emerald-600 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-gray-800">{profileStats.verified}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Verified</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-100 text-center hover:shadow-md transition-all">
                        <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-gray-800">{profileStats.pending}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Pending</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-2xl border border-blue-100 text-center hover:shadow-md transition-all">
                        <FileCheck className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-gray-800">{profileStats.completed}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Completed</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100 text-center hover:shadow-md transition-all">
                        <Target className="w-6 h-6 text-rose-500 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-gray-800">{profileStats.incomplete}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Incomplete</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50 to-white p-5 rounded-2xl border border-teal-100 text-center hover:shadow-md transition-all">
                        <CheckCircle className="w-6 h-6 text-teal-600 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-gray-800">{arrearsStats.zero}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">0 Arrears</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-2xl border border-orange-100 text-center hover:shadow-md transition-all">
                        <AlertCircle className="w-6 h-6 text-orange-500 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-gray-800">{arrearsStats.one}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">1 Arrear</p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-50 to-white p-5 rounded-2xl border border-violet-100 text-center hover:shadow-md transition-all">
                        <Award className="w-6 h-6 text-violet-600 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-gray-800">{placementRecords.length}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Total Offers</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-white p-5 rounded-2xl border border-cyan-100 text-center hover:shadow-md transition-all">
                        <BookOpen className="w-6 h-6 text-cyan-600 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-gray-800">{activeTrainings.length}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Trainings</p>
                    </div>
                </div>

                {/* Profile Completion Progress */}
                <div className="bg-gradient-to-r from-brand-orange-ice via-orange-50 to-amber-50 rounded-3xl border border-brand-orange-light/30 p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white rounded-2xl shadow-sm">
                                <Percent className="w-8 h-8 text-brand-orange-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Profile Completion Rate</h2>
                                <p className="text-gray-500">{profileStats.completed} of {totalStudents} students have completed their profiles</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-4xl font-bold text-brand-orange-primary">{profileCompletionRate}%</p>
                                <p className="text-sm text-gray-500">Completion Rate</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="h-4 bg-white rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-brand-orange-primary to-orange-400 rounded-full transition-all duration-1000"
                                style={{ width: `${profileCompletionRate}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - 3 Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Upcoming Drives */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Upcoming Drives</h2>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold">
                                {upcomingDrives.length} Active
                            </span>
                        </div>
                        
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {upcomingDrives.length === 0 ? (
                                <div className="text-center py-10">
                                    <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400">No upcoming drives</p>
                                </div>
                            ) : (
                                upcomingDrives.map((company, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-white rounded-xl hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                                                {company.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{company.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs text-gray-500">{formatDate(company.driveDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold">
                                                {getEligibleCount(company)} eligible
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-xl">
                                    <Star className="w-5 h-5 text-amber-500" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Top Performers</h2>
                            </div>
                            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-semibold">
                                By CGPA
                            </span>
                        </div>
                        
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {topPerformers.length === 0 ? (
                                <div className="text-center py-10">
                                    <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400">No data available</p>
                                </div>
                            ) : (
                                topPerformers.map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50/50 to-white rounded-xl hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                                                index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-amber-200' :
                                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-gray-200' :
                                                index === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-orange-200' :
                                                'bg-gray-100 text-gray-600 shadow-none'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{student.displayName}</p>
                                                <p className="text-xs text-gray-400">{student.rollNo || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-bold text-amber-600">{student.cgpa?.toFixed(2)}</span>
                                            <p className="text-xs text-gray-400">CGPA</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Actions & Summary */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-gradient-to-br from-brand-orange-ice via-orange-50 to-white rounded-3xl border border-brand-orange-light/30 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Activity className="w-5 h-5 text-brand-orange-primary" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Quick Actions</h2>
                            </div>
                            
                            <div className="space-y-3">
                                <Link to="/class-coordinator/students" className="flex items-center justify-between p-4 bg-white/80 hover:bg-white rounded-xl transition-all group shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-brand-orange-ice rounded-xl flex items-center justify-center border border-brand-orange-light/30">
                                            <Users className="w-5 h-5 text-brand-orange-primary" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-800 block">View All Students</span>
                                            <p className="text-xs text-gray-500">{totalStudents} students in your class</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-orange-primary group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>
                        </div>

                        {/* Class Summary Card */}
                        <div className="bg-gradient-to-br from-violet-100 via-purple-50 to-white rounded-3xl border border-violet-200/50 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <BarChart3 className="w-5 h-5 text-violet-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Class Summary</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                                    <p className="text-3xl font-bold text-brand-orange-primary">{placementRate}%</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Placement Rate</p>
                                </div>
                                <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                                    <p className="text-3xl font-bold text-emerald-600">{avgCGPA}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Avg CGPA</p>
                                </div>
                                <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                                    <p className="text-3xl font-bold text-blue-600">{profileCompletionRate}%</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Profile Done</p>
                                </div>
                                <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                                    <p className="text-3xl font-bold text-violet-600">{companies.length}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Total Drives</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassCoordinatorDashboard;
