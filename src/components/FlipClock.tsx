import React, { useEffect, useRef, useState } from 'react';
import '../styles/flip-clock.css';

interface FlipClockProps {
    value: number | string;
    theme?: 'dark' | 'light' | 'amber';
    size?: 'sm' | 'md' | 'lg';
}

const FlipDigit: React.FC<{ digit: string; theme: string }> = ({ digit, theme }) => {
    const [currentDigit, setCurrentDigit] = useState(digit);
    const [previousDigit, setPreviousDigit] = useState(digit);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (digit !== currentDigit) {
            setPreviousDigit(currentDigit);
            setCurrentDigit(digit);
            setIsFlipping(true);

            const timer = setTimeout(() => {
                setIsFlipping(false);
            }, 600); // Match CSS animation duration

            return () => clearTimeout(timer);
        }
    }, [digit, currentDigit]);

    return (
        <div className={`flip-digit flip-theme-${theme}`}>
            {/* Top Statics (Next Digit) */}
            <div className="flip-card top">
                <span>{currentDigit}</span>
            </div>

            {/* Bottom Statics (Previous Digit) */}
            <div className="flip-card bottom">
                <span>{previousDigit}</span>
            </div>

            {/* Flipped Cards */}
            {isFlipping && (
                <>
                    <div className="flip-card top flip-animate">
                        <span>{previousDigit}</span>
                    </div>
                    <div className="flip-card bottom flip-animate">
                        <span>{currentDigit}</span>
                    </div>
                </>
            )}
        </div>
    );
};

const FlipClock: React.FC<FlipClockProps> = ({ value, theme = 'amber', size = 'md' }) => {
    // Convert value to string and pad with zeros if it's a number (optional, depending on design preference)
    // For simple counts, just splitting string is enough.
    const digits = value.toString().split('');

    return (
        <div className="flip-clock-container">
            {digits.map((digit, index) => (
                <FlipDigit key={`${index}-${digit}`} digit={digit} theme={theme} />
            ))}
        </div>
    );
};

export default FlipClock;
