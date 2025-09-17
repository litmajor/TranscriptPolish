import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import type { Transcript } from "@shared/schema";

interface TranscriptEditorProps {
  transcript?: Transcript;
  contentType: "original" | "processed";
}

export default function TranscriptEditorComponent({ transcript, contentType }: TranscriptEditorProps) {
  const [content, setContent] = useState("");

  const updateMutation = useMutation({
    mutationFn: async ({ id, originalContent }: { id: string; originalContent: string }) => {
      const response = await fetch(`/api/transcripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalContent }),
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
    
    // Auto-save original content changes
    if (contentType === "original" && transcript) {
      const timeoutId = setTimeout(() => {
        updateMutation.mutate({ id: transcript.id, originalContent: value });
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  if (!transcript) {
    return (
      <div className="h-full border border-border rounded-lg bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Upload a transcript file to begin editing</p>
      </div>
    );
  }

  return (
    <div className="h-full border border-border rounded-lg bg-background">
      <Textarea
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
  );
}
