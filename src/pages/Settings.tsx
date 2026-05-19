// ===================================================================
// Settings.tsx
// System settings page — allows users to enable/disable the Gemini
// AI assistant. The preference is persisted in localStorage.
// ===================================================================
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext'; // Provides text direction (RTL/LTR)
import { Settings as SettingsIcon, Save, Bot, Power } from 'lucide-react'; // UI icons

export const Settings: React.FC = () => {
  const { direction } = useLanguage();
  
  const [aiEnabled, setAiEnabled] = useState(true); // Whether the AI assistant is active
  const [saved, setSaved] = useState(false);         // Controls the "Saved!" feedback message

  // On mount: read the saved AI preference from localStorage
  useEffect(() => {
    const savedEnabled = localStorage.getItem('aiEnabled');
    if (savedEnabled !== null) {
      setAiEnabled(savedEnabled === 'true');
    }
  }, []);

  // Persists the current toggle state to localStorage and shows a 3-second success message
  const handleSave = () => {
    localStorage.setItem('aiEnabled', String(aiEnabled));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          الإعدادات
        </h1>
        <p className="text-gray-500 mt-1">إدارة تكوينات النظام والمساعد الذكي السحابي</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 to-transparent p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">المساعد السياحي الذكي (Cloud AI)</h2>
              <p className="text-sm text-gray-500">مدعوم بواجهة برمجة تطبيقات Google Gemini السحابية الفائقة السرعة.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Power className={`w-5 h-5 ${aiEnabled ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-semibold text-gray-800">تفعيل المساعد الذكي</h3>
                <p className="text-xs text-gray-500">السماح للمساعد بتقديم استنتاجات ودردشة فورية وآمنة داخل التقارير.</p>
              </div>
            </div>
            {/* Toggle button — switches AI on/off; knob position adapts to RTL/LTR */}
            <button 
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${aiEnabled ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${aiEnabled ? (direction === 'rtl' ? 'left-1' : 'right-1') : (direction === 'rtl' ? 'right-1' : 'left-1')}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            {/* Save button — label changes to confirmation text for 3 seconds after saving */}
            <button 
              onClick={handleSave}
              className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 flex items-center gap-2 shadow-sm font-semibold transition-all"
            >
              <Save className="w-4 h-4" />
              {saved ? 'تم الحفظ بنجاح!' : 'حفظ الإعدادات'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Settings;
