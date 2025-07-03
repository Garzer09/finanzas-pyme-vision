import { cn } from '@/lib/utils'

interface DashboardPageHeaderProps {
  title: string
  subtitle: string
  className?: string
}

export const DashboardPageHeader = ({ title, subtitle, className }: DashboardPageHeaderProps) => {
  return (
    <section className={cn("relative mb-8", className)}>
      <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-steel/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-cadet/8 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg font-medium">{subtitle}</p>
        </div>
      </div>
    </section>
  )
}