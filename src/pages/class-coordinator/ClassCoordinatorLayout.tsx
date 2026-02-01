import React from 'react';
import { LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const ClassCoordinatorLayout: React.FC = () => {
    const { userProfile: user } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/class-coordinator/dashboard' },
        { icon: Users, label: 'My Students', path: '/class-coordinator/students' },
    ];

    return (
        <DashboardLayout
            title="Class Portal"
            navItems={navItems}
            userRoleLabel={user?.department || "Coordinator"}
        />
    );
};

export default ClassCoordinatorLayout;
