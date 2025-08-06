import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Database, FileText, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DummyDataReport {
  component: string;
  hasRealData: boolean;
  dataSource: string;
  issues: string[];
  suggestions: string[];
}

export const DummyDataAuditor: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [reports, setReports] = useState<DummyDataReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditDummyData();
  }, [companyId]);

  const auditDummyData = async () => {
    setLoading(true);
    const reports: DummyDataReport[] = [];

    try {
      if (companyId) {
        // Check unified financial data
        const { data: unifiedFinancialData } = await supabase
          .from('financial_series_unified')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        const hasUnifiedData = unifiedFinancialData && unifiedFinancialData.length > 0;

        reports.push({
          component: 'Financial KPIs',
          hasRealData: hasUnifiedData,
          dataSource: hasUnifiedData ? 'financial_series_unified table' : 'No data',
          issues: hasUnifiedData ? [] : ['No financial data uploaded to unified system'],
          suggestions: hasUnifiedData ? [] : ['Upload data using unified templates']
        });

        // Check company profile data
        const { data: profileData } = await supabase
          .from('company_profile_unified')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        const hasProfileData = profileData && profileData.length > 0;

        reports.push({
          component: 'Company Profile',
          hasRealData: hasProfileData,
          dataSource: hasProfileData ? 'company_profile_unified table' : 'No data',
          issues: hasProfileData ? [] : ['No company profile data uploaded'],
          suggestions: hasProfileData ? [] : ['Upload company profile template']
        });

        // Check debt data
        const { data: debtData } = await supabase
          .from('debt_loans')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        const hasDebtData = debtData && debtData.length > 0;

        reports.push({
          component: 'Debt Analysis',
          hasRealData: hasDebtData,
          dataSource: hasDebtData ? 'debt_loans table' : 'No data',
          issues: hasDebtData ? [] : ['No debt data uploaded'],
          suggestions: hasDebtData ? [] : ['Upload debt pool template']
        });
      } else {
        reports.push({
          component: 'All Components',
          hasRealData: false,
          dataSource: 'No company selected',
          issues: ['No company ID provided'],
          suggestions: ['Select a company to audit data']
        });
      }

      setReports(reports);
    } catch (error) {
      console.error('Error auditing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (report: DummyDataReport) => {
    if (report.hasRealData) {
      return <CheckCircle className="h-5 w-5 text-success" />;
    }
    return <AlertTriangle className="h-5 w-5 text-warning" />;
  };

  const getStatusBadge = (report: DummyDataReport) => {
    if (report.hasRealData) {
      return <Badge variant="default" className="bg-success/10 text-success border-success/20">Real Data</Badge>;
    }
    return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">No Data</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Quality Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalComponents = reports.length;
  const componentsWithRealData = reports.filter(r => r.hasRealData).length;
  const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Quality Audit Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-success">{componentsWithRealData}</div>
              <div className="text-sm text-muted-foreground">Components with Real Data</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-warning">{totalComponents - componentsWithRealData}</div>
              <div className="text-sm text-muted-foreground">Components with No Data</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-destructive">{totalIssues}</div>
              <div className="text-sm text-muted-foreground">Total Issues Found</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reports */}
      <div className="grid gap-4">
        {reports.map((report, index) => (
          <Card key={index} className="transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(report)}
                  <div>
                    <h3 className="font-semibold">{report.component}</h3>
                    <p className="text-sm text-muted-foreground">{report.dataSource}</p>
                  </div>
                </div>
                {getStatusBadge(report)}
              </div>

              {report.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-destructive mb-2">Issues Found:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {report.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-info mb-2">Suggestions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {report.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-info mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Panel */}
      {totalIssues > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Next Steps</h3>
                <p className="text-sm text-muted-foreground">
                  Upload real data to replace the current gaps and improve your dashboard accuracy.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  View Templates
                </Button>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};