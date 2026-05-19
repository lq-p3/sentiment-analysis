/**
 * Security & Authentication Context Manager (AuthContext.tsx)
 * 
 * This file serves as the centralized state manager for user authentication across the entire frontend ecosystem.
 * It implements a Provider pattern to globally broadcast the user's active session, login/registration methods,
 * and seamlessly handles JSON Web Token (JWT) persistence using the browser's LocalStorage API.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

/**
 * Interface definition dictating the exact blueprint of the Authentication Context bubble.
 * Any component subscribing to this context will have access to these specific variables and functions.
 */
interface AuthContextType {
    user: User | null; // Represents the currently authenticated user mapping, or null if a guest.
    login: (email: string, password: string) => Promise<void>; 
    register: (user: Omit<User, 'id'>) => Promise<void>;
    resetPassword: (email: string, newPassword: string) => Promise<void>;
    checkEmail: (email: string) => Promise<boolean>;
    verifyOtp: (email: string, code: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean; // Indicates active background network resolution (e.g., verifying tokens) to prevent race conditions.
}

// Initialize the Context. It remains 'undefined' until wrapped by the AuthProvider higher-order component.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Core absolute endpoint pointing to the C# ASP.NET Authentication Controller API.
const API_URL = 'http://localhost:5165/api/auth';

/**
 * Authentication Provider Component
 * The master wrapper component. It encapsulates the core security logic and wraps its children
 * (the entire React Router DOM) to inject the global authentication properties without prop-drilling.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Local State Initialization
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Initial Mount Lifecycle Hook (Auto-Login verification)
     * Upon the application booting, this effect probes the browser's LocalStorage for a residual JWT token.
     * If found, it pings the backend '/me' endpoint to cryptographically verify its validity.
     */
    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Inject Bearer token inside the HTTP Headers to pass backend middleware authorization
                    const response = await fetch(`${API_URL}/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        // Token is valid; hydrate the application state with the user's privileged identity
                        const userData = await response.json();
                        setUser(userData);
                    } else {
                        // Token expired or blacklisted; forcibly purge it from browser memory
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Failed to fetch user", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            // Release the UI lock whether the check succeeded, failed, or bypassed.
            setIsLoading(false);
        };
        checkUser();
    }, []);

    /**
     * Login Protocol Execution Endpoint
     * Transmits raw credentials to the C# backend, receives a signed JWT token, stores it client-side,
     * and subsequently performs a secondary fetch to strictly populate the localized user profile state.
     */
    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Invalid email or password');
            }

            const { token } = await response.json();
            
            // Securely persist the JWT token inside HTML5 LocalStorage for future authenticated sessions
            localStorage.setItem('token', token);

            // Directly query the newly granted credentials to instantiate the frontend identity layer
            const userResponse = await fetch(`${API_URL}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData);
            }
        } catch (error) {
            throw error; // Bubble error upstream to inherently trigger UI error feedback (e.g. LoginPage banners)
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Registration Protocol Execution Endpoint
     * Constructs a new user envelope, shoots a POST request for database storage,
     * and sequentially fires the `login` function to automatically onboard the user without requiring a manual re-login.
     */
    const register = async (newUser: Omit<User, 'id'>) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Registration failed');
            }

            // Immediately automate login upon successful registration completion
            await login(newUser.email, newUser.password);

        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Account Recovery / Password Reset Execution Endpoint
     * Interfaces strictly with the stateless backend reset endpoints.
     */
    const resetPassword = async (email: string, newPassword: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to reset password');
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Check Email Endpoint
     * Checks if the email exists in the database for password reset flow.
     */
    const checkEmail = async (email: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('البريد الإلكتروني غير مسجل لدينا');
                }
                throw new Error('حدث خطأ أثناء التحقق من البريد الإلكتروني');
            }
            return true;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Verify OTP Endpoint
     */
    const verifyOtp = async (email: string, code: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            if (!response.ok) {
                throw new Error('رمز التحقق غير صحيح أو منتهي الصلاحية');
            }
            return true;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Session Termination Endpoint
     * Purges the local React object state tracking the active user identity
     * and absolutely destroys the underlying JWT payload stored locally to sever system access.
     */
    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        // Broadcast all aggregated internal functions and states through the overarching Provider pipeline
        <AuthContext.Provider value={{ user, login, register, resetPassword, checkEmail, verifyOtp, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Primary Custom Abstraction Hook (`useAuth`)
 * Developers should import this hook into standard functional components rather than referencing the context directly.
 * Automatically enforces safe boundaries, ensuring that context properties are only queried from deep within the tree hierarchy.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be explicitly invoked from within an active <AuthProvider> DOM block.');
    }
    return context;
};
