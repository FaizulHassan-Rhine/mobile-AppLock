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
          bg: '#0F0F0F',
          card: '#1A1A1A',
          primary: '#7C3AED',
        },
      },
    },
  },
  plugins: [],
};
