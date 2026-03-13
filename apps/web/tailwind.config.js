/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './stores/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          primary: '#0A2540',
          'primary-light': '#1a3a5c',
          'primary-dark': '#061226',
          secondary: '#635BFF',
          'secondary-light': '#8B85FF',
          'secondary-dark': '#4B44B3',
          accent: '#00D4AA',
          'accent-light': '#33DDBB',
          'accent-dark': '#00A882',
        },
        gains: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          DEFAULT: '#22c55e',
        },
        losses: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          DEFAULT: '#ef4444',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          tertiary: '#F1F5F9',
          elevated: '#FFFFFF',
          dark: '#0F172A',
        },
        border: {
          DEFAULT: '#E2E8F0',
          light: '#F1F5F9',
          dark: '#CBD5E1',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          tertiary: '#94A3B8',
          inverse: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'premium': '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 40px rgba(99, 91, 255, 0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        'xl': '0.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
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
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0A2540 0%, #1a3a5c 50%, #635BFF 100%)',
        'card-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, rgba(99, 91, 255, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0, 212, 170, 0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(99, 91, 255, 0.05) 0px, transparent 50%)',
      },
      backgroundSize: {
        'shimmer': '200% 100%',
      },
    },
  },
  plugins: [],
}
