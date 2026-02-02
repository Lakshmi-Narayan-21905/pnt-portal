import React from 'react';
import { LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const ClassCoordinatorLayout: React.FC = () => {
    const { userProfile: user } = useAuth();

    const navItems = React.useMemo(() => [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/class-coordinator/dashboard' },
        { icon: Users, label: 'My Students', path: '/class-coordinator/students' },
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
