import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Check, AlertTriangle, Info, HelpCircle, Trash2 } from 'lucide-react';

// --- Types ---

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'delete' | 'approve';

interface AlertOptions {
    title?: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    hideButton?: boolean;
}

interface AlertContextType {
    showAlert: (message: string, type?: AlertType, title?: string, options?: { hideButton?: boolean }) => Promise<boolean>; // Returns true if confirmed (for confirm type)
    showConfirm: (message: string, title?: string, confirmText?: string, type?: 'confirm' | 'delete' | 'approve') => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

// --- Modal Component ---

const AlertModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    options: AlertOptions;
    themeColor: string;
    themeBg: string;
}> = ({ isOpen, options, themeColor, themeBg }) => {
    if (!isOpen) return null;

    const { title, message, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel } = options;

    // Icon mapping
    const getIcon = () => {
        switch (type) {
            case 'success': return <Check className="w-8 h-8 text-white" />;
            case 'error': return <X className="w-8 h-8 text-white" />;
            case 'warning': return <AlertTriangle className="w-8 h-8 text-white" />;
            case 'confirm': return <HelpCircle className="w-8 h-8 text-white" />;
            case 'delete': return <Trash2 className="w-8 h-8 text-white" />;
            case 'approve': return <Check className="w-8 h-8 text-white" />;
            default: return <Info className="w-8 h-8 text-white" />;
        }
    };

    // Color mapping for the icon background circle
    const getIconBg = () => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            case 'warning': return 'bg-amber-500';
            case 'confirm': return `bg-primary-500`; // Dynamic theme usage logic below handles button, but icon can use primary too
            case 'delete': return 'bg-red-500';
            case 'approve': return 'bg-green-500';
            default: return 'bg-blue-500';
        }
    };

    // We can override the icon color based on the Theme if it's a "confirm" or "info" type to match the portal
    const iconBgClass = (type === 'confirm' || type === 'info') ? themeBg : getIconBg();


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={onCancel}
            ></div>

            {/* Modal Card */}
            {/* Modal Card */}
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Icon Bubble */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-sm ${iconBgClass}`}>
                        {React.isValidElement(getIcon()) ? React.cloneElement(getIcon() as React.ReactElement<any>, { className: "w-6 h-6 text-white" }) : getIcon()}
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {title || (type.charAt(0).toUpperCase() + type.slice(1))}
                    </h3>

                    <p className="text-gray-500 text-sm mb-6 leading-relaxed px-2">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        {(type === 'confirm' || type === 'warning' || type === 'delete' || type === 'approve') && (
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-100 focus:outline-none"
                            >
                                {cancelText}
                            </button>
                        )}
                        {!options.hideButton && (
                            <button
                                onClick={onConfirm}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-white shadow-md hover:opacity-90 transition-all transform active:scale-95 focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50 ${type === 'delete' ? 'bg-red-600 shadow-red-500/30' :
                                    type === 'approve' ? 'bg-green-600 shadow-green-500/30' :
                                        themeColor.replace('text-', 'bg-')
                                    }`}
                            >
                                {confirmText || 'OK'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Provider ---

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        options: AlertOptions;
        resolve?: (value: boolean) => void;
    }>({
        isOpen: false,
        options: { message: '' }
    });

    const location = useLocation();

    // Determine Theme Color based on Route
    const getThemeColors = () => {
        const path = location.pathname;
        if (path.startsWith('/admin')) return { text: 'text-indigo-600', bg: 'bg-indigo-600' };
        if (path.startsWith('/placement-head')) return { text: 'text-green-600', bg: 'bg-green-600' };
        if (path.startsWith('/training-head')) return { text: 'text-green-600', bg: 'bg-green-600' };
        if (path.startsWith('/dept-coordinator')) return { text: 'text-purple-600', bg: 'bg-purple-600' };
        if (path.startsWith('/class-coordinator')) return { text: 'text-orange-500', bg: 'bg-brand-orange-primary' }; // Use brand color for better match
        return { text: 'text-blue-600', bg: 'bg-blue-600' };
    };

    const themeColors = getThemeColors();

    const showAlert = useCallback((message: string, type: AlertType = 'info', title?: string, options?: { hideButton?: boolean }) => {
        return new Promise<boolean>((resolve) => {
            setAlertState({
                isOpen: true,
                options: {
                    message,
                    type,
                    title,
                    confirmText: 'OK',
                    hideButton: options?.hideButton,
                    onConfirm: () => {
                        setAlertState(prev => ({ ...prev, isOpen: false }));
                        resolve(true);
                    },
                    onCancel: () => {
                        setAlertState(prev => ({ ...prev, isOpen: false }));
                        resolve(false);
                    }
                },
                resolve
            });
        });
    }, []);

    const showConfirm = useCallback((message: string, title: string = 'Are you sure?', confirmText: string = 'Confirm', type: 'confirm' | 'delete' | 'approve' = 'confirm') => {
        return new Promise<boolean>((resolve) => {
            setAlertState({
                isOpen: true,
                options: {
                    message,
                    type,
                    title,
                    confirmText,
                    onConfirm: () => {
                        setAlertState(prev => ({ ...prev, isOpen: false }));
                        resolve(true);
                    },
                    onCancel: () => {
                        setAlertState(prev => ({ ...prev, isOpen: false }));
                        resolve(false);
                    }
                },
                resolve
            });
        });
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => alertState.resolve?.(false)}
                options={alertState.options}
                themeColor={themeColors.text}
                themeBg={themeColors.bg}
            />
        </AlertContext.Provider>
    );
};
