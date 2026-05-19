/**
 * Main Application File (App.tsx)
 * 
 * This file contains the entire Frontend ecosystem of the Smart Tourism Sentiment Analyzer.
 * It is structured into multiple functional sections:
 * 1. Type Definitions & Imports
 * 2. Reusable UI Components (Navbar, Sidebar, Cards, Buttons)
 * 3. Data Visualization Components (Recharts & D3)
 * 4. Application Pages (Login, Dashboard, Reports, Analysis Input)
 * 5. Routing & Context Providers wrapper (Bottom of the file)
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useLocation, useParams } from 'react-router-dom'; // Routing library for SPA (Single Page Application) navigation
import { generateReport, getReports, getLatestReport, getReportById, type ReportSummary, type ReportDetail } from './src/services/reportApi'; // Backend API Services
import {
  User, Lock, Mail, Eye, ArrowRight, MapPin,
  Search, FileText, Download, RefreshCw,
  Smile, Frown, Meh, Twitter, Map as MapIcon,
  LayoutDashboard, Info, LogOut, BarChart3, Languages, ShieldCheck, Navigation
} from 'lucide-react'; // Vector icon library (Lucide)
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'; // Charting Library for Sentiment visualization
import * as d3 from 'd3'; // D3 Object for generating Word Cloud mathematics and positioning
import { LanguageProvider, useLanguage } from './src/context/LanguageContext'; // React Context for Bilingual State
import { AuthProvider, useAuth } from './src/context/AuthContext'; // React Context for User Authentication State
import { LanguageSwitcher } from './src/components/LanguageSwitcher';
import { ReportAIChat } from './src/components/ReportAIChat';
import Settings from './src/pages/Settings';
// ======================================================================
// 1. TYPE DEFINITIONS & IMPORTS
// ======================================================================

import {
  Sentiment,
  Review,
  AnalysisStats,
  WordFreq,
  CityAnalysisData
} from './src/types';

// ======================================================================
// 2. REUSABLE UI COMPONENTS (Design System)
// ======================================================================

/**
 * Button Component (exportable)
 * Defines standard button appearances across the app to ensure consistency.
 * 
 * @param variant - Changes the visual style (primary | secondary | outline | ghost)
 * @param className - Allows overriding or adding specific Tailwind utility classes
 */
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }> = ({
  children, variant = 'primary', className = '', ...props
}) => {
  // Base styling common to all button variants (padding, fonts, transitions)
  const base = "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // Specific style configurations based on the chosen variant
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg",
    secondary: "bg-accent text-primary hover:bg-accent/90 shadow-sm",
    outline: "border-2 border-primary text-primary hover:bg-primary/5",
    ghost: "text-textMain hover:bg-gray-100"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

/**
 * Input Field Component (exportable)
 * Reusable text input field with optional floating labels and integrated icons.
 * Commonly used in Authentication forms and the City Input page.
 * 
 * @param label - Floating text label above the input
 * @param icon - Lucide React component to display as a visual hint inside the input box
 */
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: React.ReactNode }> = ({
  label, icon, className = '', ...props
}) => (
  // space-y-1.5 adds vertical spacing between the label and the input field
  <div className="w-full space-y-1.5">
    {label && <label className="text-sm font-bold text-primary block">{label}</label>}
    <div className="relative">
      {/* Absolute positioning to place the icon on the far right (or left depending on RTL/LTR) inside the input */}
      {icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        // Input styling handles focus states, rounded corners, borders, and conditional padding (pr-10) if an icon is present
        className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-textMain placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${icon ? 'pr-10' : ''} ${className}`}
        {...props}
      />
    </div>
  </div>
);

/**
 * Card Container Component (exportable)
 * Used to wrap dashboard elements (like charts or statistics) inside clean, white boxes with soft shadows.
 * 
 * @param title - Optional header text for the top of the card
 */
export const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string }> = ({
  children, className = '', title
}) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {title && <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-gray-50">{title}</h3>}
    {children}
  </div>
);

/**
 * Top Navigation Bar (Navbar) Component
 * Remains sticky at the top of the screen in authenticated routes.
 * Contains the Project Logo, Title, Bilingual Switcher, User Initial Avatar, and Logout action.
 */
export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  // Fetch translation function (t) and layout direction (ltr/rtl) from global Language Context
  const { t, direction } = useLanguage();
  // Fetch current user details and logout functionality from global Auth Context
  const { user, logout } = useAuth();

  // Handle termination of session
  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to Login page after clearing context
  };

  return (
    // "sticky top-0 z-50" keeps it fixed during scrolling. "no-print" hides it when hitting Cmd+P (printing the report).
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print" dir={direction}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Left Side: Logo and Application Title */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg border border-gray-100">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-primary leading-tight">{t('appTitle')}</h1>
            <p className="text-xs text-gray-500">{t('appSubtitle')}</p>
          </div>
        </div>

        {/* Right Side: Language Toggle, User Info, and Actions */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {/* User Profile Info Section */}
          <div className={`flex items-center gap-2 ${direction === 'rtl' ? 'pl-4 border-l' : 'pr-4 border-r'} border-gray-200`}>
            {/* Avatar Circle - Displays the first character of the First Name */}
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-primary font-bold text-sm">
              {user ? user.firstName.charAt(0).toUpperCase() : 'G'}
            </div>

            {/* User Name & Role Label (Hidden on small mobile screens) */}
            <div className="hidden md:block">
              <span className="block text-sm font-medium text-textMain">{user ? `${user.firstName} ${user.lastName}` : 'Guest'}</span>
              {user?.role === 'admin' && <span className="block text-xs text-secondary">{t('adminUser')}</span>}
            </div>
          </div>

          {/* Logout Button */}
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title={t('logout')}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * Sidebar Navigation Component
 * A vertical navigation list displayed on the side of the Dashboard layout.
 * Hidden on mobile screens ("hidden lg:block").
 * 
 * @param activePath - The current browser URL path (used to highlight the active menu item)
 */
export const Sidebar: React.FC<{ activePath: string }> = ({ activePath }) => {
  const { t, direction } = useLanguage();

  // Define menu routes dynamically to support translated titles (t('...'))
  const menuItems = [
    { path: '/dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/city-input', label: t('newAnalysis'), icon: <MapPin className="w-5 h-5" /> },
    { path: '/report', label: t('reports'), icon: <FileText className="w-5 h-5" /> },
    { path: '/about', label: t('about'), icon: <Info className="w-5 h-5" /> },
  ];

  return (
    // Dynamic border positioning depending on RTL/LTR layout direction
    <aside className={`hidden lg:block w-64 bg-white ${direction === 'rtl' ? 'border-l left-0' : 'border-r right-unset'} border-gray-200 h-[calc(100vh-64px)] fixed ${direction === 'rtl' ? 'right-0' : 'left-0'} top-16 overflow-y-auto no-print`}>
      <div className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            // Add primary background styling if the user is currently on this specific route
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePath === item.path
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
              }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Support Advertisement Element at the bottom of the sidebar */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-xl text-white text-center">
          <p className="text-sm opacity-90 mb-2">{t('needHelp')}</p>
          <button className="bg-white/20 w-full py-1.5 rounded-lg text-xs font-bold hover:bg-white/30 transition-colors">
            {t('contactSupport')}
          </button>
        </div>
      </div>
    </aside>
  );
};

/**
 * General Layout Wrapper Component (DashboardLayout)
 * Encloses the authenticated internal pages dynamically.
 * Mounts the Navbar (Top) and Sidebar (Side), wrapping the specific page content inside a safe area.
 */
export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation(); // Re-render when URL path updates to highlight the correct sidebar item
  const { direction } = useLanguage();

  return (
    <div className="min-h-screen bg-bgLight flex flex-col" dir={direction}>
      {/* 1. Global Authenticated Navbar */}
      <Navbar />

      {/* 2. Main Flex Container */}
      <div className="flex flex-1 container mx-auto max-w-7xl">

        {/* 3. Global Sidebar Navigation */}
        <Sidebar activePath={location.pathname} />

        {/* 4. Dynamic Page Content Area - Automatically adjusts margin based on RTL/LTR to avoid overlapping sidebar */}
        <main className={`flex-1 ${direction === 'rtl' ? 'lg:mr-64' : 'lg:ml-64'} p-4 md:p-8 pb-20`}>
          {children}
        </main>
      </div>
    </div>
  );
};

// ======================================================================
// 3. DATA VISUALIZATION COMPONENTS (CHARTS & CLOUDS)
// ======================================================================

/**
 * Sentiment Classification Color Palette
 * Standardizes the colors used across all charts to represent sentiments.
 * These hex codes correspond to Tailwind classes used elsewhere to ensure a unified design language.
 */
const COLORS = {
  positive: '#4FB2A0', // Teal Green: Represents positive/favorable user sentiment
  neutral: '#F7C873',  // Gold/Yellow: Represents mixed or neutral sentiment
  negative: '#EF5350'  // Soft Red: Represents negative/critical user sentiment
};

// Constant for calculating circle math in Pie Chart labels
const RADIAN = Math.PI / 180;

/**
 * Custom Label Renderer for the Pie Chart
 * Calculates the exact X and Y coordinates to place percentage text directly on top of the pie slices.
 * It uses rudimentary trigonometry (Math.cos/sin) based on the slice's midAngle and radius.
 */
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
      {/* Convert raw decimal fraction (e.g., 0.45) to integer percentage string (45%) */}
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface SentimentChartProps {
  positive: number;
  neutral: number;
  negative: number;
}

/**
 * Sentiment Pie Chart Component
 * Wrapper around Recharts <PieChart> to visually distribute the counts of positive, neutral, and negative reviews.
 * Features a custom tooltip and responsive scaling.
 */
export const SentimentChart: React.FC<SentimentChartProps> = ({ positive, neutral, negative }) => {
  const { t } = useLanguage(); // Retrieve localized labels
  
  // Format the raw numerical arguments into the structured array required by Recharts
  const data = [
    { name: t('positiveLabel'), value: positive, color: COLORS.positive },
    { name: t('neutralLabel'), value: neutral, color: COLORS.neutral },
    { name: t('negativeLabel'), value: negative, color: COLORS.negative },
  ];

  return (
    // Responsive container ensures the chart resizes smoothly inside its parent Card
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" // Center X
            cy="50%" // Center Y
            labelLine={false} // Hide external pointer lines
            label={renderCustomizedLabel} // Use our custom internal label math
            outerRadius={80} // Size of the pie
            fill="#8884d8" // Fallback color
            dataKey="value" // Which property dicts the slice size
          >
            {/* Map each data entry to a specific color cell */}
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {/* Custom style for the hover tooltip popup */}
          <ReTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          {/* Display color legend at the bottom */}
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface FrequencyChartProps {
  data: WordFreq[];
}

/**
 * Keyword Frequency Bar Chart Component
 * Uses Recharts <BarChart> set to a horizontal layout to display the most commonly
 * occurring keywords extracted from the location's reviews.
 * 
 * @param data - Array containing words and their absolute occurrence frequencies.
 */
export const FrequencyChart: React.FC<FrequencyChartProps> = ({ data }) => {
  // Truncate the list to avoid overcrowding the visual space (Top 5 keywords only)
  const chartData = data.slice(0, 5);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* 'layout="vertical"' swaps the X and Y axes functionality */}
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          {/* Discrete dotted grid lines acting as visual guides */}
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
          
          {/* X axis represents the numerical frequency (hidden to reduce clutter) */}
          <XAxis type="number" hide />
          
          {/* Y axis represents the text categories (the actual words) */}
          <YAxis
            dataKey="text"
            type="category"
            width={80}
            tick={{ fill: '#3B4A54', fontSize: 12, fontWeight: 500 }}
          />
          <ReTooltip
            cursor={{ fill: '#f4f4f4' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          {/* Render individual bars with rounded corners, specifying fixed height */}
          <Bar dataKey="value" fill="#1C4966" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface WordCloudProps {
  words: WordFreq[];
}

/**
 * Descriptive Word Cloud Component
 * Uses a combination of D3.js (for calculating dynamic sizes and opacities based on frequency bounds)
 * and React (for rendering DOM spans). This simulates a tag cloud without heavy external canvas libraries.
 */
export const WordCloud: React.FC<WordCloudProps> = ({ words }) => {

  // useMemo ensures that D3 scales and heavy computations only re-run if the raw 'words' array actually changes.
  const cloudData = useMemo(() => {
    if (words.length === 0) return [];

    // Identify absolute bounds to establish a normalization ratio
    const maxVal = Math.max(...words.map(w => w.value));
    const minVal = Math.min(...words.map(w => w.value));

    // D3 Scale: Linearly maps a word's occurrence count between a constrained font size range.
    const fontSizeScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([14, 36]); // Output boundary: Smallest font = 14px, Largest font = 36px

    // D3 Scale: Linearly maps a word's occurrence count to opacity for visual depth simulation.
    const opacityScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([0.6, 1]); // Less frequent words fade out slightly

    // Static color loop list for varied text aesthetics
    const colors = ['#1C4966', '#4FB2A0', '#F7C873', '#E67E22', '#2980B9'];

    // Map raw keyword frequency array into presentation-ready DOM properties
    return words.map((w, i) => ({
      text: w.text,
      size: fontSizeScale(w.value),
      opacity: opacityScale(w.value),
      color: colors[i % colors.length], // Loop circularly through predefined palette
      rotate: i % 3 === 0 ? 0 : (i % 2 === 0 ? -5 : 5) // Inject slight randomized rotation angles for dynamic visual flow
    }));
  }, [words]);

  return (
    // Flexbox container simulating a randomized cloud environment
    <div className="h-64 w-full flex flex-wrap items-center justify-center gap-4 content-center overflow-hidden p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      {cloudData.map((word, idx) => (
        <span
          key={idx}
          // Dynamic inline styles derived from the D3 processing algorithms
          style={{
            fontSize: `${word.size}px`,
            color: word.color,
            opacity: word.opacity,
            transform: `rotate(${word.rotate}deg)`,
            transition: 'all 0.3s ease'
          }}
          className="font-bold cursor-default hover:scale-110 inline-block"
          title={`Frequency occurrences: ${words[idx].value}`} // Native HTML tooltip
        >
          {word.text}
        </span>
      ))}
    </div>
  );
};

// ======================================================================
// 4. APPLICATION PAGES (Routing Destinations)
// ======================================================================

/**
 * Login Page Component
 * Serves as the primary unauthenticated entry point to the application.
 * Manages user credentials input, interfaces with the global AuthContext,
 * and handles layout adjustments (RTL/LTR) gracefully using absolute decorative elements.
 */
const LoginPage = () => {
  const navigate = useNavigate(); // Hook to programmatically redirect users after success
  
  // Local Component State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Stores inline validation or authentication errors
  
  // Global Context Providers
  const { login } = useAuth();
  const { t, direction } = useLanguage();

  /**
   * Primary form submission handler
   * Captures the default submit event, attempts the async login protocol,
   * and subsequently routes the user to the starting page of the analysis flow.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // On success: redirect to OTP verification page
      navigate('/verify-otp');
    } catch (err) {
      // On failure: display generic security-safe error message
      setError('Invalid email or password');
    }
  };

  return (
    // 'min-h-screen' ensures the wrapper stretches across the entire viewport. 'relative overflow-hidden' encapsulates background decorations.
    <div className="min-h-screen flex items-center justify-center bg-bgLight p-4 relative overflow-hidden" dir={direction}>
      
      {/* Abstract background decorative elements (Orbs) positioned via absolute coordinates */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

      {/* Main interactive Login Card. 'z-10' elevates it above the blurred background orbs */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 relative z-10 border border-gray-100">
        
        {/* Header Section: Logo and dynamic localized text */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 p-2">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-primary">{t('welcomeBack')}</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Error notification banner - Conditional rendering based on 'error' state */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input relying on our previously defined generic Input component */}
          <Input
            type="email"
            label={t('email')}
            placeholder="example@mail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
          />
          
          {/* Password Input Block featuring absolute icon positioning adaptable to LTR/RTL layouts */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary block">{t('password')}</label>
            <div className="relative">
              <input
                type="password"
                placeholder="●●●●●●●●"
                // Dynamically assign padding left or right for text based on language direction
                className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${direction === 'rtl' ? 'pl-10' : 'pr-10'}`}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {/* Lock icon dynamically affixed to left or right bounds depending on language direction */}
              <Lock className={`absolute ${direction === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            </div>
          </div>

          {/* Form Actions (Remember me & Password recovery sequence) */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-gray-600">{t('rememberMe')}</span>
            </label>
            <Link to="/forgot-password" className="text-primary font-medium hover:underline">{t('forgotPassword')}</Link>
          </div>

          <Button type="submit" className="w-full h-12 text-lg">{t('loginButton')}</Button>
        </form>

        {/* Register router redirection */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">{t('noAccount')} </span>
          <Link to="/signup" className="text-secondary font-bold hover:underline">{t('createAccount')}</Link>
        </div>

        {/* Footer legal branding */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('copyright')}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Sign Up Page Component
 * Allows new users to create an account in the system.
 * Connects to the global authentication context to register users and direct them to the city input dashboard upon success.
 */
const SignupPage = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage(); // LTR/RTL translation engine
  
  // Local state for registering new profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { register } = useAuth(); // Global registration abstraction

  /**
   * Action dispatcher for submitting the signup form.
   * Hardcodes the new user base 'role' to 'user' to prevent privilege escalation via frontend API spoofing.
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ firstName, lastName, email, password, role: 'user' });
      navigate('/verify-otp'); // Redirect upon successful local registration creation
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight p-4" dir={direction}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary">{t('createAccountTitle')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('createAccountSubtitle')}</p>
        </div>

        {/* Validation banner block */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>
          {/* Side-by-side First and Last name inputs using Flexbox */}
          <div className="flex gap-4">
            <Input
              label={t('firstName')}
              placeholder={t('firstName')}
              icon={<User className="w-5 h-5" />}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
            />
            <Input
              label={t('lastName')}
              placeholder={t('lastName')}
              icon={<User className="w-5 h-5" />}
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
            />
          </div>
          <Input
            label={t('email')}
            type="email"
            placeholder="name@example.com"
            icon={<Mail className="w-5 h-5" />}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label={t('password')}
            type="password"
            placeholder="●●●●●●●●"
            icon={<Lock className="w-5 h-5" />}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {/* User Type selection dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary block">{t('userType')}</label>
            <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="user">{t('user')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>

          <Button type="submit" className="w-full mt-4">{t('createAccountButton')}</Button>
        </form>

        {/* Return to login routing */}
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-500">{t('haveAccount')} </span>
          <Link to="/" className="text-secondary font-bold hover:underline">{t('login')}</Link>
        </div>
      </div>
    </div>
  );
};

/**
 * Forgot Password Page Component
 * Multi-step utility page allowing users to reset their lost passwords.
 * Step 1: Verify Email exists
 * Step 2: Input OTP
 * Step 3: Input New Password
 */
const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const { resetPassword, checkEmail, verifyOtp, isLoading } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await checkEmail(email);
      setMessage({ text: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني', type: 'success' });
      setStep(2);
    } catch (error: any) {
      setMessage({ text: error.message || 'Error checking email', type: 'error' });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setMessage({ text: 'الرمز غير صحيح أو ناقص', type: 'error' });
      return;
    }
    
    try {
      await verifyOtp(email, code);
      setMessage({ text: 'تم التحقق بنجاح. أدخل كلمة المرور الجديدة.', type: 'success' });
      setStep(3);
    } catch (error: any) {
      setMessage({ text: error.message || 'رمز التحقق غير صحيح', type: 'error' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await resetPassword(email, newPassword);
      setMessage({ text: t('passwordResetSuccess') || 'تم إعادة تعيين كلمة المرور بنجاح!', type: 'success' });
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      setMessage({ text: error.message || 'Error executing reset', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight p-4" dir={direction}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">{t('forgotPassword')}</h2>
        <p className="text-gray-500 text-sm mb-6">
          {step === 1 ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز التحقق.' :
           step === 2 ? 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك.' :
           'أدخل كلمة المرور الجديدة لحسابك.'}
        </p>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${message.type === 'success' ? 'bg-green-50 text-green-600' : message.type === 'info' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
            {message.text}
          </div>
        )}

        {step === 1 && (
          <form className="space-y-4" onSubmit={handleCheckEmail}>
            <Input
              label={t('email')}
              type="email"
              placeholder="example@mail.com"
              icon={<Mail className="w-5 h-5" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '...' : 'التحقق من البريد'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="flex justify-center gap-2 mb-4" dir="ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.length > 1) return;
                    if (val && !/^\d$/.test(val)) return;
                    const newOtp = [...otp];
                    newOtp[index] = val;
                    setOtp(newOtp);
                    if (val && index < 5) inputRefs.current[index + 1]?.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[index] && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
              ))}
            </div>
            <Button type="submit" className="w-full">
              تأكيد الرمز
            </Button>
          </form>
        )}

        {step === 3 && (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <Input
              label={t('newPassword')}
              type="password"
              placeholder="●●●●●●●●"
              icon={<Lock className="w-5 h-5" />}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '...' : t('resetPasswordButton')}
            </Button>
          </form>
        )}

        <Link to="/" className="block mt-6 text-sm text-gray-500 hover:text-primary flex items-center justify-center gap-2">
          {direction === 'rtl' ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 mr-2 rotate-180" />}
          {t('login')}
        </Link>
      </div>
    </div>
  );
};

/**
 * OTP Verification Page Component
 * Displays a 6-digit code input interface for identity verification.
 * Appears after successful login or registration as a security checkpoint.
 * Features auto-focus navigation between digit fields and a countdown-based resend mechanism.
 */
const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  const { user, verifyOtp } = useAuth();

  // 6-digit OTP state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Create refs for each input field to enable auto-focus navigation
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend functionality
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  /**
   * Handles digit input in each OTP field.
   * Automatically advances focus to the next field upon entry.
   */
  const handleChange = (index: number, value: string) => {
    // Only accept single digits
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handles keyboard navigation (Backspace, ArrowLeft, ArrowRight)
   * for seamless user interaction between digit fields.
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft') {
      const target = direction === 'rtl' ? index + 1 : index - 1;
      if (target >= 0 && target <= 5) inputRefs.current[target]?.focus();
    } else if (e.key === 'ArrowRight') {
      const target = direction === 'rtl' ? index - 1 : index + 1;
      if (target >= 0 && target <= 5) inputRefs.current[target]?.focus();
    }
  };

  /**
   * Handles paste events to auto-fill all 6 digits at once.
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  /**
   * Verify OTP action handler.
   */
  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError(t('otpInvalid'));
      return;
    }

    if (!user?.email) {
      setError('لا يوجد بريد إلكتروني مسجل. يرجى تسجيل الدخول مجدداً.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await verifyOtp(user.email, code);
      setSuccess(true);
      
      // Navigate to the main app after a brief success animation
      setTimeout(() => {
        navigate('/city-input');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Resend OTP countdown reset handler.
   */
  const handleResend = () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    setCountdown(60);
    setCanResend(false);
    setError('');
    inputRefs.current[0]?.focus();
  };

  // Mask the user's email for display (e.g., al***@mail.com)
  const maskedEmail = user?.email
    ? user.email.replace(/(.{2})(.*)(@.*)/, (_, start, middle, end) => start + '*'.repeat(Math.min(middle.length, 5)) + end)
    : 'user@example.com';

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight p-4 relative overflow-hidden" dir={direction}>
      {/* Background decorative orbs matching LoginPage style */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute top-[30%] left-[10%] w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>

      {/* Main OTP Card */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 relative z-10 border border-gray-100">
        
        {/* Header Section with animated shield icon */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 transition-all duration-500 ${
            success 
              ? 'bg-green-50 border-green-200 scale-110' 
              : 'bg-gradient-to-br from-primary/5 to-secondary/10'
          }`}>
            <ShieldCheck className={`w-10 h-10 transition-all duration-500 ${
              success ? 'text-green-500' : 'text-primary'
            }`} />
          </div>
          <h2 className="text-2xl font-bold text-primary">{success ? t('otpVerified') : t('otpTitle')}</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            {success ? '' : t('otpSubtitle')}
          </p>
          
          {/* Email indicator chip */}
          {!success && (
            <div className="mt-3 bg-primary/5 rounded-full px-4 py-1.5 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary" dir="ltr">{maskedEmail}</span>
            </div>
          )}
        </div>


        {/* Error banner */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Success animation overlay */}
        {success ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{t('otpSubtitle')}</p>
          </div>
        ) : (
          <>
            {/* 6-Digit OTP Input Grid */}
            <div className="flex justify-center gap-3 mb-8" dir="ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    digit 
                      ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10' 
                      : 'border-gray-200 bg-white text-textMain hover:border-gray-300'
                  } focus:border-primary focus:ring-2 focus:ring-primary/20 focus:scale-105`}
                  style={{ caretColor: '#1C4966' }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={isVerifying || otp.some(d => !d)}
              className={`w-full h-12 text-lg transition-all duration-300 ${
                otp.every(d => d) ? 'opacity-100 scale-100' : 'opacity-70'
              }`}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  {t('verifyButton')}
                </span>
              )}
            </Button>

            {/* Resend Section */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">{t('didntReceive')}</p>
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="text-secondary font-bold text-sm hover:underline transition-colors"
                >
                  {t('resendCode')}
                </button>
              ) : (
                <p className="text-xs text-gray-400">
                  {t('resendIn')} <span className="font-bold text-primary">{countdown}</span> {t('seconds')}
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('copyright')}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * City Input Page (New Analysis Flow)
 * This is the first authenticated view where users specify a location to be analyzed.
 * Triggers the heavy AI background process by calling the backend API.
 */
const CityInputPage = () => {
  // Local interaction state
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Controls the spinning "loading" state
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { t, language, direction } = useLanguage();

  /**
   * Primary Action: Generate Report
   * This sends an asynchronous request to the backend ML pipeline to scrape reviews
   * and analyze their sentiments. It blocks the UI until the server responds.
   */
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return; // Prevent empty local submissions
    
    setIsLoading(true); // Lock the form and show loading indicators
    setError('');

    try {
      // Calls the external report API service (FastAPI backend)
      const result = await generateReport({
        city,
        sources: ['GoogleMaps', 'X'], // Scrape sources
        dateFrom: '2026-02-01',
        dateTo: '2026-02-21',
        limit: 200 // Maximum reviews to scrape
      });
      // Redirect successfully analyzed data to its newly assigned UUID dashboard page
      navigate(`/dashboard/${result.id}`);
    } catch (err: any) {
      // Display human-readable error if ML server is offline or scraping fails
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsLoading(false); // Release UI lock
    }
  };

  return (
    // Wraps the page in the global Layout (Navbar + Sidebar)
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)]">
        {/* Main interactive Input Card. Includes subtle gradient background aesthetics */}
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 w-full max-w-3xl border border-gray-100 text-center relative overflow-hidden" dir={direction}>
          
          {/* Aesthetic top-bleed gradient */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            {/* Contextual top icon for visual hierarchy */}
            <div className="inline-flex items-center justify-center p-3 bg-secondary/10 rounded-2xl mb-6 text-secondary">
              <Search className="w-8 h-8" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">{t('analyzeReviews')}</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
              {t('analyzeSubtitle')}
            </p>

            {/* Error display banner */}
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
                {error}
              </div>
            )}

            {/* Analysis Initiation Form */}
            <form onSubmit={handleAnalyze} className={`space-y-6 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div>
                <Input
                  label={t('cityName')}
                  placeholder={t('cityPlaceholder')}
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  icon={<MapPin className="w-5 h-5" />}
                  className="text-lg py-4"
                  autoFocus
                />
              </div>

              {/* Inspirational Message Box / Info Callout */}
              <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/10 rounded-2xl p-6 text-center">
                {/* Simulated AI 'thinking' pulse dots */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-150"></div>
                </div>
                <p className="text-primary font-bold text-lg mb-2">
                  {t('discoverMessage')}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('analyzeMessage')}
                </p>
              </div>

              <div>
                {/* Submit button dynamically altering state based on background thread (isLoading) */}
                <Button
                  type="submit"
                  className="w-full py-4 text-lg font-bold shadow-lg shadow-primary/20"
                  disabled={isLoading || !city}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {direction === 'rtl' ? 'جارٍ التحليل...' : 'Analyzing...'}
                    </span>
                  ) : t('startAnalysis')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/**
 * Report JSON Parser Utility Function
 * Acts as a Data Transfer Object (DTO) mapper. Converts the raw stringified JSON
 * returned by the backend (and stored in SQLite) into strongly-typed CityAnalysisData
 * objects that the React components (Charts, Cards) can safely render.
 * 
 * @param reportJson - Raw text payload from the database
 * @returns CityAnalysisData object or null if parsing fails
 */
