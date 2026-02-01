import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Building2,
    Briefcase,
    ClipboardList
} from 'lucide-react';

const PlacementHeadLayout: React.FC = () => {
    const { logout, userProfile } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/placement-head/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/placement-head/coordinators', label: 'Coordinators', icon: Users },
        { path: '/placement-head/companies', label: 'Company Drives', icon: Building2 },
        { path: '/placement-head/students', label: 'Students', icon: Briefcase },
        { path: '/placement-head/records', label: 'Placement Records', icon: ClipboardList },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg z-10 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center">
                    <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold">PH</span>
                    </div>
                    <span className="text-lg font-bold text-gray-800">Placement Head</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-purple-50 text-purple-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-purple-600' : 'text-gray-400'}`} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                            {userProfile?.displayName?.charAt(0) || 'P'}
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
                    <span className="font-bold text-gray-800">Placement Portal</span>
                    <button onClick={() => logout()} className="text-red-600 text-sm">Logout</button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default PlacementHeadLayout;
