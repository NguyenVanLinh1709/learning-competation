import { create } from 'zustand';
import { LangCode, Translations, TRANSLATIONS } from '../i18n/translations';

interface LanguageStore {
  lang: LangCode;
  t: Translations;
  setLanguage: (lang: LangCode) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  lang: 'en',
  t: TRANSLATIONS.en,
  setLanguage: (lang) => set({ lang, t: TRANSLATIONS[lang] }),
}));
