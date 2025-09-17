import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transcript } from "@shared/schema";

interface SpeakerSystemProps {
  transcript: Transcript;
}

export default function SpeakerSystem({ transcript }: SpeakerSystemProps) {
  const { toast } = useToast();
  
  const [speakerType, setSpeakerType] = useState(transcript.speakerType || "standard");
  const [speakers, setSpeakers] = useState(transcript.speakers || []);
  const [newSpeakerLabel, setNewSpeakerLabel] = useState("");
  const [newSpeakerDescription, setNewSpeakerDescription] = useState("");

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/transcripts/${transcript.id}`, {
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update speaker system",
        variant: "destructive",
      });
    },
  });

  const handleSpeakerTypeChange = (newType: string) => {
    setSpeakerType(newType);
    
    // Reset to default speakers based on type
    let defaultSpeakers: Array<{ label: string; description: string }>;
    if (newType === "standard") {
      defaultSpeakers = [
        { label: "Q:", description: "Interviewer" },
        { label: "A:", description: "Interviewee" }
      ];
    } else {
      defaultSpeakers = [];
    }
    
    setSpeakers(defaultSpeakers);
    
    updateMutation.mutate({
      speakerType: newType,
      speakers: defaultSpeakers,
    });
  };

  const addSpeaker = () => {
    if (!newSpeakerLabel.trim()) return;
    
    const label = newSpeakerLabel.endsWith(":") ? newSpeakerLabel : `${newSpeakerLabel}:`;
    const newSpeaker = {
      label,
      description: newSpeakerDescription || "Custom Speaker",
    };
    
    const updatedSpeakers = [...speakers, newSpeaker];
    setSpeakers(updatedSpeakers);
    setNewSpeakerLabel("");
    setNewSpeakerDescription("");
    
    updateMutation.mutate({
      speakers: updatedSpeakers,
    });
  };

  const removeSpeaker = (index: number) => {
    const updatedSpeakers = speakers.filter((_, i) => i !== index);
    setSpeakers(updatedSpeakers);
    
    updateMutation.mutate({
      speakers: updatedSpeakers,
    });
  };

  return (
    <div className="p-6 flex-1">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Speaker System</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-card-foreground">Type</Label>
          <Select value={speakerType} onValueChange={handleSpeakerTypeChange}>
            <SelectTrigger className="w-32" data-testid="select-speaker-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard (Q/A)</SelectItem>
              <SelectItem value="custom">Custom Labels</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Speaker Labels */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-card-foreground">Active Speakers</div>
          <div className="space-y-1">
            {speakers.map((speaker, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between bg-accent px-2 py-1 rounded text-sm"
                data-testid={`speaker-${index}`}
              >
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {speaker.label}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{speaker.description}</span>
                </div>
                {speakerType === "custom" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSpeaker(index)}
                    className="h-6 w-6 p-0"
                    data-testid={`button-remove-speaker-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Custom Speaker */}
        {speakerType === "custom" && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm font-medium text-card-foreground">Add Speaker</Label>
            <div className="space-y-2">
              <Input
                placeholder="Speaker label (e.g., MAN, WOMAN)"
                value={newSpeakerLabel}
                onChange={(e) => setNewSpeakerLabel(e.target.value)}
                className="text-sm"
                data-testid="input-new-speaker-label"
              />
              <Input
                placeholder="Description (optional)"
                value={newSpeakerDescription}
                onChange={(e) => setNewSpeakerDescription(e.target.value)}
                className="text-sm"
                data-testid="input-new-speaker-description"
              />
              <Button
                onClick={addSpeaker}
                disabled={!newSpeakerLabel.trim()}
                size="sm"
                className="w-full"
                data-testid="button-add-speaker"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Speaker
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
