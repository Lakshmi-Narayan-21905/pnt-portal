import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Building2, GraduationCap, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DeptCoordinatorLayout: React.FC = () => {
    const { userProfile: user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dept-coordinator/dashboard' },
        { icon: Users, label: 'Students', path: '/dept-coordinator/students' },
        { icon: Users, label: 'Class Coordinators', path: '/dept-coordinator/coordinators' },
        { icon: Building2, label: 'Companies', path: '/dept-coordinator/companies' },
        { icon: GraduationCap, label: 'Trainings', path: '/dept-coordinator/trainings' },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar (Desktop) */}
            <div className="w-64 bg-white shadow-lg z-10 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center">
                    <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-gray-800 block leading-tight">Dept Portal</span>
                        <span className="text-xs text-gray-500 font-medium">{user?.department}</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                            {user?.displayName?.charAt(0) || 'C'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm md:hidden p-4 flex justify-between items-center z-20">
                    <div className="flex items-center">
                        <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold">D</span>
                        </div>
                        <span className="font-bold text-gray-800">Dept Portal</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600">
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </header>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div className="md:hidden absolute inset-0 z-50 bg-gray-800 bg-opacity-75" onClick={() => setIsSidebarOpen(false)}>
                        <div className="bg-white w-64 h-full flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <span className="text-lg font-bold text-gray-800">Menu</span>
                                <button onClick={() => setIsSidebarOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
                            </div>
                            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
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
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut className="h-4 w-4 mr-3" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DeptCoordinatorLayout;
