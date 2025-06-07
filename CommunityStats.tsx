import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Copy, Eye, User } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CommunityStatData {
  id: number;
  name: string;
  formula: string;
  description: string | null;
  userId: string | null;
  isPublic: number | null;
  createdAt: Date | null;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

export default function CommunityStats() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: communityStats = [], isLoading } = useQuery<CommunityStatData[]>({
    queryKey: ["/api/community-stats"],
    retry: false,
  });

  const copyFormula = (formula: string, name: string) => {
    navigator.clipboard.writeText(formula);
    toast({
      title: "Formula copied!",
      description: `"${name}" formula copied to clipboard`,
    });
  };

  const getUserDisplayName = (user: CommunityStatData['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'Anonymous';
  };

  const getUserInitials = (user: CommunityStatData['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'A';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Community Stats
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Discover and use custom formulas shared by the community
          </p>
        </div>

        {communityStats.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                No community stats yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Be the first to share a custom formula with the community!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityStats.map((stat) => (
              <Card key={stat.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
                        {stat.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={stat.user.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(stat.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getUserDisplayName(stat.user)}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      <Eye className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
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
                      <Button
                        onClick={() => copyFormula(stat.formula, stat.name)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Formula
                      </Button>
                    </div>

                    {stat.createdAt && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Shared {new Date(stat.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}