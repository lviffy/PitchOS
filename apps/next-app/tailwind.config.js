/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './apps/next-app/src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/next-app/src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/next-app/src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
