// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import astroIcon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import { defaultLang } from './src/i18n/ui';

// https://astro.build/config
export default defineConfig({
  site: 'https://world-wide.dev',
  image: {
    service: passthroughImageService(),
  },
  integrations: [
    tailwind(),
    sitemap({
      i18n: {
        defaultLocale: defaultLang,
        locales: { de: 'de-DE', en: 'en-US' },
      },
    }),
    astroIcon({
      include: {
        mdi: ['*'],
        ri: ['*'],
        'simple-icons': ['*'],
      },
    }),
  ],
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: defaultLang,
  },
});
