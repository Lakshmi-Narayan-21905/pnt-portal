import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Building2,
    GraduationCap
} from 'lucide-react';

const AdminLayout: React.FC = () => {
    const { logout, userProfile } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Manage Users', icon: Users },
        { path: '/admin/manage-companies', label: 'Companies', icon: Building2 },
        { path: '/admin/manage-trainings', label: 'Trainings', icon: GraduationCap },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg z-10 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center">
                    <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold">P</span>
                    </div>
                    <span className="text-lg font-bold text-gray-800">Admin Portal</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-primary-50 text-primary-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-primary-600' : 'text-gray-400'}`} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                            {userProfile?.displayName?.charAt(0) || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{userProfile?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm md:hidden p-4 flex justify-between items-center">
                    <span className="font-bold">Admin Portal</span>
                    <button onClick={() => logout()} className="text-red-600 text-sm">Logout</button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
