import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';

import { checkEligibility } from '../../utils/eligibility';
import DashboardCalendar, { type CalendarEvent } from '../../components/DashboardCalendar';
import { Trophy } from 'lucide-react';

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
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Welcome Back, {userProfile?.displayName?.split(' ')[0]}!</h1>
                <p className="text-gray-600 mt-2">Here's an overview of your placement journey.</p>
            </div>

            {userProfile?.placementStatus === 'PLACED' && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 rounded-r shadow-sm flex items-center">
                    <div className="bg-green-200 rounded-full p-2 mr-4">
                        <Trophy className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Congratulations! You are Placed!</h3>
                        <p className="text-sm">Great job on securing a placement. We are proud of your achievement!</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Active Drives</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.activeDrives}</p>
                    <p className="text-xs text-gray-400 mt-1">Companies hiring now</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">My Applications</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.myApplications}</p>
                    <p className="text-xs text-gray-400 mt-1">Applied so far</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Upcoming Trainings</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{stats.upcomingTrainings}</p>
                    <p className="text-xs text-gray-400 mt-1">Scheduled sessions</p>
                </div>
            </div>

            {/* Calendars Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                <div className="h-[540px] flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-600">Filter Drives:</label>
                        <select
                            value={placementFilter}
                            onChange={(e) => setPlacementFilter(e.target.value as any)}
                            className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Drives</option>
                            <option value="eligible">Eligible</option>
                            <option value="not_eligible">Not Eligible</option>
                            <option value="opted_in">Opted In</option>
                            <option value="opted_out">Opted Out</option>
                        </select>
                    </div>
                    <DashboardCalendar
                        title="Company Drives"
                        events={companyEvents}
                        type="point"
                        onEventClick={() => navigate('/student/drives')}
                    />
                </div>

                <div className="h-[540px] flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-600">Filter Trainings:</label>
                        <select
                            value={trainingFilter}
                            onChange={(e) => setTrainingFilter(e.target.value as any)}
                            className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="all">All Trainings</option>
                            <option value="registered">Registered</option>
                            <option value="not_registered">Not Registered</option>
                        </select>
                    </div>
                    <DashboardCalendar
                        title="Training Schedule"
                        events={trainingEvents}
                        type="range"
                        onEventClick={() => navigate('/student/trainings')}
                    />
                </div>
            </div>


        </div>
    );
};

export default StudentDashboard;
