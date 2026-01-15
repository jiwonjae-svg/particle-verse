import { en, TranslationKey } from './en';
import { ko } from './ko';

export type Language = 'en' | 'ko';

const translations: Record<Language, typeof en> = {
  en,
  ko,
};

// 현재 언어 상태 (기본값: 영어)
let currentLanguage: Language = 'en';

// 브라우저에서 저장된 언어 설정 로드
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('particle-verse-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.uiSettings?.language) {
        currentLanguage = parsed.state.uiSettings.language as Language;
      }
    }
  } catch (e) {
    // 로컬스토리지 접근 실패 시 기본값 사용
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getTranslation(lang: Language, key: string): string {
  const typedKey = key as TranslationKey;
  return translations[lang]?.[typedKey] || translations.en[typedKey] || key;
}

// 단일 인수 버전 (현재 언어 사용)
export function t(key: string, params?: Record<string, string | number>): string {
  let text = getTranslation(currentLanguage, key);
  
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value));
    });
  }
  
  return text;
}

// 언어 지정 버전
export function tWithLang(lang: Language, key: string, params?: Record<string, string | number>): string {
  let text = getTranslation(lang, key);
  
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value));
    });
  }
  
  return text;
}

export { en, ko };
export type { TranslationKey };
