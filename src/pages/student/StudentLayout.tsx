import React from 'react';
import { LayoutDashboard, User, Briefcase, GraduationCap } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const StudentLayout: React.FC = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
        { icon: User, label: 'My Profile', path: '/student/profile' },
        { icon: Briefcase, label: 'Company Drives', path: '/student/drives' }, // Placeholder for now
        { icon: GraduationCap, label: 'My Trainings', path: '/student/trainings' },
        { icon: LayoutDashboard, label: 'Announcements', path: '/student/announcements' },
    ];

    return (
        <DashboardLayout
            title="Student Portal"
            navItems={navItems}
            userRoleLabel="Student"
            theme="blue"
        />
    );
};

export default StudentLayout;
