import React, { useState, useEffect } from 'react';
import { useAlert } from '../../contexts/AlertContext';
import { Plus, Upload } from 'lucide-react';
import { UserService } from '../../services/userService';
import { AdminAuthService } from '../../services/adminAuthService';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';
import Modal from '../../components/ui/Modal';
import * as XLSX from 'xlsx';

const ClassStudents: React.FC = () => {
    const { showAlert, showConfirm } = useAlert();
    const { userProfile } = useAuth();
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
    });

    const fetchStudents = async () => {
        if (!userProfile?.department) return;
        setLoading(true);
        try {
            // Fetch all students and filter by department (and classId if available)
            const allStudents = await UserService.getUsersByRole('STUDENT');
            let filtered = allStudents.filter(u => u.department === userProfile.department);

            // If class coordinator has a specific classId, filter by it (Deprecated logic?)
            if (userProfile.classId) {
                filtered = filtered.filter(u => u.classId === userProfile.classId);
            }

            // FILTER BY SECTION
            if (userProfile.section) {
                filtered = filtered.filter(u => u.section === userProfile.section);
            }

            // Include the coordinator's own profile in the list
            const coordinatorAsStudent: UserProfile = {
                ...userProfile,
                // Mark as coordinator for display purposes
            };

            // Combine students with coordinator (coordinator at the top)
            setStudents([coordinatorAsStudent, ...filtered]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [userProfile]);

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.department) return;

        setCreating(true);
        try {
            const newUser = await AdminAuthService.createUser(
                formData.email,
                formData.password
            );

            await UserService.createUserProfile({
                uid: newUser.uid,
                email: formData.email,
                displayName: formData.displayName,
                role: 'STUDENT',
                department: userProfile.department,
                classId: userProfile.classId, // Assign classId if coordinator has one
                profileCompleted: false,
                createdAt: Date.now()
            });

            setIsAddModalOpen(false);
            setFormData({ email: '', password: '', displayName: '' });
            fetchStudents();
            await showAlert('Student created successfully', 'success', 'Success');
        } catch (error: any) {
            console.error(error);
            await showAlert('Failed to create student: ' + error.message, 'error', 'Error');
        } finally {
            setCreating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userProfile?.department) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data: any[] = XLSX.utils.sheet_to_json(ws);

            if (await showConfirm(`Found ${data.length} records. Create students?`, 'Confirm Upload', 'Yes, Create')) {
                setCreating(true);
                let successCount = 0;
                for (const row of data) {
                    try {
                        const email = row.email || row.username;
                        const pwd = row.password || 'password123';
                        const name = row.displayName || row.name || 'Student';

                        const newUser = await AdminAuthService.createUser(email, pwd);
                        await UserService.createUserProfile({
                            uid: newUser.uid,
                            email,
                            role: 'STUDENT',
                            displayName: name,
                            department: userProfile.department,
                            classId: userProfile.classId,
                            profileCompleted: false,
                            createdAt: Date.now()
                        });
                        successCount++;
                    } catch (err) {
                        console.error("Failed for row:", row, err);
                    }
                }
                setCreating(false);
                setIsUploadModalOpen(false);
                fetchStudents();
                await showAlert(`Successfully created ${successCount} students.`, 'success', 'Success');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleApprove = async () => {
        if (!selectedStudent) return;
        if (await showConfirm(`Approve ${selectedStudent.displayName}?`, 'Approve Student', 'Yes, Approve', 'approve')) {
            try {
                await UserService.updateUserProfile(selectedStudent.uid, {
                    ...selectedStudent,
                    profileStatus: 'VERIFIED'
                });
                setSelectedStudent(null);
                fetchStudents();
                await showAlert('Student approved successfully', 'success', 'Approved');
            } catch (e) {
                await showAlert('Failed to approve', 'error', 'Error');
            }
        }
    };

    const handleDecline = async () => {
        if (!selectedStudent) return;
        if (await showConfirm(`Decline ${selectedStudent.displayName}? They will need to resubmit details.`, 'Decline Student', 'Yes, Decline', 'delete')) {
            try {
                await UserService.updateUserProfile(selectedStudent.uid, {
                    ...selectedStudent,
                    profileStatus: 'PENDING',
                    profileCompleted: false
                });
                setSelectedStudent(null);
                fetchStudents();
                await showAlert('Student declined and profile reset', 'info', 'Declined');
            } catch (e) {
                await showAlert('Failed to decline', 'error', 'Error');
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Students</h1>
                    <p className="text-sm text-gray-500">Department: {userProfile?.department}</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-brand-orange-ice text-brand-orange-deep font-medium rounded-lg hover:bg-brand-orange-light transition border border-brand-orange-light"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Excel
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-brand-orange-primary text-white font-bold rounded-lg hover:bg-brand-orange-deep transition shadow-lg shadow-brand-orange-primary/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-orange-50/50 backdrop-blur-sm border-b border-orange-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-orange-900/70 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-orange-900/70 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-orange-900/70 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">No students found.</td></tr>
                        ) : (
                            students.map((student) => (
                                <tr
                                    key={student.uid}
                                    onClick={() => setSelectedStudent(student)}
                                    className="cursor-pointer hover:bg-orange-50/30 transition-colors group"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                {student.displayName?.charAt(0)}
                                            </div>
                                            <div className="ml-4 text-sm font-medium text-gray-900">{student.displayName}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${student.profileStatus === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-100' :
                                            student.profileStatus === 'APPROVAL_PENDING' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-orange-50 text-orange-700 border-orange-100'
                                            }`}>
                                            {student.profileStatus === 'VERIFIED' ? 'Verified' :
                                                student.profileStatus === 'APPROVAL_PENDING' ? 'Approval Pending' :
                                                    'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Student">
                <form onSubmit={handleCreateStudent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name <span className="text-red-500">*</span></label>
                        <input required placeholder="Display Name" className="input-field w-full" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input required type="email" placeholder="Email" className="input-field w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                        <input required type="password" placeholder="Password" className="input-field w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>

                    <button disabled={creating} type="submit" className="w-full py-2.5 bg-brand-orange-primary text-white font-bold rounded-lg hover:bg-brand-orange-deep transition shadow-lg shadow-brand-orange-primary/30 mt-4 disabled:opacity-70">
                        {creating ? 'Creating...' : 'Create Student'}
                    </button>
                </form>
            </Modal>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Bulk Upload Students">
                <div className="space-y-4 text-center">
                    <div className="border-2 border-dashed border-brand-orange-light rounded-xl p-8 bg-brand-orange-ice/30">
                        <Upload className="mx-auto h-12 w-12 text-brand-orange-medium" />
                        <p className="mt-2 text-sm text-gray-600">Upload Excel file with columns: email, password, displayName</p>
                        <input type="file" onChange={handleFileUpload} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-orange-ice file:text-brand-orange-deep hover:file:bg-brand-orange-light transition cursor-pointer" />
                    </div>
                    {creating && <p className="text-brand-orange-primary font-medium">Processing file... Please wait...</p>}
                </div>
            </Modal>

            {/* Student Details Modal */}
            <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details" size="2xl">
                {selectedStudent && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                <span className={`block mt-1 px-2 py-1 text-xs font-semibold rounded-full w-max ${selectedStudent.profileStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' : selectedStudent.profileStatus === 'APPROVAL_PENDING' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {selectedStudent.profileStatus || 'Pending'}
                                </span>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Created At</label>
                                <p className="text-sm font-medium">{new Date(selectedStudent.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-bold text-gray-700 mb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-500">Roll No</label><p className="font-medium">{selectedStudent.rollNo}</p></div>
                                <div><label className="text-xs text-gray-500">Name</label><p className="font-medium break-words">{selectedStudent.displayName}</p></div>
                                <div><label className="text-xs text-gray-500">Email</label><p className="font-medium break-all">{selectedStudent.email}</p></div>
                                <div><label className="text-xs text-gray-500">Phone</label><p className="font-medium">{selectedStudent.phone || '-'}</p></div>
                                <div className="col-span-2"><label className="text-xs text-gray-500">Address</label><p className="font-medium break-words">{selectedStudent.address || '-'}</p></div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-bold text-gray-700 mb-2">Academic Information</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div><label className="text-xs text-gray-500">Department</label><p className="font-medium">{selectedStudent.department}</p></div>
                                <div><label className="text-xs text-gray-500">Section</label><p className="font-medium">{selectedStudent.section || '-'}</p></div>
                                <div><label className="text-xs text-gray-500">CGPA</label><p className="font-medium">{selectedStudent.cgpa || '-'}</p></div>
                                <div><label className="text-xs text-gray-500">10th Mark</label><p className="font-medium">{selectedStudent.tenthMark ? `${selectedStudent.tenthMark}%` : '-'}</p></div>
                                <div><label className="text-xs text-gray-500">12th Mark</label><p className="font-medium">{selectedStudent.twelfthMark ? `${selectedStudent.twelfthMark}%` : '-'}</p></div>
                                <div><label className="text-xs text-gray-500">Standing Arrears</label><p className="font-medium text-red-600">{selectedStudent.standingArreas || 0}</p></div>
                                <div><label className="text-xs text-gray-500">History of Arrears</label><p className="font-medium text-orange-600">{selectedStudent.historyOfArreas || 0}</p></div>
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-6 border-t">
                            <button
                                onClick={handleApprove}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                            >
                                Approve
                            </button>
                            <button
                                onClick={handleDecline}
                                className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 font-medium"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default ClassStudents;
