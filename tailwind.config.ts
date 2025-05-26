
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
				// Paleta inspirada en la imagen de referencia
				'dashboard': {
					bg: '#1e293b',           // Fondo principal oscuro
					'bg-light': '#334155',   // Fondo más claro
					card: '#374151',         // Cards
					'card-hover': '#4b5563', // Cards hover
					sidebar: '#1e2736',      // Sidebar
					accent: '#3b82f6',       // Azul principal
					'accent-light': '#60a5fa', // Azul claro
					success: '#10b981',      // Verde
					warning: '#f59e0b',      // Amarillo
					danger: '#ef4444',       // Rojo
					text: '#f8fafc',         // Texto principal
					'text-secondary': '#94a3b8', // Texto secundario
					'text-muted': '#64748b', // Texto muted
					border: '#475569'        // Bordes
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			},
			backgroundImage: {
				'gradient-dashboard': 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
				'gradient-card': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(55, 65, 81, 0.8) 100%)',
				'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
				'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
				'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
				'gradient-danger': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
			},
			boxShadow: {
				'dashboard': '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
				'card': '0 4px 16px 0 rgba(0, 0, 0, 0.2)',
				'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
				'glow-success': '0 0 20px rgba(16, 185, 129, 0.4)',
				'glow-warning': '0 0 20px rgba(245, 158, 11, 0.4)',
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
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
					'50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.7)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
