import React from 'react';
import {
    LayoutDashboard,
    Users,
    Building2,
    Briefcase,
    ClipboardList,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const PlacementHeadLayout: React.FC = () => {
    const navItems = [
        { path: '/placement-head/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/placement-head/coordinators', label: 'Coordinators', icon: Users },
        { path: '/placement-head/companies', label: 'Company Drives', icon: Building2 },
        { path: '/placement-head/students', label: 'Students', icon: Briefcase },
        { path: '/placement-head/records', label: 'Placement Records', icon: ClipboardList },
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
