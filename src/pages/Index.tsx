
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { CompanyLogo } from '@/components/CompanyLogo';

const Index = () => {
  const { logoUrl } = useCompanyLogo();

  return (
    <div className="min-h-screen bg-steel flex items-center justify-center" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <CompanyLogo 
            logoUrl={logoUrl}
            size="lg"
            className="h-20 w-auto max-w-64"
            fallback={
              <h1 className="text-6xl font-bold text-white">
                FinSight
              </h1>
            }
          />
        </div>
        <p className="text-2xl text-white mb-8">
          Tu análisis económico inteligente
        </p>
        <Link to="/auth">
          <Button 
            variant="secondary"
            className="bg-gray-400 hover:bg-gray-300 text-black font-medium px-8 py-3 text-lg"
          >
            Comenzar
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
