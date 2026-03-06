/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                        heading: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                        body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                        mono: ['SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        tp: {
                                highlight: '#4cc9f0',
                                pinned: '#e2b714',
                                audible: '#4ade80',
                                duplicate: '#ef4444',
                        },
                        'tab-group': {
                                grey: '#9aa0a6',
                                blue: '#8ab4f8',
                                red: '#f28b82',
                                yellow: '#fdd663',
                                green: '#81c995',
                                pink: '#ff8bcb',
                                purple: '#c58af9',
                                cyan: '#78d9ec',
                        },
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        'pulse-glow': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0.5' },
                        },
                        'slide-in': {
                                from: { opacity: '0', transform: 'translateY(-4px)' },
                                to: { opacity: '1', transform: 'translateY(0)' },
                        },
                        'fade-out': {
                                from: { opacity: '1', transform: 'scale(1)' },
                                to: { opacity: '0', transform: 'scale(0.95)' },
                        },
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                        'slide-in': 'slide-in 0.2s ease-out',
                        'fade-out': 'fade-out 0.15s ease-in',
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
