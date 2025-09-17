
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transcript } from "@shared/schema";

interface TranscriptComparisonProps {
  transcript: Transcript;
}

export default function TranscriptComparison({ transcript }: TranscriptComparisonProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "diff">("side-by-side");
  const { toast } = useToast();

  const originalContent = transcript.originalContent || "";
  const processedContent = transcript.processedContent || "";

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
    const originalWords = originalContent.split(/\s+/).length;
    const processedWords = processedContent.split(/\s+/).length;
    const originalLines = originalContent.split('\n').length;
    const processedLines = processedContent.split('\n').length;

    return {
      wordDiff: processedWords - originalWords,
      lineDiff: processedLines - originalLines,
      originalWords,
      processedWords,
      originalLines,
      processedLines
    };
  };

  const stats = getDiffStats();

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-medium">Transcript Comparison</h3>
            <div className="flex gap-2">
              <Badge variant="outline">
                Original: {stats.originalWords} words, {stats.originalLines} lines
              </Badge>
              <Badge variant="outline">
                Processed: {stats.processedWords} words, {stats.processedLines} lines
              </Badge>
              {stats.wordDiff !== 0 && (
                <Badge variant={stats.wordDiff > 0 ? "default" : "secondary"}>
                  {stats.wordDiff > 0 ? "+" : ""}{stats.wordDiff} words
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
                            Original Score: {originalVersion.score}/100
                          </Badge>
                        )}
                        {processedVersion?.score !== undefined && (
                          <Badge variant={processedVersion.score > (originalVersion?.score || 0) ? "default" : "secondary"}>
                            Processed Score: {processedVersion.score}/100
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
              variant={viewMode === "side-by-side" ? "default" : "outline"}
              onClick={() => setViewMode("side-by-side")}
            >
              <ArrowLeftRight className="w-4 h-4 mr-1" />
              Side by Side
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Content */}
      <div className="flex-1 flex">
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
    </div>
  );
}
