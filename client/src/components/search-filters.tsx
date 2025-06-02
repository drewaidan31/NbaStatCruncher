import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTeam: string;
  onTeamChange: (value: string) => void;
  selectedPosition: string;
  onPositionChange: (value: string) => void;
}

export default function SearchFilters({
  searchTerm,
  onSearchChange,
  selectedTeam,
  onTeamChange,
  selectedPosition,
  onPositionChange,
}: SearchFiltersProps) {
  const teams = [
    "all", "ATL", "BOS", "BKN", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW",
    "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK", "OKC",
    "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"
  ];

  const positions = ["all", "PG", "SG", "SF", "PF", "C"];

  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-bold text-slate-50">Player Leaderboard</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 text-slate-50 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-500 min-w-64"
            />
          </div>
          
          <Select value={selectedTeam} onValueChange={onTeamChange}>
            <SelectTrigger className="w-40 bg-slate-900 border border-slate-600 text-slate-50 focus:border-orange-500 focus:ring-orange-500">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600">
              {teams.map((team) => (
                <SelectItem key={team} value={team} className="text-slate-50 focus:bg-slate-700">
                  {team === "all" ? "All Teams" : team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPosition} onValueChange={onPositionChange}>
            <SelectTrigger className="w-44 bg-slate-900 border border-slate-600 text-slate-50 focus:border-orange-500 focus:ring-orange-500">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600">
              {positions.map((position) => (
                <SelectItem key={position} value={position} className="text-slate-50 focus:bg-slate-700">
                  {position === "all" ? "All Positions" : 
                   position === "PG" ? "Point Guard" :
                   position === "SG" ? "Shooting Guard" :
                   position === "SF" ? "Small Forward" :
                   position === "PF" ? "Power Forward" :
                   position === "C" ? "Center" : position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
