import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Trophy, TrendingUp, BarChart3, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface TeamStats {
  teamId: number;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  points: number;
  pointsPerGame: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  possessionsPerGame: number;
  plusMinus: number;
}

interface TeamData {
  teams: TeamStats[];
  leagueAverage: {
    possessionsPerGame: number;
    pace: number;
    offensiveRating: number;
    defensiveRating: number;
  };
}

interface TeamCalculationResult {
  team: TeamStats;
  customStat: number;
  formula: string;
  rank: number;
}

const SEASON_OPTIONS = [
  { value: "2024-25", label: "2024-25" },
  { value: "2023-24", label: "2023-24" },
  { value: "2022-23", label: "2022-23" },
  { value: "2021-22", label: "2021-22" },
  { value: "2020-21", label: "2020-21" }
];

const TEAM_FORMULA_EXAMPLES = [
  {
    name: "Offensive Efficiency",
    formula: "ORTG / PACE * 100",
    description: "Points scored per 100 possessions adjusted for pace"
  },
  {
    name: "Team Balance",
    formula: "(AST / TOV) * FG_PCT * 100",
    description: "Assist-to-turnover ratio weighted by shooting efficiency"
  },
  {
    name: "Defensive Impact",
    formula: "STL + BLK - (TOV / 2)",
    description: "Combined steals and blocks minus turnover penalty"
  },
  {
    name: "Win Efficiency",
    formula: "W_PCT * ORTG / DRTG",
    description: "Win percentage weighted by offensive vs defensive rating"
  },
  {
    name: "Pace Factor",
    formula: "PACE * (PPG / 100)",
    description: "Team pace adjusted for scoring output"
  }
];

export default function TeamStats() {
  const [selectedSeason, setSelectedSeason] = useState("2024-25");
  const [customFormula, setCustomFormula] = useState("");
  const [selectedExample, setSelectedExample] = useState(TEAM_FORMULA_EXAMPLES[0]);

  const { data: teamData, isLoading: isLoadingTeams } = useQuery<TeamData>({
    queryKey: ["/api/teams", selectedSeason],
    enabled: !!selectedSeason,
  });

  const calculateMutation = useMutation({
    mutationFn: async (formula: string) => {
      const response = await fetch("/api/teams/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula, season: selectedSeason }),
      });
      if (!response.ok) throw new Error("Failed to calculate team stats");
      return response.json();
    },
  });

  const handleCalculate = () => {
    if (customFormula.trim()) {
      calculateMutation.mutate(customFormula);
    }
  };

  const handleExampleSelect = (example: typeof TEAM_FORMULA_EXAMPLES[0]) => {
    setSelectedExample(example);
    setCustomFormula(example.formula);
    calculateMutation.mutate(example.formula);
  };

  useEffect(() => {
    if (selectedExample) {
      setCustomFormula(selectedExample.formula);
      calculateMutation.mutate(selectedExample.formula);
    }
  }, [selectedSeason]);

  const topTeams = teamData?.teams.slice(0, 5) || [];
  const results = calculateMutation.data as TeamCalculationResult[] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <BarChart3 className="h-8 w-8 text-orange-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Team Analytics
          </h1>
        </div>
        <p className="text-xl text-slate-400">
          Advanced team performance analysis with custom statistical formulas
        </p>
      </div>

      {/* Season Selector */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-orange-500" />
            Season Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="season" className="text-slate-300 whitespace-nowrap">Season:</Label>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {SEASON_OPTIONS.map((season) => (
                  <SelectItem 
                    key={season.value} 
                    value={season.value}
                    className="text-white hover:bg-slate-600"
                  >
                    {season.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* League Overview */}
      {teamData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">League Overview ({selectedSeason})</CardTitle>
            <CardDescription className="text-slate-400">
              Key league averages and standings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">
                  {teamData.leagueAverage.pace}
                </div>
                <div className="text-sm text-slate-300">Avg Pace</div>
              </div>
              <div className="text-center p-3 bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {teamData.leagueAverage.offensiveRating}
                </div>
                <div className="text-sm text-slate-300">Avg Off Rating</div>
              </div>
              <div className="text-center p-3 bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-red-400">
                  {teamData.leagueAverage.defensiveRating}
                </div>
                <div className="text-sm text-slate-300">Avg Def Rating</div>
              </div>
              <div className="text-center p-3 bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {teamData.leagueAverage.possessionsPerGame}
                </div>
                <div className="text-sm text-slate-300">Avg Possessions</div>
              </div>
            </div>

            {/* Top 5 Teams */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Top 5 Teams by Wins</h3>
              <div className="space-y-2">
                {topTeams.map((team, index) => (
                  <div key={team.teamId} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-orange-400 border-orange-400">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-white">{team.teamName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <span>{team.wins}-{team.losses}</span>
                      <span>({(team.winPercentage * 100).toFixed(1)}%)</span>
                      <span>{team.pointsPerGame.toFixed(1)} PPG</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Formula Calculator */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calculator className="h-5 w-5 text-orange-500" />
            Team Stat Calculator
          </CardTitle>
          <CardDescription className="text-slate-400">
            Create custom team statistics using available team metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formula Examples */}
          <div>
            <Label className="text-slate-300 mb-2 block">Formula Examples:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {TEAM_FORMULA_EXAMPLES.map((example) => (
                <Button
                  key={example.name}
                  variant={selectedExample.name === example.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleExampleSelect(example)}
                  className={`h-auto p-3 text-left justify-start ${
                    selectedExample.name === example.name 
                      ? "bg-orange-600 hover:bg-orange-700 text-white" 
                      : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <div>
                    <div className="font-medium">{example.name}</div>
                    <div className="text-xs opacity-70 mt-1">{example.formula}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-600" />

          {/* Custom Formula Input */}
          <div className="space-y-3">
            <Label htmlFor="formula" className="text-slate-300">Custom Formula:</Label>
            <div className="text-sm text-slate-400 space-y-1">
              <p>Available variables: PPG, PTS, AST, REB, STL, BLK, TOV, FG_PCT, 3P_PCT, FT_PCT</p>
              <p>Advanced: W_PCT, GP, W, L, PACE, ORTG, DRTG, POSS, PLUS_MINUS</p>
            </div>
            <div className="flex gap-3">
              <Input
                id="formula"
                value={customFormula}
                onChange={(e) => setCustomFormula(e.target.value)}
                placeholder="Enter your formula (e.g., ORTG * W_PCT)"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button 
                onClick={handleCalculate}
                disabled={!customFormula.trim() || calculateMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {calculateMutation.isPending ? "Calculating..." : "Calculate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Results: {selectedExample.name}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {selectedExample.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Top 10 Teams Table */}
            <div className="space-y-2">
              {results.slice(0, 10).map((result) => (
                <div key={result.team.teamId} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline" 
                      className={`${
                        result.rank <= 3 
                          ? "text-orange-400 border-orange-400" 
                          : "text-slate-400 border-slate-500"
                      }`}
                    >
                      #{result.rank}
                    </Badge>
                    <div>
                      <div className="font-medium text-white">{result.team.teamName}</div>
                      <div className="text-sm text-slate-400">
                        {result.team.wins}-{result.team.losses} ({(result.team.winPercentage * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-orange-400">
                      {result.customStat.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-400">
                      {result.team.pointsPerGame.toFixed(1)} PPG
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Chart */}
            <div className="h-80 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="team.teamName" 
                    stroke="#94a3b8"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value: any) => [value.toFixed(2), selectedExample.name]}
                    labelFormatter={(label) => `Team: ${label}`}
                  />
                  <Bar 
                    dataKey="customStat" 
                    fill="#fb923c" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}