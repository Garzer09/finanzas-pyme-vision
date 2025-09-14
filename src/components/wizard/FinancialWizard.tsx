import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { ModuleSelectionStep } from './ModuleSelectionStep';
import { BalanceSheetStep } from './BalanceSheetStep';
import { ProfitLossStep } from './ProfitLossStep';
import { DebtPoolStep } from './DebtPoolStep';
import { CashFlowStep } from './CashFlowStep';
import { FinancialAssumptionsStep } from './FinancialAssumptionsStep';

import { saveFinancialWizardData } from '@/services/financialWizardService';

interface FinancialWizardProps {
  companyId: string;
}

export interface WizardData {
  mode: 'new' | 'update';
  selectedModules: string[];
  balanceSheet: any;
  profitLoss: any;
  debtPool: any[];
  cashFlow: any;
  assumptions: any;
}

const STEPS = [
  'Configuración',
  'Balance',
  'Cuenta P&G',
  'Pool Deuda',
  'Cash Flow',
  'Supuestos'
];

export const FinancialWizard: React.FC<FinancialWizardProps> = ({ companyId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [wizardData, setWizardData] = useState<WizardData>({
    mode: 'new',
    selectedModules: [],
    balanceSheet: {},
    profitLoss: {},
    debtPool: [],
    cashFlow: {},
    assumptions: {}
  });

  const updateWizardData = (key: keyof WizardData, value: any) => {
    setWizardData(prev => ({ ...prev, [key]: value }));
  };

  const isStepRequired = (stepIndex: number): boolean => {
    if (stepIndex <= 2) return true; // Configuration, Balance, P&L always required
    
    const { selectedModules } = wizardData;
    
    switch (stepIndex) {
      case 3: // Debt Pool
        return selectedModules.includes('debt-pool') || selectedModules.includes('debt-service');
      case 4: // Cash Flow  
        return selectedModules.includes('cash-flow');
      case 5: // Assumptions
        return selectedModules.includes('projections') || selectedModules.includes('valuation');
      default:
        return false;
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Module Selection
        return wizardData.selectedModules.length > 0;
      case 1: // Balance Sheet
        return validateBalanceSheet(wizardData.balanceSheet);
      case 2: // P&L
        return validateProfitLoss(wizardData.profitLoss);
      case 3: // Debt Pool
        return !isStepRequired(3) || wizardData.debtPool.length > 0;
      case 4: // Cash Flow
        return !isStepRequired(4) || Object.keys(wizardData.cashFlow).length > 0;
      case 5: // Assumptions
        return !isStepRequired(5) || Object.keys(wizardData.assumptions).length > 0;
      default:
        return true;
    }
  };

  const validateBalanceSheet = (balance: any): boolean => {
    const required = ['activoCorriente', 'activoNoCorriente', 'pasivoCorriente', 'pasivoNoCorriente', 'patrimonioNeto'];
    return required.every(field => balance[field] !== undefined && balance[field] !== null);
  };

  const validateProfitLoss = (pyg: any): boolean => {
    const required = ['ingresos', 'costes', 'ebitda', 'amortizaciones', 'gastosFinancieros'];
    return required.every(field => pyg[field] !== undefined && pyg[field] !== null);
  };

  const handleNext = () => {
    if (canProceed()) {
      let nextStep = currentStep + 1;
      
      // Skip non-required steps
      while (nextStep < STEPS.length && !isStepRequired(nextStep)) {
        nextStep++;
      }
      
      if (nextStep < STEPS.length) {
        setCurrentStep(nextStep);
      }
    }
  };

  const handlePrevious = () => {
    let prevStep = currentStep - 1;
    
    // Skip non-required steps going backwards
    while (prevStep >= 0 && !isStepRequired(prevStep)) {
      prevStep--;
    }
    
    if (prevStep >= 0) {
      setCurrentStep(prevStep);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const result = await saveFinancialWizardData(companyId, wizardData);
      
      toast({
        title: "Datos guardados exitosamente",
        description: `${result.ratiosCalculated} ratios calculados, ${result.kpisGenerated} KPIs disponibles`,
      });

      // Navigate to company dashboard
      navigate(`/app/${companyId}`);
      
    } catch (error) {
      console.error('Error saving wizard data:', error);
      toast({
        title: "Error al guardar datos",
        description: "Por favor, inténtelo de nuevo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (canProceed()) {
      await handleSave();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ModuleSelectionStep
            mode={wizardData.mode}
            selectedModules={wizardData.selectedModules}
            onModeChange={(mode) => updateWizardData('mode', mode)}
            onModulesChange={(modules) => updateWizardData('selectedModules', modules)}
          />
        );
      case 1:
        return (
          <BalanceSheetStep
            data={wizardData.balanceSheet}
            onChange={(data) => updateWizardData('balanceSheet', data)}
          />
        );
      case 2:
        return (
          <ProfitLossStep
            data={wizardData.profitLoss}
            onChange={(data) => updateWizardData('profitLoss', data)}
          />
        );
      case 3:
        return (
          <DebtPoolStep
            data={wizardData.debtPool}
            onChange={(data) => updateWizardData('debtPool', data)}
          />
        );
      case 4:
        return (
          <CashFlowStep
            data={wizardData.cashFlow}
            balanceSheet={wizardData.balanceSheet}
            profitLoss={wizardData.profitLoss}
            onChange={(data) => updateWizardData('cashFlow', data)}
          />
        );
      case 5:
        return (
          <FinancialAssumptionsStep
            data={wizardData.assumptions}
            onChange={(data) => updateWizardData('assumptions', data)}
          />
        );
      default:
        return null;
    }
  };

  const getVisibleSteps = () => {
    return STEPS.filter((_, index) => index <= 2 || isStepRequired(index));
  };

  const getCurrentStepIndex = () => {
    const visibleSteps = getVisibleSteps();
    const actualStepNames = STEPS.filter((_, index) => index <= 2 || isStepRequired(index));
    return actualStepNames.findIndex((_, index) => {
      let stepIndex = 0;
      for (let i = 0; i <= index; i++) {
        while (stepIndex < STEPS.length && (stepIndex <= 2 || isStepRequired(stepIndex))) {
          if (i === index) return stepIndex === currentStep;
          stepIndex++;
          break;
        }
      }
      return false;
    });
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1 || 
                   (currentStep >= 2 && !STEPS.slice(currentStep + 1).some((_, i) => isStepRequired(currentStep + 1 + i)));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/empresas')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Empresas
            </Button>
            <h1 className="text-2xl font-bold">Wizard de Datos Financieros</h1>
          </div>
          
          <Stepper
            steps={getVisibleSteps()}
            currentStep={getCurrentStepIndex()}
            className="mb-4"
          />
          
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{STEPS[currentStep]}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isLoading || !canProceed()}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Progreso
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleFinish}
                disabled={isLoading || !canProceed()}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isLoading ? 'Guardando...' : 'Finalizar'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};