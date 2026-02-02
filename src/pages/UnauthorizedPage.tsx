import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6">
                    You do not have permission to view this page. Please contact your administrator if you believe this is a mistake.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-5 py-2.5 bg-brand-blue text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
