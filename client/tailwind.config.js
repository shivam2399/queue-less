/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        surface: {
          DEFAULT: '#111318',
          elevated: '#181B22',
          hover: '#1F232C'
        },
        border: {
          DEFAULT: '#272B35',
          subtle: '#1C2028'
        },
        foreground: '#F4F4F5',
        muted: '#A1A1AA',
        subtle: '#71717A',
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          muted: '#1D4ED8'
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#38BDF8'
      },
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'monospace']
      }
    },
  },
  plugins: [],
};
