/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        apple: '16px',
        'apple-sm': '12px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'PingFang SC',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        apple: {
          blue: '#0071E3',
          green: '#34C759',
          orange: '#FF9500',
          red: '#FF3B30',
          gray: '#8E8E93',
        },
      },
      boxShadow: {
        apple: '0 2px 12px rgba(0,0,0,0.06)',
        'apple-hover': '0 4px 20px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
