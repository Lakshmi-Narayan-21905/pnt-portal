import React from 'react';
import '../styles/student-background.css';

const AnimatedBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[-50] overflow-hidden pointer-events-none isolate">
            {/* Rich Animated Background */}
            <div className="student-bg-wrapper absolute inset-0 w-full h-full">
                {/* Floating Squares */}
                <ul className="bg-circles">
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                </ul>

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
