/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#141420',
        'surface-2': '#1C1C2E',
        accent: '#6366F1',
        'accent-light': '#818CF8',
        'accent-dark': '#4F46E5',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'amex-blue': '#006FCF',
        'barclay-teal': '#00AEEF',
        'virgin-red': '#E10014',
        'hsbc-red': '#DB0011',
        'chase-blue': '#117ACA',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
