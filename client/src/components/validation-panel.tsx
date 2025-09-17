import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Info, AlertTriangle, Clock } from "lucide-react";
import type { Transcript } from "@shared/schema";

interface ValidationPanelProps {
  transcript?: Transcript;
}

export default function ValidationPanel({ transcript }: ValidationPanelProps) {
  if (!transcript) {
    return (
      <div className="w-80 bg-card border-l border-border p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Real-time Validation</h3>
        <p className="text-muted-foreground text-sm">Upload a transcript to see validation results</p>
      </div>
    );
  }

  const validationResults = transcript.validationResults;
  const hasHeader = transcript.detectiveInfo?.name && transcript.detectiveInfo?.badge;
  const hasSpeakers = transcript.speakers && transcript.speakers.length > 0;

  return (
    <div className="w-80 bg-card border-l border-border p-6" data-testid="validation-panel">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Real-time Validation</h3>
      
      {/* Validation Status */}
      <div className="space-y-4">
        <div className={`rounded-lg p-3 border ${hasHeader ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center">
            {hasHeader ? (
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            ) : (
              <Clock className="w-4 h-4 text-yellow-500 mr-2" />
            )}
            <span className={`text-sm font-medium ${hasHeader ? 'text-green-800' : 'text-yellow-800'}`}>
              Format Compliance
            </span>
          </div>
          <p className={`text-xs mt-1 ${hasHeader ? 'text-green-700' : 'text-yellow-700'}`}>
            {hasHeader ? 'LVMPD header information complete' : 'Missing detective information'}
          </p>
        </div>
        
        <div className={`rounded-lg p-3 border ${hasSpeakers ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center">
            <Info className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-blue-800">Speaker System</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {transcript.speakerType === "standard" ? "Standard Q/A format" : "Custom speaker labels"} detected
          </p>
        </div>
        
        {validationResults && (
          <div className={`rounded-lg p-3 border ${
            validationResults.issues.length === 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center">
              {validationResults.issues.length === 0 ? (
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                validationResults.issues.length === 0 ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Style Issues
              </span>
            </div>
            <p className={`text-xs mt-1 ${
              validationResults.issues.length === 0 ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {validationResults.issues.length === 0 
                ? 'No style issues found' 
                : `${validationResults.issues.length} potential corrections found`
              }
            </p>
          </div>
        )}
      </div>

      {/* Suggested Corrections */}
      {validationResults && validationResults.issues.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-card-foreground mb-3">Suggested Corrections</h4>
          <div className="space-y-3">
            {validationResults.issues.slice(0, 3).map((issue, index) => (
              <div key={index} className="bg-muted rounded-lg p-3" data-testid={`correction-${index}`}>
                <div className="text-xs text-muted-foreground mb-1">Line {issue.line}</div>
                <div className="text-sm mb-1">{issue.message}</div>
                {issue.suggestion && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Suggestion: {issue.suggestion}
                  </div>
                )}
                <div className="flex space-x-2 mt-2">
                  <Button size="sm" className="px-2 py-1 h-auto text-xs bg-green-100 text-green-800 hover:bg-green-200" data-testid={`button-accept-${index}`}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="px-2 py-1 h-auto text-xs" data-testid={`button-reject-${index}`}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style Guide Quick Reference */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-card-foreground mb-3">Quick Reference</h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Numbers 1-10:</span>
            <span className="font-mono">Spell out</span>
          </div>
          <div className="flex justify-between">
            <span>Numbers 11+:</span>
            <span className="font-mono">Use digits</span>
          </div>
          <div className="flex justify-between">
            <span>Time format:</span>
            <span className="font-mono">hh:mm am/pm</span>
          </div>
          <div className="flex justify-between">
            <span>Interruption:</span>
            <span className="font-mono">Use ...</span>
          </div>
          <div className="flex justify-between">
            <span>Unknown:</span>
            <span className="font-mono">UM:, UW:, UC:</span>
          </div>
        </div>
      </div>
    </div>
  );
}
