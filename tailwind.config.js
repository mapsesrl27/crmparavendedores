/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0E1B33', 800: '#152A4E', 700: '#1D3A6B' },
        teal: { 600: '#0F8A6B', 700: '#0C6E56' },
        amber: { 500: '#E8A33D', 600: '#CC8A28' },
        slate: { 50: '#F7F8FA', 100: '#EEF1F5' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
