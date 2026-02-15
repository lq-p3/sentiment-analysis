/**
 * هذا هو الملف الرئيسي للمشروع (The Main File).
 * يحتوي على:
 * 1. جميع صفحات الموقع (تسجيل الدخول، لوحة التحكم، التقارير، إلخ).
 * 2. جميع المكونات (الأزرار، الرسوم البيانية، القوائم).
 * 3. تعريفات البيانات (Types).

 */
import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  User, Lock, Mail, Eye, ArrowRight, MapPin,
  Search, FileText, Download, RefreshCw,
  Smile, Frown, Meh, Twitter, Map as MapIcon,
  LayoutDashboard, Info, LogOut, BarChart3
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import * as d3 from 'd3';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { LanguageSwitcher } from './src/components/LanguageSwitcher';

// ==========================================
// 1. TYPES
// ==========================================

import {
  Sentiment,
  Review,
  AnalysisStats,
  WordFreq,
  CityAnalysisData
} from './src/types';

// ==========================================
// 2. UI COMPONENTS (LayoutComponents)
// ==========================================

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }> = ({
  children, variant = 'primary', className = '', ...props
}) => {
  const base = "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
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

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: React.ReactNode }> = ({
  label, icon, className = '', ...props
}) => (
  <div className="w-full space-y-1.5">
    {label && <label className="text-sm font-bold text-primary block">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-textMain placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${icon ? 'pr-10' : ''} ${className}`}
        {...props}
      />
    </div>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string }> = ({
  children, className = '', title
}) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {title && <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-gray-50">{title}</h3>}
    {children}
  </div>
);

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print" dir={direction}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-primary leading-tight">{t('appTitle')}</h1>
            <p className="text-xs text-gray-500">{t('appSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <div className={`flex items-center gap-2 ${direction === 'rtl' ? 'pl-4 border-l' : 'pr-4 border-r'} border-gray-200`}>
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-primary font-bold text-sm">
              A
            </div>
            <span className="hidden md:block text-sm font-medium text-textMain">{t('adminUser')}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title={t('logout')}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export const Sidebar: React.FC<{ activePath: string }> = ({ activePath }) => {
  const { t, direction } = useLanguage();
  const menuItems = [
    { path: '/dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/city-input', label: t('newAnalysis'), icon: <MapPin className="w-5 h-5" /> },
    { path: '/report', label: t('reports'), icon: <FileText className="w-5 h-5" /> },
    { path: '/about', label: t('about'), icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <aside className={`hidden lg:block w-64 bg-white ${direction === 'rtl' ? 'border-l left-0' : 'border-r right-unset'} border-gray-200 h-[calc(100vh-64px)] fixed ${direction === 'rtl' ? 'right-0' : 'left-0'} top-16 overflow-y-auto no-print`}>
      <div className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
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

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { direction } = useLanguage();

  return (
    <div className="min-h-screen bg-bgLight flex flex-col" dir={direction}>
      <Navbar />
      <div className="flex flex-1 container mx-auto max-w-7xl">
        <Sidebar activePath={location.pathname} />
        <main className={`flex-1 ${direction === 'rtl' ? 'lg:mr-64' : 'lg:ml-64'} p-4 md:p-8 pb-20`}>
          {children}
        </main>
      </div>
    </div>
  );
};

// ==========================================
// 3. CHART COMPONENTS (Charts)
// ==========================================

// Colors
const COLORS = {
  positive: '#4FB2A0', // Teal
  neutral: '#F7C873',  // Gold
  negative: '#EF5350'  // Red
};

const RADIAN = Math.PI / 180;

// --- Sentiment Pie Chart ---
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface SentimentChartProps {
  positive: number;
  neutral: number;
  negative: number;
}

export const SentimentChart: React.FC<SentimentChartProps> = ({ positive, neutral, negative }) => {
  const { t } = useLanguage();
  const data = [
    { name: t('positiveLabel'), value: positive, color: COLORS.positive },
    { name: t('neutralLabel'), value: neutral, color: COLORS.neutral },
    { name: t('negativeLabel'), value: negative, color: COLORS.negative },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ReTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Frequency Bar Chart ---

interface FrequencyChartProps {
  data: WordFreq[];
}

export const FrequencyChart: React.FC<FrequencyChartProps> = ({ data }) => {
  // Take top 5 for bar chart
  const chartData = data.slice(0, 5);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
          <XAxis type="number" hide />
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
          <Bar dataKey="value" fill="#1C4966" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Word Cloud (D3 Based Logic) ---

interface WordCloudProps {
  words: WordFreq[];
}

export const WordCloud: React.FC<WordCloudProps> = ({ words }) => {

  const cloudData = useMemo(() => {
    if (words.length === 0) return [];

    const maxVal = Math.max(...words.map(w => w.value));
    const minVal = Math.min(...words.map(w => w.value));

    const fontSizeScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([14, 36]); // Min font size 14px, Max 36px

    const opacityScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([0.6, 1]);

    // Color palette array
    const colors = ['#1C4966', '#4FB2A0', '#F7C873', '#E67E22', '#2980B9'];

    return words.map((w, i) => ({
      text: w.text,
      size: fontSizeScale(w.value),
      opacity: opacityScale(w.value),
      color: colors[i % colors.length],
      rotate: i % 3 === 0 ? 0 : (i % 2 === 0 ? -5 : 5) // slight rotation for effect
    }));
  }, [words]);

  return (
    <div className="h-64 w-full flex flex-wrap items-center justify-center gap-4 content-center overflow-hidden p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      {cloudData.map((word, idx) => (
        <span
          key={idx}
          style={{
            fontSize: `${word.size}px`,
            color: word.color,
            opacity: word.opacity,
            transform: `rotate(${word.rotate}deg)`,
            transition: 'all 0.3s ease'
          }}
          className="font-bold cursor-default hover:scale-110 inline-block"
          title={`تكرار: ${words[idx].value}`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
};

// ==========================================
// 4. PAGES
// ==========================================

// 1. Login Page
const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t, direction } = useLanguage();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    navigate('/city-input');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight p-4 relative overflow-hidden" dir={direction}>
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 relative z-10 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
            <div className="relative">
              <MapPin className="w-8 h-8" />
              <div className="absolute -bottom-1 -right-1 bg-secondary rounded-full p-0.5 border-2 border-white">
                <Smile className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-primary">{t('welcomeBack')}</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            {t('loginSubtitle')}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            type="email"
            label={t('email')}
            placeholder="example@mail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary block">{t('password')}</label>
            <div className="relative">
              <input
                type="password"
                placeholder="●●●●●●●●"
                className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${direction === 'rtl' ? 'pl-10' : 'pr-10'}`}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Lock className={`absolute ${direction === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-gray-600">{t('rememberMe')}</span>
            </label>
            <Link to="/forgot-password" className="text-primary font-medium hover:underline">{t('forgotPassword')}</Link>
          </div>

          <Button type="submit" className="w-full h-12 text-lg">{t('loginButton')}</Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">{t('noAccount')} </span>
          <Link to="/signup" className="text-secondary font-bold hover:underline">{t('createAccount')}</Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('copyright')}
          </p>
        </div>
      </div>
    </div>
  );
};

// 2. Signup Page
const SignupPage = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight p-4" dir={direction}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary">{t('createAccountTitle')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('createAccountSubtitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/city-input'); }}>
          <Input label={t('fullName')} placeholder={t('fullName')} icon={<User className="w-5 h-5" />} />
          <Input label={t('email')} type="email" placeholder="name@example.com" icon={<Mail className="w-5 h-5" />} />
          <Input label={t('password')} type="password" placeholder="●●●●●●●●" icon={<Lock className="w-5 h-5" />} />

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary block">{t('userType')}</label>
            <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="user">{t('user')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>

          <Button type="submit" className="w-full mt-4">{t('createAccountButton')}</Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-500">{t('haveAccount')} </span>
          <Link to="/" className="text-secondary font-bold hover:underline">{t('login')}</Link>
        </div>
      </div>
    </div>
  );
};

// 3. Forgot Password Page
const ForgotPasswordPage = () => {
  const { t, direction } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight p-4" dir={direction}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center">
        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">{t('forgotPassword')}</h2>
        <p className="text-gray-500 text-sm mb-6">{t('email')}</p>

        <form className="space-y-4">
          <Input label={t('email')} type="email" placeholder="example@mail.com" icon={<Mail className="w-5 h-5" />} />
          <Button className="w-full">{t('loginButton')}</Button>
        </form>

        <Link to="/" className="block mt-6 text-sm text-gray-500 hover:text-primary flex items-center justify-center gap-2">
          {direction === 'rtl' ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 mr-2 rotate-180" />}
          {t('login')}
        </Link>
      </div>
    </div>
  );
};

// 4. City Input Page
const CityInputPage = () => {
  const [city, setCity] = useState('');
  const navigate = useNavigate();
  const { t, language, direction } = useLanguage();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;

    // Hardcoded Mock Data - Direct UI Transition
    const mockDataAr: CityAnalysisData = {
      cityName: city,
      timestamp: new Date().toLocaleDateString('ar-SA'),
      stats: {
        totalReviews: 15,
        positiveCount: 9,
        negativeCount: 3,
        neutralCount: 3,
        averageRating: 4.2
      },
      reviews: [
        {
          id: "1",
          text: "مدينة رائعة جداً وتستحق الزيارة، الأجواء كانت خيالية والمناظر طبيعية.",
          sentiment: Sentiment.POSITIVE,
          source: "Google Maps",
          date: "2024-02-15",
          author: "محمد السالم"
        },
        {
          id: "2",
          text: "الخدمات تحتاج إلى تحسين، الأسعار مرتفعة قليلاً مقارنة بالجودة.",
          sentiment: Sentiment.NEGATIVE,
          source: "Twitter/X",
          date: "2024-02-14",
          author: "سارة العلي"
        },
        {
          id: "3",
          text: "تجربة مقبولة، الفنادق جيدة ولكن المواصلات صعبة.",
          sentiment: Sentiment.NEUTRAL,
          source: "TripAdvisor",
          date: "2024-02-10",
          author: "فهد القحطاني"
        },
        {
          id: "4",
          text: "أفضل مكان زرته في السعودية! التاريخ والعراقة في كل مكان.",
          sentiment: Sentiment.POSITIVE,
          source: "Google Maps",
          date: "2024-01-20",
          author: "نورة محمد"
        },
        {
          id: "5",
          text: "زحمة جداً في المواسم، وصعب تلاقي حجز.",
          sentiment: Sentiment.NEGATIVE,
          source: "Booking.com",
          date: "2024-01-05",
          author: "خالد الزهراني"
        }
      ],
      topWords: [
        { text: "جميلة", value: 80 },
        { text: "زحمة", value: 45 },
        { text: "تراث", value: 60 },
        { text: "فنادق", value: 30 },
        { text: "مطاعم", value: 55 },
        { text: "أسعار", value: 40 },
        { text: "خدمة", value: 35 },
        { text: "أجواء", value: 70 },
        { text: "فعاليات", value: 50 },
        { text: "طبيعة", value: 65 }
      ]
    };

    const mockDataEn: CityAnalysisData = {
      cityName: city,
      timestamp: new Date().toLocaleDateString('en-US'),
      stats: {
        totalReviews: 15,
        positiveCount: 9,
        negativeCount: 3,
        neutralCount: 3,
        averageRating: 4.2
      },
      reviews: [
        {
          id: "1",
          text: "Absolutely wonderful city, worth visiting. The atmosphere was magical and the scenery natural.",
          sentiment: Sentiment.POSITIVE,
          source: "Google Maps",
          date: "2024-02-15",
          author: "Mohammed Al-Salem"
        },
        {
          id: "2",
          text: "Services need improvement, prices are a bit high compared to quality.",
          sentiment: Sentiment.NEGATIVE,
          source: "Twitter/X",
          date: "2024-02-14",
          author: "Sarah Al-Ali"
        },
        {
          id: "3",
          text: "Acceptable experience, hotels are good but transportation is difficult.",
          sentiment: Sentiment.NEUTRAL,
          source: "TripAdvisor",
          date: "2024-02-10",
          author: "Fahad Al-Qahtani"
        },
        {
          id: "4",
          text: "Best place I visited in Saudi! History and heritage everywhere.",
          sentiment: Sentiment.POSITIVE,
          source: "Google Maps",
          date: "2024-01-20",
          author: "Noura Mohammed"
        },
        {
          id: "5",
          text: "Very crowded in seasons, hard to find reservations.",
          sentiment: Sentiment.NEGATIVE,
          source: "Booking.com",
          date: "2024-01-05",
          author: "Khalid Al-Zahrani"
        }
      ],
      topWords: [
        { text: "Beautiful", value: 80 },
        { text: "Crowded", value: 45 },
        { text: "Heritage", value: 60 },
        { text: "Hotels", value: 30 },
        { text: "Restaurants", value: 55 },
        { text: "Prices", value: 40 },
        { text: "Service", value: 35 },
        { text: "Atmosphere", value: 70 },
        { text: "Events", value: 50 },
        { text: "Nature", value: 65 }
      ]
    };

    const mockData = language === 'ar' ? mockDataAr : mockDataEn;

    // Pass data directly to the next page
    navigate('/dashboard', { state: mockData });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)]">
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 w-full max-w-3xl border border-gray-100 text-center relative overflow-hidden" dir={direction}>
          {/* Decorative background image hint */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-3 bg-secondary/10 rounded-2xl mb-6 text-secondary">
              <Search className="w-8 h-8" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">{t('analyzeReviews')}</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
              {t('analyzeSubtitle')}
            </p>

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

              {/* Inspirational Message Box */}
              <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/10 rounded-2xl p-6 text-center">
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
                <Button
                  type="submit"
                  className="w-full py-4 text-lg font-bold shadow-lg shadow-primary/20"
                >
                  {t('startAnalysis')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// 5. Dashboard Page
const DashboardPage = () => {
  const location = useLocation();
  const analysisData = location.state as CityAnalysisData | null;
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const { t, direction } = useLanguage();

  const navigate = useNavigate();

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

  const filteredReviews = analysisData.reviews.filter(r =>
    filterSentiment === 'all' || r.sentiment === filterSentiment
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={direction}>
        {/* Header Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              {t('analysisResults')}: <span className="text-accent">{analysisData.cityName}</span>
            </h2>
            <p className="text-gray-500 text-sm">{t('lastUpdate')}: {analysisData.timestamp}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/city-input')}>
              <RefreshCw className="w-4 h-4" /> {t('newAnalysis')}
            </Button>
            <Button variant="primary" onClick={() => navigate('/report', { state: analysisData })}>
              <FileText className="w-4 h-4" /> {t('createPDF')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
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

        {/* Charts Row 1 */}
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

        {/* Charts Row 2 & Reviews */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card title={t('topTopics')} className="md:col-span-1 h-fit">
            <FrequencyChart data={analysisData.topWords} />
          </Card>

          <Card title={t('reviewDetails')} className="md:col-span-2">
            {/* Filters */}
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

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredReviews.map(review => (
                <div key={review.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {review.sentiment === Sentiment.POSITIVE && <Smile className="w-4 h-4 text-green-500" />}
                      {review.sentiment === Sentiment.NEGATIVE && <Frown className="w-4 h-4 text-red-500" />}
                      {review.sentiment === Sentiment.NEUTRAL && <Meh className="w-4 h-4 text-yellow-500" />}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${review.sentiment === Sentiment.POSITIVE ? 'bg-green-100 text-green-700' :
                        review.sentiment === Sentiment.NEGATIVE ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {review.sentiment === Sentiment.POSITIVE ? t('positiveLabel') : (review.sentiment === Sentiment.NEGATIVE ? t('negativeLabel') : t('neutralLabel'))}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                  <p className="text-sm text-textMain leading-relaxed mb-3">
                    "{review.text}"
                  </p>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {review.source.includes('Google') ? <MapIcon className="w-3 h-3" /> : <Twitter className="w-3 h-3" />}
                      {review.source}
                    </div>
                    <span className="text-xs font-medium text-primary">{review.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

// 6. Report Page (Print Friendly)
const ReportPage = () => {
  const location = useLocation();
  const analysisData = location.state as CityAnalysisData | null;
  const navigate = useNavigate();
  const { t, direction } = useLanguage();

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto" dir={direction}>
        <div className="flex justify-between items-center mb-8 no-print">
          <Button variant="outline" onClick={() => navigate('/dashboard', { state: analysisData })}>{t('backToDashboard')}</Button>
          <Button variant="primary" onClick={handlePrint}>
            <Download className="w-4 h-4" /> {t('downloadReport')}
          </Button>
        </div>

        <div className="bg-white p-10 shadow-lg rounded-none print:shadow-none print:w-full" id="report-content">
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

          {/* Summary Section */}
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

          {/* Visuals Section */}
          <div className="grid grid-cols-2 gap-8 mb-8 page-break-inside-avoid">
            <div>
              <h4 className="font-bold text-sm mb-2 text-center">{t('sentimentDistribution')}</h4>
              <div className="border p-4 rounded-lg h-64">
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

          {/* Sample Reviews */}
          <div>
            <h3 className={`text-lg font-bold text-primary mb-4 bg-gray-50 p-2 rounded ${direction === 'rtl' ? 'border-r-4' : 'border-l-4'} border-accent`}>{t('sampleReviews')}</h3>
            <div className="space-y-3">
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

          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
            {t('autoGenerated')}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// 7. About Page
const AboutPage = () => {
  const { t, direction } = useLanguage();
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto" dir={direction}>
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-4">{t('aboutTitle')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('aboutDescription')}
            </p>
          </div>

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

// --- Main App Component ---

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/city-input" element={<CityInputPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
};

export default App;
