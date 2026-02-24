/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aios: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#a855f7',
          dark: '#0f0f23',
          darker: '#0a0a1a',
          surface: '#1a1a2e',
          border: '#2a2a4a',
          text: '#e2e8f0',
          muted: '#94a3b8',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 1s steps(3) infinite',
      },
      keyframes: {
        typing: {
          '0%, 100%': { content: '"."' },
          '33%': { content: '".."' },
          '66%': { content: '"..."' },
        }
      }
    },
  },
  plugins: [],
}
