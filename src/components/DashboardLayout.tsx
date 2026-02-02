import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationItem {
    label: string;
    path: string;
    icon: React.ElementType;
}

export type ThemeColor = 'indigo' | 'purple' | 'blue' | 'green' | 'amber' | 'lavender' | 'orange';

interface DashboardLayoutProps {
    title: string;
    navItems: NavigationItem[];
    userRoleLabel?: string;
    theme?: ThemeColor;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, navItems, userRoleLabel, theme = 'indigo' }) => {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    const isActive = (path: string) => location.pathname === path;

    const themeConfig = {
        purple: {
            sidebarGradient: 'from-purple-950 to-purple-900 border-r border-purple-800/50 shadow-2xl',
            activeItemBg: 'bg-white/10 backdrop-blur-md border-l-4 border-purple-400 rounded-lg shadow-inner',
            activeItemText: 'text-white font-bold tracking-wide',
            accentText: 'text-purple-300/80',
            logoBg: 'bg-gradient-to-br from-purple-500 to-purple-700',
            hoverBg: 'hover:bg-white/5 hover:text-white',
            lightAccent: 'bg-white/10 text-white hover:bg-white/20',
            border: 'border-purple-800/30',
            pageBg: 'bg-purple-50/60'
        },
        blue: {
            sidebarGradient: 'from-blue-950 to-blue-900 border-r border-blue-800/50 shadow-2xl',
            activeItemBg: 'bg-white/10 backdrop-blur-md border-l-4 border-blue-400 rounded-lg shadow-inner',
            activeItemText: 'text-white font-bold tracking-wide',
            accentText: 'text-blue-300/80',
            logoBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
            hoverBg: 'hover:bg-white/5 hover:text-white',
            lightAccent: 'bg-white/10 text-white hover:bg-white/20',
            border: 'border-blue-800/30',
            pageBg: 'bg-blue-50/60'
        },
        green: {
            sidebarGradient: 'from-emerald-950 to-emerald-900 border-r border-emerald-800/50 shadow-2xl',
            activeItemBg: 'bg-white/10 backdrop-blur-md border-l-4 border-emerald-400 rounded-lg shadow-inner',
            activeItemText: 'text-white font-bold tracking-wide',
            accentText: 'text-emerald-300/80',
            logoBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
            hoverBg: 'hover:bg-white/5 hover:text-white',
            lightAccent: 'bg-white/10 text-white hover:bg-white/20',
            border: 'border-emerald-800/30',
            pageBg: 'bg-emerald-50/60'
        },
        lavender: {
            sidebarGradient: 'from-violet-950 to-violet-900 border-r border-violet-800/50 shadow-2xl',
            activeItemBg: 'bg-white/10 backdrop-blur-md border-l-4 border-violet-400 rounded-lg shadow-inner',
            activeItemText: 'text-white font-bold tracking-wide',
            accentText: 'text-violet-300/80',
            logoBg: 'bg-gradient-to-br from-violet-500 to-violet-700',
            hoverBg: 'hover:bg-white/5 hover:text-white',
            lightAccent: 'bg-white/10 text-white hover:bg-white/20',
            border: 'border-violet-800/30',
            pageBg: 'bg-violet-50/60'
        },
        orange: {
            sidebarGradient: 'from-orange-950 to-orange-900 border-r border-orange-800/50 shadow-2xl',
            activeItemBg: 'bg-white/10 backdrop-blur-md border-l-4 border-orange-400 rounded-lg shadow-inner',
            activeItemText: 'text-white font-bold tracking-wide',
            accentText: 'text-orange-300/80',
            logoBg: 'bg-gradient-to-br from-orange-500 to-orange-700',
            hoverBg: 'hover:bg-white/5 hover:text-white',
            lightAccent: 'bg-white/10 text-white hover:bg-white/20',
            border: 'border-orange-800/30',
            pageBg: 'bg-orange-50/60'
        },
        indigo: {
            sidebarGradient: 'from-indigo-950 to-indigo-900 border-r border-indigo-800/50 shadow-2xl',
            activeItemBg: 'bg-white/10 backdrop-blur-md border-l-4 border-indigo-400 rounded-lg shadow-inner',
            activeItemText: 'text-white font-bold tracking-wide',
            accentText: 'text-indigo-300/80',
            logoBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
            hoverBg: 'hover:bg-white/5 hover:text-white',
            lightAccent: 'bg-white/10 text-white hover:bg-white/20',
            border: 'border-indigo-800/30',
            pageBg: 'bg-indigo-50/60'
        },
        amber: {
            sidebarGradient: 'from-stone-900 via-stone-800 to-stone-900 border-r border-stone-700 shadow-2xl',
            activeItemBg: 'bg-white/10 backdrop-blur-md border-l-4 border-amber-500 rounded-lg shadow-inner',
            activeItemText: 'text-white font-bold tracking-wide',
            accentText: 'text-amber-500/80',
            logoBg: 'bg-gradient-to-br from-amber-600 to-amber-800',
            hoverBg: 'hover:bg-white/5 hover:text-white',
            lightAccent: 'bg-white/10 text-white hover:bg-white/20',
            border: 'border-stone-700/50',
            pageBg: 'bg-stone-50/60'
        }
    };

    const currentTheme = themeConfig[theme];

    return (
        <div className={`flex h-screen font-sans overflow-hidden relative ${currentTheme.pageBg}`}>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:relative z-50 h-[calc(100vh-2rem)] my-4 ml-4 flex flex-col transition-all duration-300 ease-in-out shadow-lg rounded-2xl
                    ${isSidebarOpen ? 'w-72' : 'w-20'} 
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    bg-gradient-to-b ${currentTheme.sidebarGradient} text-gray-100
                `}
            >
                {/* Sidebar Toggle Button (Absolute Positioned on Right Edge) */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`
                        absolute -right-3 top-9 z-50 p-1 rounded-full bg-white border shadow-md transition-all duration-200
                        ${currentTheme.border} hover:bg-gray-50 text-gray-500 hover:text-gray-800 hidden md:flex items-center justify-center
                    `}
                >
                    {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* 1. Header with Profile (Top Aligned) */}
                <div className={`flex flex-col border-b ${currentTheme.border} relative transition-all duration-300 ${isSidebarOpen ? 'p-6' : 'p-4 items-center'}`}>

                    {/* Top Row: Logo/Title (Expanded) or Logo (Collapsed) */}
                    <div className={`flex items-center gap-3 mb-6 transition-all duration-300 ${!isSidebarOpen && 'justify-center mb-0'}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${currentTheme.logoBg} flex items-center justify-center shadow-lg text-white font-bold text-lg`}>
                            {title.charAt(0)}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-lg text-white leading-tight truncate tracking-tight">{title}</span>
                                <span className={`text-[10px] uppercase tracking-wider ${currentTheme.accentText} font-semibold truncate`}>
                                    {userRoleLabel}
                                </span>
                            </div>
                        )}
                    </div>

                </div>

                {/* 2. Navigation (Middle - No Scrollbar) */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-1.5 self-stretch">
                    {/* CSS hack for no visible scrollbar but functional scrolling */}
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>

                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    relative flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 group
                                    ${active
                                        ? `${currentTheme.activeItemBg} ${currentTheme.activeItemText} shadow-lg`
                                        : `text-gray-400 ${currentTheme.hoverBg} hover:text-white`
                                    }
                                    ${!isSidebarOpen && 'justify-center px-0'}
                                `}
                            >
                                <item.icon
                                    className={`
                                        w-5 h-5 flex-shrink-0 transition-transform duration-200
                                        ${active ? 'text-white scale-110' : `text-gray-400 group-hover:text-white group-hover:scale-110`}
                                    `}
                                />

                                {isSidebarOpen && (
                                    <span className="ml-3 font-medium text-sm truncate">
                                        {item.label}
                                    </span>
                                )}

                                {/* Hover Tooltip for Collapsed */}
                                {!isSidebarOpen && (
                                    <div className="absolute left-14 ml-2 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none border border-white/10">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* 3. Footer with Profile & Logout (Fixed Bottom) */}
                <div className={`p-4 border-t ${currentTheme.border} mt-auto flex flex-col gap-4`}>

                    {/* Profile Section (Moved to Bottom) */}
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm shadow-inner">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0 shadow-lg">
                                {userProfile?.photoURL ? (
                                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-brand-blue font-bold text-xs">{userProfile?.displayName?.charAt(0) || <User className="w-4 h-4" />}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{userProfile?.displayName || 'User'}</p>
                                <p className={`text-xs ${currentTheme.accentText} font-medium truncate`}>{userProfile?.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 mx-auto rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm mb-2">
                            {userProfile?.photoURL ? (
                                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-brand-blue font-bold text-xs">{userProfile?.displayName?.charAt(0) || <User className="w-4 h-4" />}</span>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center w-full px-3 py-3 rounded-xl transition-all duration-200 shadow-sm border border-gray-100
                            bg-white text-red-500 hover:bg-red-50 hover:border-red-100 hover:shadow-md
                            ${!isSidebarOpen && 'justify-center'}
                        `}
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {isSidebarOpen && <span className="ml-3 font-bold text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent h-screen overflow-hidden">
                <header className="h-16 bg-transparent border-none flex items-center justify-between px-6 sticky top-0 z-30 shadow-none">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div >
    );
};

export default DashboardLayout;
