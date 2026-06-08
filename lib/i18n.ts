'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import frCommon from '../locales/fr/common.json';
import enCommon from '../locales/en/common.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            fr: { common: frCommon },
            en: { common: enCommon },
        },
        fallbackLng: 'fr',
        supportedLngs: ['fr', 'en'],
        defaultNS: 'common',
        interpolation: {
            escapeValue: false, // React handles XSS
        },
        detection: {
            order: ['queryString', 'cookie', 'localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        react: {
            useSuspense: false, // Avoid suspense for now to prevent hydration issues if data isn't ready
        },
    });

export default i18n;