
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const FinancialSemaphore = () => {
  const status = 'Saludable';
  const description = 'Basado en liquidez, rentabilidad, solvencia y tendencias';
  
  return (
    <Card className="bg-white border border-light-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-steel-blue-light to-light-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-white border border-steel-blue/30 shadow-sm">
            <CheckCircle className="h-6 w-6 text-steel-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{status}</h2>
            <p className="text-gray-700 font-medium">{description}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
