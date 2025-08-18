/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9F6F', // Verde oscuro medio brillante
          50: '#E6F7F1',
          100: '#CCEFE3',
          200: '#99DFC7',
          300: '#66CFAB',
          400: '#33BF8F',
          500: '#0D9F6F',
          600: '#0A7F59',
          700: '#085F43',
          800: '#05402D',
          900: '#032016',
          950: '#01100B',
        },
        background: {
          DEFAULT: '#000000', // Negro
          50: '#1A1A1A',
          100: '#333333',
          200: '#4D4D4D',
          300: '#666666',
          400: '#808080',
          500: '#999999',
          600: '#B3B3B3',
          700: '#CCCCCC',
          800: '#E6E6E6',
          900: '#FFFFFF', // Blanco
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}