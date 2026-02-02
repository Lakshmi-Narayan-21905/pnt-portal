import { useLocation } from 'react-router-dom';

export const useTheme = () => {
    const location = useLocation();
    const path = location.pathname;

    if (path.startsWith('/admin')) {
        return {
            name: 'admin',
            text: 'text-indigo-600',
            bg: 'bg-indigo-600',
            border: 'border-indigo-600',
            borderLeft: 'border-l-indigo-600',
            lightBg: 'bg-indigo-50',
            hoverBorder: 'hover:border-indigo-400',
            shadow: 'shadow-indigo-100'
        };
    }

    if (path.startsWith('/placement-head')) {
        return {
            name: 'placement-head',
            text: 'text-emerald-600',
            bg: 'bg-emerald-600',
            border: 'border-emerald-600',
            borderLeft: 'border-l-emerald-600',
            lightBg: 'bg-emerald-50',
            hoverBorder: 'hover:border-emerald-400',
            shadow: 'shadow-emerald-100'
        };
    }

    if (path.startsWith('/training-head')) {
        return {
            name: 'training-head',
            text: 'text-teal-600',
            bg: 'bg-teal-600',
            border: 'border-teal-600',
            borderLeft: 'border-l-teal-600',
            lightBg: 'bg-teal-50',
            hoverBorder: 'hover:border-teal-400',
            shadow: 'shadow-teal-100'
        };
    }

    if (path.startsWith('/dept-coordinator')) {
        return {
            name: 'dept-coordinator',
            text: 'text-purple-600',
            bg: 'bg-purple-600',
            border: 'border-purple-600',
            borderLeft: 'border-l-purple-600',
            lightBg: 'bg-purple-50',
            hoverBorder: 'hover:border-purple-400',
            shadow: 'shadow-purple-100'
        };
    }

    if (path.startsWith('/class-coordinator')) {
        return {
            name: 'class-coordinator',
            text: 'text-orange-500',
            bg: 'bg-orange-500', // Assuming brand-orange is defined or using tailwind orange
            border: 'border-orange-500',
            borderLeft: 'border-l-orange-500',
            lightBg: 'bg-orange-50',
            hoverBorder: 'hover:border-orange-400',
            shadow: 'shadow-orange-100'
        };
    }

    // Default to Student / Blue
    return {
        name: 'student',
        text: 'text-blue-600',
        bg: 'bg-blue-600',
        border: 'border-blue-600',
        borderLeft: 'border-l-blue-600',
        lightBg: 'bg-blue-50',
        hoverBorder: 'hover:border-blue-400',
        shadow: 'shadow-blue-100'
    };
};
