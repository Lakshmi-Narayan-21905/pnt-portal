import React from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/student-background.css';
import '../styles/green-background.css';

const AnimatedBackground: React.FC = () => {
    const location = useLocation();

    // Check if we are in Training or Placement Head portals
    const isGreenTheme = location.pathname.startsWith('/training-head') || location.pathname.startsWith('/placement-head');
    const isLavenderTheme = location.pathname.startsWith('/dept-coordinator');
    const isOrangeTheme = location.pathname.startsWith('/class-coordinator');
    const isIndigoTheme = location.pathname.startsWith('/admin');

    return (
        <div className="fixed inset-0 z-[-50] overflow-hidden pointer-events-none isolate">
            {/* Rich Animated Background - Switch based on route */}
            <div className={`${isGreenTheme ? 'green-bg-wrapper' : isLavenderTheme ? 'lavender-bg-wrapper' : isOrangeTheme ? 'orange-bg-wrapper' : isIndigoTheme ? 'indigo-bg-wrapper' : 'student-bg-wrapper'} absolute inset-0 w-full h-full transition-colors duration-1000`}>
                {/* Floating Squares - Removed as per previous tasks */}

                {/* Flowy Waves */}
                <div className="wave-container">
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <div className="wave"></div>
                </div>
            </div>

            {/* Glass Overlay for Content Legibility */}
            <div className="absolute inset-0 glass-overlay"></div>
        </div>
    );
};

export default AnimatedBackground;
