
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const FinancialSemaphore = () => {
  const status = 'Healthy';
  const description = 'Based on liquidity, profitability, solvency, and trends';
  
  return (
    <div className="bg-cover bg-center flex flex-col items-stretch justify-end rounded-lg pt-[132px] mb-6"
      style={{
        backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%), url("https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2070")',
        fontFamily: '"Noto Sans", sans-serif'
      }}
    >
      <div className="flex w-full items-end justify-between gap-4 p-4">
        <div className="flex max-w-[440px] flex-1 flex-col gap-1">
          <p className="text-white tracking-light text-2xl font-bold leading-tight max-w-[440px]">{status}</p>
          <p className="text-white text-base font-medium leading-normal">{description}</p>
        </div>
      </div>
    </div>
  );
};
