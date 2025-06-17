
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Colores específicos para el dashboard financiero
				success: 'hsl(var(--success))',
				warning: 'hsl(var(--warning))',
				info: 'hsl(var(--info))',
				orange: 'hsl(var(--orange))',
				indigo: 'hsl(var(--indigo))',
				// Paleta de grises profesional
				gray: {
					50: 'hsl(var(--gray-50))',
					100: 'hsl(var(--gray-100))',
					200: 'hsl(var(--gray-200))',
					300: 'hsl(var(--gray-300))',
					400: 'hsl(var(--gray-400))',
					500: 'hsl(var(--gray-500))',
					600: 'hsl(var(--gray-600))',
					700: 'hsl(var(--gray-700))',
					800: 'hsl(var(--gray-800))',
					900: 'hsl(var(--gray-900))',
				},
				// Colores para gráficos y visualizaciones
				chart: {
					1: 'hsl(var(--chart-1))',
					2: 'hsl(var(--chart-2))',
					3: 'hsl(var(--chart-3))',
					4: 'hsl(var(--chart-4))',
					5: 'hsl(var(--chart-5))',
					6: 'hsl(var(--chart-6))',
					7: 'hsl(var(--chart-7))',
				},
				// Steel Blue and Light Gray palette
				'steel-blue': {
					DEFAULT: '#4682B4',
					50: '#f0f6fb',
					100: '#dfeaf6',
					200: '#c6dbee',
					300: '#a0c5e2',
					400: '#74a8d3',
					500: '#4682B4',
					600: '#3a6fa0',
					700: '#315a84',
					800: '#2c4d6e',
					900: '#27425c',
					950: '#1a2b3c'
				},
				'light-gray': {
					DEFAULT: '#D3D3D3',
					50: '#fafafa',
					100: '#f4f4f5',
					200: '#e4e4e7',
					300: '#D3D3D3',
					400: '#a1a1aa',
					500: '#71717a',
					600: '#52525b',
					700: '#3f3f46',
					800: '#27272a',
					900: '#18181b'
				}
			},
			fontFamily: {
				sans: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
				display: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
				text: ['"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
				inter: ['Inter', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.005em' }],
				'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.005em' }],
				'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
				'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
				'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
				'2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
				// Tamaños específicos para el dashboard
				'h1': ['2rem', { lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '-0.02em' }],
				'h2': ['1.5rem', { lineHeight: '2rem', fontWeight: '600', letterSpacing: '-0.015em' }],
				'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '500', letterSpacing: '-0.01em' }],
				'body': ['0.875rem', { lineHeight: '1.5rem', fontWeight: '400', letterSpacing: '-0.005em' }],
				'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400', letterSpacing: '-0.005em' }],
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'xl': '0.75rem',
				'2xl': '1rem',
				'3xl': '1.5rem',
			},
			boxShadow: {
				'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
				'soft-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 40px -10px rgba(0, 0, 0, 0.1)',
				'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
				'glass-sm': '0 4px 16px rgba(31, 38, 135, 0.2)',
			},
			backdropBlur: {
				xs: '2px',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'data-wave': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(0, 123, 255, 0.3)' },
					'50%': { boxShadow: '0 0 20px rgba(0, 123, 255, 0.6)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'data-wave': 'data-wave 8s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'shimmer': 'shimmer 1.5s infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
