import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Database, Calendar, Users, Building2 } from 'lucide-react';
import { usePerplexitySearch } from '@/hooks/usePerplexitySearch';
import { useShareholderData } from '@/hooks/useShareholderData';

interface ShareholderSearchDialogProps {
  companyName: string;
  onSearchComplete?: (data: any) => void;
}

export const ShareholderSearchDialog: React.FC<ShareholderSearchDialogProps> = ({
  companyName,
  onSearchComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState(companyName);
  const [searchType, setSearchType] = useState<'full' | 'shareholders' | 'management' | 'board'>('full');
  const [searchResults, setSearchResults] = useState<any>(null);

  const { searchCompanyInfo, isSearching, searchHistory, getRecentSearches } = usePerplexitySearch();
  const { fetchData } = useShareholderData(companyName);

  const handleSearch = async () => {
    const results = await searchCompanyInfo(searchName, searchType);
    if (results) {
      setSearchResults(results);
      if (onSearchComplete) {
        onSearchComplete(results);
      }
      // Refresh the shareholder data
      await fetchData();
    }
  };

  const handleApplyResults = async () => {
    setIsOpen(false);
    setSearchResults(null);
    // Data is already saved by the edge function
    await fetchData();
  };

  const recentSearches = getRecentSearches(searchName);

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'shareholders': return <Users className="h-4 w-4" />;
      case 'management': return <Building2 className="h-4 w-4" />;
      case 'board': return <Database className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getSearchTypeLabel = (type: string) => {
    switch (type) {
      case 'shareholders': return 'Solo Accionistas';
      case 'management': return 'Solo Equipo Directivo';
      case 'board': return 'Solo Consejo';
      default: return 'Información Completa';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Buscar Automáticamente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda Automática de Información Corporativa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la Empresa</Label>
              <Input
                id="company-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Ejemplo: Banco Santander"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-type">Tipo de Búsqueda</Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Información Completa
                    </div>
                  </SelectItem>
                  <SelectItem value="shareholders">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Solo Accionistas
                    </div>
                  </SelectItem>
                  <SelectItem value="management">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Solo Equipo Directivo
                    </div>
                  </SelectItem>
                  <SelectItem value="board">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Solo Consejo de Administración
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchName}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Buscando información...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Iniciar Búsqueda
              </>
            )}
          </Button>

          {/* Search Results */}
          {searchResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resultados de la Búsqueda</span>
                  <Badge variant="outline">
                    Confianza: {searchResults.confidence_score || 'N/A'}%
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Información encontrada para {searchResults.company_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchResults.shareholders && searchResults.shareholders.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Accionistas ({searchResults.shareholders.length})</h4>
                    <div className="space-y-1">
                      {searchResults.shareholders.slice(0, 3).map((shareholder: any, index: number) => (
                        <div key={index} className="text-sm bg-muted p-2 rounded">
                          <span className="font-medium">{shareholder.name}</span>
                          {shareholder.percentage && (
                            <span className="text-muted-foreground"> - {shareholder.percentage}</span>
                          )}
                        </div>
                      ))}
                      {searchResults.shareholders.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{searchResults.shareholders.length - 3} accionistas más...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {searchResults.management_team && searchResults.management_team.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Equipo Directivo ({searchResults.management_team.length})</h4>
                    <div className="space-y-1">
                      {searchResults.management_team.slice(0, 3).map((member: any, index: number) => (
                        <div key={index} className="text-sm bg-muted p-2 rounded">
                          <span className="font-medium">{member.name}</span>
                          {member.position && (
                            <span className="text-muted-foreground"> - {member.position}</span>
                          )}
                        </div>
                      ))}
                      {searchResults.management_team.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{searchResults.management_team.length - 3} directivos más...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Fuentes: {searchResults.data_sources?.join(', ') || 'Múltiples fuentes'}
                  </div>
                  <Button onClick={handleApplyResults}>
                    Aplicar Resultados
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Búsquedas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        {getSearchTypeIcon(search.search_type)}
                        <span className="text-sm font-medium">{search.company_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getSearchTypeLabel(search.search_type)}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(search.search_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};