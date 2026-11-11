// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// En GitHub Pages el sitio vive bajo /restaurante-brasa/ (BASE_PATH lo pone el workflow); en local queda en la raíz.
export default defineConfig({
  site: 'https://jesusgabri3l.github.io',
  base: process.env.BASE_PATH ?? '/',
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Caprasimo',
      cssVariable: '--font-display',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-body',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
});
