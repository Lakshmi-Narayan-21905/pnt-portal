import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';
import { Briefcase, Building2, GraduationCap, Filter } from 'lucide-react';

import { checkEligibility } from '../../utils/eligibility';
import DashboardCalendar, { type CalendarEvent } from '../../components/DashboardCalendar';

import AnimatedCounter from '../../components/AnimatedCounter';
import StudentPageContainer from '../../components/student/StudentPageContainer';


// StatCard Component
interface StatCardProps {
    title: string;
    count: number;
    subtitle: string;
    icon: React.ElementType;
    delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, subtitle, icon: Icon, delay }) => (
    <div
        className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)] hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group min-w-[280px]"
        style={{ animation: `fadeInUp 0.5s ease-out ${delay}s backwards` }}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm group-hover:bg-indigo-100 transition-colors">
                <Icon className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                +12% <span className="ml-1 text-emerald-600/70 font-normal">vs last month</span>
            </span>
        </div>
        <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">{title}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">
                    <AnimatedCounter value={count} />
                </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium bg-gray-50 inline-block px-2 py-0.5 rounded-lg border border-gray-100">{subtitle}</p>
        </div>
    </div>
);

const StudentDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();

    // Stats State
    const [stats, setStats] = useState({
        activeDrives: 0,
        myApplications: 0,
        upcomingTrainings: 0
    });

    // Calendar Events State
    const [companyEvents, setCompanyEvents] = useState<CalendarEvent[]>([]);
    const [trainingEvents, setTrainingEvents] = useState<CalendarEvent[]>([]);

    // Filter State
    const [placementFilter, setPlacementFilter] = useState<'all' | 'eligible' | 'not_eligible' | 'opted_in' | 'opted_out'>('all');
    const [trainingFilter, setTrainingFilter] = useState<'all' | 'registered' | 'not_registered'>('all');

    useEffect(() => {
        const fetchStats = async () => {
            if (!userProfile?.uid) return;
            try {
                const [companies, trainings] = await Promise.all([
                    CompanyService.getAllCompanies(),
                    TrainingService.getAllTrainings()
                ]);

                // Filter by Department
                const dept = userProfile.department;
                const relevantCompanies = companies.filter(c =>
                    !dept || (c.eligibilityCriteria?.branches?.length === 0) || c.eligibilityCriteria?.branches?.includes(dept)
                );
                const relevantTrainings = trainings.filter(t =>
                    !dept || (t.eligibility?.branches?.length === 0) || t.eligibility?.branches?.includes(dept)
                );

                const now = Date.now();
                const activeDrives = relevantCompanies.filter(c => c.deadline && c.deadline > now).length;
                const myApplications = relevantCompanies.filter(c => c.applicants && c.applicants.includes(userProfile.uid)).length;
                const myTrainings = relevantTrainings.filter(t => t.participants && t.participants.includes(userProfile.uid) && t.startDate > now).length;

                setStats({
                    activeDrives,
                    myApplications,
                    upcomingTrainings: myTrainings
                });

                // Transform for Calendar with Filters
                let filteredCompanies = relevantCompanies;

                if (placementFilter !== 'all') {
                    filteredCompanies = companies.filter(c => {
                        const hasApplied = c.applicants?.includes(userProfile.uid);
                        const hasOptedOut = c.optedOut?.includes(userProfile.uid);
                        const { eligible } = checkEligibility(userProfile, c);

                        if (placementFilter === 'opted_in') return hasApplied;
                        if (placementFilter === 'opted_out') return hasOptedOut;
                        if (placementFilter === 'eligible') return eligible;
                        if (placementFilter === 'not_eligible') return !eligible;
                        return true;
                    });
                }

                const cEvents: CalendarEvent[] = filteredCompanies
                    .filter(c => c.driveDate)
                    .map(c => ({
                        id: c.id,
                        title: c.name,
                        date: new Date(c.driveDate),
                        type: 'point'
                    }));
                setCompanyEvents(cEvents);

                let filteredTrainings = relevantTrainings;
                if (trainingFilter !== 'all') {
                    filteredTrainings = relevantTrainings.filter(t => {
                        const isRegistered = t.participants?.includes(userProfile.uid);
                        return trainingFilter === 'registered' ? isRegistered : !isRegistered;
                    });
                }

                const tEvents: CalendarEvent[] = filteredTrainings
                    .filter(t => t.startDate && t.endDate)
                    .map(t => ({
                        id: t.id,
                        title: t.title,
                        startDate: new Date(t.startDate),
                        endDate: new Date(t.endDate),
                        type: 'range'
                    }));
                setTrainingEvents(tEvents);

            } catch (error) {
                console.error("Error fetching student stats:", error);
            }
        };

        fetchStats();
    }, [userProfile, placementFilter, trainingFilter]);

    return (
        <StudentPageContainer
            title={`Hello, ${userProfile?.displayName?.split(' ')[0]} 👋`}
            subtitle="Here's what's happening in your placement journey today."
        >
            {/* Stats Grid - Responsive Correction */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <StatCard
                    title="Active Drives"
                    count={stats.activeDrives}
                    subtitle="Companies hiring now"
                    icon={Building2}
                    delay={0.1}
                />
                <StatCard
                    title="My Applications"
                    count={stats.myApplications}
                    subtitle="Applications submitted"
                    icon={Briefcase}
                    delay={0.2}
                />
                <StatCard
                    title="Upcoming Trainings"
                    count={stats.upcomingTrainings}
                    subtitle="Scheduled sessions"
                    icon={GraduationCap}
                    delay={0.3}
                />
            </div>

            {/* Calendars Section with Soft Light Theme */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Drives Calendar */}
                <div
                    className="h-[600px] flex flex-col bg-white rounded-3xl p-4 md:p-6 shadow-md shadow-gray-200 border border-gray-100 transition-all hover:shadow-xl hover:shadow-gray-200/50 overflow-hidden"
                    style={{ animation: 'fadeInUp 0.6s ease-out 0.4s backwards' }}
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-sm shadow-blue-200"></div>
                            <h3 className="font-bold text-gray-800 tracking-tight text-lg">Placement Schedule</h3>
                        </div>

                        <div className="relative group w-full sm:w-auto">
                            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            <select
                                value={placementFilter}
                                onChange={(e) => setPlacementFilter(e.target.value as any)}
                                className="w-full sm:w-auto pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-full shadow-inner focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none appearance-none cursor-pointer hover:bg-white transition-all text-gray-700"
                            >
                                <option value="all">All Drives</option>
                                <option value="eligible">Eligible</option>
                                <option value="not_eligible">Ineligible</option>
                                <option value="opted_in">Opted In</option>
                                <option value="opted_out">Opted Out</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50">
                        <DashboardCalendar
                            title=""
                            events={companyEvents}
                            type="point"
                            onEventClick={() => navigate('/student/drives')}
                        />
                    </div>
                </div>

                {/* Trainings Calendar */}
                <div
                    className="h-[600px] flex flex-col bg-white rounded-3xl p-4 md:p-6 shadow-md shadow-gray-200 border border-gray-100 transition-all hover:shadow-xl hover:shadow-gray-200/50 overflow-hidden"
                    style={{ animation: 'fadeInUp 0.6s ease-out 0.5s backwards' }}
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-sm shadow-indigo-200"></div>
                            <h3 className="font-bold text-gray-800 tracking-tight text-lg">Training Schedule</h3>
                        </div>

                        <div className="relative group w-full sm:w-auto">
                            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                            <select
                                value={trainingFilter}
                                onChange={(e) => setTrainingFilter(e.target.value as any)}
                                className="w-full sm:w-auto pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-full shadow-inner focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none appearance-none cursor-pointer hover:bg-white transition-all text-gray-700"
                            >
                                <option value="all">All Trainings</option>
                                <option value="registered">Registered</option>
                                <option value="not_registered">Not Registered</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50">
                        <DashboardCalendar
                            title=""
                            events={trainingEvents}
                            type="range"
                            onEventClick={() => navigate('/student/trainings')}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </StudentPageContainer>
    );
};

export default StudentDashboard;
