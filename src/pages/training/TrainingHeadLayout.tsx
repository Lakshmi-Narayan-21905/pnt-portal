import React from 'react';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Briefcase
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const TrainingHeadLayout: React.FC = () => {
    const navItems = [
        { path: '/training-head/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/training-head/coordinators', label: 'Coordinators', icon: Users },
        { path: '/training-head/trainings', label: 'Trainings', icon: GraduationCap },
        { path: '/training-head/students', label: 'Students', icon: Briefcase },
        { path: '/training-head/announcements', label: 'Announcements', icon: GraduationCap }, // Recycling icon for now or need to import Bell
    ];

    return (
        <DashboardLayout
            title="Training Portal"
            navItems={navItems}
            userRoleLabel="Training Head"
            theme="green"
        />
    );
};

export default TrainingHeadLayout;
