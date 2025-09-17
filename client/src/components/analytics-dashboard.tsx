
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, FileText, AlertTriangle } from "lucide-react";

interface AnalyticsDashboardProps {
  transcripts: any[];
}

export default function AnalyticsDashboard({ transcripts }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("7d");

  const getProcessingStats = () => {
    const totalProcessed = transcripts.filter(t => t.status === "ready").length;
    const avgProcessingTime = transcripts.reduce((acc, t) => {
      const created = new Date(t.createdAt);
      const updated = new Date(t.updatedAt);
      return acc + (updated.getTime() - created.getTime());
    }, 0) / transcripts.length / 1000 / 60; // in minutes

    const qualityScores = transcripts
      .filter(t => t.validationResults?.score)
      .map(t => t.validationResults.score);
    
    const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length || 0;

    return {
      totalProcessed,
      avgProcessingTime: Math.round(avgProcessingTime),
      avgQuality: Math.round(avgQuality),
      totalIssuesFixed: transcripts.reduce((acc, t) => 
        acc + (t.validationResults?.issues?.length || 0), 0)
    };
  };

  const getDetectiveStats = () => {
    const detectives = transcripts.reduce((acc, t) => {
      const detective = t.detectiveInfo?.name || "Unknown";
      if (!acc[detective]) {
        acc[detective] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      acc[detective].count++;
      if (t.validationResults?.score) {
        acc[detective].totalScore += t.validationResults.score;
        acc[detective].avgScore = acc[detective].totalScore / acc[detective].count;
      }
      return acc;
    }, {});

    return Object.entries(detectives).map(([name, stats]: [string, any]) => ({
      name,
      count: stats.count,
      avgScore: Math.round(stats.avgScore)
    }));
  };

  const getSectionStats = () => {
    const sections = transcripts.reduce((acc, t) => {
      const section = t.detectiveInfo?.section || "Unknown";
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sections).map(([name, value]) => ({ name, value }));
  };

  const stats = getProcessingStats();
  const detectiveData = getDetectiveStats();
  const sectionData = getSectionStats();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProcessed}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}m</div>
            <p className="text-xs text-muted-foreground">
              -5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgQuality}/100</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Fixed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIssuesFixed}</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="detectives">Detectives</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={detectiveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detectives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detective Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detectiveData.map((detective, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{detective.name}</p>
                      <p className="text-sm text-muted-foreground">{detective.count} transcripts</p>
                    </div>
                    <Badge variant={detective.avgScore > 80 ? "default" : "secondary"}>
                      {detective.avgScore}/100
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={sectionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
