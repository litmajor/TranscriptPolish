
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Clock, User, FileText, Download, Eye, Lock } from "lucide-react";
import { format } from "date-fns";

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  severity: "low" | "medium" | "high";
}

interface AuditTrailProps {
  transcriptId: string;
}

export default function AuditTrail({ transcriptId }: AuditTrailProps) {
  const [events] = useState<AuditEvent[]>([
    {
      id: "1",
      timestamp: new Date(),
      userId: "det001",
      userName: "J. SMITH",
      action: "TRANSCRIPT_VIEWED",
      resource: transcriptId,
      details: { section: "original_content" },
      ipAddress: "192.168.1.100",
      severity: "low"
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 300000),
      userId: "det001",
      userName: "J. SMITH",
      action: "TRANSCRIPT_MODIFIED",
      resource: transcriptId,
      details: { changes: "Added detective information", lines_changed: 5 },
      ipAddress: "192.168.1.100",
      severity: "medium"
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 600000),
      userId: "admin001",
      userName: "ADMIN",
      action: "TRANSCRIPT_PROCESSED",
      resource: transcriptId,
      details: { processing_type: "automatic", issues_fixed: 12 },
      ipAddress: "192.168.1.50",
      severity: "high"
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "TRANSCRIPT_VIEWED": return <Eye className="h-4 w-4" />;
      case "TRANSCRIPT_MODIFIED": return <FileText className="h-4 w-4" />;
      case "TRANSCRIPT_PROCESSED": return <Shield className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const exportAuditLog = () => {
    const auditData = events.map(event => ({
      timestamp: format(event.timestamp, "yyyy-MM-dd HH:mm:ss"),
      user: event.userName,
      action: event.action,
      resource: event.resource,
      ip_address: event.ipAddress,
      details: JSON.stringify(event.details)
    }));

    const csv = [
      Object.keys(auditData[0]).join(","),
      ...auditData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${transcriptId}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Trail & Compliance
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportAuditLog}>
              <Download className="h-4 w-4 mr-2" />
              Export Log
            </Button>
            <Badge variant="outline" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              CJIS Compliant
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Audit Events</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Check</TabsTrigger>
            <TabsTrigger value="retention">Data Retention</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getActionIcon(event.action)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.action.replace(/_/g, ' ')}</span>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {event.userName} ({event.userId})
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(event.timestamp, "MMM dd, yyyy 'at' HH:mm:ss")}
                          </div>
                        </div>
                        {event.details && (
                          <div className="text-xs bg-muted rounded p-2 mt-2">
                            <pre>{JSON.stringify(event.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      IP: {event.ipAddress}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">CJIS Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Encryption</span>
                      <Badge className="bg-green-100 text-green-800">✓ AES-256</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Access Control</span>
                      <Badge className="bg-green-100 text-green-800">✓ Role-based</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Audit Logging</span>
                      <Badge className="bg-green-100 text-green-800">✓ Enabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Data Integrity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Checksums</span>
                      <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Version Control</span>
                      <Badge className="bg-green-100 text-green-800">✓ Active</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Backup Status</span>
                      <Badge className="bg-green-100 text-green-800">✓ Current</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Retention Policy</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Active cases: Indefinite retention</p>
                  <p>• Closed cases: 7 years minimum</p>
                  <p>• Audit logs: 3 years minimum</p>
                  <p>• Automatic archival after retention period</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Current Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">March 15, 2024</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retention Until:</span>
                    <p className="font-medium">March 15, 2031</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
