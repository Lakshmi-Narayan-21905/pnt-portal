import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 1500, className = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quart
            const easeOut = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(easeOut * value));

            if (percentage < 1) {
                animationFrameId = window.requestAnimationFrame(animate);
            }
        };

        animationFrameId = window.requestAnimationFrame(animate);

        return () => window.cancelAnimationFrame(animationFrameId);
    }, [value, duration]);

    return (
        <span className={`tabular-nums ${className}`}>
            {count.toLocaleString()}
        </span>
    );
};

export default AnimatedCounter;
