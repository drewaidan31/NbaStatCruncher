import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import type { CustomStat } from "@shared/schema";

interface MyCustomStatsProps {
  onStatSelect: (formula: string, name: string) => void;
}

export function MyCustomStats({ onStatSelect }: MyCustomStatsProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Always call useQuery hook regardless of authentication state
  const { data: userCustomStats = [], isLoading, error } = useQuery<CustomStat[]>({
    queryKey: ["/api/custom-stats/my"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  console.log("MyCustomStats - isAuthenticated:", isAuthenticated);
  console.log("MyCustomStats - userCustomStats:", userCustomStats);
  console.log("MyCustomStats - isLoading:", isLoading);
  console.log("MyCustomStats - error:", error);

  // Early returns after all hooks
  if (!isAuthenticated) {
    console.log("MyCustomStats - Not authenticated, hiding component");
    return null;
  }

  if (userCustomStats.length === 0 && !isLoading) {
    console.log("MyCustomStats - No custom stats found, hiding component");
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
      <div className="flex items-center gap-3 mb-4">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200">My Custom Stats</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {userCustomStats.length}
        </Badge>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userCustomStats.map((stat) => (
          <Card
            key={stat.id}
            className="bg-white dark:bg-blue-900/30 border-blue-200 dark:border-blue-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-800/50 transition-colors group"
            onClick={() => onStatSelect(stat.formula, stat.name)}
          >
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">{stat.name}</h4>
              <code className="text-sm text-blue-700 dark:text-blue-300 font-mono block mb-2 p-2 bg-blue-100 dark:bg-blue-800/50 rounded">
                {stat.formula}
              </code>
              <div className="text-xs text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                Click to use this formula
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}