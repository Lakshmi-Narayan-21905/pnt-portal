import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

// Import images from assets folder
import logo from '../assets/logo.png';
import loginBg from '../assets/login-bg.jpg';

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
        <div className="fixed inset-0 flex items-center justify-center bg-slate-300 overflow-hidden p-4">
            {/* Main Container */}
            <div className="flex w-full max-w-5xl h-[85vh] max-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Left Side - Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white relative overflow-y-auto">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #059669 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                    <div className="w-full max-w-sm relative z-10">
                        {/* Logo */}
                        <div className="flex justify-center mb-4">
                            <img 
                                src={logo} 
                                alt="Kongu Engineering College" 
                                className="h-16 object-contain"
                            />
                        </div>

                        {/* Header */}
                        <div className="text-center mb-5">
                            <h1 className="text-xl font-bold text-slate-900 mb-1">
                                Get Started with Kongu Placements
                            </h1>
                            <p className="text-slate-500 text-xs">
                                Sign in to your account to continue
                            </p>
                        </div>

                        {/* Error Message */}
                        {displayError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mb-4 text-xs">
                                {displayError}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="group">
                                <label className="block text-xs font-medium text-slate-700 mb-1 transition-colors group-focus-within:text-primary-600">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white hover:border-primary-300 hover:bg-white transition-all duration-200"
                                    placeholder="mail@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="group">
                                <label className="block text-xs font-medium text-slate-700 mb-1 transition-colors group-focus-within:text-primary-600">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white hover:border-primary-300 hover:bg-white transition-all duration-200"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 hover:shadow-lg hover:shadow-primary-500/30 focus:outline-none focus:ring-4 focus:ring-primary-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>

                            {/* Forgot Password Link */}
                            <div className="text-left pt-1">
                                <a 
                                    href="#" 
                                    className="text-xs text-primary-600 hover:text-primary-700 font-medium underline underline-offset-4 decoration-primary-300 hover:decoration-primary-500 transition-all duration-200"
                                >
                                    Forgot your password?
                                </a>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side - Image */}
                <div className="hidden lg:block lg:w-1/2 relative rounded-r-2xl overflow-hidden">
                    <img 
                        src={loginBg} 
                        alt="College Library" 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Green overlay for branding */}
                    
                </div>
            </div>
        </div>
    );
};

export default LoginPage;