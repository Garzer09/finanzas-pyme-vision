
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Dashboard color palette from the image
				'dashboard-green': {
					50: '#F0F9F4',
					100: '#DCF4E4',
					200: '#B5D5C5',
					300: '#9DC88D',
					400: '#7CB342',
					500: '#4A7C59',
					600: '#2E5233',
					700: '#1E3A22',
					800: '#142B17',
					900: '#0A1B0D'
				},
				'dashboard-orange': {
					50: '#FFF8F0',
					100: '#FEF0E1',
					200: '#F8CBA6',
					300: '#F4B76B',
					400: '#E8A448',
					500: '#D18F2B',
					600: '#B8751E',
					700: '#8B4513',
					800: '#5C2E0C',
					900: '#2D1706'
				},
				'dashboard-blue': {
					50: '#F0F9FE',
					100: '#E1F3FD',
					200: '#A5D7E8',
					300: '#6BB8D6',
					400: '#359AC4',
					500: '#0F7DB2',
					600: '#0B5D85',
					700: '#083E58',
					800: '#04202B',
					900: '#021016'
				},
				'dashboard-red': {
					50: '#FFF5F5',
					100: '#FFE5E5',
					200: '#FFB5B5',
					300: '#FF8585',
					400: '#FF5555',
					500: '#E53E3E',
					600: '#C53030',
					700: '#9B2C2C',
					800: '#742A2A',
					900: '#4A1414'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
