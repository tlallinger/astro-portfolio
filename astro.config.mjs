// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import astroIcon from 'astro-icon';
import { defaultLang } from './src/i18n/ui';

// https://astro.build/config
export default defineConfig({
  image: {
    service: passthroughImageService(),
  },
  integrations: [
    tailwind(),
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
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
