import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/theme';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // BeMinimalist color system
        'pure-white': '#ffffff',
        'pure-black': '#000000',
        'neutral': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        'accent': {
          blue: '#0066ff',
          green: '#00cc66',
          red: '#ff3333',
          orange: '#ff6600',
          purple: '#6600cc',
        },
      },
      fontFamily: {
        heading: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Fira Code',
          'monospace',
        ],
      },
      spacing: {
        0: '0',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: '#ffffff',
            foreground: '#000000',
            primary: {
              DEFAULT: '#ff6600',
              foreground: '#ffffff',
            },
            secondary: {
              DEFAULT: '#f5f5f5',
              foreground: '#000000',
            },
            success: '#00cc66',
            warning: '#ff6600',
            danger: '#ff3333',
            content1: '#ffffff',
            content2: '#f5f5f5',
            content3: '#e5e5e5',
            content4: '#d4d4d4',
          },
        },
        dark: {
          colors: {
            background: '#000000',
            foreground: '#ffffff',
            primary: {
              DEFAULT: '#ff6600',
              foreground: '#ffffff',
            },
            secondary: {
              DEFAULT: '#262626',
              foreground: '#ffffff',
            },
            success: '#00cc66',
            warning: '#ff6600',
            danger: '#ff3333',
            content1: '#171717',
            content2: '#262626',
            content3: '#404040',
            content4: '#525252',
          },
        },
      },
    }),
  ],
};

export default config;
