import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ar } from '../translations/ar';
import { en } from '../translations/en';

type Language = 'ar' | 'en';
type Translations = typeof ar;

interface LanguageContextType {
    language: Language;
    direction: 'rtl' | 'ltr';
    t: (key: keyof Translations) => string;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language') as Language;
        return saved || 'ar';
    });

    const translations = language === 'ar' ? ar : en;
    const direction = language === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = direction;
    }, [language, direction]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const toggleLanguage = () => {
        setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
    };

    const t = (key: keyof Translations) => {
        return translations[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, direction, t, setLanguage, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
