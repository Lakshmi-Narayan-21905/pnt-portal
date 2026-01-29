import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCompanies from './pages/admin/ManageCompanies';
import ManageTrainings from './pages/admin/ManageTrainings';
import AdminLayout from './pages/admin/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import PlacementHeadLayout from './pages/placement/PlacementHeadLayout';
import PlacementHeadDashboard from './pages/placement/PlacementHeadDashboard';
import ManageCoordinators from './pages/placement/ManageCoordinators';
import PlacementCompanies from './pages/placement/PlacementCompanies';
import PlacementStudents from './pages/placement/PlacementStudents';

import TrainingHeadLayout from './pages/training/TrainingHeadLayout';
import TrainingHeadDashboard from './pages/training/TrainingHeadDashboard';
import TrainingPrograms from './pages/training/TrainingPrograms';
import TrainingCoordinators from './pages/training/TrainingCoordinators';
import TrainingStudents from './pages/training/TrainingStudents';

import DeptCoordinatorLayout from './pages/coordinator/DeptCoordinatorLayout';
import DeptCoordinatorDashboard from './pages/coordinator/DeptCoordinatorDashboard';
import DeptStudents from './pages/coordinator/DeptStudents';
import DeptCoordinators from './pages/coordinator/DeptCoordinators';
import DeptPlacements from './pages/coordinator/DeptPlacements';
import DeptTrainings from './pages/coordinator/DeptTrainings';

import ClassCoordinatorLayout from './pages/class-coordinator/ClassCoordinatorLayout';
import ClassCoordinatorDashboard from './pages/class-coordinator/ClassCoordinatorDashboard';
import ClassStudents from './pages/class-coordinator/ClassStudents';

import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import CompleteProfile from './pages/student/CompleteProfile';
import StudentProfile from './pages/student/StudentProfile';
import StudentDrives from './pages/student/StudentDrives';
import StudentTrainings from './pages/student/StudentTrainings';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="manage-companies" element={<ManageCompanies />} />
            <Route path="manage-trainings" element={<ManageTrainings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* Placement Head Routes */}
        <Route element={<ProtectedRoute allowedRoles={['PLACEMENT_HEAD']} />}>
          <Route path="/placement-head" element={<PlacementHeadLayout />}>
            <Route path="dashboard" element={<PlacementHeadDashboard />} />
            <Route path="coordinators" element={<ManageCoordinators />} />
            <Route path="companies" element={<PlacementCompanies />} />
            <Route path="students" element={<PlacementStudents />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
        {/* Training Head Routes */}
        <Route element={<ProtectedRoute allowedRoles={['TRAINING_HEAD']} />}>
          <Route path="/training-head" element={<TrainingHeadLayout />}>
            <Route path="dashboard" element={<TrainingHeadDashboard />} />
            <Route path="trainings" element={<TrainingPrograms />} />
            <Route path="coordinators" element={<TrainingCoordinators />} />
            <Route path="students" element={<TrainingStudents />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* Dept Coordinator Routes */}
        <Route element={<ProtectedRoute allowedRoles={['DEPT_COORDINATOR']} />}>
          <Route path="/dept-coordinator" element={<DeptCoordinatorLayout />}>
            <Route path="dashboard" element={<DeptCoordinatorDashboard />} />
            <Route path="students" element={<DeptStudents />} />
            <Route path="coordinators" element={<DeptCoordinators />} />
            <Route path="companies" element={<DeptPlacements />} />
            <Route path="trainings" element={<DeptTrainings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* Class Coordinator Routes */}
        <Route element={<ProtectedRoute allowedRoles={['CLASS_COORDINATOR']} />}>
          <Route path="/class-coordinator" element={<ClassCoordinatorLayout />}>
            <Route path="dashboard" element={<ClassCoordinatorDashboard />} />
            <Route path="students" element={<ClassStudents />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student/complete-profile" element={<CompleteProfile />} />
          <Route path="/student" element={<StudentLayout />}>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="drives" element={<StudentDrives />} />
            <Route path="trainings" element={<StudentTrainings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
