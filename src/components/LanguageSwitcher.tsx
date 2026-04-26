/**
 * Language Switcher UI Component
 * 
 * A stateless, presentation-focused button that integrates directly with the global `LanguageContext`.
 * It provides users with a persistent, accessible mechanism to toggle between Arabic (RTL) and English (LTR) interfaces.
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
    // Extract the reactive language state and the designated mutation handler from the Context Provider
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
            {/* Contextual Label Rendering: Prompts the user with the inverse option to their current active locale */}
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
        </button>
    );
};
