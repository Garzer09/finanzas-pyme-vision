
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
        <div className="flex flex-col gap-4 items-center">
          <Link to="/home?demo=client">
            <Button 
              variant="secondary"
              className="bg-blue-500 hover:bg-blue-400 text-white font-medium px-8 py-3 text-lg w-64"
            >
              Ver como Cliente (Demo)
            </Button>
          </Link>
          <Link to="/admin/settings?demo=admin">
            <Button 
              variant="secondary"
              className="bg-green-500 hover:bg-green-400 text-white font-medium px-8 py-3 text-lg w-64"
            >
              Ver como Administrador (Demo)
            </Button>
          </Link>
          <Link to="/auth">
            <Button 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-steel font-medium px-8 py-3 text-lg w-64"
            >
              Acceso Normal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
