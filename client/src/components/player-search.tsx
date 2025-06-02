import { useState } from "react";
import { Search, User, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Player {
  playerId: number;
  name: string;
  team: string;
  position: string;
  gamesPlayed: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  plusMinus: number;
  currentSeason?: string;
  availableSeasons?: string[];
}

interface PlayerSearchProps {
  onPlayerSelect: (player: Player, season: string) => void;
  onCompareSelect: (players: { player1: Player; season1: string; player2: Player; season2: string }) => void;
  currentFormula?: string;
  customStatResults?: Array<{ playerId: number; value: number; rank: number }>;
}

export default function PlayerSearch({ onPlayerSelect, onCompareSelect, currentFormula, customStatResults }: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);

  const { data: players = [], isLoading, error } = useQuery({
    queryKey: ["/api/nba/players"],
    queryFn: async () => {
      const response = await fetch("/api/nba/players");
      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      return response.json();
    },
  });

  // Debug: Log the data structure
  console.log("Players data:", players);
  console.log("Query loading:", isLoading);
  console.log("Query error:", error);
  console.log("Search term:", searchTerm);

  const filteredPlayers = searchTerm.length >= 1
    ? players
      .filter((player: Player) => {
        const name = player.name;
        return name && name.toLowerCase().includes(searchTerm.toLowerCase());
      }).slice(0, 10) // Show max 10 suggestions
    : [];

  // Helper function to get custom stat value for a player
  const getCustomStatValue = (player: Player) => {
    if (!customStatResults || !currentFormula) return null;
    const result = customStatResults.find(r => r.playerId === player.playerId);
    return result ? { value: result.value, rank: result.rank } : null;
  };

  const handlePlayerClick = (player: Player) => {
    if (compareMode) {
      if (!selectedPlayer1) {
        setSelectedPlayer1(player);
      } else {
        onCompareSelect({
          player1: selectedPlayer1,
          season1: selectedPlayer1.currentSeason || "2024-25",
          player2: player,
          season2: player.currentSeason || "2024-25"
        });
        setCompareMode(false);
        setSelectedPlayer1(null);
      }
    } else {
      onPlayerSelect(player, player.currentSeason || "2024-25");
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <h2 className="text-xl font-bold text-white">Player Search</h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCompareMode(false);
              setSelectedPlayer1(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !compareMode
                ? "bg-orange-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <User className="w-4 h-4 inline mr-1" />
            Individual
          </button>
          <button
            onClick={() => setCompareMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              compareMode
                ? "bg-orange-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Compare
          </button>
        </div>
      </div>

      {compareMode && selectedPlayer1 && (
        <div className="bg-slate-700 rounded-lg p-3 mb-4 border border-slate-600">
          <div className="text-sm text-slate-300">Selected for comparison:</div>
          <div className="text-white font-medium">
            {selectedPlayer1.name} ({selectedPlayer1.currentSeason || "2024-25"}) - {selectedPlayer1.team}
          </div>
          <div className="text-xs text-slate-400">Now select a second player to compare</div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Search Players:
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Type player name... (searches all players from any season)"
        />
      </div>

      {searchTerm.length >= 1 && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="text-slate-400">Loading players...</div>
            </div>
          ) : filteredPlayers.length > 0 ? (
            <>
              <div className="text-sm text-slate-400 mb-2">
                {filteredPlayers.length} suggestion{filteredPlayers.length !== 1 ? 's' : ''}
                {filteredPlayers.length === 10 ? ' (showing top 10)' : ''}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredPlayers.map((player: Player) => (
                  <div
                    key={player.playerId}
                    onClick={() => handlePlayerClick(player)}
                    className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg cursor-pointer transition-colors border border-slate-600"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-sm text-slate-300">
                          {player.team} • {player.position} • {player.currentSeason || "2024-25"}
                        </div>
                        {player.availableSeasons && player.availableSeasons.length > 1 && (
                          <div className="text-xs text-slate-400 mt-1">
                            Played in {player.availableSeasons.length} seasons
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        {(() => {
                          const customStat = getCustomStatValue(player);
                          if (customStat && currentFormula) {
                            return (
                              <>
                                <div className="text-green-400 font-bold text-base">#{customStat.rank}</div>
                                <div className="text-green-300 font-medium">{customStat.value.toFixed(2)}</div>
                                <div className="text-xs text-slate-400">Custom Stat</div>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <div className="text-orange-400 font-medium">{player.points.toFixed(1)} PPG</div>
                                <div className="text-slate-400">{player.assists.toFixed(1)} APG</div>
                                <div className="text-slate-400">{player.rebounds.toFixed(1)} RPG</div>
                              </>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-slate-400">No players found matching "{searchTerm}"</div>
            </div>
          )}
        </div>
      )}

      {searchTerm.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <div className="text-slate-400 mb-2">Search for any NBA player</div>
          <div className="text-slate-500 text-sm">
            Type a player's name to see unified profiles with all their seasons
          </div>
        </div>
      )}
    </div>
  );
}