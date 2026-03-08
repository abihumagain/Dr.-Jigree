/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040d1a',
          900: '#071428',
          800: '#0d1f3c',
          700: '#112844',
          600: '#163354',
          500: '#1a3f66',
          400: '#1e4d7a',
        },
        brand: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        accent: {
          400: '#34d399',
          500: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #040d1a 0%, #071428 50%, #0d1f3c 100%)',
      },
    },
  },
  plugins: [],
};
