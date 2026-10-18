import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep charcoal/navy surfaces
        surface: {
          50: '#f0f2f7',
          100: '#e1e5ef',
          200: '#c3cad8',
          300: '#9aa6bd',
          400: '#6b7fa0',
          500: '#4e6287',
          600: '#3d4e6c',
          700: '#2d3a52',
          800: '#1e2740',
          900: '#131a2e',
          950: '#0b1020',
        },
        // Electric violet accent
        accent: {
          50: '#f3f0ff',
          100: '#ece5ff',
          200: '#d8ceff',
          300: '#bea6ff',
          400: '#a17aff',
          500: '#864eff',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Electric blue secondary accent
        electric: {
          50: '#eff9ff',
          100: '#def1ff',
          200: '#b7e5ff',
          300: '#76d4ff',
          400: '#2ec0ff',
          500: '#06aaff',
          600: '#0088df',
          700: '#0070b8',
          800: '#005d97',
          900: '#004e7d',
          950: '#003154',
        },
        // Success/green
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        // Warning/amber
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Error/rose
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-electric': '0 0 20px rgba(6, 170, 255, 0.3)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #1e2740 0%, #131a2e 50%, #0b1020 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [typography],
}

export default config
