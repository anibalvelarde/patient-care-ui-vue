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
      },
    },
  },
  plugins: [],
}
