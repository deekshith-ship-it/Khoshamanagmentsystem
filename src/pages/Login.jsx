import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, ArrowRight, Loader2, MessageSquareCode } from 'lucide-react';
import { Card } from '../components/common';
import { authAPI } from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [loginType, setLoginType] = useState('email'); // 'email', 'phone'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        phone: '',
        otp: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            navigate('/');
        } else if (token) {
            // Token exists but user data is missing/corrupted - clear it
            localStorage.removeItem('token');
        }
    }, [navigate]);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await authAPI.login({ email: formData.email, password: formData.password });
            localStorage.setItem('token', response.token || 'active');
            localStorage.setItem('user', JSON.stringify(response.user));
            if (response.sessionId) localStorage.setItem('sessionId', response.sessionId);
            localStorage.setItem('team_session_start', Date.now().toString());
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        setError('');
        setLoading(true);
        try {
            await authAPI.sendOtp(formData.phone);
            setOtpSent(true);
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await authAPI.login({ phone: formData.phone, otp: formData.otp });
            localStorage.setItem('token', response.token || 'active');
            localStorage.setItem('user', JSON.stringify(response.user));
            if (response.sessionId) localStorage.setItem('sessionId', response.sessionId);
            localStorage.setItem('team_session_start', Date.now().toString());
            navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] dark:bg-[#0B0F1A] flex items-center justify-center p-4">
            {/* Ambient background glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[800px] h-[800px] rounded-full bg-primary-500/[0.03] blur-[120px] -top-[400px] -right-[200px]"></div>
                <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/[0.03] blur-[100px] -bottom-[300px] -left-[200px]"></div>
            </div>

            <div className="w-full max-w-[400px] relative animate-enter">
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <img
                        src="/khosha-logo.png"
                        alt="Khosha Systems"
                        className="h-16 mx-auto mb-6 object-contain"
                    />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome Back</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Sign in to your dashboard</p>
                </div>

                <Card className="p-8 !rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
                    {/* Login Type Tabs */}
                    <div className="flex bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 mb-8">
                        <button
                            onClick={() => { setLoginType('email'); setError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${loginType === 'email'
                                ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Mail size={14} />
                            Email
                        </button>
                        <button
                            onClick={() => { setLoginType('phone'); setError(''); setOtpSent(false); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${loginType === 'phone'
                                ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Phone size={14} />
                            Phone
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/20 text-center font-medium">
                            {error}
                        </div>
                    )}

                    {/* Email Login Form */}
                    {loginType === 'email' && (
                        <form onSubmit={handleEmailLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input pl-10"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="input pl-10"
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full py-3 text-sm uppercase tracking-wider font-bold mt-2"
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={16} className="ml-2" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Phone Login Form */}
                    {loginType === 'phone' && (
                        <form onSubmit={handlePhoneLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input pl-10"
                                        placeholder="+91 XXXXX XXXXX"
                                        disabled={otpSent}
                                    />
                                </div>
                            </div>

                            {!otpSent ? (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={loading || !formData.phone}
                                    className="btn btn-primary w-full py-3 text-sm uppercase tracking-wider font-bold"
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <MessageSquareCode size={16} className="mr-2" />
                                            Send OTP
                                        </>
                                    )}
                                </button>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                            Enter OTP
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            required
                                            value={formData.otp}
                                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                            className="input text-center tracking-[0.5em] text-lg font-bold"
                                            placeholder="• • • • • •"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary w-full py-3 text-sm uppercase tracking-wider font-bold"
                                    >
                                        {loading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                Verify & Sign In
                                                <ArrowRight size={16} className="ml-2" />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOtpSent(false)}
                                        className="w-full text-center text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-medium"
                                    >
                                        ← Change Number
                                    </button>
                                </>
                            )}
                        </form>
                    )}
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6 font-medium">
                    Powered by <span className="font-bold text-gray-500 dark:text-gray-400">Khosha Systems</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
