/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Instrument Sans', 'ui-sans-serif', 'system-ui'],
        display: ['Fraunces', 'ui-serif', 'Georgia']
      },
      colors: {
        ink: {
          950: '#070A13',
          900: '#0B1020',
          800: '#111A33'
        },
        neon: {
          500: '#B6FF4D'
        }
      },
      boxShadow: {
        card: '0 10px 35px rgba(7,10,19,0.12)',
        card2: '0 1px 0 rgba(255,255,255,0.6) inset, 0 14px 40px rgba(7,10,19,0.14)'
      }
    }
  },
  plugins: []
};
