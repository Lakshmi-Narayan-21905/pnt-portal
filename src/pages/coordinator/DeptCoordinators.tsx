import React, { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { UserService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';
import Modal from '../../components/ui/Modal';

const SECTIONS = ['A', 'B', 'C', 'D'] as const;

type SectionRow = {
  section: string;
  coordinator: UserProfile | null;
};

const StudentCoordinatorAssignment: React.FC = () => {
  const { userProfile } = useAuth();

  const [sectionData, setSectionData] = useState<SectionRow[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [currentCoordinator, setCurrentCoordinator] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // 🔹 Load everything
  const loadData = async () => {
  if (!userProfile?.department) return;

  setLoading(true);
  try {
    const allUsers = await UserService.getAllUsers();
    const deptUsers = allUsers.filter(
      u => u.department === userProfile.department
    );

    console.log("DEPT USERS:", deptUsers);

    const sectionMap = ['A', 'B', 'C', 'D'].map(section => {
      const coord = deptUsers.find(
        u =>
          u.role === 'STUDENT_COORDINATOR' &&
          u.section?.toUpperCase().includes(section)
      );

      return {
        section,
        coordinator: coord || null
      };
    });

    setSectionData(sectionMap);
    setStudents(deptUsers);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadData();
  }, [userProfile]);

  // 🔹 Open modal
  const openAssignModal = (row: SectionRow) => {
    setSelectedSection(row.section);
    setCurrentCoordinator(row.coordinator);
    setIsModalOpen(true);
  };

  // 🔹 Assign coordinator
  const assignCoordinator = async (student: UserProfile) => {
    if (!selectedSection) return;

    if (
      !confirm(
        `Assign ${student.displayName} as Student Coordinator for Section ${selectedSection}?`
      )
    )
      return;

    setAssigning(true);
    try {
      // Remove old coordinator
      if (currentCoordinator) {
        await UserService.updateUserProfile(currentCoordinator.uid, {
          role: 'STUDENT'
        });
      }

      // Assign new coordinator
      await UserService.updateUserProfile(student.uid, {
        role: 'STUDENT_COORDINATOR',
        section: selectedSection
      });

      alert('Coordinator assigned successfully');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Coordinators</h1>

      <div className="bg-white rounded-xl shadow border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Section</th>
              <th className="px-6 py-3 text-left">Coordinator</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-6 text-center">Loading...</td>
              </tr>
            ) : (
              sectionData.map(row => (
                <tr key={row.section}>
                  <td className="px-6 py-4 font-semibold">{row.section}</td>
                  <td className="px-6 py-4">
                    {row.coordinator ? row.coordinator.displayName : 'NIL'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openAssignModal(row)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 ASSIGN MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Assign Coordinator – Section ${selectedSection}`}
      >
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {students
            .filter(
              s => s.section?.toUpperCase() === selectedSection
            )
            .map(student => (
              <button
                key={student.uid}
                disabled={assigning}
                onClick={() => assignCoordinator(student)}
                className="w-full text-left px-4 py-2 border rounded hover:bg-indigo-50"
              >
                {student.displayName}
                {student.role === 'STUDENT_COORDINATOR' && (
                  <span className="ml-2 text-xs text-green-600">(Current)</span>
                )}
              </button>
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default StudentCoordinatorAssignment;
