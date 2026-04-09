// ── Font configuration ────────────────────────────────────────────────────────
//
// This is the single file to touch when swapping the display font:
//   1. Drop new font files into /public/fonts/
//   2. Update the src array in displayFont below
//   3. Update --font-display in app/globals.css to var(--font-<newvariable>)
//      and update the variable name here to match
//
// All other fonts (body, serif, mono) are loaded from Google Fonts below.
// ─────────────────────────────────────────────────────────────────────────────

import { Inter, Fraunces, DM_Mono } from 'next/font/google';
import localFont from 'next/font/local';

export const displayFont = localFont({
  src: [
    { path: '../public/fonts/Unique-Thin.woff2',       weight: '100', style: 'normal' },
    { path: '../public/fonts/Unique-ExtraLight.woff2', weight: '200', style: 'normal' },
    { path: '../public/fonts/Unique-Light.woff2',      weight: '300', style: 'normal' },
    { path: '../public/fonts/Unique-Regular.woff2',    weight: '400', style: 'normal' },
    { path: '../public/fonts/Unique-Medium.woff2',     weight: '500', style: 'normal' },
    { path: '../public/fonts/Unique-SemiBold.woff2',   weight: '600', style: 'normal' },
    { path: '../public/fonts/Unique-Bold.woff2',       weight: '700', style: 'normal' },
  ],
  variable: '--font-unique',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['300', '400', '500'],
  display: 'swap',
});
