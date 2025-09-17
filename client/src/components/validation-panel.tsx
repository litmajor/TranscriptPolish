import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, CheckCircle, Info, ChevronDown, ChevronRight, Zap, Target } from "lucide-react";
import type { Transcript } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ValidationPanelProps {
  transcript: Transcript;
  processingSummary?: string;
  appliedRules?: number;
  issuesFixed?: number;
}

export default function ValidationPanel({ transcript }: ValidationPanelProps) {
  const _s = $RefreshSig$();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  // Early return if no transcript
  if (!transcript) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Validation Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No transcript loaded</p>
        </CardContent>
      </Card>
    );
  }

  // Get validation results from transcript or create default
  const validationResults = transcript.validationResults || { issues: [], score: 0 };
  const { issues, score } = validationResults;
  const errorCount = issues.filter(issue => issue.type === "header" || issue.type === "footer").length;
  const warningCount = issues.filter(issue => !["header", "footer"].includes(issue.type)).length;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  const getIssueIcon = (type: string) => {
    const criticalTypes = ["header", "footer", "transcription_error"];
    if (criticalTypes.includes(type)) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <Info className="h-4 w-4 text-yellow-500" />;
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      header: "Missing Header",
      footer: "Missing Footer",
      transcription_error: "Transcription Error",
      audio_quality: "Audio Quality",
      discourse_marker: "Discourse Marker",
      number_format: "Number Format",
      date_format: "Date Format",
      speaker_identification: "Speaker ID",
      punctuation: "Punctuation",
      capitalization: "Capitalization",
      time_format: "Time Format"
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validation Results
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getScoreBadgeVariant(score)} className="text-lg px-3 py-1">
                {score}/100
              </Badge>
              {appliedRules > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {appliedRules} rules applied
                </Badge>
              )}
              {issuesFixed > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {issuesFixed} fixes
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Score Summary */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Overall Quality Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}/100
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Issues Found</p>
                <div className="flex gap-2">
                  {errorCount > 0 && (
                    <Badge variant="destructive">{errorCount} critical</Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge variant="secondary">{warningCount} warnings</Badge>
                  )}
                  {issues.length === 0 && (
                    <Badge variant="default">Perfect!</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Processing Summary */}
            {processingSummary && (
              <Collapsible open={showProcessingDetails} onOpenChange={setShowProcessingDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Processing Details</span>
                    {showProcessingDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap text-blue-800 font-mono">
                      {processingSummary}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Issues List */}
            {issues.length > 0 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Issues & Suggestions ({issues.length})</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 mt-4">
                    {issues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 border border-border rounded-md"
                      >
                        {getIssueIcon(issue.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {getIssueTypeLabel(issue.type)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Line {issue.line}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {issue.message}
                          </p>
                          {issue.suggestion && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <strong>Suggestion:</strong> {issue.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Perfect Score Message */}
            {issues.length === 0 && (
              <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-green-800">Perfect Transcript!</h3>
                <p className="text-sm text-green-600">
                  This transcript meets all LVMPD formatting standards and guidelines.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}