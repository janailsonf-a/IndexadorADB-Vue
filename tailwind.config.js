/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        adb: {
          orange: '#FF6B00',
          'orange-dark': '#E65300',
          'orange-2': '#FD4B00',
          yellow: '#FFD900',
          blue: '#0047BA',
          teal: '#143F43',
          cream: '#FAF5EE',
        },
      },
      borderRadius: {
        pill: '999px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.06)',
        'card-dark': '0 4px 20px rgba(0,0,0,0.30)',
        accent: '0 8px 24px rgba(255,107,0,0.22)',
        hover: '0 14px 30px rgba(255,107,0,0.28)',
      },
    },
  },
  plugins: [],
}
