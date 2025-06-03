import { useAuth } from "@/hooks/useAuth";
import { User as UserIcon, LogOut } from "lucide-react";
import type { User } from "@shared/schema";

export default function UserProfile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const typedUser = user as User | null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
        <div className="w-5 h-5 bg-slate-600 rounded-full animate-pulse"></div>
        <div className="w-20 h-4 bg-slate-600 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => window.location.href = '/api/login'}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
      >
        <UserIcon className="w-4 h-4" />
        Sign In
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
        {typedUser?.profileImageUrl ? (
          <img 
            src={typedUser.profileImageUrl} 
            alt="Profile" 
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {typedUser?.firstName?.[0] || typedUser?.email?.[0] || 'U'}
          </div>
        )}
        <span className="text-white text-sm">
          {typedUser?.firstName || typedUser?.email?.split('@')[0] || 'User'}
        </span>
      </div>
      
      <button
        onClick={() => window.location.href = '/api/logout'}
        className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}