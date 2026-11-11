/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tableau: {
          header: '#1F4E79',
          blue: '#1F4E79',
          navy: '#143857',
          lightBlue: '#E8F1F8',
          accent: '#2F75B5',
          border: '#D9E1E8',
          kpiBg: '#F8FAFC',
          card: '#FFFFFF',
          textDark: '#1E293B',
          textMuted: '#64748B',
          green: '#10B981',
          orange: '#F59E0B',
          red: '#EF4444',
          gray: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        poppins: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
