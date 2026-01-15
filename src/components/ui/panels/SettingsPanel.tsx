'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { t, setLanguage, getLanguage, type Language } from '@/locales';
import { 
  Sun, 
  Moon, 
  Globe,
  Check,
} from 'lucide-react';

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

export default function SettingsPanel() {
  const { uiSettings, updateUISettings } = useAppStore();
  const currentLang = getLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    updateUISettings({ language: lang });
  };

  const handleDarkModeToggle = () => {
    updateUISettings({ darkMode: !uiSettings.darkMode });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="space-y-6"
    >
      {/* 다크 모드 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          {uiSettings.darkMode ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
          {t('appearance')}
        </h3>
        
        <button
          onClick={handleDarkModeToggle}
          className={`w-full p-3 rounded-lg border transition-all ${
            uiSettings.darkMode
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-yellow-500 bg-yellow-500/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                uiSettings.darkMode ? 'bg-dark-800' : 'bg-yellow-500/20'
              }`}>
                {uiSettings.darkMode ? (
                  <Moon className="w-5 h-5 text-primary-400" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  {uiSettings.darkMode ? t('darkMode') : t('lightMode')}
                </p>
                <p className="text-xs text-gray-400">
                  {uiSettings.darkMode 
                    ? t('darkModeEnabled')
                    : t('lightModeEnabled')}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
              uiSettings.darkMode ? 'bg-primary-500' : 'bg-yellow-500'
            }`}>
              <motion.div
                className="w-4 h-4 rounded-full bg-white"
                animate={{ x: uiSettings.darkMode ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
        </button>
      </div>

      {/* 언어 선택 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t('language')}
        </h3>
        
        <div className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full p-3 rounded-lg border transition-all ${
                currentLang === lang.code
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 bg-dark-700 hover:border-dark-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {lang.code === 'en' ? '🇺🇸' : '🇰🇷'}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lang.name}
                    </p>
                  </div>
                </div>
                {currentLang === lang.code && (
                  <Check className="w-5 h-5 text-primary-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 앱 정보 */}
      <div className="pt-4 border-t border-dark-600">
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>ParticleVerse v1.0.0</p>
          <p>{t('createdWith')}</p>
        </div>
      </div>
    </motion.div>
  );
}
