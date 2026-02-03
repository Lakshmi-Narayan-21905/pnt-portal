import { useLocation } from 'react-router-dom';

export const useTheme = () => {
    const location = useLocation();
    const path = location.pathname;

    // Black and white theme - all roles use the same grayscale colors
    const grayscaleTheme = {
        text: 'text-gray-800',
        bg: 'bg-gray-800',
        border: 'border-gray-800',
        borderLeft: 'border-l-gray-800',
        lightBg: 'bg-gray-50',
        hoverBorder: 'hover:border-gray-600',
        shadow: 'shadow-gray-200'
    };

    if (path.startsWith('/admin')) {
        return {
            name: 'admin',
            ...grayscaleTheme
        };
    }

    if (path.startsWith('/placement-head')) {
        return {
            name: 'placement-head',
            ...grayscaleTheme
        };
    }

    if (path.startsWith('/training-head')) {
        return {
            name: 'training-head',
            ...grayscaleTheme
        };
    }

    if (path.startsWith('/dept-coordinator')) {
        return {
            name: 'dept-coordinator',
            ...grayscaleTheme
        };
    }

    if (path.startsWith('/class-coordinator')) {
        return {
            name: 'class-coordinator',
            ...grayscaleTheme
        };
    }

    // Default to Student
    return {
        name: 'student',
        ...grayscaleTheme
    };
};
