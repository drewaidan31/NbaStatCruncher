import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import SavedStats from "@/components/saved-stats";
import CommunityStats from "./CommunityStats";
import { Library, Users, BookOpen } from "lucide-react";

export default function StatsLibrary() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-3">
            <Library className="w-8 h-8" />
            Stats Library
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your saved formulas and explore community contributions
          </p>
        </div>

        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              My Stats
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Community
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved" className="mt-6">
            <SavedStats />
          </TabsContent>
          
          <TabsContent value="community" className="mt-6">
            <CommunityStats />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}