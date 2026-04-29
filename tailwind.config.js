/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f6f7f8',
          100: '#e9ebed',
          200: '#c9ced3',
          300: '#9aa2ac',
          400: '#6a7380',
          500: '#4a5360',
          600: '#343b46',
          700: '#252a33',
          800: '#171b22',
          900: '#0c0f14',
        },
        blood: {
          50: '#fff1f1',
          100: '#ffdede',
          200: '#ffc1c1',
          300: '#ff9494',
          400: '#ff5b5b',
          500: '#f83030',
          600: '#e01414',
          700: '#b80d0d',
          800: '#8f0a0a',
          900: '#5e0707',
        },
        bone: '#f4efe6',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
