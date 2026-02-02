import React from 'react';
import { LayoutDashboard, Users, Building2, FileBarChart, Bell } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const PlacementHeadLayout: React.FC = () => {
    const navItems = [
        { path: '/placement-head/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/placement-head/coordinators', label: 'Coordinators', icon: Users },
        { path: '/placement-head/companies', label: 'Company Drives', icon: Building2 },
        { path: '/placement-head/students', label: 'Students', icon: FileBarChart }, // Assuming FileBarChart is intended for Students based on import change
        { path: '/placement-head/announcements', label: 'Announcements', icon: Bell },
        { path: '/placement-head/records', label: 'Placement Records', icon: FileBarChart }, // Assuming FileBarChart is intended for Placement Records based on import change
    ];

    return (
        <DashboardLayout
            title="Placement Portal"
            navItems={navItems}
            userRoleLabel="Placement Head"
            theme="green"
        />
    );
};

export default PlacementHeadLayout;
