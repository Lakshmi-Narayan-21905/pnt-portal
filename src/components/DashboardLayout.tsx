import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronLeft, ChevronRight, Bell, Search, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from './AnimatedBackground';

interface NavigationItem {
    label: string;
    path: string;
    icon: React.ElementType;
}

export type ThemeColor = 'indigo' | 'purple' | 'blue' | 'green' | 'amber';

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
        indigo: {
            sidebarGradient: 'from-indigo-900 via-indigo-800 to-indigo-900',
            activeItemBg: 'bg-white/20 shadow-inner backdrop-blur-sm border border-white/10',
            activeItemText: 'text-white font-semibold',
            accentText: 'text-indigo-200',
            logoBg: 'bg-indigo-600',
            hoverBg: 'hover:bg-white/10 hover:backdrop-blur-sm',
            lightAccent: 'bg-white/10 backdrop-blur-sm shadow-sm border border-white/20 text-white',
            border: 'border-indigo-700/50',
        },
        purple: {
            sidebarGradient: 'from-purple-900 via-purple-800 to-purple-900',
            activeItemBg: 'bg-white/20 shadow-inner backdrop-blur-sm border border-white/10',
            activeItemText: 'text-white font-semibold',
            accentText: 'text-purple-200',
            logoBg: 'bg-purple-600',
            hoverBg: 'hover:bg-white/10 hover:backdrop-blur-sm',
            lightAccent: 'bg-white/10 backdrop-blur-sm shadow-sm border border-white/20 text-white',
            border: 'border-purple-700/50',
        },
        blue: {
            sidebarGradient: 'from-blue-900 via-blue-800 to-blue-900',
            activeItemBg: 'bg-white/20 shadow-inner backdrop-blur-sm border border-white/10',
            activeItemText: 'text-white font-semibold',
            accentText: 'text-blue-200',
            logoBg: 'bg-blue-600',
            hoverBg: 'hover:bg-white/10 hover:backdrop-blur-sm',
            lightAccent: 'bg-white/10 backdrop-blur-sm shadow-sm border border-white/20 text-white',
            border: 'border-blue-700/50',
        },
        green: {
            sidebarGradient: 'from-green-900 via-green-800 to-green-900',
            activeItemBg: 'bg-white/20 shadow-inner backdrop-blur-sm border border-white/10',
            activeItemText: 'text-white font-semibold',
            accentText: 'text-green-200',
            logoBg: 'bg-green-600',
            hoverBg: 'hover:bg-white/10 hover:backdrop-blur-sm',
            lightAccent: 'bg-white/10 backdrop-blur-sm shadow-sm border border-white/20 text-white',
            border: 'border-green-700/50',
        },
        amber: {
            sidebarGradient: 'from-stone-900 via-stone-800 to-stone-900',
            activeItemBg: 'bg-white/20 shadow-inner backdrop-blur-sm border border-white/10',
            activeItemText: 'text-white font-semibold',
            accentText: 'text-amber-500',
            logoBg: 'bg-amber-600',
            hoverBg: 'hover:bg-white/10 hover:backdrop-blur-sm',
            lightAccent: 'bg-white/10 backdrop-blur-sm shadow-sm border border-white/20 text-white',
            border: 'border-stone-700/50',
        }
    };

    const currentTheme = themeConfig[theme];

    return (
        <div className="flex h-screen font-sans overflow-hidden relative">
            <AnimatedBackground />

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
                    fixed md:relative z-50 h-[calc(100vh-2rem)] my-4 ml-4 flex flex-col transition-all duration-300 ease-in-out shadow-lg rounded-2xl overflow-hidden
                    ${isSidebarOpen ? 'w-72' : 'w-20'} 
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    bg-gradient-to-b ${currentTheme.sidebarGradient} text-gray-100
                `}
            >
                {/* 1. Header with Profile (Top Aligned) */}
                <div className={`flex flex-col border-b ${currentTheme.border} relative transition-all duration-300 ${isSidebarOpen ? 'p-6' : 'p-4 items-center'}`}>

                    {/* Top Row: Logo/Title (Expanded) or Logo (Collapsed) */}
                    <div className={`flex items-center gap-3 mb-6 transition-all duration-300 ${!isSidebarOpen && 'justify-center mb-0'}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${currentTheme.logoBg} flex items-center justify-center shadow-lg text-white font-bold text-lg`}>
                            {title.charAt(0)}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-lg text-white leading-tight truncate">{title}</span>
                                <span className={`text-[10px] uppercase tracking-wider ${currentTheme.accentText} font-semibold truncate`}>
                                    {userRoleLabel}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Profile Section (Inside Header Area) */}
                    {isSidebarOpen && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0">
                                {userProfile?.photoURL ? (
                                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-xs">{userProfile?.displayName?.charAt(0) || <User className="w-4 h-4" />}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{userProfile?.displayName || 'User'}</p>
                                <p className="text-xs text-gray-400 truncate">{userProfile?.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Collapsed Profile Avatar (Just below logo if space allows, or merged? 
                        User said: "The profile picture must stay aligned at the top". 
                        If collapsed, we can show avatar just under logo or maybe HIDE it to avoid clutter if requested? 
                        No, "Profile picture must STAY aligned at the top". Implies visibility.
                        Let's put Avatar under Logo in collapsed state.
                    */}
                    {!isSidebarOpen && (
                        <div className="mt-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 transition-all duration-300">
                            {userProfile?.photoURL ? (
                                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-bold text-xs">{userProfile?.displayName?.charAt(0) || <User className="w-4 h-4" />}</span>
                            )}
                        </div>
                    )}
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
                                        ? `${currentTheme.activeItemBg} ${currentTheme.activeItemText} shadow-md`
                                        : `text-gray-300 ${currentTheme.hoverBg} hover:text-white`
                                    }
                                    ${!isSidebarOpen && 'justify-center px-0'}
                                `}
                            >
                                <item.icon
                                    className={`
                                        w-5 h-5 flex-shrink-0 transition-transform duration-200
                                        ${active ? 'text-white' : `text-gray-400 group-hover:text-white`}
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

                {/* 3. Footer with Logout (Fixed Bottom) */}
                <div className={`p-4 border-t ${currentTheme.border} bg-black/10 mt-auto`}>
                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center w-full px-3 py-2.5 rounded-xl text-red-300 hover:bg-white/5 hover:text-red-200 transition-colors
                            ${!isSidebarOpen && 'justify-center'}
                        `}
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {isSidebarOpen && <span className="ml-3 font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent h-screen overflow-hidden">
                <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-white/20 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`hidden md:flex p-2 hover:text-white ${currentTheme.lightAccent} rounded-xl transition-all duration-200`}
                        >
                            {isSidebarOpen ? <ChevronLeft className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
