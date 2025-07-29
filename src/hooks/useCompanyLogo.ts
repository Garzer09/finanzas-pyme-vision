import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCompanyLogo = (targetUserId?: string) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Fetch current logo URL
  const fetchLogo = async () => {
    try {
      setLoading(true);
      let userId = targetUserId;
      
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('company_logo_url')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching logo:', error);
        return;
      }

      setLogoUrl(data?.company_logo_url || null);
    } catch (error) {
      console.error('Error fetching logo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Upload new logo
  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      let userId = targetUserId;
      
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Error",
            description: "Usuario no autenticado",
            variant: "destructive",
          });
          return null;
        }
        userId = user.id;
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Formato de archivo no válido. Use PNG, JPG o SVG.",
          variant: "destructive",
        });
        return null;
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 2MB.",
          variant: "destructive",
        });
        return null;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${userId}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Error",
          description: "Error al subir el archivo",
          variant: "destructive",
        });
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const newLogoUrl = urlData.publicUrl;

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ company_logo_url: newLogoUrl })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        toast({
          title: "Error",
          description: "Error al actualizar el perfil",
          variant: "destructive",
        });
        return null;
      }

      setLogoUrl(newLogoUrl);
      toast({
        title: "Éxito",
        description: "Logo actualizado correctamente",
      });

      return newLogoUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Error inesperado al subir el logo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Remove logo
  const removeLogo = async () => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user profile to remove logo URL
      const { error } = await supabase
        .from('user_profiles')
        .update({ company_logo_url: null })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing logo:', error);
        toast({
          title: "Error",
          description: "Error al eliminar el logo",
          variant: "destructive",
        });
        return;
      }

      setLogoUrl(null);
      toast({
        title: "Éxito",
        description: "Logo eliminado correctamente",
      });
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: "Error",
        description: "Error inesperado al eliminar el logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchLogo();
  }, []);

  return {
    logoUrl,
    loading,
    uploading,
    uploadLogo,
    removeLogo,
    refreshLogo: fetchLogo
  };
};