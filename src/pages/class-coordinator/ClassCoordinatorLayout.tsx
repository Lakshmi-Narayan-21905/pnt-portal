import React from 'react';
import { LayoutDashboard, Users, UserCircle, Briefcase, Award, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const ClassCoordinatorLayout: React.FC = () => {
    const { userProfile: user } = useAuth();

    const navItems = React.useMemo(() => [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/class-coordinator/dashboard' },
        { icon: Users, label: 'My Students', path: '/class-coordinator/students' },
        // Student Features
        { icon: UserCircle, label: 'My Profile', path: '/class-coordinator/profile' },
        { icon: Briefcase, label: 'Drives', path: '/class-coordinator/drives' },
        { icon: Award, label: 'Trainings', path: '/class-coordinator/trainings' },
        { icon: Bell, label: 'Announcements', path: '/class-coordinator/announcements' },
    ], []);

    return (
        <DashboardLayout
            title="Class Portal"
            navItems={navItems}
            userRoleLabel={user?.section ? `Section ${user.section}` : "Coordinator"}
            theme="orange"
        />);
};

export default ClassCoordinatorLayout;
