const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    path.resolve(__dirname, './src/pages/**/*.{js,ts,jsx,tsx,mdx}'),
    path.resolve(__dirname, './src/components/**/*.{js,ts,jsx,tsx,mdx}'),
    path.resolve(__dirname, './src/app/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': 'var(--background)',
        'card-dark': 'var(--card)',
        'card-hover': 'var(--card-hover)',
        'border-dark': 'var(--border)',
        'text-primary': 'var(--foreground)',
        'text-secondary': 'var(--muted-foreground)',
        'primary-green': 'var(--primary)',
        'primary-green-hover': 'var(--primary-hover)',
        'pitch-gold': 'var(--gold)',
        'pitch-red': 'var(--red)',
      }
    },
  },
  plugins: [],
};
