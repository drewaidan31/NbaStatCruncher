import { useQuery } from "@tanstack/react-query";
import { Settings, Wifi, WifiOff, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onAuthClick?: () => void;
}

export default function Header({ onAuthClick }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, isAuthenticated, logoutMutation } = useAuth();

  // Check API connection by attempting to fetch players
  const { isError, error } = useQuery({
    queryKey: ["/api/nba/players"],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/nba/refresh", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🏀</div>
              <h1 className="text-xl font-bold text-slate-50">NBA Formula Builder</h1>
            </div>
            <span className="text-sm text-slate-400 hidden sm:block">2024-25 Season Analytics</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isError ? (
                <>
                  <WifiOff className="w-2 h-2 text-red-500" />
                  <Badge variant="destructive" className="text-xs">
                    API Disconnected
                  </Badge>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <Badge variant="secondary" className="text-xs bg-emerald-900 text-emerald-100">
                    API Connected
                  </Badge>
                </>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-slate-400 hover:text-slate-50"
            >
              {isRefreshing ? (
                <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
            </Button>

            {/* Authentication Controls */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-50">
                    <User className="w-4 h-4 mr-2" />
                    {user?.firstName || user?.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onAuthClick}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
