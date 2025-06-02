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
}

interface PlayerSearchProps {
  onPlayerSelect: (player: Player, season: string) => void;
  onCompareSelect: (players: { player1: Player; season1: string; player2: Player; season2: string }) => void;
}

export default function PlayerSearch({ onPlayerSelect, onCompareSelect }: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("2024-25");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedSeason1, setSelectedSeason1] = useState("2024-25");

  const { data: players = [], isLoading, error } = useQuery({
    queryKey: ["/api/nba/players", selectedSeason],
    queryFn: async () => {
      const response = await fetch(`/api/nba/players?season=${selectedSeason}`);
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
    ? players.filter((player: any) => {
        // Check different possible name fields
        const name = player.name || player.playerName || player.PLAYER_NAME;
        return name && name.toLowerCase().includes(searchTerm.toLowerCase());
      }).slice(0, 10) // Show max 10 suggestions
    : [];

  const handlePlayerClick = (player: Player) => {
    if (compareMode) {
      if (!selectedPlayer1) {
        setSelectedPlayer1(player);
        setSelectedSeason1(selectedSeason);
      } else {
        onCompareSelect({
          player1: selectedPlayer1,
          season1: selectedSeason1,
          player2: player,
          season2: selectedSeason
        });
        setCompareMode(false);
        setSelectedPlayer1(null);
      }
    } else {
      onPlayerSelect(player, selectedSeason);
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
            {selectedPlayer1.name} ({selectedSeason1}) - {selectedPlayer1.team}
          </div>
          <div className="text-xs text-slate-400">Now select a second player to compare</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Search Players:
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Start typing a player's name..."
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Season:
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all-time">All-Time Leaders (2010-2025)</option>
            <option value="2024-25">2024-25 Season (Current)</option>
            <option value="2023-24">2023-24 Season</option>
            <option value="2022-23">2022-23 Season</option>
            <option value="2021-22">2021-22 Season</option>
            <option value="2020-21">2020-21 Season</option>
            <option value="2019-20">2019-20 Season</option>
            <option value="2018-19">2018-19 Season</option>
            <option value="2017-18">2017-18 Season</option>
            <option value="2016-17">2016-17 Season</option>
            <option value="2015-16">2015-16 Season</option>
            <option value="2014-15">2014-15 Season</option>
            <option value="2013-14">2013-14 Season</option>
            <option value="2012-13">2012-13 Season</option>
            <option value="2011-12">2011-12 Season</option>
            <option value="2010-11">2010-11 Season</option>
          </select>
        </div>
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
                    key={`${player.playerId}-${selectedSeason}`}
                    onClick={() => handlePlayerClick(player)}
                    className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg cursor-pointer transition-colors border border-slate-600"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-sm text-slate-300">
                          {player.team} • {player.position}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-400 font-bold">{player.points.toFixed(1)} PPG</div>
                        <div className="text-xs text-slate-400">
                          {player.assists.toFixed(1)} APG • {player.rebounds.toFixed(1)} RPG
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : searchTerm.length >= 1 ? (
            <div className="text-center py-4">
              <div className="text-slate-400">No players found matching "{searchTerm}"</div>
              <div className="text-xs text-slate-500 mt-1">Try a different spelling or first/last name only</div>
            </div>
          ) : null}
        </div>
      )}

      {searchTerm.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-slate-500 mx-auto mb-2" />
          <div className="text-slate-400">
            {compareMode 
              ? "Search and select two players to compare their stats"
              : "Start typing a player's name to see suggestions"
            }
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Examples: "LeBron", "Curry", "Jokic"
          </div>
        </div>
      )}
    </div>
  );
}