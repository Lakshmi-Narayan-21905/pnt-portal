import React, { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { UserService } from '../../services/userService';
import type { UserProfile } from '../../types';
import { DEPARTMENTS } from '../../utils/constants';

import { PlacementRecordService } from '../../services/placementRecordService';
import type { PlacementRecord } from '../../types';
import Modal from '../../components/ui/Modal';
import { Briefcase } from 'lucide-react';

const PlacementDetailsSection: React.FC<{ rollNo?: string }> = ({ rollNo }) => {
    const [records, setRecords] = useState<PlacementRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            if (rollNo) {
                setLoading(true);
                // Try fetching with normalized roll number (lowercase) as that's how we store user status updates
                // But typically records are stored as entered. We should probably try both or rely on consistent entry.
                // Best bet: Try exact match first.
                let data = await PlacementRecordService.getRecordsByRollNo(rollNo);

                // If no data found, try lowercase roll number (common mismatch source)
                if (data.length === 0) {
                    data = await PlacementRecordService.getRecordsByRollNo(rollNo.toLowerCase());
                }

                // If still no data, try uppercase
                if (data.length === 0) {
                    data = await PlacementRecordService.getRecordsByRollNo(rollNo.toUpperCase());
                }

                setRecords(data);
                setLoading(false);
            }
        };
        fetch();
    }, [rollNo]);

    if (loading) return <div className="text-sm text-gray-500">Loading placement details...</div>;
    if (records.length === 0) return null;

    return (
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h4 className="flex items-center text-indigo-800 font-bold mb-3">
                <Briefcase className="w-4 h-4 mr-2" />
                Placement Offers
            </h4>
            <div className="space-y-3">
                {records.map(rec => (
                    <div key={rec.id} className="bg-white p-3 rounded border border-indigo-100 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-800">{rec.companyName}</p>
                            <p className="text-xs text-gray-500">{rec.role || 'Role not specified'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-indigo-600">{rec.package} LPA</p>
                            <p className="text-xs text-gray-400">Package</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PlacementStudents: React.FC = () => {
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [verificationFilter, setVerificationFilter] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
    const [placementStatusFilter, setPlacementStatusFilter] = useState('');

    useEffect(() => {
        const load = async () => {
            const data = await UserService.getUsersByRole('STUDENT');
            setStudents(data);
            setLoading(false);
        };
        load();
    }, []);

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = departmentFilter ? student.department === departmentFilter : true;

        // Fix: logic for 'All Status' (Verification)
        const matchesVerification = verificationFilter ? student.profileStatus === verificationFilter : true;

        // New: Placement Status Filter
        let matchesPlacement = true;
        if (placementStatusFilter === 'PLACED') {
            matchesPlacement = student.placementStatus === 'PLACED';
        } else if (placementStatusFilter === 'UNPLACED') {
            matchesPlacement = student.placementStatus !== 'PLACED';
        }

        return matchesSearch && matchesDept && matchesVerification && matchesPlacement;
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Student Database</h1>
                <div className="flex space-x-2">
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Departments</option>
                        {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>

                    <select
                        value={placementStatusFilter}
                        onChange={(e) => setPlacementStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Placement Status</option>
                        <option value="PLACED">Placed</option>
                        <option value="UNPLACED">Unplaced</option>
                    </select>

                    <select
                        value={verificationFilter}
                        onChange={(e) => setVerificationFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Profile Status</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="APPROVAL_PENDING">Approval Pending</option>
                        <option value="PENDING">Pending</option>
                    </select>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <button
                        onClick={() => {
                            const exportData = filteredStudents.map(s => ({
                                Name: s.displayName,
                                Email: s.email,
                                Department: s.department,
                                RollNo: s.rollNo,
                                PlacementStatus: s.placementStatus || 'UNPLACED',
                                CGPA: s.cgpa || 0
                            }));
                            import('../../utils/excelParser').then(mod => {
                                mod.ExcelParser.exportToExcel(exportData, 'Student_List');
                            });
                        }}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        title="Export Filtered Data"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center">No students found matching your filters.</td></tr>
                        ) : (
                            filteredStudents.map((student) => (
                                <tr key={student.uid} className="hover:bg-gray-50 transition-colors">
                                    <td
                                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                        onClick={() => setSelectedStudent(student)}
                                    >
                                        {student.displayName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Student Details Modal */}
            <Modal
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                title="Student Profile"
                size="2xl"
            >
                {selectedStudent && (
                    <div className="space-y-6">
                        {/* Status Badge */}
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="text-sm font-medium text-gray-500">Current Status</div>
                            <div>
                                {selectedStudent.placementStatus === 'PLACED' ? (
                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold border border-green-200">
                                        PLACED
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium border border-gray-200">
                                        {selectedStudent.placementStatus || 'UNPLACED'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Placement Details (Async Loaded) */}
                        <PlacementDetailsSection rollNo={selectedStudent.rollNo} />

                        {/* Personal Details */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-100 pb-1">Personal Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Roll No</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.rollNo}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Full Name</span>
                                    <span className="font-medium text-gray-900 break-words">{selectedStudent.displayName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Email</span>
                                    <span className="font-medium text-gray-900 break-all">{selectedStudent.email}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Phone</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.phone || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Address</span>
                                    <span className="font-medium text-gray-900 break-words">{selectedStudent.address || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Academic Details */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-100 pb-1">Academic Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">Department</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.department}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">Section</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.section || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">CGPA</span>
                                    <span className="font-bold text-indigo-700">{selectedStudent.cgpa || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">Standing Arrears</span>
                                    <span className="font-bold text-red-600">{selectedStudent.standingArreas || 0}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">History of Arrears</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.historyOfArreas || 0}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">10th Mark</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.tenthMark}%</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="block text-gray-500 text-xs uppercase">12th Mark</span>
                                    <span className="font-medium text-gray-900">{selectedStudent.twelfthMark}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default PlacementStudents;
