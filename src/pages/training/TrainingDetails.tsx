import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrainingService } from '../../services/trainingService';
import { UserService } from '../../services/userService';
import type { Training, UserProfile } from '../../types';
import { DEPARTMENTS } from '../../utils/constants';
import { ArrowLeft, GraduationCap, Calendar, User } from 'lucide-react';

const TrainingDetails: React.FC = () => {
    const { trainingId } = useParams();
    const navigate = useNavigate();
    const [training, setTraining] = useState<Training | null>(null);
    const [loading, setLoading] = useState(true);
    const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<UserProfile[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Filters (No Eligibility Filter as requested)
    const [filterApplied, setFilterApplied] = useState<'applied' | 'not_applied'>('applied');
    const [filterDept, setFilterDept] = useState<string>('');

    useEffect(() => {
        const fetchDetails = async () => {
            if (!trainingId) return;
            try {
                const trainings = await TrainingService.getAllTrainings();
                const found = trainings.find(t => t.id === trainingId);

                if (found) {
                    setTraining(found);
                    fetchTrainingStudents(found);
                } else {
                    console.error("Training not found");
                }
            } catch (error) {
                console.error("Error fetching training:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [trainingId]);

    const fetchTrainingStudents = async (targetTraining: Training) => {
        setLoadingStudents(true);
        try {
            const students = await UserService.getUsersByRole('STUDENT');
            setAllStudents(students);
            applyFilters(students, targetTraining, 'applied', '');
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const applyFilters = (
        students: UserProfile[],
        trg: Training | null,
        applied: 'applied' | 'not_applied',
        dept: string
    ) => {
        if (!trg) return;

        let result = students;

        // Applied Filter
        result = result.filter(s => {
            const isApplied = trg.participants?.includes(s.uid);
            return applied === 'applied' ? isApplied : !isApplied;
        });

        // Dept Filter
        if (dept) {
            result = result.filter(s => s.department === dept);
        }

        setFilteredStudents(result);
    };

    useEffect(() => {
        if (training) {
            applyFilters(allStudents, training, filterApplied, filterDept);
        }
    }, [filterApplied, filterDept, allStudents, training]);


    if (loading) {
        return <div className="p-6 text-center">Loading details...</div>;
    }

    if (!training) {
        return (
            <div className="p-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </button>
                <div className="text-center text-red-500">Training not found.</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition">
                <ArrowLeft className="w-5 h-5 mr-1" /> Back to Trainings
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{training.title}</h1>
                            <p className="text-gray-500 mt-1">Trainer: {training.trainer}</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 text-sm rounded-full font-medium bg-blue-100 text-blue-700">
                        {training.eligibility.year} Year Students
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200 mt-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Start Date</p>
                            <p className="font-medium">{new Date(training.startDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">End Date</p>
                            <p className="font-medium">{new Date(training.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Participants</p>
                            <p className="font-medium">{training.participants?.length || 0} Registered</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{training.description}</p>
                </div>

                <div className="mt-4">
                    <h3 className="font-bold text-gray-800 mb-2">Eligible Branches</h3>
                    <div className="flex flex-wrap gap-2">
                        {training.eligibility.branches.map((b, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">{b}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Participation Status</label>
                        <select
                            className="input-field w-full mt-1"
                            value={filterApplied}
                            onChange={(e) => setFilterApplied(e.target.value as any)}
                        >
                            <option value="applied">Registered / Applied</option>
                            <option value="not_applied">Not Registered</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                        <select
                            className="input-field w-full mt-1"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800">Student List ({filteredStudents.length})</h2>
                    {loadingStudents && <span className="text-sm text-gray-500">Updating...</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No students match the current filters.</td></tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.uid} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{student.displayName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.cgpa || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {training.participants?.includes(student.uid) ? (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Registered
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Not Registered
                                                </span>
                                            )}
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

export default TrainingDetails;
