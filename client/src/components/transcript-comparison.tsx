
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transcript } from "@shared/schema";

interface TranscriptComparisonProps {
  transcript: Transcript;
}

interface DiffChange {
  type: 'added' | 'removed' | 'unchanged' | 'suggested';
  content: string;
  lineNumber?: number;
}

export default function TranscriptComparison({ transcript }: TranscriptComparisonProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const { toast } = useToast();

  const originalContent = transcript.originalContent || "";
  const processedContent = transcript.processedContent || "";

  const diffChanges = useMemo(() => {
    return generateDiff(originalContent, processedContent);
  }, [originalContent, processedContent]);

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Success",
        description: `${type} content copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getDiffStats = () => {
    const added = diffChanges.filter(c => c.type === 'added').length;
    const removed = diffChanges.filter(c => c.type === 'removed').length;
    const suggested = diffChanges.filter(c => c.type === 'suggested').length;
    
    const originalWords = originalContent.split(/\s+/).filter(w => w.length > 0).length;
    const processedWords = processedContent.split(/\s+/).filter(w => w.length > 0).length;
    
    return {
      added,
      removed,
      suggested,
      wordDiff: processedWords - originalWords,
      originalWords,
      processedWords
    };
  };

  const stats = getDiffStats();

  const renderDiffLine = (change: DiffChange, index: number) => {
    const baseClasses = "px-2 py-1 font-mono text-sm leading-relaxed";
    let classes = baseClasses;
    let prefix = "";

    switch (change.type) {
      case 'added':
        classes += " bg-green-100 border-l-4 border-green-500 text-green-800";
        prefix = "+ ";
        break;
      case 'removed':
        classes += " bg-red-100 border-l-4 border-red-500 text-red-800 line-through";
        prefix = "- ";
        break;
      case 'suggested':
        classes += " bg-blue-100 border-l-4 border-blue-500 text-blue-800";
        prefix = "? ";
        break;
      default:
        classes += " bg-white";
        prefix = "  ";
    }

    if (change.type === 'suggested' && !showSuggestions) {
      return null;
    }

    return (
      <div key={index} className={classes}>
        <span className="text-gray-400 mr-2 select-none">{prefix}</span>
        {change.content}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-medium">Transcript Comparison</h3>
            <div className="flex gap-2">
              <Badge variant="outline">
                Original: {stats.originalWords} words
              </Badge>
              <Badge variant="outline">
                Processed: {stats.processedWords} words
              </Badge>
              {stats.added > 0 && (
                <Badge className="bg-green-100 text-green-800">
                  +{stats.added} additions
                </Badge>
              )}
              {stats.removed > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  -{stats.removed} removals
                </Badge>
              )}
              {stats.suggested > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  {stats.suggested} suggestions
                </Badge>
              )}
              
              {/* Score badges */}
              {transcript.versions && transcript.versions.length > 0 && (
                <>
                  {(() => {
                    const originalVersion = transcript.versions.find(v => v.type === "original");
                    const processedVersion = transcript.versions.find(v => v.type === "processed");
                    return (
                      <>
                        {originalVersion?.score !== undefined && (
                          <Badge variant="secondary">
                            Original: {originalVersion.score}/100
                          </Badge>
                        )}
                        {processedVersion?.score !== undefined && (
                          <Badge variant={processedVersion.score > (originalVersion?.score || 0) ? "default" : "secondary"}>
                            Processed: {processedVersion.score}/100
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showSuggestions ? "default" : "outline"}
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Suggestions
            </Button>
            <Button
              size="sm"
              variant={viewMode === "side-by-side" ? "default" : "outline"}
              onClick={() => setViewMode(viewMode === "side-by-side" ? "unified" : "side-by-side")}
            >
              <ArrowLeftRight className="w-4 h-4 mr-1" />
              {viewMode === "side-by-side" ? "Unified" : "Side by Side"}
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "unified" ? (
          <div className="p-4">
            <div className="border rounded-lg overflow-hidden">
              {diffChanges.map((change, index) => renderDiffLine(change, index))}
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Original Content */}
            <div className="flex-1 border-r border-border">
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Original Transcript</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(originalContent, "Original")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="h-full overflow-auto p-6">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {originalContent || "No original content"}
                </pre>
              </div>
            </div>

            {/* Processed Content */}
            <div className="flex-1">
              <div className="p-4 border-b border-border bg-green-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Processed Transcript</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(processedContent, "Processed")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="h-full overflow-auto p-6">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {processedContent || "No processed content available"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function generateDiff(original: string, processed: string): DiffChange[] {
  const originalLines = original.split('\n');
  const processedLines = processed.split('\n');
  const changes: DiffChange[] = [];

  const maxLines = Math.max(originalLines.length, processedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || '';
    const processedLine = processedLines[i] || '';

    if (originalLine === processedLine) {
      if (originalLine.trim() !== '') {
        changes.push({
          type: 'unchanged',
          content: originalLine,
          lineNumber: i + 1
        });
      }
    } else {
      // Line was removed
      if (originalLine && !processedLine) {
        changes.push({
          type: 'removed',
          content: originalLine,
          lineNumber: i + 1
        });
      }
      // Line was added
      else if (!originalLine && processedLine) {
        changes.push({
          type: 'added',
          content: processedLine,
          lineNumber: i + 1
        });
      }
      // Line was modified
      else if (originalLine !== processedLine) {
        if (originalLine.trim() !== '') {
          changes.push({
            type: 'removed',
            content: originalLine,
            lineNumber: i + 1
          });
        }
        if (processedLine.trim() !== '') {
          changes.push({
            type: 'added',
            content: processedLine,
            lineNumber: i + 1
          });
        }
      }
    }
  }

  return changes;
}
