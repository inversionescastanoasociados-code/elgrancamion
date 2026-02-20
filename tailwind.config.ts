import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        asphalt: '#0a0a0a',
        'deep-black': '#050505',
        'truck-red': '#E63946',
        'neon-red': '#FF1744',
        'warning-yellow': '#FFB703',
        'gold': '#FFD700',
        chrome: '#E5E5E5',
        'steel': '#8A8A8A',
      },
      fontFamily: {
        headings: ['"Bebas Neue"', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
        'red-glow': 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(230,57,70,0.06), transparent 40%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(230,57,70,0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(230,57,70,0.6), 0 0 80px rgba(230,57,70,0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 16px 64px rgba(0, 0, 0, 0.45)',
        'red': '0 14px 34px rgba(230,57,70,0.28)',
        'red-lg': '0 20px 60px rgba(230,57,70,0.4)',
        'gold': '0 14px 34px rgba(255,183,3,0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