function parseReportJson(reportJson: string | null | undefined): CityAnalysisData | null {
  if (!reportJson) return null; // Abort if empty
  try {
    const data = JSON.parse(reportJson);
    
    // Safely destructure and map property trees to avoid fatal "undefined property" errors during UI render
    return {
      cityName: data.cityName || '',
      timestamp: data.timestamp || '',
      stats: {
        totalReviews: data.stats?.totalReviews || 0,
        positiveCount: data.stats?.positiveCount || 0,
        negativeCount: data.stats?.negativeCount || 0,
        neutralCount: data.stats?.neutralCount || 0,
        averageRating: data.stats?.averageRating || 0,
      },
      reviews: (data.reviews || []).map((r: any) => ({
        id: r.id || '',
        text: r.text || '',
        // Map raw string enumerations to strict TypeScript Enum instances
        sentiment: r.sentiment === 'Positive' ? Sentiment.POSITIVE : r.sentiment === 'Negative' ? Sentiment.NEGATIVE : Sentiment.NEUTRAL,
        source: r.source || '',
        date: r.date || '',
        author: r.author || '',
      })),
      topWords: (data.topWords || []).map((w: any) => ({ text: w.text, value: w.value })),
    };
  } catch {
    // Return null silently if JSON is corrupted rather than crashing the page
    return null;
  }
}

