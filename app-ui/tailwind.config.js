/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#f78da7',
        secondary: '#ffcccb',
        accent: '#ffd700',
        neutral: '#e0f7fa',
        base: '#ffffff',
        info: '#0288d1',
        success: '#8bc34a',
        warning: '#ffeb3b',
        danger: '#f44336',
        // Option 01: Medical Blue/Teal
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
