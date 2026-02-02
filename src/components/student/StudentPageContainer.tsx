import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface StudentPageContainerProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

const StudentPageContainer: React.FC<StudentPageContainerProps> = ({ children, title, subtitle }) => {
    const { userProfile } = useAuth();
    const firstName = userProfile?.displayName?.split(' ')[0] || 'Student';

    return (
        <div className="min-h-full pb-8 relative isolate overflow-x-hidden">
            {/* Background is now handled globally by DashboardLayout */}

            {/* Header Section */}
            {(title || subtitle) ? (
                <div className="mb-8 pl-1 relative z-10 pt-6">
                    {title ? (
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
                            {title.includes('Hello') ? (
                                <>
                                    Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-blue">{firstName}</span>
                                    <span className="text-2xl ml-2 inline-block hover:animate-wave origin-bottom-right"></span>
                                </>
                            ) : (
                                title
                            )}
                        </h1>
                    ) : null}
                    {subtitle && <p className="text-gray-500 mt-1 font-medium">{subtitle}</p>}
                </div>
            ) : null}

            {/* Main Content Area */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Global Keyframes */}
            <style>{`
                @keyframes wave {
                    0% { transform: rotate(0deg); }
                    10% { transform: rotate(14deg); }
                    20% { transform: rotate(-8deg); }
                    30% { transform: rotate(14deg); }
                    40% { transform: rotate(-4deg); }
                    50% { transform: rotate(10deg); }
                    60% { transform: rotate(0deg); }
                    100% { transform: rotate(0deg); }
                }
                .hover\\:animate-wave:hover {
                    animation: wave 2s infinite;
                    transform-origin: 70% 70%;
                }
            `}</style>
        </div>
    );
};

export default StudentPageContainer;
