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
    const [hasUnread, setHasUnread] = useState(false);

    const checkUnread = async () => {
        if (!userProfile) return;
        try {
            const data: number = await import('../services/announcementService').then(m => m.AnnouncementService.getLatestAnnouncementDate(userProfile.department));
            const lastRead = localStorage.getItem('lastReadAnnouncementTime');
            if (!lastRead || data > parseInt(lastRead)) {
                setHasUnread(true);
            } else {
                setHasUnread(false);
            }
        } catch (e) { console.error(e); }
    };

    React.useEffect(() => {
        if (userProfile) {
            checkUnread();
        }

        const handleReadEvents = () => {
            setHasUnread(false);
        };

        window.addEventListener('announcementsRead', handleReadEvents);
        return () => window.removeEventListener('announcementsRead', handleReadEvents);
    }, [userProfile, location.pathname]); // Re-check on nav change too


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
            sidebarGradient: 'bg-white border-r border-gray-200 shadow-sm', // Clean White Sidebar
            activeItemBg: 'bg-brand-purple-ice text-brand-purple-deep border-r-[3px] border-brand-purple-primary rounded-none',
            activeItemText: 'text-brand-purple-deep font-bold',
            accentText: 'text-gray-500',
            logoBg: 'bg-brand-purple-primary', // Solid Brand Purple Logo
            hoverBg: 'hover:bg-gray-50 hover:text-gray-900',
            lightAccent: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            border: 'border-gray-200',
        },
        blue: {
            sidebarGradient: 'bg-white border-r border-gray-200 shadow-sm', // Clean White Sidebar
            activeItemBg: 'bg-brand-ice text-brand-blue border-r-[3px] border-brand-primary rounded-none', // Professional Active Indicator
            activeItemText: 'text-brand-blue font-bold',
            accentText: 'text-gray-500', // Subtle subtext
            logoBg: 'bg-brand-blue', // Solid Brand Blue Logo
            hoverBg: 'hover:bg-gray-50 hover:text-gray-900', // Subtle gray hover
            lightAccent: 'bg-gray-100 text-gray-600 hover:bg-gray-200', // Toggle button
            border: 'border-gray-200',
        },
        green: {
            sidebarGradient: 'bg-white border-r border-gray-200 shadow-sm', // Clean White Sidebar
            activeItemBg: 'bg-brand-green-ice text-brand-green-deep border-r-[3px] border-brand-green-primary rounded-none', // Professional Active Indicator
            activeItemText: 'text-brand-green-deep font-bold',
            accentText: 'text-gray-500',
            logoBg: 'bg-brand-green-primary', // Solid Brand Green Logo
            hoverBg: 'hover:bg-gray-50 hover:text-gray-900', // Subtle gray hover
            lightAccent: 'bg-gray-100 text-gray-600 hover:bg-gray-200', // Toggle button
            border: 'border-gray-200',
        },
        lavender: {
            sidebarGradient: 'bg-white border-r border-gray-200 shadow-sm', // Clean White Sidebar
            activeItemBg: 'bg-brand-lavender-ice text-brand-lavender-deep border-r-[3px] border-brand-lavender-primary rounded-none',
            activeItemText: 'text-brand-lavender-deep font-bold',
            accentText: 'text-gray-500',
            logoBg: 'bg-brand-lavender-primary', // Solid Brand Lavender Logo
            hoverBg: 'hover:bg-gray-50 hover:text-gray-900',
            lightAccent: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            border: 'border-gray-200',
        },
        orange: {
            sidebarGradient: 'bg-white border-r border-gray-200 shadow-sm', // Clean White Sidebar
            activeItemBg: 'bg-brand-orange-ice text-brand-orange-deep border-r-[3px] border-brand-orange-primary rounded-none',
            activeItemText: 'text-brand-orange-deep font-bold',
            accentText: 'text-gray-500',
            logoBg: 'bg-brand-orange-primary',
            hoverBg: 'hover:bg-gray-50 hover:text-gray-900',
            lightAccent: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            border: 'border-gray-200',
        },
        indigo: {
            sidebarGradient: 'bg-white border-r border-gray-200 shadow-sm', // Clean White Sidebar
            activeItemBg: 'bg-brand-indigo-ice text-brand-indigo-deep border-r-[3px] border-brand-indigo-primary rounded-none',
            activeItemText: 'text-brand-indigo-deep font-bold',
            accentText: 'text-gray-500',
            logoBg: 'bg-brand-indigo-primary',
            hoverBg: 'hover:bg-gray-50 hover:text-gray-900',
            lightAccent: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            border: 'border-gray-200',
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
                        absolute -right-3 top-20 z-50 p-1 rounded-full bg-white border shadow-md transition-all duration-200
                        ${currentTheme.border} hover:bg-gray-50 text-gray-400 hover:text-gray-600 hidden md:flex items-center justify-center
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
                                <span className="font-bold text-lg text-gray-900 leading-tight truncate">{title}</span>
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
                        const isAnnouncements = item.label === 'Announcements';

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    relative flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 group
                                    ${active
                                        ? `${currentTheme.activeItemBg} ${currentTheme.activeItemText} shadow-none`
                                        : `text-gray-600 ${currentTheme.hoverBg} hover:text-gray-900`
                                    }
                                    ${!isSidebarOpen && 'justify-center px-0'}
                                `}
                            >
                                <item.icon
                                    className={`
                                        w-5 h-5 flex-shrink-0 transition-transform duration-200
                                        ${active ? 'text-brand-blue' : `text-gray-500 group-hover:text-gray-700`}
                                    `}
                                />

                                {isSidebarOpen && (
                                    <span className="ml-3 font-medium text-sm truncate flex-1 flex items-center justify-between">
                                        {item.label}
                                        {isAnnouncements && hasUnread && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-200"></span>
                                        )}
                                    </span>
                                )}

                                {/* Collapsed Unread Dot */}
                                {!isSidebarOpen && isAnnouncements && hasUnread && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
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
                        <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm">
                                {userProfile?.photoURL ? (
                                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-brand-blue font-bold text-xs">{userProfile?.displayName?.charAt(0) || <User className="w-4 h-4" />}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{userProfile?.displayName || 'User'}</p>
                                <p className="text-xs text-brand-blue font-medium truncate">{userProfile?.email}</p>
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
