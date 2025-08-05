import { useState, useEffect } from 'react';
import { templateService } from '@/services/templateService';

export const useTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = fetchTemplates; // Alias for compatibility

  const getRequiredTemplates = async () => {
    try {
      return await templateService.getRequiredTemplates();
    } catch (err) {
      setError(err);
      return [];
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    loadTemplates,
    getRequiredTemplates
  };
};

// Export additional hooks for compatibility
export const useTemplateDetection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detectTemplate = async (fileData: any) => {
    try {
      setLoading(true);
      return await templateService.detectTemplate(fileData);
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { detectTemplate, loading, error };
};

export const useCompanyTemplateCustomizations = (companyId: string) => {
  const [customizations, setCustomizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomizations = async () => {
    try {
      setLoading(true);
      const data = await templateService.getCompanyCustomizations(companyId);
      setCustomizations(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchCustomizations();
    }
  }, [companyId]);

  return {
    customizations,
    loading,
    error,
    fetchCustomizations
  };
};

export const useTemplateGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateTemplate = async (data: any) => {
    try {
      setLoading(true);
      return await templateService.generateTemplate(data);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateTemplate, loading, error };
};