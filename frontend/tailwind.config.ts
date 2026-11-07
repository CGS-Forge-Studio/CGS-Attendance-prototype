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
        cgs: {
          canvas: '#F4F2F7',
          card: '#FFFFFF',
          purple: {
            50: '#FAF5FF',
            100: '#F3E8FF',
            200: '#E9D5FF',
            300: '#D8B4FE',
            500: '#A855F7',
            600: '#9333EA',
            700: '#7E22CE',
            800: '#6B21A8',
            900: '#581C87',
            950: '#3B0764',
          },
          status: {
            present: '#22C55E',
            absent: '#EF4444',
            onDuty: '#3B82F6',
          },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(88, 28, 135, 0.08)',
        'purple-glow': '0 8px 24px -4px rgba(147, 51, 234, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;

