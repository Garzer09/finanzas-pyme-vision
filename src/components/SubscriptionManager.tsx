
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: Record<string, any>;
  modules_access: string[];
}

interface UserProfile {
  id: string;
  subscription_plan_id: string;
  subscription_status: string;
  subscription_expires_at: string;
}

export const SubscriptionManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar planes de suscripción
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price');

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Cargar perfil del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de suscripción",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionChange = async (planId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (userProfile) {
        // Actualizar suscripción existente
        const { error } = await supabase
          .from('user_profiles')
          .update({
            subscription_plan_id: planId,
            subscription_status: 'active',
            subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Crear nuevo perfil
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            subscription_plan_id: planId,
            subscription_status: 'active',
            subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: "Suscripción actualizada",
        description: "Tu plan de suscripción ha sido actualizado exitosamente",
      });

      loadData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la suscripción",
        variant: "destructive"
      });
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <Zap className="h-6 w-6" />;
      case 'standard': return <Star className="h-6 w-6" />;
      case 'premium': return <Crown className="h-6 w-6" />;
      default: return <Check className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'standard': return 'from-purple-500/20 to-violet-500/20 border-purple-500/30';
      case 'premium': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Cargando planes de suscripción...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Elige tu Plan de Suscripción</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Selecciona el plan que mejor se adapte a las necesidades de tu empresa. 
          Todos los planes incluyen análisis financiero avanzado y soporte técnico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = userProfile?.subscription_plan_id === plan.id;
          const isRecommended = plan.name.toLowerCase() === 'standard';

          return (
            <Card
              key={plan.id}
              className={`bg-gradient-to-br ${getPlanColor(plan.name)} backdrop-blur-sm border p-6 relative ${
                isRecommended ? 'ring-2 ring-purple-400/50' : ''
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">Recomendado</Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex justify-center mb-3 text-white">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
                <div className="text-3xl font-bold text-white">
                  €{plan.price}
                  <span className="text-lg font-normal text-gray-300">/mes</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Archivos Excel:</span> {
                    plan.features.max_excel_files === 'unlimited' 
                      ? 'Ilimitados' 
                      : plan.features.max_excel_files
                  }
                </div>
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Escenarios:</span> {
                    plan.features.max_scenarios === 'unlimited' 
                      ? 'Ilimitados' 
                      : plan.features.max_scenarios
                  }
                </div>
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Soporte:</span> {
                    plan.features.support === 'email' 
                      ? 'Email' 
                      : plan.features.support === 'priority'
                      ? 'Prioritario'
                      : 'Teléfono'
                  }
                </div>
                {plan.features.ai_insights && (
                  <div className="flex items-center gap-2 text-sm text-green-300">
                    <Check className="h-4 w-4" />
                    Insights de IA
                  </div>
                )}
                {plan.features.custom_kpis && (
                  <div className="flex items-center gap-2 text-sm text-green-300">
                    <Check className="h-4 w-4" />
                    KPIs personalizados
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-white mb-2">Módulos incluidos:</p>
                {plan.modules_access.map((module) => (
                  <div key={module} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-3 w-3 text-green-400" />
                    {module.replace('-', ' ').charAt(0).toUpperCase() + module.replace('-', ' ').slice(1)}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleSubscriptionChange(plan.id)}
                className={`w-full ${
                  isCurrentPlan
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-white hover:bg-gray-100 text-gray-900'
                }`}
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? 'Plan Actual' : 'Seleccionar Plan'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
