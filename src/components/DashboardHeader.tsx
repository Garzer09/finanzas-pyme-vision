
import { TrendingUp, Bell, User } from 'lucide-react';

export const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#f0f3f4] px-10 py-3 bg-white">
      <div className="flex items-center gap-4 text-[#111518]">
        <div className="h-4 w-4">
          <TrendingUp className="h-full w-full" />
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">FinSight</h2>
      </div>
      
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-9">
          <a className="text-[#111518] text-sm font-medium leading-normal" href="#">Panel Principal</a>
          <a className="text-[#111518] text-sm font-medium leading-normal" href="#">Rentabilidad</a>
          <a className="text-[#111518] text-sm font-medium leading-normal" href="#">Liquidez</a>
          <a className="text-[#111518] text-sm font-medium leading-normal" href="#">Solvencia</a>
          <a className="text-[#111518] text-sm font-medium leading-normal" href="#">Eficiencia</a>
          <a className="text-[#111518] text-sm font-medium leading-normal" href="#">Simulador</a>
        </div>
        <button
          className="flex items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f3f4] text-[#111518] gap-2 text-sm font-bold leading-normal tracking-[0.015em] px-2.5"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden">
          <User className="h-full w-full p-2 text-gray-600" />
        </div>
      </div>
    </header>
  );
};
