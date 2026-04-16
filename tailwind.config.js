/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.js',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        focus: {
          bg: '#0b0b10',
          surface: '#14141c',
          surfaceSoft: '#1b1b25',
          border: '#252534',
          primary: '#7c3aed',
          primarySoft: 'rgb(124 58 237 / 0.2)',
          muted: '#9ca3af',
          ok: '#22c55e',
          warn: '#f59e0b',
          danger: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
