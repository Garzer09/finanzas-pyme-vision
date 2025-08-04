import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, FileText, Brain, AlertCircle } from 'lucide-react';
import { formatFileSize, estimateProcessingTime } from '@/utils/fileProcessing';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface ProgressTrackerProps {
  fileName: string;
  fileSize: number;
  steps: ProgressStep[];
  currentStep?: string;
  progress: number; // 0-100
  estimatedTimeRemaining?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  fileName,
  fileSize,
  steps,
  currentStep,
  progress,
  estimatedTimeRemaining
}) => {
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <div className="h-5 w-5 border-2 border-steel-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStepTextColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-700';
      case 'processing':
        return 'text-steel-700 font-medium';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        {/* File Info Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-steel-700">
            <FileText className="h-5 w-5" />
            <span className="font-medium truncate max-w-xs" title={fileName}>
              {fileName}
            </span>
          </div>
          <div className="text-sm text-slate-500">
            {formatFileSize(fileSize)}
          </div>
          <div className="flex items-center gap-1 text-steel-600">
            <Brain className="h-4 w-4" />
            <span className="text-sm">IA Claude</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Progreso del análisis
            </span>
            <span className="text-sm text-slate-600">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {estimatedTimeRemaining && (
            <div className="text-xs text-slate-500 mt-1">
              Tiempo estimado restante: {estimatedTimeRemaining}
            </div>
          )}
        </div>

        {/* Processing Steps */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            Pasos del procesamiento:
          </h4>
          
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                step.status === 'processing' 
                  ? 'bg-steel-50 border border-steel-200' 
                  : step.status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : step.status === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <div className="flex-shrink-0">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${getStepTextColor(step)}`}>
                  {step.label}
                </div>
                {step.error && (
                  <div className="text-xs text-red-600 mt-1">
                    {step.error}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-slate-400">
                {index + 1}/{steps.length}
              </div>
            </div>
          ))}
        </div>

        {/* AI Processing Note */}
        <div className="mt-6 p-3 bg-steel-50 rounded-lg border border-steel-200">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-steel-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-steel-700">
              <strong>Claude AI</strong> está analizando tu archivo financiero extrayendo automáticamente:
              P&G, Balance, Flujos, Ratios, Pool Financiero y validando la consistencia de datos.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};