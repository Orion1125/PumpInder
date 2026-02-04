/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'clash-display': ['Clash Display', 'Inter', 'sans-serif'],
        'jetbrains-mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'bg-canvas': '#F4F4F0',
        'bg-grid-lines': '#E5E5E5',
        'ink-primary': '#121212',
        'ink-secondary': '#4A4A4A',
        'cta-primary': '#5D5FEF',
        'action-like': '#FF4D00',
        'action-boost': '#00D668',
        'ticker-bg': '#FFFF00',
        'error-pass': '#FFFFFF',
      },
    },
  },
  plugins: [],
}
