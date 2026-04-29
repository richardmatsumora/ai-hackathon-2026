/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        display: ['Inter', '"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        // Surfaces — "Void" scale from DESIGN.md
        surface: {
          DEFAULT: '#16130b',
          dim:     '#16130b',
          bright:  '#3d392f',
          lowest:  '#110e07',
          low:     '#1f1b13',
          base:    '#231f17',
          high:    '#2d2a21',
          highest: '#39342b',
        },
        on: {
          surface:         '#eae1d4',
          'surface-muted': '#d0c5af',
        },
        outline: {
          DEFAULT: '#99907b',
          subtle:  '#4d4635',
        },
        // Caution Yellow — primary CTA / crime-scene tape
        yellow: {
          DEFAULT: '#f2c94c',
          dim:     '#ebc246',
          dark:    '#6b5400',
          on:      '#3d2f00',
        },
        // Forensic Blue — data / metadata
        blue: {
          DEFAULT: '#2d9cdb',
          light:   '#8ccdff',
          on:      '#002d44',
        },
        // Blood Red — destructive / killed meetings
        red: {
          DEFAULT: '#eb5757',
          dim:     '#ffb4ab',
          dark:    '#93000a',
          on:      '#690005',
        },
      },
      boxShadow: {
        // Hard-drop stamp shadows — no blur
        stamp:   '4px 4px 0px 0px #000000',
        'stamp-y': '4px 4px 0px 0px #f2c94c',
        'stamp-r': '4px 4px 0px 0px #eb5757',
        soft:    '0 1px 12px rgba(0,0,0,0.5)',
      },
      borderWidth: {
        DEFAULT: '1px',
        '2': '2px',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
