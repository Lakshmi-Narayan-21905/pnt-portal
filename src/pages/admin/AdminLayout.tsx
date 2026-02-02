import React from 'react';
import {
    LayoutDashboard,
    Users,
    Building2,
    GraduationCap,
    Menu
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const AdminLayout: React.FC = () => {
    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Manage Users', icon: Users },
        { path: '/admin/manage-companies', label: 'Companies', icon: Building2 },
        { path: '/admin/manage-trainings', label: 'Trainings', icon: GraduationCap },
    ];

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (

        <DashboardLayout
            title="Admin Portal"
            navItems={navItems}
            userRoleLabel="Administrator"
            theme="indigo"
        />

    );
};

export default AdminLayout;
