import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Users, Building2, Briefcase, TrendingUp } from 'lucide-react';
import { ShareholderInfo, ManagementMember, BoardMember, FoundingPartner, KeyInvestor } from '@/hooks/useShareholderData';

interface ShareholderStructureCardProps {
  data: {
    shareholder_structure: ShareholderInfo[];
    management_team: ManagementMember[];
    board_of_directors: BoardMember[];
    founding_partners: FoundingPartner[];
    key_investors: KeyInvestor[];
    data_source: string;
  };
  isEditing: boolean;
  onAddItem: (section: string, item: any) => void;
  onUpdateItem: (section: string, index: number, item: any) => void;
  onRemoveItem: (section: string, index: number) => void;
}

export const ShareholderStructureCard: React.FC<ShareholderStructureCardProps> = ({
  data,
  isEditing,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}) => {
  const [editingItem, setEditingItem] = useState<{section: string, index?: number, item?: any} | null>(null);

  const handleSaveItem = (section: string, item: any, index?: number) => {
    if (index !== undefined) {
      onUpdateItem(section, index, item);
    } else {
      onAddItem(section, item);
    }
    setEditingItem(null);
  };

  const getDataSourceBadge = () => {
    const sourceConfig = {
      manual: { label: 'Manual', variant: 'secondary' as const },
      perplexity: { label: 'Automático', variant: 'default' as const },
      mixed: { label: 'Mixto', variant: 'outline' as const }
    };

    const config = sourceConfig[data.data_source as keyof typeof sourceConfig] || sourceConfig.manual;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const renderSection = (
    title: string,
    items: any[],
    sectionKey: string,
    icon: React.ReactNode,
    renderItem: (item: any, index: number) => React.ReactNode,
    addButtonText: string
  ) => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
            <Badge variant="outline">{items.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {getDataSourceBadge()}
            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingItem({ section: sectionKey })}
              >
                <Plus className="h-4 w-4 mr-1" />
                {addButtonText}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  {renderItem(item, index)}
                </div>
                {isEditing && (
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingItem({ section: sectionKey, index, item })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveItem(sectionKey, index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-2 opacity-50">{icon}</div>
            <p>No hay información disponible</p>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditingItem({ section: sectionKey })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar {addButtonText}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Shareholders */}
      {renderSection(
        'Estructura Accionaria',
        data.shareholder_structure,
        'shareholder_structure',
        <Users className="h-5 w-5" />,
        (shareholder: ShareholderInfo) => (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold">{shareholder.name}</h4>
              {shareholder.percentage && (
                <Badge variant="secondary">{shareholder.percentage}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {shareholder.type}
              </Badge>
              {shareholder.description && (
                <span>{shareholder.description}</span>
              )}
            </div>
          </div>
        ),
        'Accionista'
      )}

      {/* Management Team */}
      {renderSection(
        'Equipo Directivo',
        data.management_team,
        'management_team',
        <Building2 className="h-5 w-5" />,
        (member: ManagementMember) => (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold">{member.name}</h4>
              <Badge variant="secondary">{member.position}</Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {member.education && (
                <p><strong>Formación:</strong> {member.education}</p>
              )}
              {member.experience && (
                <p><strong>Experiencia:</strong> {member.experience}</p>
              )}
              {member.tenure && (
                <p><strong>En el cargo:</strong> {member.tenure}</p>
              )}
            </div>
          </div>
        ),
        'Directivo'
      )}

      {/* Board of Directors */}
      {renderSection(
        'Consejo de Administración',
        data.board_of_directors,
        'board_of_directors',
        <Briefcase className="h-5 w-5" />,
        (member: BoardMember) => (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold">{member.name}</h4>
              <div className="flex gap-1">
                <Badge variant="secondary">{member.position}</Badge>
                {member.independent && (
                  <Badge variant="outline" className="text-xs">Independiente</Badge>
                )}
              </div>
            </div>
            {member.background && (
              <p className="text-sm text-muted-foreground">{member.background}</p>
            )}
          </div>
        ),
        'Consejero'
      )}

      {/* Key Investors */}
      {renderSection(
        'Inversores Clave',
        data.key_investors,
        'key_investors',
        <TrendingUp className="h-5 w-5" />,
        (investor: KeyInvestor) => (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold">{investor.name}</h4>
              <Badge variant="secondary">{investor.type}</Badge>
            </div>
            {investor.investment_details && (
              <p className="text-sm text-muted-foreground">{investor.investment_details}</p>
            )}
          </div>
        ),
        'Inversor'
      )}

      {/* Edit Dialog */}
      <EditItemDialog
        editingItem={editingItem}
        onSave={handleSaveItem}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
};

// Edit Dialog Component
const EditItemDialog: React.FC<{
  editingItem: {section: string, index?: number, item?: any} | null;
  onSave: (section: string, item: any, index?: number) => void;
  onClose: () => void;
}> = ({ editingItem, onSave, onClose }) => {
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (editingItem?.item) {
      setFormData(editingItem.item);
    } else {
      setFormData({});
    }
  }, [editingItem]);

  if (!editingItem) return null;

  const handleSave = () => {
    onSave(editingItem.section, formData, editingItem.index);
  };

  const renderForm = () => {
    switch (editingItem.section) {
      case 'shareholder_structure':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="percentage">Participación (%)</Label>
              <Input
                id="percentage"
                value={formData.percentage || ''}
                onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type || 'individual'}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="institutional">Institucional</SelectItem>
                  <SelectItem value="corporate">Corporativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        );

      case 'management_team':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="education">Formación</Label>
              <Input
                id="education"
                value={formData.education || ''}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="experience">Experiencia</Label>
              <Textarea
                id="experience"
                value={formData.experience || ''}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tenure">Tiempo en el cargo</Label>
              <Input
                id="tenure"
                value={formData.tenure || ''}
                onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
              />
            </div>
          </div>
        );

      // Similar forms for other sections...
      default:
        return <p>Formulario no implementado para esta sección</p>;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem.index !== undefined ? 'Editar' : 'Agregar'} Elemento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {renderForm()}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};