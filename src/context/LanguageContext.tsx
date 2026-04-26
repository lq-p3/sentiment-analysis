/**
 * Bilingual & Internationalization (i18n) Context Manager (LanguageContext.tsx)
 * 
 * This file governs the global interface language switching mechanism (Arabic/English) 
 * and handles the localized reading direction layout properties (RTL vs LTR).
 * It dynamically maps string keys to localized literal values via a centralized dictionary lookup.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ar } from '../translations/ar';
import { en } from '../translations/en';

type Language = 'ar' | 'en';
// Inherit typing inference structurally from the Arabic dictionary to ensure strict typings across all translations
type Translations = typeof ar;

/**
 * Interface defining the exact shape and utility functions exposed by the Language Provider.
 */
interface LanguageContextType {
    language: Language; // Identifies the currently active linguistic profile
    direction: 'rtl' | 'ltr'; // Identifies mapping orientation parameters mapped to CSS grid/flex containers
    t: (key: keyof Translations) => string;  // Polyglot Translation Utility Hook function
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    /**
     * State initialization phase.
     * Evaluates prior user preferences persisted across sessions in browser LocalStorage.
     * Hard defaults to Arabic ('ar') if no existing signature configuration flag exists.
     */
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language') as Language;
        return saved || 'ar';
    });

    // Dynamically assign translation payloads and layout orientation references based on the active language switch
    const translations = language === 'ar' ? ar : en;
    const direction = language === 'ar' ? 'rtl' : 'ltr';

    /**
     * Subscribed Side-Effect Listener
     * Automatically reacts to state mutations in the 'language' configuration,
     * rewriting the native DOM structure (<html> tag) and caching the user's latest choice locally.
     */
    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = direction;
    }, [language, direction]);

    // Explicit setter function to override the context language directly
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    // Toggle utility function for cyclical switching (Ar <-> En) bound to User Interface triggers.
    const toggleLanguage = () => {
        setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
    };

    /**
     * Dictionary Key Extraction Function `t()`
     * Processes statically typed keys and returns the resolved translation string. 
     * Offers graceful degradation by returning the raw key string itself if a translation mapping is improperly missed.
     */
    const t = (key: keyof Translations) => {
        return translations[key] || key;
    };

    return (
        // Broadcast local states & translator functions downward throughout the encapsulated application structure
        <LanguageContext.Provider value={{ language, direction, t, setLanguage, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

/**
 * Primary Custom Abstraction Hook (`useLanguage`)
 * Exposes a localized hook enabling deeply nested inner components to consume and manipulate linguistic configurations natively.
 */
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage hook must be strictly utilized within the structural envelope of a LanguageProvider wrapper.');
    }
    return context;
};
