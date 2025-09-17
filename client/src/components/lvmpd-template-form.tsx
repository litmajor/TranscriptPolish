import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transcript } from "@shared/schema";

interface LVMPDTemplateFormProps {
  transcript: Transcript;
}

export default function LVMPDTemplateForm({ transcript }: LVMPDTemplateFormProps) {
  const { toast } = useToast();
  
  const [detectiveName, setDetectiveName] = useState(transcript.detectiveInfo?.name || "");
  const [badgeNumber, setBadgeNumber] = useState(transcript.detectiveInfo?.badge || "");
  const [section, setSection] = useState(transcript.detectiveInfo?.section || "");
  const [interviewDate, setInterviewDate] = useState(transcript.interviewInfo?.date || "");
  const [interviewTime, setInterviewTime] = useState(transcript.interviewInfo?.time || "");
  const [location, setLocation] = useState(transcript.interviewInfo?.location || "");

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
      toast({
        title: "Success",
        description: "Template information updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template information",
        variant: "destructive",
      });
    },
  });

  const handleGenerateHeader = () => {
    const updates = {
      detectiveInfo: {
        name: detectiveName,
        badge: badgeNumber,
        section: section,
      },
      interviewInfo: {
        date: interviewDate,
        time: interviewTime,
        location: location,
      },
    };

    updateMutation.mutate(updates);
  };

  // Auto-save when values change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (detectiveName || badgeNumber || section || interviewDate || interviewTime || location) {
        const updates = {
          detectiveInfo: {
            name: detectiveName,
            badge: badgeNumber,
            section: section,
          },
          interviewInfo: {
            date: interviewDate,
            time: interviewTime,
            location: location,
          },
        };
        updateMutation.mutate(updates);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [detectiveName, badgeNumber, section, interviewDate, interviewTime, location]);

  return (
    <div className="p-6 border-b border-border">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">LVMPD Template</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="detective-name" className="text-sm font-medium text-card-foreground">
            Detective Info
          </Label>
          <Input
            id="detective-name"
            type="text"
            placeholder="INITIAL. LAST NAME"
            value={detectiveName}
            onChange={(e) => setDetectiveName(e.target.value)}
            className="w-full"
            data-testid="input-detective-name"
          />
        </div>
        
        <div>
          <Label htmlFor="badge-number" className="text-sm font-medium text-card-foreground">
            Badge Number
          </Label>
          <Input
            id="badge-number"
            type="text"
            placeholder="P# NUMBER"
            value={badgeNumber}
            onChange={(e) => setBadgeNumber(e.target.value)}
            className="w-full"
            data-testid="input-badge-number"
          />
        </div>
        
        <div>
          <Label htmlFor="section" className="text-sm font-medium text-card-foreground">
            Section
          </Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger data-testid="select-section">
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Homicide">Homicide</SelectItem>
              <SelectItem value="Robbery">Robbery</SelectItem>
              <SelectItem value="Sexual Assault">Sexual Assault</SelectItem>
              <SelectItem value="Burglary">Burglary</SelectItem>
              <SelectItem value="Vice">Vice</SelectItem>
              <SelectItem value="Narcotics">Narcotics</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="interview-date" className="text-sm font-medium text-card-foreground">
              Date
            </Label>
            <Input
              id="interview-date"
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full"
              data-testid="input-interview-date"
            />
          </div>
          <div>
            <Label htmlFor="interview-time" className="text-sm font-medium text-card-foreground">
              Time
            </Label>
            <Input
              id="interview-time"
              type="time"
              value={interviewTime}
              onChange={(e) => setInterviewTime(e.target.value)}
              className="w-full"
              data-testid="input-interview-time"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location" className="text-sm font-medium text-card-foreground">
            Location
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="Interview Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full"
            data-testid="input-location"
          />
        </div>
        
        <Button 
          onClick={handleGenerateHeader}
          disabled={updateMutation.isPending}
          className="w-full"
          data-testid="button-generate-header"
        >
          <Plus className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Updating..." : "Generate Header"}
        </Button>
      </div>
    </div>
  );
}
