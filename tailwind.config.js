/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'] },
      colors: {
        canvas: '#FAF8F3',
        surface: '#FFFFFF',
        sand: { 50: '#F7F3EA', 100: '#F0EADB', 200: '#E6DDC8', 300: '#D6C9AC', 400: '#BFAE87' },
        sage: {
          50: '#F2F5F0', 100: '#E3EAE0', 200: '#C8D5C2', 300: '#A6BBA0', 400: '#85A07E',
          500: '#6B8A64', 600: '#56704F', 700: '#445A40', 800: '#374935', 900: '#2D3B2B',
        },
        ink: { DEFAULT: '#2B2B28', soft: '#4A4A45', muted: '#76766E', faint: '#A3A399' },
        line: '#E8E3D6',
        clay: { 50: '#FBF1EC', 100: '#F5DDD2', 500: '#C06A4B', 600: '#A9553A', 700: '#8A432D' },
        amber2: { 50: '#FDF6E3', 100: '#F9EBBF', 500: '#C9962B', 600: '#A67A1C', 700: '#805E14' },
        sky2: { 50: '#EEF4F6', 100: '#D8E6EB', 500: '#5B8FA0', 600: '#477889', 700: '#385F6D' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(43,43,40,0.04), 0 4px 16px rgba(43,43,40,0.04)',
        pop: '0 8px 30px rgba(43,43,40,0.14)',
      },
      borderRadius: { xl2: '1rem' },
    },
  },
  plugins: [],
}