/**
 * Individual Review Item Component
 * Renders a single fetched review gracefully. It includes dynamic color-coded badges
 * for sentiment (Positive/Neutral/Negative) and embeds a bilingual translation feature.
 * 
 * @param review - The structured review object (text, sentiment, date, etc.)
 * @param t - Localization translation hook inject
 * @param direction - 'ltr' or 'rtl' to adjust layout direction
 */
const ReviewItem: React.FC<{ review: any, t: any, direction: string }> = ({ review, t, direction }) => {
  // State for managing inline translation feature
  const [translated, setTranslated] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);

  /**
   * Contacts external MyMemory API to translate reviews on-the-fly.
   * Auto-detects whether the review is English or Arabic, and intelligently selects the inverse target language.
   */
  const handleTranslate = async () => {
    // If translation is already cached, just toggle visibility
    if (translated) {
      setShowOriginal(!showOriginal);
      return;
    }

    setIsTranslating(true);
    try {
      // Determine the target language based on the presence of Arabic Unicode characters
      const containsArabic = /[\u0600-\u06FF]/.test(review.text);
      const targetLang = containsArabic ? 'en' : 'ar'; // Auto-invert logic

      const q = encodeURIComponent(review.text);
      // REST API call to translation service provider (Google Translate gtx)
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${q}`);
      const data = await res.json();

      if (Array.isArray(data) && data[0]) {
        const translatedText = data[0].map((x: any) => x[0]).join('');
        setTranslated(translatedText);
        setShowOriginal(false);
      } else {
        // Fallback or error if rate limited or invalid payload
        console.error("Translation API error:", data);
        setTranslated(t('translateText') + " (Error)");
      }
    } catch (e) {
      console.error(e);
      setTranslated(t('translateText') + " (Error)");
    } finally {
      setIsTranslating(false);
    }
  };

  // Determine which string version to output based on the toggle state
  const displayText = (!showOriginal && translated) ? translated : review.text;

  return (
    // Review card wrapper with subtle hover micro-interactions
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {/* Dynamic Sentiment Icon mapping based on ML prediction */}
          {review.sentiment === Sentiment.POSITIVE && <Smile className="w-4 h-4 text-green-500" />}
          {review.sentiment === Sentiment.NEGATIVE && <Frown className="w-4 h-4 text-red-500" />}
          {review.sentiment === Sentiment.NEUTRAL && <Meh className="w-4 h-4 text-yellow-500" />}
          
          {/* Color-coded sentiment badge */}
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${review.sentiment === Sentiment.POSITIVE ? 'bg-green-100 text-green-700' :
            review.sentiment === Sentiment.NEGATIVE ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
            {review.sentiment === Sentiment.POSITIVE ? t('positiveLabel') : (review.sentiment === Sentiment.NEGATIVE ? t('negativeLabel') : t('neutralLabel'))}
          </span>
        </div>
        <span className="text-xs text-gray-400">{review.date || ''}</span>
      </div>
      
      {/* Review Body */}
      <p className="text-sm text-textMain leading-relaxed mb-3">
        "{displayText}"
      </p>
      
      {/* Review Footer metadata (Source Tag & Translation Action) */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {review.source?.includes('Google') ? <MapIcon className="w-3 h-3" /> : <Twitter className="w-3 h-3" />}
          {review.source}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="no-print text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
            title={t('translateText')}
          >
            {isTranslating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
            {isTranslating ? t('translating') : (translated && !showOriginal ? t('showOriginal') : t('translateText'))}
          </button>
          <span className="text-xs font-medium text-primary">{review.author}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard Page Component
 * Acts as the primary visual hub for viewing sentiment analysis output.
 * Fetches either the 'latest' report or a specific UUID report from the SQLite database
 * via the backend API API layer, and displays it using the localized Chart and Review block components.
 */
const DashboardPage = () => {
  // Extract Optional Route Parameter (UUID of a previously executed report)
  const { id } = useParams<{ id?: string }>();
  
  // Dashboard Core State Management
  const [analysisData, setAnalysisData] = useState<CityAnalysisData | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Review filtering state (Default showcases all retrieved sentiments)
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  
  const { t, direction } = useLanguage();
  const navigate = useNavigate();

  /**
   * Component mount initializer
   * Attempts to retrieve report schema data and pass it through the mapping utility.
   */
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        let report: ReportDetail | null = null;
        if (id) {
          // If navigated from history list, fetch explicit report ID
          report = await getReportById(id);
        } else {
          // If naturally logged in, automatically load the most recent analysis
          report = await getLatestReport();
        }
        
        // Hydrate the visual components by parsing the backend JSON Blob into typescript objects
        if (report) {
          setReportId(report.id);
          setAnalysisData(parseReportJson(report.reportJson));
        }
      } catch {
        // Silently catch exceptions; UI handles null analysisData state natively below
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  // View state 1: Awaiting network resolution
  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center mt-20">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">{direction === 'rtl' ? 'جارٍ التحميل...' : 'Loading...'}</p>
        </div>
      </DashboardLayout>
    );
  }

  // View state 2: Blank slate / Failed to locate report
  if (!analysisData) {
    return (
      <DashboardLayout>
        <div className="text-center mt-20">
          <h3 className="text-xl font-bold text-gray-400">{t('noData')}</h3>
          <Button variant="outline" onClick={() => navigate('/city-input')} className="mt-4 mx-auto">
            {t('startNewAnalysis')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Pure function deriving local filtered array based on active toggle states mapping
  const filteredReviews = analysisData.reviews.filter(r =>
    filterSentiment === 'all' || r.sentiment === filterSentiment
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={direction}>
        {/* Header Informational Block - City name context & timestamp */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              {t('analysisResults')}: <span className="text-accent">{analysisData.cityName}</span>
            </h2>
            <p className="text-gray-500 text-sm">{t('lastUpdate')}: {analysisData.timestamp}</p>
          </div>
          
          {/* Quick Action Navigation Strip */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/city-input')}>
              <RefreshCw className="w-4 h-4" /> {t('newAnalysis')}
            </Button>
            <Button variant="primary" onClick={() => navigate(reportId ? `/report/${reportId}` : '/report')}>
              <FileText className="w-4 h-4" /> {t('createPDF')}
            </Button>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(analysisData.cityName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-secondary text-white hover:bg-secondary/90 shadow-sm hover:shadow-lg"
            >
              <Navigation className="w-4 h-4" /> {t('navigateToDestination')}
            </a>
          </div>
        </div>

        {/* Global Statistics Summary Row (4 Dynamic Statistic Modules) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-primary"><FileText /></div>
            <div>
              <p className="text-xs text-gray-500">{t('totalReviews')}</p>
              <p className="text-2xl font-bold text-primary">{analysisData.stats.totalReviews}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-full text-green-600"><Smile /></div>
            <div>
              <p className="text-xs text-gray-500">{t('positive')}</p>
              <p className="text-2xl font-bold text-green-600">{analysisData.stats.positiveCount}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-full text-red-500"><Frown /></div>
            <div>
              <p className="text-xs text-gray-500">{t('negative')}</p>
              <p className="text-2xl font-bold text-red-500">{analysisData.stats.negativeCount}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="bg-yellow-50 p-3 rounded-full text-yellow-600"><Meh /></div>
            <div>
              <p className="text-xs text-gray-500">{t('neutral')}</p>
              <p className="text-2xl font-bold text-yellow-600">{analysisData.stats.neutralCount}</p>
            </div>
          </Card>
        </div>

        {/* Primary Data Visualization Row: Pie Chart AND D3 Tag Cloud */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card title={t('sentimentDistribution')} className="md:col-span-1">
            <SentimentChart
              positive={analysisData.stats.positiveCount}
              neutral={analysisData.stats.neutralCount}
              negative={analysisData.stats.negativeCount}
            />
          </Card>
          <Card title={t('wordCloud')} className="md:col-span-2">
            <WordCloud words={analysisData.topWords} />
          </Card>
        </div>

        {/* Secondary Data Visualization Row: Frequency Bar Chart AND Scrolling Reviews List */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card title={t('topTopics')} className="md:col-span-1 h-fit">
            <FrequencyChart data={analysisData.topWords} />
          </Card>

          <Card title={t('reviewDetails')} className="md:col-span-2">
            {/* Inline Micro-filtering navigation for parsed reviews */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['all', Sentiment.POSITIVE, Sentiment.NEGATIVE, Sentiment.NEUTRAL].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterSentiment(type)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterSentiment === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {type === 'all' ? t('filterAll') : (type === Sentiment.POSITIVE ? t('filterPositive') : (type === Sentiment.NEGATIVE ? t('filterNegative') : t('filterNeutral')))}
                </button>
              ))}
            </div>

            {/* Vertically bounded viewport for Review Block Maps applying custom CSS scrollbars */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredReviews.map(review => (
                <ReviewItem key={review.id} review={review} t={t} direction={direction} />
              ))}
            </div>
          </Card>
        </div>

        {/* Embedded Google Maps - Destination Location Card */}
        <Card title={t('destinationLocation')} className="mt-6">
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <iframe
              title={`${analysisData.cityName} - Google Maps`}
              width="100%"
              height="350"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(analysisData.cityName + ' Saudi Arabia')}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-secondary" />
              <span>{analysisData.cityName}</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(analysisData.cityName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-secondary font-medium hover:underline flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              {t('openInGoogleMaps')}
            </a>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

/**
 * PDF Reports Generation Component
 * Allows users to view historical analyses side-by-side with generating physical or PDF printouts
 * of the currently active sentiment report. Hides browser-wrapper elements dynamically using CSS standard media queries.
 */
const ReportPage = () => {
  const { id } = useParams<{ id?: string }>();
  
  // High-level State Aggregators
  const [analysisData, setAnalysisData] = useState<CityAnalysisData | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { t, direction } = useLanguage();

  /**
   * Complex Data Aggregation Effect
   * Parallelizes querying general report history (Left Sidebar) while targeting specific report data (Right Context Frame).
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch up to the 20 most recent analysis requests associated with this account
        const history = await getReports(20);
        setReportHistory(history);

        // Fetch precise reporting block mapped to the route address parameter, falling back to index latest
        let report: ReportDetail | null = null;
        if (id) {
          report = await getReportById(id);
        } else {
          report = await getLatestReport();
        }
        if (report) {
          setReportId(report.id);
          setAnalysisData(parseReportJson(report.reportJson));
        }
      } catch {
        // Suppress rendering fails natively and fallback to standard interface constraints
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Simply use the flat report history without region grouping
  // We sort it by date descending to show the newest first
  const sortedReports = useMemo(() => {
    return [...reportHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reportHistory]);



  // View state 1: Processing
  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center mt-20">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">{direction === 'rtl' ? 'جارٍ التحميل...' : 'Loading...'}</p>
        </div>
      </DashboardLayout>
    );
  }

  // View state 2: No historical architecture initialized
  if (!analysisData) {
    return (
      <DashboardLayout>
        <div className="text-center mt-20">
          <h3 className="text-xl font-bold text-gray-400">{t('noReportData')}</h3>
          <p className="text-gray-500 mt-2">{t('mustAnalyzeFirst')}</p>
          <Button variant="outline" onClick={() => navigate('/city-input')} className="mt-4 mx-auto">
            {t('startNewAnalysis')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  /**
   * Action trigger invoking the native OS dialogue box targeting .no-print tagged blocks for aesthetic exclusion.
   */
  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="flex gap-6" dir={direction}>
        
        {/* Historical Reports Sidebar Panel - Flat List */}
        <div className="hidden md:block w-80 flex-shrink-0 no-print">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-20 overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-4 pb-3 border-b border-gray-100 bg-gradient-to-b from-primary/[0.03] to-transparent">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {direction === 'rtl' ? 'التقارير السابقة' : 'Report History'}
                </h3>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-full">
                  {sortedReports.length}
                </span>
              </div>
            </div>
            
            {/* Scrollable list content */}
            <div className="p-3 space-y-2 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {sortedReports.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">
                    {direction === 'rtl' ? 'لا توجد تقارير سابقة' : 'No previous reports'}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    {direction === 'rtl' ? 'ابدأ بتحليل وجهة سياحية' : 'Start by analyzing a destination'}
                  </p>
                </div>
              )}
              
              {sortedReports.map((r) => {
                const isActive = reportId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/report/${r.id}`)}
                    className={`w-full text-left transition-all duration-200 border rounded-xl p-3 ${
                      isActive 
                        ? 'bg-primary/5 border-primary/20 shadow-sm' 
                        : 'bg-white border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex items-center gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-primary/10' : 'bg-gray-50'
                      }`}>
                        <MapPin className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      </div>
                      
                      <div className={`flex-1 min-w-0 text-${direction === 'rtl' ? 'right' : 'left'}`}>
                        <h4 className={`font-bold text-sm truncate ${isActive ? 'text-primary' : 'text-gray-800'}`}>
                          {r.city}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-1">
                            <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold border border-green-100/50">+{r.positiveCount}</span>
                            <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold border border-red-100/50">-{r.negativeCount}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Printable Context Wrapper */}
        <div className="flex-1 max-w-4xl">
          {/* Document metadata controls (Excluded from PDF output) */}
          <div className="flex justify-between items-center mb-8 no-print">
            <Button variant="outline" onClick={() => navigate(reportId ? `/dashboard/${reportId}` : '/dashboard')}>{t('backToDashboard')}</Button>
            <Button variant="primary" onClick={handlePrint}>
              <Download className="w-4 h-4" /> {t('downloadReport')}
            </Button>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(analysisData.cityName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-secondary text-white hover:bg-secondary/90 shadow-sm hover:shadow-lg"
            >
              <Navigation className="w-4 h-4" /> {t('navigateToDestination')}
            </a>
          </div>

          {/* Central Report Document. Custom 'print:shadow-none print:w-full' CSS ensures a clean output when exporting to PDF. */}
          <div className="bg-white p-10 shadow-lg rounded-none print:shadow-none print:w-full" id="report-content">
            
            {/* Standardized academic header template */}
            <div className="border-b-4 border-primary pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-primary">{t('reportTitle')}</h1>
                <p className="text-gray-500 mt-2">Smart Tourism Sentiment Analyzer Report</p>
              </div>
              <div className={`text-${direction === 'rtl' ? 'left' : 'right'}`}>
                <p className="text-sm font-bold text-textMain">{t('cityName')}: {analysisData.cityName}</p>
                <p className="text-sm text-gray-500">{t('lastUpdate')}: {analysisData.timestamp}</p>
              </div>
            </div>

            <ReportAIChat reportData={analysisData} direction={direction} />

            {/* Top-Level Summary Analytics Block */}
            <div className="mb-8">
              <h3 className={`text-lg font-bold text-primary mb-4 bg-gray-50 p-2 rounded ${direction === 'rtl' ? 'border-r-4' : 'border-l-4'} border-accent`}>{t('analysisSummary')}</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                  <span className="block text-2xl font-bold text-primary">{analysisData.stats.totalReviews}</span>
                  <span className="text-xs text-gray-500">{t('reviews')}</span>
                </div>
                <div className="p-4 border rounded-lg bg-green-50/50 border-green-100">
                  <span className="block text-2xl font-bold text-green-600">{analysisData.stats.positiveCount}</span>
                  <span className="text-xs text-gray-500">{t('positive')}</span>
                </div>
                <div className="p-4 border rounded-lg bg-red-50/50 border-red-100">
                  <span className="block text-2xl font-bold text-red-500">{analysisData.stats.negativeCount}</span>
                  <span className="text-xs text-gray-500">{t('negative')}</span>
                </div>
                <div className="p-4 border rounded-lg">
                  <span className="block text-2xl font-bold text-yellow-600">{analysisData.stats.neutralCount}</span>
                  <span className="text-xs text-gray-500">{t('neutral')}</span>
                </div>
              </div>
            </div>

            {/* Embedded Visual Analytics Graphs */}
            {/* 'page-break-inside-avoid' forces PDF printers to not slice charts across page boundaries */}
            <div className="grid grid-cols-2 gap-8 mb-8 page-break-inside-avoid">
              <div>
                <h4 className="font-bold text-sm mb-2 text-center">{t('sentimentDistribution')}</h4>
                <div className="border p-4 rounded-lg h-64">
                  {/* Re-utilized scalable Rechart Component natively injected into print boundaries */}
                  <SentimentChart
                    positive={analysisData.stats.positiveCount}
                    neutral={analysisData.stats.neutralCount}
                    negative={analysisData.stats.negativeCount}
                  />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-2 text-center">{t('keywords')}</h4>
                <div className="border p-4 rounded-lg h-64">
                  <FrequencyChart data={analysisData.topWords} />
                </div>
              </div>
            </div>

            {/* Empirical Justification Listing (Top 5 Review samples) */}
            <div>
              <h3 className={`text-lg font-bold text-primary mb-4 bg-gray-50 p-2 rounded ${direction === 'rtl' ? 'border-r-4' : 'border-l-4'} border-accent`}>{t('sampleReviews')}</h3>
              <div className="space-y-3">
                {/* Truncate total array and map strictly qualitative review metadata limits */}
                {analysisData.reviews.slice(0, 5).map((review, i) => (
                  <div key={i} className="p-3 border-b border-gray-100 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className={`text-xs font-bold ${review.sentiment === Sentiment.POSITIVE ? 'text-green-600' : 'text-red-600'}`}>
                        {review.sentiment === Sentiment.POSITIVE ? t('positiveLabel') : (review.sentiment === Sentiment.NEGATIVE ? t('negativeLabel') : t('neutralLabel'))}
                      </span>
                      <span className="text-gray-400 text-xs">{review.source}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">"{review.text}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Embedded Destination Map Section */}
            <div className="mb-8 page-break-inside-avoid">
              <h3 className={`text-lg font-bold text-primary mb-4 bg-gray-50 p-2 rounded ${direction === 'rtl' ? 'border-r-4' : 'border-l-4'} border-accent`}>{t('destinationLocation')}</h3>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  title={`${analysisData.cityName} - Google Maps`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(analysisData.cityName + ' Saudi Arabia')}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {analysisData.cityName}
              </p>
            </div>

            {/* Legitimate AI Generation Timestamp Stamp */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
              {t('autoGenerated')}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/**
 * About Project Page
 * Static page demonstrating the academic roots, team member attributions, 
 * and high-level architectural goals of the Smart Tourism Sentiment Analyzer.
 */
const AboutPage = () => {
  const { t, direction } = useLanguage();
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto" dir={direction}>
        <Card className="p-8">
          
          {/* Thesis / Main Description Block */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-4">{t('about')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('aboutDescription')}
            </p>
          </div>

          {/* Core Objectives Modular Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-50 p-6 rounded-xl text-center">
              <h3 className="font-bold text-primary mb-2">{t('problemTitle')}</h3>
              <p className="text-sm text-gray-600">{t('problemDesc')}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl text-center">
              <h3 className="font-bold text-green-800 mb-2">{t('solutionTitle')}</h3>
              <p className="text-sm text-gray-600">{t('solutionDesc')}</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl text-center">
              <h3 className="font-bold text-yellow-800 mb-2">{t('goalTitle')}</h3>
              <p className="text-sm text-gray-600">{t('goalDesc')}</p>
            </div>
          </div>

          {/* Academic Recognition / Hierarchical Mapping */}
          <div className="border-t border-gray-100 pt-8">
            <h3 className="text-xl font-bold text-primary mb-3 text-center">{t('supervisorTitle')}</h3>
            <div className="flex justify-center mb-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <p className="font-bold text-base text-primary">{t('supervisorName')}</p>
                <p className="text-xs text-gray-500">{t('supervisorRole')}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-primary mb-6 text-center">{t('teamTitle')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              
              {/* Core Engineering Members Block */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-bold text-sm">علي عبدالله آل مستور</p>
                <p className="text-xs text-gray-500">{t('teamMember')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-bold text-sm">عبدالله حسين آل عوض</p>
                <p className="text-xs text-gray-500">{t('teamMember')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-bold text-sm">عبدالله مسفر</p>
                <p className="text-xs text-gray-500">{t('teamMember')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-bold text-sm">يزن يحيى</p>
                <p className="text-xs text-gray-500">{t('teamMember')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-bold text-sm">مهدي حمود الدوسري</p>
                <p className="text-xs text-gray-500">{t('teamMember')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-bold text-sm">عبدالرحمن عدوي</p>
                <p className="text-xs text-gray-500">{t('teamMember')}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// ======================================================================
// 5. BOOTSTRAP: ROUTING & CONTEXT PROVIDERS
// ======================================================================

/**
 * Root Application Entrypoint
 * Bootstraps the complete React tree with necessary Context Providers mapping localized logic across the DOM:
 * - HashRouter: Controls client-side URL routing without requiring server rewrites (Ideal for strict environments).
 * - LanguageProvider: Injects dynamic bilingual translation properties globally.
 * - AuthProvider: Manages user session state and validates backend privileges.
 */
const App: React.FC = () => {
  return (
    <HashRouter>
      <LanguageProvider>
        <AuthProvider>
          {/* Declare logical mapping trees connecting Browser URL parameters to corresponding Component blocks */}
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-otp" element={<OtpVerificationPage />} />

            {/* Authenticated Zone Endpoints */}
            <Route path="/city-input" element={<CityInputPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:id" element={<DashboardPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/report/:id" element={<ReportPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </HashRouter>
  );
};

export default App;
