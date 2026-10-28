/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#22d3ee',
          purple: '#a78bfa',
          pink: '#f472b6',
          green: '#4ade80',
          yellow: '#fde047',
        },
        bg: {
          dark: '#030712',
          panel: '#0b0f19',
          glass: 'rgba(15, 23, 42, 0.6)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 25px rgba(34, 211, 238, 0.8), 0 0 50px rgba(34, 211, 238, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
