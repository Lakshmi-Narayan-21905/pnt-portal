import React, { useState, useEffect } from 'react';
import { useAlert } from '../../contexts/AlertContext';
import { Pencil, Check } from 'lucide-react';
import { UserService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';
import Modal from '../../components/ui/Modal';

const DeptCoordinators: React.FC = () => {
    const { showAlert, showConfirm } = useAlert();
    const { userProfile } = useAuth();
    const [coordinators, setCoordinators] = useState<UserProfile[]>([]);
    const [students, setStudents] = useState<UserProfile[]>([]); // All students in dept
    const [loading, setLoading] = useState(true);

    // Selection Modal State
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [targetSection, setTargetSection] = useState<string>('');
    const [assigning, setAssigning] = useState(false);

    // Fetch data
    const fetchData = async () => {
        if (!userProfile?.department) return;
        setLoading(true);
        try {
            // 1. Get current coordinators
            const allCoordinators = await UserService.getUsersByRole('CLASS_COORDINATOR');
            const deptCoordinators = allCoordinators.filter(u => u.department === userProfile.department);
            setCoordinators(deptCoordinators);

            // 2. Get students for selection pool
            const allStudents = await UserService.getUsersByRole('STUDENT');
            const deptStudents = allStudents.filter(u => u.department === userProfile.department);
            setStudents(deptStudents);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userProfile]);


    const handleOpenAssignModal = (section: string) => {
        setTargetSection(section);
        setIsSelectModalOpen(true);
    };

    const handleAssignCoordinator = async (student: UserProfile) => {
        if (!await showConfirm(`Promote ${student.displayName} to Class Coordinator for Section ${targetSection}?`, 'Confirm Assignment', 'Yes, Assign')) return;

        setAssigning(true);
        try {
            // 1. Remove from Students collection
            await UserService.deleteUserProfile(student.uid);

            // 2. Add to Class Coordinators collection
            // Preserve all student data, just update Role and Section
            const newProfile: UserProfile = {
                ...student,
                role: 'CLASS_COORDINATOR',
                section: targetSection,
                // Ensure accessing student features is still possible by role permissions in App.tsx
            };

            await UserService.createUserProfile(newProfile);

            // 3. Optional: Demote previous coordinator of this section? 
            // For now, we just rely on the new one being set. 
            // If we wanted to clean up, we'd find the old one and set their section to null or move them back to students.
            // Leaving as is to minimize destructive actions unless requested.

            await showAlert(`Successfully assigned ${student.displayName} as Class Coordinator.`, 'success', 'Success');
            setIsSelectModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            await showAlert('Failed to assign coordinator: ' + error.message, 'error', 'Error');
        } finally {
            setAssigning(false);
        }
    };

    // Filter students for the current target section
    const availableStudents = students.filter(s => s.section === targetSection);
    // Also include current coordinator in the list if we verify they are "in this section" locally? 
    // Actually current coordinator is NOT in 'students' list anymore (since we moved them). 
    // The user screenshot shows "KOWSHIK P (Current)". 
    // So we should merge available students + the current coordinator for display.

    const currentCoordinator = coordinators.find(c => c.section === targetSection);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Class Coordinators</h1>
                    <p className="text-sm text-gray-500">Department: {userProfile?.department}</p>
                </div>
                {/* Removed Export/Add buttons to match simplified "Section View" request */}
            </div>

            <div className="bg-white/70 backdrop-blur-md shadow-sm border border-white/60 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-brand-lavender-light/30">
                    <thead className="bg-brand-lavender-ice/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinator</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-lavender-light/30">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : (
                            ['A', 'B', 'C', 'D'].map((section) => {
                                const coord = coordinators.find(c => c.section === section);
                                return (
                                    <tr key={section} className="hover:bg-brand-lavender-ice/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{section}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {coord ? (
                                                <span className="font-semibold text-gray-800">{coord.displayName}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">NIL</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenAssignModal(section)}
                                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                                title="Assign Coordinator"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Selection Modal */}
            <Modal
                isOpen={isSelectModalOpen}
                onClose={() => setIsSelectModalOpen(false)}
                title={`Assign Coordinator – Section ${targetSection}`}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* List Current Coordinator if exists */}
                    {currentCoordinator && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-800">{currentCoordinator.displayName}</h4>
                                <p className="text-xs text-green-700 font-semibold">(Current Coordinator)</p>
                            </div>
                            <span className="text-green-600"><Check className="w-5 h-5" /></span>
                        </div>
                    )}

                    {/* List Students */}
                    {availableStudents.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No eligible students found in Section {targetSection}.</p>
                    ) : (
                        availableStudents.map(student => (
                            <button
                                key={student.uid}
                                disabled={assigning}
                                onClick={() => handleAssignCoordinator(student)}
                                className="w-full text-left p-4 bg-white border border-gray-100 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all group flex justify-between items-center shadow-sm"
                            >
                                <div>
                                    <h4 className="font-medium text-gray-800 group-hover:text-blue-800">{student.displayName}</h4>
                                    <p className="text-xs text-gray-500">{student.email}</p>
                                </div>
                                <span className="opacity-0 group-hover:opacity-100 text-blue-600 font-medium text-sm">Select</span>
                            </button>
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default DeptCoordinators;
