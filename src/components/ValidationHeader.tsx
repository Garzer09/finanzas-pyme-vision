import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export const ValidationHeader: React.FC = () => {
  const navigate = useNavigate();
  const bypassAuth = localStorage.getItem('bypass_auth');
  const mockRole = localStorage.getItem('mock_role') as 'admin' | 'user' | null;

  if (!bypassAuth) return null;

  const switchRole = () => {
    const newRole = mockRole === 'admin' ? 'user' : 'admin';
    localStorage.setItem('mock_role', newRole);
    window.location.reload();
  };

  const exitValidation = () => {
    localStorage.removeItem('bypass_auth');
    localStorage.removeItem('mock_role');
    navigate('/auth');
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-amber-700 border-amber-500">
          🔧 Modo Validación
        </Badge>
        <Badge variant={mockRole === 'admin' ? 'default' : 'secondary'}>
          {mockRole === 'admin' ? '👨‍💼 Administrador' : '👤 Usuario Normal'}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={switchRole}
          className="text-xs"
        >
          Cambiar a {mockRole === 'admin' ? 'Usuario' : 'Admin'}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={exitValidation}
          className="text-xs text-amber-700"
        >
          Salir Validación
        </Button>
      </div>
    </div>
  );
};