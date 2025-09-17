import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transcript } from "@shared/schema";

interface FileUploadProps {
  onFileUploaded: (transcript: Transcript) => void;
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/transcripts/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (transcript: Transcript) => {
      setIsUploading(false);
      onFileUploaded(transcript);
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-primary/50 bg-primary/5"
          : "border-border hover:border-primary/50 bg-muted/30"
      }`}
      data-testid="file-upload-area"
    >
      <input {...getInputProps()} data-testid="file-upload-input" />
      <CloudUpload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm font-medium text-card-foreground mb-1">
        {isUploading ? "Uploading..." : "Drop transcript files here"}
      </p>
      <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
      <p className="text-xs text-muted-foreground">Supports: .txt, .docx, .pdf</p>
    </div>
  );
}
