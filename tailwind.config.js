/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', '"Noto Serif Thai"', 'Georgia', 'serif'],
        serifth: ['"Noto Serif Thai"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        canvas: '#FAF8F3',
        ivory: '#FCFAF4',
        cream: '#F3EDDF',
        stone: { 100: '#EAE5D8', 200: '#DAD3C2', 300: '#CFC8B8', 400: '#B3AB98', 500: '#8F8775' },
        olive: {
          50: '#F4F5EC', 100: '#E6E9D3', 200: '#CDD3A9', 300: '#AEB87C', 400: '#8E9A58',
          500: '#717D41', 600: '#5A6535', 700: '#464F2B', 800: '#343B20', 900: '#262B18',
        },
        bark: {
          50: '#F6F0EA', 100: '#EADFD2', 200: '#D5C0A8', 300: '#B99B7B', 400: '#9A7757',
          500: '#7D5E42', 600: '#654A34', 700: '#4F3A29', 800: '#3A2B1F', 900: '#2A1F16',
        },
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
      keyframes: {
        'scroll-cue': {
          '0%': { transform: 'translateY(-100%)' },
          '60%, 100%': { transform: 'translateY(100%)' },
        },
      },
      animation: { 'scroll-cue': 'scroll-cue 2.2s cubic-bezier(0.6, 0, 0.3, 1) infinite' },
    },
  },
  plugins: [],
}
