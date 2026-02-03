import React, { useEffect, useState } from 'react';
import { Users, Briefcase, UserCheck, AlertCircle, CheckCircle2, TrendingUp, Calendar, Building2, GraduationCap, XCircle, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Modal from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { TrainingService } from '../../services/trainingService';
import { AnnouncementService } from '../../services/announcementService';

const ClassCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);

    // State for all metrics
    const [stats, setStats] = useState({
        totalStudents: 0,
        placedStudents: 0,
        unplacedStudents: 0,
        placementPercentage: 0,
        trainedCount: 0,
        trainingCoverage: 0,
        readiness: {
            ready: 0,
            partial: 0,
            notReady: 0
        },
        atRiskStudents: [] as { name: string, cgpa: number, issue: string }[],
        upcomingDrive: null as { name: string, date: number, eligibleCount: number, notAppliedCount: number, notAppliedStudents: { uid: string, name: string, rollNo: string }[] } | null
    });
    const [isStudentListOpen, setIsStudentListOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!userProfile?.department) return;

            setLoading(true);
            try {
                const [allStudents, allCompanies, allTrainings] = await Promise.all([
                    UserService.getAllStudents(),
                    CompanyService.getAllCompanies(),
                    TrainingService.getAllTrainings()
                ]);

                // A. Base Query: Students under this coordinator
                // Filter by department AND section if available
                const studentsInSection = allStudents.filter(s =>
                    s.department === userProfile.department &&
                    (userProfile.section ? s.section === userProfile.section : true)
                );

                // B. KPI Cards Logic
                const total = studentsInSection.length;
                const placed = studentsInSection.filter(s => s.placementStatus === 'PLACED').length;
                const unplaced = total - placed;
                const placementPercentage = total > 0 ? Math.round((placed / total) * 100) : 0;

                // C. Training Coverage
                const trainingsParticipants = new Set<string>();
                allTrainings.forEach(t => {
                    if (t.participants) {
                        t.participants.forEach(uid => trainingsParticipants.add(uid));
                    }
                });

                const trainedCount = studentsInSection.filter(s => trainingsParticipants.has(s.uid)).length;
                const trainingCoverage = total > 0 ? Math.round((trainedCount / total) * 100) : 0;

                // D. Placement Readiness Donut
                // Companies targeting upcoming batches (e.g., targetYear >= currentYear + 1 or just active future drives)
                // For simplicity and robustness, we use companies with future drives
                const now = Date.now();
                const eligibleCompanies = allCompanies.filter(c => c.driveDate > now || c.targetYear >= 2026);

                let ready = 0;
                let partial = 0;
                let notReady = 0;

                studentsInSection.forEach(student => {
                    // Check eligibility for ANY upcoming company
                    // Note: Handling property spelling mismatch (standingArreas vs standingArrears)
                    const eligibleDrivesCount = eligibleCompanies.filter(c => {
                        const isDeptEligible = c.eligibilityCriteria?.branches?.includes(student.department || '');
                        const isCgpaEligible = (student.cgpa || 0) >= (c.eligibilityCriteria?.minCGPA || 0);

                        // Arrears check
                        const studentHistory = student.historyOfArreas || 0;
                        const studentStanding = student.standingArreas || 0;
                        const allowedHistory = c.eligibilityCriteria?.historyOfArrears ?? 100; // Default to lax if missing
                        const allowedStanding = c.eligibilityCriteria?.standingArrears ?? 100;

                        const isHistoryArrearsEligible = studentHistory <= allowedHistory;
                        const isStandingArrearsEligible = studentStanding <= allowedStanding;

                        return isDeptEligible && isCgpaEligible && isHistoryArrearsEligible && isStandingArrearsEligible;
                    }).length;

                    const isTrained = trainingsParticipants.has(student.uid);

                    if (eligibleDrivesCount > 0 && isTrained) ready++;
                    else if (eligibleDrivesCount > 0) partial++;
                    else notReady++;
                });

                // E. At-Risk Students (Top 5)
                const atRisk = studentsInSection
                    .filter(s => {
                        if (s.placementStatus === 'PLACED') return false;

                        const isTrained = trainingsParticipants.has(s.uid);

                        // Count eligible drives for this specific student from UPCOMING companies
                        const eligibleDrivesCount = eligibleCompanies.filter(c => {
                            const isDeptEligible = c.eligibilityCriteria?.branches?.includes(s.department || '');
                            const isCgpaEligible = (s.cgpa || 0) >= (c.eligibilityCriteria?.minCGPA || 0);

                            const studentHistory = s.historyOfArreas || 0;
                            const studentStanding = s.standingArreas || 0;
                            const allowedHistory = c.eligibilityCriteria?.historyOfArrears ?? 100;
                            const allowedStanding = c.eligibilityCriteria?.standingArrears ?? 100;

                            return isDeptEligible && isCgpaEligible && studentHistory <= allowedHistory && studentStanding <= allowedStanding;
                        }).length;

                        // Risk Condition: Unplaced AND (CGPA < 7 OR No Training OR No Eligible Drives)
                        return (s.cgpa || 0) < 7 || !isTrained || eligibleDrivesCount === 0;
                    })
                    .map(s => {
                        let issue = '';
                        if ((s.cgpa || 0) < 7) issue = 'Low CGPA';
                        else if (!trainingsParticipants.has(s.uid)) issue = 'No Training';
                        else issue = 'Not Eligible';

                        return {
                            name: s.displayName,
                            cgpa: s.cgpa || 0,
                            issue
                        };
                    })
                    .slice(0, 5);

                // F. Upcoming Drive Readiness
                // Find next active drive
                const nextDrive = allCompanies
                    .filter(c => c.driveDate > now)
                    .sort((a, b) => a.driveDate - b.driveDate)[0];

                let upcomingDriveData = null;
                if (nextDrive) {
                    const eligibleStudents = studentsInSection.filter(s => {
                        const isDeptEligible = nextDrive.eligibilityCriteria?.branches?.includes(s.department || '');
                        const isCgpaEligible = (s.cgpa || 0) >= (nextDrive.eligibilityCriteria?.minCGPA || 0);

                        const studentHistory = s.historyOfArreas || 0;
                        const studentStanding = s.standingArreas || 0;
                        const allowedHistory = nextDrive.eligibilityCriteria?.historyOfArrears ?? 100;
                        const allowedStanding = nextDrive.eligibilityCriteria?.standingArrears ?? 100;

                        return isDeptEligible && isCgpaEligible && studentHistory <= allowedHistory && studentStanding <= allowedStanding;
                    });

                    const eligibleCount = eligibleStudents.length;
                    const applicants = nextDrive.applicants || [];

                    const notAppliedStudentsList = eligibleStudents
                        .filter(s => !applicants.includes(s.uid))
                        .map(s => ({ uid: s.uid, name: s.displayName || 'Unknown', rollNo: s.rollNo || 'N/A' }));

                    const notAppliedCount = notAppliedStudentsList.length;

                    upcomingDriveData = {
                        name: nextDrive.name,
                        date: nextDrive.driveDate,
                        eligibleCount,
                        notAppliedCount,
                        notAppliedStudents: notAppliedStudentsList
                    };
                    console.log("Upcoming Drive Data Updated:", upcomingDriveData);
                }

                setStats({
                    totalStudents: total,
                    placedStudents: placed,
                    unplacedStudents: unplaced,
                    placementPercentage,
                    trainedCount,
                    trainingCoverage,
                    readiness: { ready, partial, notReady },
                    atRiskStudents: atRisk,
                    upcomingDrive: upcomingDriveData
                });

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userProfile]);

    const handleRemindStudents = async () => {
        if (!stats.upcomingDrive || !stats.upcomingDrive.notAppliedCount) return;

        // Refetch students to get UIDs of those who haven't applied (since we only stored counts in stats)
        // Optimization: In a real app we might store the IDs in stats or pass them down, 
        // but re-calculating is safer to get the exact list at click time.

        try {
            const [allStudents, allCompanies] = await Promise.all([
                UserService.getAllStudents(),
                CompanyService.getAllCompanies()
            ]);

            // Re-find the drive
            const now = Date.now();
            const nextDrive = allCompanies
                .filter(c => c.driveDate > now)
                .sort((a, b) => a.driveDate - b.driveDate)[0];

            if (!nextDrive) return;

            // Re-filter students
            const studentsInSection = allStudents.filter(s =>
                s.department === userProfile?.department &&
                (userProfile?.section ? s.section === userProfile.section : true)
            );

            const targetStudents = studentsInSection.filter(s => {
                const isDeptEligible = nextDrive.eligibilityCriteria?.branches?.includes(s.department || '');
                const isCgpaEligible = (s.cgpa || 0) >= (nextDrive.eligibilityCriteria?.minCGPA || 0);
                const applicants = nextDrive.applicants || [];
                // Filter: Eligible AND Not Applied
                return isDeptEligible && isCgpaEligible && !applicants.includes(s.uid);
            });

            if (targetStudents.length === 0) {
                alert("No students to remind!");
                return;
            }

            const targetUids = targetStudents.map(s => s.uid);

            await AnnouncementService.createAnnouncement({
                title: `Reminder: Apply for ${nextDrive.name}`,
                content: `You are eligible for the upcoming recruitment drive by ${nextDrive.name} on ${new Date(nextDrive.driveDate).toLocaleDateString()}. Please apply immediately before the deadline!`,
                authorId: userProfile?.uid || '',
                authorRole: userProfile?.role || 'CLASS_COORDINATOR',
                authorName: userProfile?.displayName || 'Coordinator',
                targetDepts: [], // No dept broadcast
                targetUsers: targetUids // Only these specific users
            });

            alert(`Reminder sent to ${targetUids.length} students.`);

        } catch (error) {
            console.error("Failed to send reminder:", error);
            alert("Failed to send reminder.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    // UI RENDER
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-800">Class Overview</h1>
                <p className="text-sm text-gray-500">{userProfile?.department} - Section {userProfile?.section || 'All'}</p>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Total Students</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
                </div>
                {/* Placed */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Placed</p>
                        <p className="text-2xl font-bold text-green-600">{stats.placedStudents}</p>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                </div>
                {/* Unplaced */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Unplaced</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.unplacedStudents}</p>
                    </div>
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><XCircle className="w-5 h-5" /></div>
                </div>
                {/* Percentage */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Success Rate</p>
                        <p className="text-2xl font-bold text-indigo-600">{stats.placementPercentage}%</p>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                </div>
            </div>

            {/* Row 2: Readiness & Training */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[260px]">
                {/* Readiness Donut */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Placement Readiness</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-[180px] h-[180px]" style={{ width: 180, height: 180 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Ready', value: stats.readiness.ready },
                                            { name: 'Partial', value: stats.readiness.partial },
                                            { name: 'Not Ready', value: stats.readiness.notReady },
                                        ]}
                                        dataKey="value"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                    >
                                        <Cell fill="#22c55e" />
                                        <Cell fill="#f59e0b" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="ml-8 space-y-3">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-sm text-gray-600">Ready ({stats.readiness.ready})</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-sm text-gray-600">Partial ({stats.readiness.partial})</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-sm text-gray-600">Not Ready ({stats.readiness.notReady})</span></div>
                        </div>
                    </div>
                </div>

                {/* Training Coverage */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-gray-700 mb-6">Training Participation</h3>
                    <div className="space-y-6 px-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Enrolled Students</span>
                                <span className="font-bold text-gray-800">{stats.trainedCount} / {stats.totalStudents}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-4">
                                <div className="bg-teal-500 h-4 rounded-full transition-all duration-500" style={{ width: `${stats.trainingCoverage}%` }}></div>
                            </div>
                            <p className="text-xs text-teal-600 mt-2 font-medium">{stats.trainingCoverage}% Coverage</p>
                        </div>
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-100 flex gap-3 items-start">
                            <GraduationCap className="w-5 h-5 text-teal-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-teal-800">Training Insight</p>
                                <p className="text-xs text-teal-600 mt-1">
                                    {stats.trainingCoverage < 50 ? 'Enrollment is low. Encourage students to register for upcoming programs.' : 'Good participation! Monitor attendance for better outcomes.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Action Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                {/* At-Risk Students */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            At-Risk Students (Action Needed)
                        </h3>
                        <span className="text-xs text-gray-500">Top 5</span>
                    </div>
                    <div className="overflow-hidden">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CGPA</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Primary Issue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.atRiskStudents.length > 0 ? (
                                    stats.atRiskStudents.map((s, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-3 text-sm text-gray-800 font-medium">{s.name}</td>
                                            <td className="px-3 py-3 text-sm text-gray-600">{s.cgpa}</td>
                                            <td className="px-3 py-3 text-sm text-red-600 font-medium">{s.issue}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-4 text-center text-sm text-green-600 font-medium">
                                            <CheckCircle2 className="w-4 h-4 inline mr-2" />
                                            All active students are on track!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upcoming Drive Readiness */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        Next Drive Readiness {stats.upcomingDrive ? `- ${stats.upcomingDrive.name}` : ''}
                    </h3>

                    {stats.upcomingDrive ? (
                        <div className="flex-1 flex flex-col justify-center space-y-6">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-blue-500 font-semibold uppercase">Drive Date</p>
                                        <p className="text-lg font-bold text-blue-800">{new Date(stats.upcomingDrive.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-blue-700">{stats.upcomingDrive.eligibleCount}</p>
                                    <p className="text-xs text-blue-500 font-medium">Eligible Students</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <div>
                                    <p className="text-lg font-bold text-orange-800">{stats.upcomingDrive.notAppliedCount}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-orange-700 font-medium">Eligible but Not Applied</p>
                                        <button
                                            onClick={() => setIsStudentListOpen(true)}
                                            className="text-orange-600 hover:text-orange-800 transition p-1"
                                            title="View List"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemindStudents}
                                    className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition shadow-sm">
                                    Remind Students
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <Building2 className="w-12 h-12 mb-2 opacity-50" />
                            <p>No upcoming active drives found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Student List */}
            <Modal
                isOpen={isStudentListOpen}
                onClose={() => setIsStudentListOpen(false)}
                title={`Students Not Yet Applied - ${stats.upcomingDrive?.name}`}
            >
                <div className="max-h-[60vh] overflow-y-auto">
                    {stats.upcomingDrive?.notAppliedStudents && stats.upcomingDrive.notAppliedStudents.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stats.upcomingDrive.notAppliedStudents.map((student) => (
                                    <tr key={student.uid}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.rollNo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 py-4">No students found.</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ClassCoordinatorDashboard;
