import React from 'react';
import { LayoutDashboard, Users, Building2, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const DeptCoordinatorLayout: React.FC = () => {
    const { userProfile: user } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dept-coordinator/dashboard' },
        { icon: Users, label: 'Students', path: '/dept-coordinator/students' },
        { icon: Users, label: 'Class Coordinators', path: '/dept-coordinator/coordinators' },
        { icon: Building2, label: 'Companies', path: '/dept-coordinator/companies' },
        { icon: GraduationCap, label: 'Trainings', path: '/dept-coordinator/trainings' },
    ];

    return (
        <DashboardLayout
            title="Dept Portal"
            navItems={navItems}
            userRoleLabel={user?.department || "Coordinator"}
            theme="lavender" // Added theme prop
        />
    );
};

export default DeptCoordinatorLayout;
