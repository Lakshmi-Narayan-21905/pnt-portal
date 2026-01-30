import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
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
    const [isResetting, setIsResetting] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [localError, setLocalError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { userProfile, error: authError } = useAuth();

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
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error("Login Error:", err);
            setLocalError('Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setResetMessage('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetMessage('Password reset link sent! Check your email.');
            // Optional: Switch back to login after items
        } catch (err: any) {
            console.error("Reset Error:", err);
            setLocalError('Failed to send reset email. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-300 overflow-hidden p-4">
            <div className="flex w-full max-w-5xl h-[85vh] max-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white relative overflow-y-auto">
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #059669 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                    <div className="w-full max-w-sm relative z-10">
                        {/* Logo */}
                        <div className="flex justify-center mb-6 -mt-12">
                            <img
                                src={logo}
                                alt="Kongu Engineering College"
                                className="h-28 object-contain"
                            />
                        </div>

                        {/* Header */}
                        <div className="text-center mb-5">
                            <h1 className="text-xl font-bold text-slate-900 mb-1">
                                {isResetting ? 'Reset Password' : 'Get Started with your Placements'}
                            </h1>
                            <p className="text-slate-500 text-xs">
                                {isResetting ? 'Enter your email to receive a reset link' : 'Sign in to your account to continue'}
                            </p>
                        </div>

                        {/* Messages */}
                        {displayError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mb-4 text-xs">
                                {displayError}
                            </div>
                        )}
                        {resetMessage && (
                            <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-lg mb-4 text-xs">
                                {resetMessage}
                            </div>
                        )}

                        {isResetting ? (
                            /* Reset Password Form */
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="group">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none"
                                        placeholder="mail@example.com"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 transition-all shadow-md disabled:opacity-70"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResetting(false);
                                        setLocalError('');
                                        setResetMessage('');
                                    }}
                                    className="w-full text-xs text-slate-500 hover:text-slate-700 font-medium"
                                >
                                    Back to Login
                                </button>
                            </form>
                        ) : (
                            /* Login Form */
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
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsResetting(true);
                                            setLocalError('');
                                            setResetEmail(email); // Pre-fill if they started typing
                                        }}
                                        className="text-xs text-primary-600 hover:text-primary-700 font-medium underline underline-offset-4 decoration-primary-300 hover:decoration-primary-500 transition-all duration-200"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </form>
                        )}
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