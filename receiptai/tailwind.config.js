export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0D0F1A',
          800: '#131625',
          700: '#1A1E32',
          600: '#222740',
        },
        green: {
          400: '#00FF85',
          500: '#00E876',
          600: '#00CC66',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
