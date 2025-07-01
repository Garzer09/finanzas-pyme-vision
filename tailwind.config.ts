
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
				// Steel Blue Palette - Primarios
				'steel': {
					DEFAULT: '#4682B4',
					50: '#f0f8ff',
					100: '#e0f0fe',
					200: '#bae1fd',
					300: '#7cc7fb',
					400: '#36aaf7',
					500: '#0d8ee8',
					600: '#0172c6',
					700: '#025ba0',
					800: '#064e85',
					900: '#0b426e',
					950: '#072949'
				},
				'cadet': {
					DEFAULT: '#5F9EA0',
					50: '#f0fdfd',
					100: '#ccf7f8',
					200: '#99eff2',
					300: '#5fdde2',
					400: '#27c3cb',
					500: '#5F9EA0',
					600: '#0e7c86',
					700: '#10646e',
					800: '#13525a',
					900: '#15444c',
					950: '#052b31'
				},
				// Light Gray Palette - Secundarios
				'light': {
					DEFAULT: '#E5E7EB',
					50: '#F9FAFB',
					100: '#F3F4F6',
					200: '#E5E7EB',
					300: '#D1D5DB',
					400: '#9CA3AF',
					500: '#6B7280',
					600: '#4B5563',
					700: '#374151',
					800: '#1F2937',
					900: '#111827'
				},
				// Estados Específicos
				success: {
					DEFAULT: '#10B981',
					50: '#ECFDF5',
					100: '#D1FAE5',
					500: '#10B981',
					600: '#059669',
					700: '#047857'
				},
				warning: {
					DEFAULT: '#F59E0B',
					50: '#FFFBEB',
					100: '#FEF3C7',
					500: '#F59E0B',
					600: '#D97706',
					700: '#B45309'
				},
				danger: {
					DEFAULT: '#EF4444',
					50: '#FEF2F2',
					100: '#FEE2E2',
					500: '#EF4444',
					600: '#DC2626',
					700: '#B91C1C'
				},
				// Paleta profesional para gráficos
				chart: {
					1: 'hsl(210, 44%, 45%)', // Steel Blue
					2: 'hsl(184, 25%, 50%)', // Cadet Blue
					3: 'hsl(210, 44%, 65%)', // Light Steel Blue
					4: 'hsl(158, 64%, 52%)', // Success Green
					5: 'hsl(43, 96%, 56%)', // Warning Yellow
					6: 'hsl(0, 84%, 60%)', // Danger Red
					7: 'hsl(220, 9%, 46%)' // Neutral Gray
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
				display: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'Monaco', 'Cascadia Code', '"Roboto Mono"', 'Consolas', 'monospace'],
			},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
				'sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
				'base': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
				'lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
				'xl': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '500' }],
				'2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
				'5xl': ['3rem', { lineHeight: '1', fontWeight: '800' }],
				'6xl': ['3.75rem', { lineHeight: '1', fontWeight: '800' }],
				// KPI números grandes
				'kpi-sm': ['2rem', { lineHeight: '2.25rem', fontWeight: '800' }],
				'kpi-md': ['2.5rem', { lineHeight: '2.75rem', fontWeight: '800' }],
				'kpi-lg': ['3.5rem', { lineHeight: '3.75rem', fontWeight: '900' }],
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
				'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
				'professional': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				'kpi': '0 10px 25px -5px rgba(70, 130, 180, 0.15), 0 4px 6px -2px rgba(70, 130, 180, 0.05)',
				'steel': '0 10px 25px -5px rgba(70, 130, 180, 0.25), 0 4px 6px -2px rgba(70, 130, 180, 0.1)',
				'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
			},
			backdropBlur: {
				xs: '2px',
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
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'counter': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(70, 130, 180, 0.3)' },
					'50%': { boxShadow: '0 0 20px rgba(70, 130, 180, 0.6)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'counter': 'counter 0.6s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
