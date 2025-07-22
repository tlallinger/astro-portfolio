import type { CV } from '@/cv/types';
import { ui, defaultLang } from './ui';

function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export const lang: keyof typeof ui = defaultLang;

export function t(key: keyof (typeof ui)[typeof defaultLang]) {
  return ui[lang][key] || ui[defaultLang][key];
}

export function getCV() {
  const cvs = import.meta.glob<CV>('../cv/cv_*.ts', { eager: true, import: 'default' });
  return cvs[`../cv/cv_${lang}.ts`] || cvs[`../cv/cv_${defaultLang}.ts`];
}
