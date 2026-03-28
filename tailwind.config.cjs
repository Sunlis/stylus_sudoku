const defaultTheme = require('tailwindcss/defaultTheme');

/***********************
 * Tailwind configuration
 ***********************/

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
