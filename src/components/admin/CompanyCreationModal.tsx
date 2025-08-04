import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompanyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onCompanyCreated: () => void;
}

export const CompanyCreationModal: React.FC<CompanyCreationModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onCompanyCreated
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    currency_code: 'EUR',
    accounting_standard: 'PGC'
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es obligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name.trim(),
          sector: formData.sector.trim() || null,
          currency_code: formData.currency_code,
          accounting_standard: formData.accounting_standard,
          created_by: userId
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create membership for the user
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: userId,
          company_id: company.id,
          role: 'member'
        });

      if (membershipError) throw membershipError;

      toast({
        title: "Empresa creada",
        description: `La empresa "${formData.name}" ha sido creada y asignada al usuario`,
        variant: "default"
      });

      // Reset form
      setFormData({
        name: '',
        sector: '',
        currency_code: 'EUR',
        accounting_standard: 'PGC'
      });

      onCompanyCreated();
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la empresa",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFormData({
        name: '',
        sector: '',
        currency_code: 'EUR',
        accounting_standard: 'PGC'
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Crear Nueva Empresa
          </DialogTitle>
          <DialogDescription>
            Crea una nueva empresa y asígnala automáticamente a {userEmail}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nombre de la Empresa *</Label>
            <Input
              id="company-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Acme Corp"
              required
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              value={formData.sector}
              onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
              placeholder="Ej: Tecnología, Retail, Manufactura..."
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select
              value={formData.currency_code}
              onValueChange={(value) => setFormData(prev => ({ ...prev, currency_code: value }))}
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="USD">USD - Dólar</SelectItem>
                <SelectItem value="GBP">GBP - Libra</SelectItem>
                <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accounting">Estándar Contable</Label>
            <Select
              value={formData.accounting_standard}
              onValueChange={(value) => setFormData(prev => ({ ...prev, accounting_standard: value }))}
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PGC">PGC - Plan General Contable</SelectItem>
                <SelectItem value="IFRS">IFRS - International Financial Reporting Standards</SelectItem>
                <SelectItem value="GAAP">GAAP - Generally Accepted Accounting Principles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !formData.name.trim()}
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Empresa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};