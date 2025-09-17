import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import TranscriptEditorComponent from "@/components/transcript-editor";
import ValidationPanel from "@/components/validation-panel";
import LVMPDTemplateForm from "@/components/lvmpd-template-form";
import SpeakerSystem from "@/components/speaker-system";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings, HelpCircle, Download, CheckCircle, Wand2, Eraser } from "lucide-react";
import type { Transcript } from "@shared/schema";

export default function TranscriptEditor() {
  const { id } = useParams<{ id?: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("original");

  // Fetch transcript if ID is provided
  const { data: transcript, isLoading } = useQuery<Transcript>({
    queryKey: ["/api/transcripts", id],
    enabled: !!id,
  });

  // Fetch all transcripts for recent files
  const { data: transcripts = [] } = useQuery<Transcript[]>({
    queryKey: ["/api/transcripts"],
  });

  // Process transcript mutation
  const processMutation = useMutation({
    mutationFn: async (transcriptId: string) => {
      const response = await fetch(`/api/transcripts/${transcriptId}/process`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to process transcript");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transcripts"] });
      toast({
        title: "Success",
        description: "Transcript processed successfully",
      });
      setActiveTab("processed");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process transcript",
        variant: "destructive",
      });
    },
  });

  const handleFileUploaded = (newTranscript: Transcript) => {
    queryClient.invalidateQueries({ queryKey: ["/api/transcripts"] });
    // Navigate to the new transcript
    window.history.pushState({}, "", `/transcript/${newTranscript.id}`);
    toast({
      title: "Success",
      description: "File uploaded successfully",
    });
  };

  const handleDownload = () => {
    if (!transcript?.processedContent) {
      toast({
        title: "Error",
        description: "No processed content to download",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([transcript.processedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${transcript.filename.replace(/\.[^/.]+$/, "")}_processed.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Transcript downloaded successfully",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-6 w-6" />
              <div>
                <h1 className="text-xl font-bold">LVMPD Transcript Editor</h1>
                <p className="text-sm text-primary-foreground/80">Professional Law Enforcement Transcription Tool</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-help">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <aside className="w-80 bg-card border-r border-border flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Document Upload</h2>
            <FileUpload onFileUploaded={handleFileUploaded} />
            
            {/* Recent Files */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-card-foreground mb-3">Recent Files</h3>
              <div className="space-y-2">
                {transcripts.slice(0, 5).map((t) => (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => window.history.pushState({}, "", `/transcript/${t.id}`)}
                    data-testid={`file-recent-${t.id}`}
                  >
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-file-alt text-muted-foreground"></i>
                      <span className="text-sm text-card-foreground truncate">{t.filename}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LVMPD Template Section */}
          {transcript && (
            <>
              <LVMPDTemplateForm transcript={transcript} />
              <SpeakerSystem transcript={transcript} />
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => transcript && processMutation.mutate(transcript.id)}
                  disabled={!transcript || processMutation.isPending}
                  data-testid="button-process"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {processMutation.isPending ? "Processing..." : "Process Transcript"}
                </Button>
                <Button variant="secondary" data-testid="button-validate">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate
                </Button>
                <Button variant="outline" data-testid="button-clear">
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Status:</span>
                {transcript && getStatusBadge(transcript.status)}
                <Button
                  onClick={handleDownload}
                  disabled={!transcript?.processedContent}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-download"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex">
            <div className="flex-1 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="original">Original Transcript</TabsTrigger>
                  <TabsTrigger value="processed">Processed Transcript</TabsTrigger>
                  <TabsTrigger value="validation">Validation Report</TabsTrigger>
                </TabsList>
                
                <TabsContent value="original" className="flex-1 mt-4">
                  <TranscriptEditorComponent 
                    transcript={transcript} 
                    contentType="original"
                  />
                </TabsContent>
                
                <TabsContent value="processed" className="flex-1 mt-4">
                  <TranscriptEditorComponent 
                    transcript={transcript} 
                    contentType="processed"
                  />
                </TabsContent>
                
                <TabsContent value="validation" className="flex-1 mt-4">
                  <div className="h-full border border-border rounded-lg bg-background p-6">
                    <h3 className="text-lg font-semibold mb-4">Validation Report</h3>
                    {transcript?.validationResults ? (
                      <div>
                        <div className="mb-4">
                          <span className="text-sm text-muted-foreground">Overall Score: </span>
                          <span className="font-semibold">{transcript.validationResults.score}/100</span>
                        </div>
                        <div className="space-y-2">
                          {transcript.validationResults.issues.map((issue, index) => (
                            <div key={index} className="bg-muted rounded-lg p-3">
                              <div className="text-sm font-medium">Line {issue.line}: {issue.message}</div>
                              {issue.suggestion && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Suggestion: {issue.suggestion}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Process transcript to see validation results</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Validation Panel */}
            <ValidationPanel transcript={transcript} />
          </div>
        </main>
      </div>
    </div>
  );
}
