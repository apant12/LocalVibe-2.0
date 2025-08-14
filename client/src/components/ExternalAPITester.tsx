import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface APITestResult {
  service: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  responseTime?: number;
  count?: number;
}

export default function ExternalAPITester() {
  const [results, setResults] = useState<Record<string, APITestResult>>({
    eventbrite: { service: 'Eventbrite', status: 'idle' },
    ticketmaster: { service: 'Ticketmaster', status: 'idle' },
    places: { service: 'Google Places', status: 'idle' },
  });
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const testMutation = useMutation({
    mutationFn: async ({ service, endpoint }: { service: string; endpoint: string }) => {
      const startTime = Date.now();
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      return { data, responseTime };
    },
    onMutate: ({ service }) => {
      setResults(prev => ({
        ...prev,
        [service]: { ...prev[service], status: 'loading' }
      }));
    },
    onSuccess: ({ data, responseTime }, { service }) => {
      setResults(prev => ({
        ...prev,
        [service]: {
          ...prev[service],
          status: 'success',
          data,
          responseTime,
          count: data.count || data.experiences?.length || 0,
        }
      }));
      toast({
        title: `${results[service].service} Test Successful`,
        description: `Found ${data.count || data.experiences?.length || 0} results in ${responseTime}ms`,
        className: "bg-green-600 text-white",
      });
    },
    onError: (error: any, { service }) => {
      const errorMessage = error.message || 'API test failed';
      setResults(prev => ({
        ...prev,
        [service]: {
          ...prev[service],
          status: 'error',
          error: errorMessage,
        }
      }));
      toast({
        title: `${results[service].service} Test Failed`,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const testAPI = (service: string, endpoint: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test external APIs",
        variant: "destructive",
      });
      return;
    }
    testMutation.mutate({ service, endpoint });
  };

  const testAllAPIs = () => {
    testAPI('eventbrite', '/api/sync/eventbrite?location=San Francisco&limit=5');
    setTimeout(() => {
      testAPI('ticketmaster', '/api/sync/ticketmaster?city=San Francisco&limit=5');
    }, 1000);
    setTimeout(() => {
      testAPI('places', '/api/sync/places?location=San Francisco&radius=5000&limit=5');
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-center">
            <i className="fas fa-lock mr-2"></i>
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center">
            Please log in to test external API integrations
          </p>
          <Button
                onClick={() => window.location.href = "/login"}
            className="w-full mt-4 bg-primary hover:bg-primary/90"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">External API Testing</h3>
        <Button
          onClick={testAllAPIs}
          disabled={testMutation.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          {testMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Testing APIs...
            </>
          ) : (
            <>
              <i className="fas fa-play mr-2"></i>
              Test All APIs
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {Object.entries(results).map(([key, result]) => (
          <Card key={key} className="bg-surface border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  {getStatusIcon(result.status)}
                  <span>{result.service} API</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary"
                    className={`${getStatusColor(result.status)} text-white`}
                  >
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.status === 'success' && (
                  <div className="space-y-1">
                    <p className="text-sm text-green-400">
                      ✓ Successfully retrieved {result.count} items
                    </p>
                    <p className="text-xs text-gray-400">
                      Response time: {result.responseTime}ms
                    </p>
                    {result.data?.experiences?.slice(0, 2).map((exp: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-300 bg-black/20 p-2 rounded">
                        • {exp.title} - {exp.location}
                      </div>
                    ))}
                  </div>
                )}
                
                {result.status === 'error' && (
                  <div className="text-sm text-red-400">
                    ✗ {result.error}
                  </div>
                )}
                
                {result.status === 'loading' && (
                  <div className="text-sm text-blue-400 flex items-center space-x-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Testing API connection...</span>
                  </div>
                )}

                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testAPI(key, `/api/sync/${key}?location=San Francisco&limit=5`)}
                    disabled={result.status === 'loading'}
                    className="text-xs"
                  >
                    {result.status === 'loading' ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <i className="fas fa-redo mr-1"></i>
                    )}
                    Test
                  </Button>
                  {result.status === 'success' && result.data?.experiences && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
                        toast({ title: "Copied to clipboard", description: "API response data copied" });
                      }}
                      className="text-xs"
                    >
                      <i className="fas fa-copy mr-1"></i>
                      Copy Data
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Health Summary */}
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">API Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-500">
                {Object.values(results).filter(r => r.status === 'success').length}
              </p>
              <p className="text-sm text-gray-400">Healthy</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-red-500">
                {Object.values(results).filter(r => r.status === 'error').length}
              </p>
              <p className="text-sm text-gray-400">Failed</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-blue-500">
                {Object.values(results).filter(r => r.status === 'loading').length}
              </p>
              <p className="text-sm text-gray-400">Testing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}