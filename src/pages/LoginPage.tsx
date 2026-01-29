import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { userProfile, error: authError } = useAuth(); // Get global auth error

    // Show either local login error or global auth error (like missing profile)
    const displayError = localError || authError;

    useEffect(() => {
        if (userProfile) {
            // Redirect based on role
            switch (userProfile.role) {
                case 'ADMIN':
                    navigate('/admin/dashboard');
                    break;
                case 'PLACEMENT_HEAD':
                    navigate('/placement-head/dashboard');
                    break;
                case 'TRAINING_HEAD':
                    navigate('/training-head/dashboard');
                    break;
                case 'DEPT_COORDINATOR':
                    navigate('/dept-coordinator/dashboard');
                    break;
                case 'CLASS_COORDINATOR':
                    navigate('/class-coordinator/dashboard');
                    break;
                case 'STUDENT':
                    if (!userProfile.profileCompleted) {
                        navigate('/student/complete-profile');
                    } else {
                        navigate('/student/dashboard');
                    }
                    break;
                default:
                    navigate('/');
            }
        }
    }, [userProfile, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setLoading(true);

        try {
            // Set persistence to session (tab-only)
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect will be handled by useEffect when userProfile updates
        } catch (err: any) {
            console.error("Login Error:", err);
            setLocalError('Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
            {/* Blue Wave Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="#3b82f6" fillOpacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
                <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="#3b82f6" fillOpacity="0.15" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,181.3C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
                <svg className="absolute top-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="#3b82f6" fillOpacity="0.08" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,122.7C960,139,1056,149,1152,133.3C1248,117,1344,75,1392,53.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                </svg>
            </div>

            <div className="relative z-10 w-full max-w-md p-8 mx-4">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                <LogIn className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                            <p className="text-gray-600">Sign in to access the portal</p>
                        </div>

                        {displayError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
                                {displayError}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
