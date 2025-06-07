import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, EyeOff, Share2 } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CustomStat {
  id: number;
  name: string;
  formula: string;
  description: string | null;
  userId: string | null;
  isPublic: number | null;
  createdAt: Date | null;
}

interface EditDialogProps {
  stat: CustomStat;
  onClose: () => void;
}

function EditDialog({ stat, onClose }: EditDialogProps) {
  const [name, setName] = useState(stat.name);
  const [description, setDescription] = useState(stat.description || "");
  const [isPublic, setIsPublic] = useState(Boolean(stat.isPublic));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; isPublic: boolean }) => {
      const response = await fetch(`/api/custom-stats/${stat.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          formula: stat.formula,
          description: data.description,
          isPublic: data.isPublic
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-stats/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-stats"] });
      toast({
        title: "Success",
        description: "Custom stat updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update custom stat",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      isPublic
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Custom Stat</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of what this stat measures..."
            rows={3}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="public-toggle">Share with community</Label>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Make this formula visible to other users
            </div>
          </div>
          <Switch
            id="public-toggle"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

export default function SavedStats() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingStat, setEditingStat] = useState<CustomStat | null>(null);

  const { data: savedStats = [], isLoading, error } = useQuery<CustomStat[]>({
    queryKey: ["/api/custom-stats/my"],
    queryFn: async () => {
      const response = await fetch("/api/custom-stats/my", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    retry: false,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  console.log("SavedStats component - isAuthenticated:", isAuthenticated, "isLoading:", isLoading, "savedStats:", savedStats, "error:", error);
  
  // Manual test of the API endpoint
  if (isAuthenticated && !isLoading && savedStats.length === 0 && !error) {
    console.log("Manually testing API endpoint...");
    fetch("/api/custom-stats/my", { credentials: "include" })
      .then(res => {
        console.log("Manual API test - status:", res.status);
        return res.json();
      })
      .then(data => console.log("Manual API test - data:", data))
      .catch(err => console.log("Manual API test - error:", err));
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/custom-stats/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-stats/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-stats"] });
      toast({
        title: "Success",
        description: "Custom stat deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete custom stat",
        variant: "destructive",
      });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: number; isPublic: boolean }) => {
      const response = await fetch(`/api/custom-stats/${id}/toggle-visibility`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community-stats"] });
      toast({
        title: "Success",
        description: "Visibility updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Sign in to save custom stats
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Create an account to save and share your custom formulas
          </p>
          <Button onClick={() => window.location.href = "/api/login"}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          Your Saved Stats
        </h2>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {savedStats.length} saved
        </div>
      </div>

      {savedStats.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              No saved stats yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Create and save custom formulas to reuse them later
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedStats.map((stat) => (
            <Card key={stat.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {stat.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {stat.isPublic ? (
                      <Badge variant="default" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stat.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stat.description}
                    </p>
                  )}
                  
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Formula:
                    </div>
                    <code className="text-sm font-mono text-slate-900 dark:text-slate-50 break-all">
                      {stat.formula}
                    </code>
                  </div>

                  <div className="flex gap-2">
                    <Dialog open={editingStat?.id === stat.id} onOpenChange={(open) => !open && setEditingStat(null)}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setEditingStat(stat)}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      {editingStat?.id === stat.id && (
                        <EditDialog
                          stat={editingStat}
                          onClose={() => setEditingStat(null)}
                        />
                      )}
                    </Dialog>
                    
                    <Button
                      onClick={() => toggleVisibilityMutation.mutate({
                        id: stat.id,
                        isPublic: !stat.isPublic
                      })}
                      size="sm"
                      variant="outline"
                      disabled={toggleVisibilityMutation.isPending}
                    >
                      {stat.isPublic ? <EyeOff className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </Button>

                    <Button
                      onClick={() => deleteMutation.mutate(stat.id)}
                      size="sm"
                      variant="destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {stat.createdAt && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Created {new Date(stat.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}