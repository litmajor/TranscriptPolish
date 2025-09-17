
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardPaste, Eraser, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transcript } from "@shared/schema";

interface TranscriptEditorProps {
  transcript?: Transcript;
  contentType: "original" | "processed";
  onClear?: () => void;
}

export default function TranscriptEditorComponent({ transcript, contentType, onClear }: TranscriptEditorProps) {
  const [content, setContent] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async ({ id, originalContent, createVersion = false }: { id: string; originalContent: string; createVersion?: boolean }) => {
      const updates: any = { originalContent };
      
      // Add version tracking if requested
      if (createVersion && transcript) {
        const newVersion = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
          content: originalContent,
          type: "original" as const,
          changes: `Updated ${contentType} content`,
        };
        
        const existingVersions = transcript.versions || [];
        updates.versions = [...existingVersions, newVersion];
      }

      const response = await fetch(`/api/transcripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to update transcript");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transcripts"] });
    },
  });

  useEffect(() => {
    if (transcript) {
      const displayContent = contentType === "processed" 
        ? transcript.processedContent || ""
        : transcript.originalContent || "";
      setContent(displayContent);
    }
  }, [transcript, contentType]);

  const handleContentChange = (value: string) => {
    setContent(value);
    
    // Auto-save original content changes with versioning
    if (contentType === "original" && transcript) {
      const timeoutId = setTimeout(() => {
        updateMutation.mutate({ 
          id: transcript.id, 
          originalContent: value, 
          createVersion: true 
        });
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setContent(clipboardText);
        if (contentType === "original" && transcript) {
          updateMutation.mutate({ 
            id: transcript.id, 
            originalContent: clipboardText, 
            createVersion: true 
          });
        }
        toast({
          title: "Success",
          description: "Content pasted successfully",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to paste content. Please use Ctrl+V manually.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setContent("");
    if (contentType === "original" && transcript) {
      updateMutation.mutate({ 
        id: transcript.id, 
        originalContent: "", 
        createVersion: true 
      });
    }
    onClear?.();
    toast({
      title: "Success",
      description: "Content cleared successfully",
    });
  };

  const restoreVersion = (version: any) => {
    setContent(version.content);
    if (contentType === "original" && transcript) {
      updateMutation.mutate({ 
        id: transcript.id, 
        originalContent: version.content, 
        createVersion: true 
      });
    }
    toast({
      title: "Success",
      description: "Version restored successfully",
    });
  };

  if (!transcript) {
    return (
      <div className="h-full border border-border rounded-lg bg-background flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">No Transcript Selected</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePaste}>
                <ClipboardPaste className="w-4 h-4 mr-1" />
                Paste
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Upload a transcript file to begin editing</p>
        </div>
      </div>
    );
  }

  const versions = transcript.versions?.filter(v => v.type === contentType) || [];

  return (
    <div className="h-full border border-border rounded-lg bg-background flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">
              {contentType === "original" ? "Original" : "Processed"} Transcript
            </h3>
            {versions.length > 0 && (
              <Badge variant="secondary">{versions.length} versions</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {contentType === "original" && (
              <>
                <Button size="sm" variant="outline" onClick={handlePaste}>
                  <ClipboardPaste className="w-4 h-4 mr-1" />
                  Paste
                </Button>
                <Button size="sm" variant="outline" onClick={handleClear}>
                  <Eraser className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </>
            )}
            {versions.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowVersions(!showVersions)}
              >
                <History className="w-4 h-4 mr-1" />
                Versions
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Version History */}
      {showVersions && versions.length > 0 && (
        <div className="p-4 border-b border-border bg-muted/30 max-h-32 overflow-y-auto">
          <div className="space-y-2">
            {versions.slice(-5).reverse().map((version) => (
              <div key={version.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {new Date(version.timestamp).toLocaleString()}
                  </span>
                  {version.changes && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      - {version.changes}
                    </span>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => restoreVersion(version)}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={
            contentType === "original"
              ? "Paste or upload your transcript here for processing..."
              : "Processed transcript will appear here after processing..."
          }
          className="w-full h-full resize-none border-0 bg-transparent transcript-editor text-sm leading-relaxed focus:ring-0 focus:outline-none p-6"
          style={{
            fontFamily: "'Source Code Pro', Consolas, monospace",
            lineHeight: "1.6",
          }}
          readOnly={contentType === "processed"}
          data-testid={`editor-${contentType}`}
        />
      </div>
    </div>
  );
}
