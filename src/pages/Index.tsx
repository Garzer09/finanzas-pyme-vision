
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-steel flex items-center justify-center" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          FinSight
        </h1>
        <p className="text-2xl text-white mb-8">
          Tu análisis económico inteligente
        </p>
        <Link to="/home">
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
