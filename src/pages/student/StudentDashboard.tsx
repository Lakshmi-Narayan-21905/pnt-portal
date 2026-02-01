import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';
import { Briefcase, Building2, GraduationCap, ChevronRight, Filter } from 'lucide-react';

import { checkEligibility } from '../../utils/eligibility';
import DashboardCalendar, { type CalendarEvent } from '../../components/DashboardCalendar';
import AnimatedCounter from '../../components/AnimatedCounter';
import StudentPageContainer from '../../components/student/StudentPageContainer';

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

                const now = Date.now();
                const activeDrives = companies.filter(c => c.deadline && c.deadline > now).length;
                const myApplications = companies.filter(c => c.applicants && c.applicants.includes(userProfile.uid)).length;
                const myTrainings = trainings.filter(t => t.participants && t.participants.includes(userProfile.uid) && t.startDate > now).length;

                setStats({
                    activeDrives,
                    myApplications,
                    upcomingTrainings: myTrainings
                });

                // Transform for Calendar with Filters
                let filteredCompanies = companies;

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

                let filteredTrainings = trainings;
                if (trainingFilter !== 'all') {
                    filteredTrainings = trainings.filter(t => {
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

    // Card Component
    const StatCard = ({ title, count, subtitle, icon: Icon, delay = 0 }: any) => (
        <div
            className="relative overflow-hidden rounded-2xl p-6 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                animation: `fadeInUp 0.6s ease-out forwards ${delay}s`,
                opacity: 0
            }}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-blue-500/10"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">{title}</h3>
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Icon className="w-5 h-5" />
                    </div>
                </div>

                <div className="flex items-center gap-3 my-4">
                    <span className="text-4xl font-extrabold text-gray-800 tracking-tight">
                        <AnimatedCounter value={count} />
                    </span>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2"></div>

                <p className="text-xs text-gray-500 font-medium flex items-center justify-between group-hover:text-blue-700 transition-colors">
                    {subtitle}
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-500" />
                </p>
            </div>
        </div>
    );

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

            {/* Calendars Section with Blue Glassmorphism */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Drives Calendar */}
                <div className="h-[600px] flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-xl shadow-gray-200/50 border border-white/80 transition-all hover:shadow-2xl hover:shadow-blue-900/5 overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-sm shadow-blue-200"></div>
                            <h3 className="font-bold text-gray-800 tracking-tight text-lg">Placement Schedule</h3>
                        </div>

                        <div className="relative group w-full sm:w-auto">
                            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            <select
                                value={placementFilter}
                                onChange={(e) => setPlacementFilter(e.target.value as any)}
                                className="w-full sm:w-auto pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none appearance-none cursor-pointer hover:border-gray-300 transition-all text-gray-600"
                            >
                                <option value="all">All Drives</option>
                                <option value="eligible">Eligible</option>
                                <option value="not_eligible">Ineligible</option>
                                <option value="opted_in">Opted In</option>
                                <option value="opted_out">Opted Out</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white/40">
                        <DashboardCalendar
                            title=""
                            events={companyEvents}
                            type="point"
                            onEventClick={() => navigate('/student/drives')}
                        />
                    </div>
                </div>

                {/* Trainings Calendar */}
                <div className="h-[600px] flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-xl shadow-gray-200/50 border border-white/80 transition-all hover:shadow-2xl hover:shadow-indigo-900/5 overflow-hidden">
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
                                className="w-full sm:w-auto pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none cursor-pointer hover:border-gray-300 transition-all text-gray-600"
                            >
                                <option value="all">All Trainings</option>
                                <option value="registered">Registered</option>
                                <option value="not_registered">Not Registered</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white/40">
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
