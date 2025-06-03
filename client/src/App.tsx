import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StatCalculator from "./components/stat-calculator";
import LeaderboardTable from "./components/leaderboard-table";
import { BarChart3, Search } from "lucide-react";

const queryClient = new QueryClient();

function MainApp() {
  const [selectedSeason, setSelectedSeason] = useState("2024-25");
  const [formula, setFormula] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");

  // Season options from 1996-97 to 2024-25
  const seasonOptions = [
    "2024-25", "2023-24", "2022-23", "2021-22", "2020-21", "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
    "2014-15", "2013-14", "2012-13", "2011-12", "2010-11", "2009-10", "2008-09", "2007-08", "2006-07", "2005-06",
    "2004-05", "2003-04", "2002-03", "2001-02", "2000-01", "1999-00", "1998-99", "1997-98", "1996-97"
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            NBA Custom Stats Calculator
          </h1>
          <p className="text-xl text-slate-300">
            Create custom basketball statistics with 29 seasons of authentic NBA data (1996-2025)
          </p>
        </div>

        {/* Navigation Bar */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 text-white"
              >
                <BarChart3 className="w-4 h-4" />
                Leaderboards
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600"
              >
                <Search className="w-4 h-4" />
                Player Search
              </button>
            </div>
          </div>
        </div>

        {/* Season Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select NBA Season:
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            >
              {seasonOptions.map((season) => (
                <option key={season} value={season}>
                  {season} Season {season === "2024-25" ? "(Current)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Loading NBA player data...
            </p>
          </div>
        </div>

        {/* Formula Calculator */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">NBA Custom Stats Calculator</h2>
          <p className="text-slate-300 mb-6">Build your own basketball analytics formulas using real NBA player data. Create custom stats, compare players, and discover new insights.</p>
          
          <StatCalculator 
            onFormulaChange={setFormula}
            onCalculate={() => {}}
          />
        </div>

        {/* NBA Player Leaderboard Table */}
        <LeaderboardTable
          formula={formula}
          searchTerm={searchTerm}
          selectedTeam={selectedTeam}
          selectedPosition={selectedPosition}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}