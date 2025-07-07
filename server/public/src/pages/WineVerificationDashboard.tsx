import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Play, Square, BarChart3, Database, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface VerificationStats {
  totalWines: number;
  verifiedWines: number;
  enhancedWines: number;
  unverifiedWines: number;
  verificationRate: number;
}

interface VerificationProgress {
  isRunning: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  startTime: string;
  lastUpdate: string;
}

export default function WineVerificationDashboard() {
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [progress, setProgress] = useState<VerificationProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sommelier/stats');
      const data = await response.json();
      if (data) {
        setStats({
          totalWines: data.totalWines,
          verifiedWines: data.verifiedWines,
          enhancedWines: data.enhancedWines,
          unverifiedWines: data.totalWines - data.verifiedWines,
          verificationRate: data.totalWines > 0 ? (data.verifiedWines / data.totalWines) * 100 : 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/sommelier/verification-progress');
      const data = await response.json();
      if (data.success) {
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const startVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sommelier/start-background-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'wine-sommelier-2024'
        },
        body: JSON.stringify({ batchSize: 20 })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Verification Started",
          description: "Background wine verification is now running with authentic Vivino data"
        });
        fetchProgress();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to start verification",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start verification process",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const stopVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sommelier/stop-background-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'wine-sommelier-2024'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Verification Stopped",
          description: "Background wine verification has been stopped"
        });
        fetchProgress();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to stop verification",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop verification process",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchProgress();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchProgress();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = () => {
    if (!progress) return <Badge variant="outline">Unknown</Badge>;
    
    if (progress.isRunning) {
      return <Badge variant="default" className="bg-green-500">Running</Badge>;
    } else {
      return <Badge variant="outline">Stopped</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wine Verification Dashboard</h1>
          <p className="text-muted-foreground">
            Authenticate wines with real Vivino data including ratings, regions, and tasting notes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={startVerification}
            disabled={loading || progress?.isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Verification
          </Button>
          <Button
            onClick={stopVerification}
            disabled={loading || !progress?.isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wines</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWines || 0}</div>
            <p className="text-xs text-muted-foreground">
              In wine database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Wines</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.verifiedWines || 0}</div>
            <p className="text-xs text-muted-foreground">
              Authenticated with Vivino
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enhanced Wines</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.enhancedWines || 0}</div>
            <p className="text-xs text-muted-foreground">
              Comprehensive profiles complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verification Progress</CardTitle>
              <CardDescription>
                Real-time progress of wine authentication with Vivino data
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{stats.verifiedWines} / {stats.totalWines} wines</span>
              </div>
              <Progress value={stats.verificationRate} className="h-2" />
            </div>
          )}

          {progress && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{progress.totalProcessed}</div>
                <div className="text-xs text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{progress.successCount}</div>
                <div className="text-xs text-muted-foreground">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{progress.errorCount}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {progress.totalProcessed > 0 ? Math.round((progress.successCount / progress.totalProcessed) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Information */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Started</div>
                <div className="text-sm">{formatDate(progress.startTime)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Update</div>
                <div className="text-sm">{formatDate(progress.lastUpdate)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Wine Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This system authenticates your wine database with real Vivino data using the Apify API.
            Each wine is verified with authentic information including:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Professional ratings and reviews</li>
            <li>• Accurate region and country information</li>
            <li>• Wine type and style classifications</li>
            <li>• Authentic tasting notes and descriptions</li>
            <li>• Direct links to Vivino wine pages</li>
          </ul>
          <Separator />
          <p className="text-xs text-muted-foreground">
            The system processes wines with a 3-second delay between requests to respect API rate limits.
            Background processing ensures continuous authentication without interrupting other operations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}