/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          300: '#1D9E75',
          400: '#0F6E56',
          500: '#085041',
          600: '#04342C',
        },
        warn: {
          light: '#FAEEDA',
          DEFAULT: '#BA7517',
          dark: '#633806',
        },
        danger: {
          light: '#FCEBEB',
          DEFAULT: '#A32D2D',
          dark: '#501313',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      maxWidth: {
        app: '480px',
      },
    },
  },
  plugins: [],
}
