import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Zap, Users, ArrowLeft } from "lucide-react";
import type { CustomStat, Player } from "@shared/schema";

interface ScatterPlotAnalyzerProps {
  players: Player[];
  onBack: () => void;
}

interface ScatterDataPoint {
  name: string;
  team: string;
  season: string;
  x: number;
  y: number;
  teamColor: string;
  playerId: number;
}

// Team colors mapping
const teamColors: Record<string, string> = {
  'LAL': '#552583', 'GSW': '#1D428A', 'BOS': '#007A33', 'MIA': '#98002E',
  'CHI': '#CE1141', 'NYK': '#006BB6', 'PHX': '#E56020', 'DAL': '#00538C',
  'MIL': '#00471B', 'DEN': '#0E2240', 'PHI': '#006BB6', 'TOR': '#CE1141',
  'ATL': '#E03A3E', 'CLE': '#6F263D', 'BKN': '#000000', 'POR': '#E03A3E',
  'UTA': '#002B5C', 'SAC': '#5A2D81', 'MEM': '#5D76A9', 'MIN': '#0C2340',
  'ORL': '#0077C0', 'IND': '#002D62', 'WAS': '#002B5C', 'CHA': '#1D1160',
  'DET': '#C8102E', 'HOU': '#CE1141', 'SAS': '#C4CED4', 'OKC': '#007AC1',
  'LAC': '#C8102E', 'NOH': '#0C2340', 'NOP': '#0C2340'
};

export default function ScatterPlotAnalyzer({ players, onBack }: ScatterPlotAnalyzerProps) {
  const { isAuthenticated } = useAuth();
  const [xAxisStat, setXAxisStat] = useState<string>("");
  const [yAxisStat, setYAxisStat] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [scatterData, setScatterData] = useState<ScatterDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's custom stats
  const { data: customStats = [] } = useQuery<CustomStat[]>({
    queryKey: ["/api/custom-stats/my"],
    queryFn: async () => {
      const response = await fetch("/api/custom-stats/my", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: true,
  });

  const calculateScatterData = async () => {
    if (!xAxisStat || !yAxisStat || !isAuthenticated) return;

    setLoading(true);
    try {
      // Calculate both stats
      const [xResponse, yResponse] = await Promise.all([
        fetch("/api/nba/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formula: xAxisStat })
        }),
        fetch("/api/nba/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formula: yAxisStat })
        })
      ]);

      if (!xResponse.ok || !yResponse.ok) {
        throw new Error("Failed to calculate statistics");
      }

      const [xData, yData] = await Promise.all([
        xResponse.json(),
        yResponse.json()
      ]);

      // Combine data points
      const combinedData: ScatterDataPoint[] = [];
      xData.forEach((xPoint: any) => {
        const yPoint = yData.find((y: any) => 
          y.player.id === xPoint.player.id && y.bestSeason === xPoint.bestSeason
        );
        
        if (yPoint && xPoint.customStat !== null && yPoint.customStat !== null) {
          const dataPoint = {
            name: xPoint.player.name,
            team: xPoint.player.team,
            season: xPoint.bestSeason,
            x: xPoint.customStat,
            y: yPoint.customStat,
            teamColor: teamColors[xPoint.player.team] || '#666666',
            playerId: xPoint.player.id
          };
          
          // Filter by selected season if not "all"
          if (selectedSeason === "all" || dataPoint.season === selectedSeason) {
            combinedData.push(dataPoint);
          }
        }
      });

      setScatterData(combinedData);
    } catch (error) {
      console.error("Error calculating scatter data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (xAxisStat && yAxisStat) {
      calculateScatterData();
    }
  }, [xAxisStat, yAxisStat, selectedSeason]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You need to be signed in to use the scatter plot analyzer
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 sm:p-3 shadow-xl max-w-xs">
          <p className="text-white font-bold text-sm truncate">{data.name}</p>
          <p className="text-slate-300 text-xs">{data.team} • {data.season}</p>
          <div className="mt-1 sm:mt-2 space-y-1">
            <p className="text-xs sm:text-sm">
              <span className="text-blue-400">X-Axis:</span> {data.x.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm">
              <span className="text-green-400">Y-Axis:</span> {data.y.toFixed(2)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const xAxisStatName = customStats.find(s => s.formula === xAxisStat)?.name || "X-Axis Stat";
  const yAxisStatName = customStats.find(s => s.formula === yAxisStat)?.name || "Y-Axis Stat";

  // Calculate quadrant stats
  const avgX = scatterData.length > 0 ? scatterData.reduce((sum, d) => sum + d.x, 0) / scatterData.length : 0;
  const avgY = scatterData.length > 0 ? scatterData.reduce((sum, d) => sum + d.y, 0) / scatterData.length : 0;
  const topRightQuadrant = scatterData.filter(d => d.x > avgX && d.y > avgY);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Scatter Plot Analyzer</h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Compare two custom stats to identify elite performers
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Configure Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">X-Axis Stat</label>
                <Select value={xAxisStat} onValueChange={setXAxisStat}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select X-axis statistic" />
                  </SelectTrigger>
                  <SelectContent>
                    {customStats.map((stat) => (
                      <SelectItem key={stat.id} value={stat.formula}>
                        {stat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {xAxisStat && (
                  <p className="text-xs text-slate-500 mt-1 font-mono break-all">
                    {customStats.find(s => s.formula === xAxisStat)?.formula}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Y-Axis Stat</label>
                <Select value={yAxisStat} onValueChange={setYAxisStat}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select Y-axis statistic" />
                  </SelectTrigger>
                  <SelectContent>
                    {customStats.map((stat) => (
                      <SelectItem key={stat.id} value={stat.formula}>
                        {stat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {yAxisStat && (
                  <p className="text-xs text-slate-500 mt-1 font-mono break-all">
                    {customStats.find(s => s.formula === yAxisStat)?.formula}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Season</label>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                    <SelectItem value="2022-23">2022-23</SelectItem>
                    <SelectItem value="2021-22">2021-22</SelectItem>
                    <SelectItem value="2020-21">2020-21</SelectItem>
                    <SelectItem value="2019-20">2019-20</SelectItem>
                    <SelectItem value="2018-19">2018-19</SelectItem>
                    <SelectItem value="2017-18">2017-18</SelectItem>
                    <SelectItem value="2016-17">2016-17</SelectItem>
                    <SelectItem value="2015-16">2015-16</SelectItem>
                    <SelectItem value="2014-15">2014-15</SelectItem>
                    <SelectItem value="2013-14">2013-14</SelectItem>
                    <SelectItem value="2012-13">2012-13</SelectItem>
                    <SelectItem value="2011-12">2011-12</SelectItem>
                    <SelectItem value="2010-11">2010-11</SelectItem>
                    <SelectItem value="2009-10">2009-10</SelectItem>
                    <SelectItem value="2008-09">2008-09</SelectItem>
                    <SelectItem value="2007-08">2007-08</SelectItem>
                    <SelectItem value="2006-07">2006-07</SelectItem>
                    <SelectItem value="2005-06">2005-06</SelectItem>
                    <SelectItem value="2004-05">2004-05</SelectItem>
                    <SelectItem value="2003-04">2003-04</SelectItem>
                    <SelectItem value="2002-03">2002-03</SelectItem>
                    <SelectItem value="2001-02">2001-02</SelectItem>
                    <SelectItem value="2000-01">2000-01</SelectItem>
                    <SelectItem value="1999-00">1999-00</SelectItem>
                    <SelectItem value="1998-99">1998-99</SelectItem>
                    <SelectItem value="1997-98">1997-98</SelectItem>
                    <SelectItem value="1996-97">1996-97</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Filter data by specific season
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Stats - Mobile optimized */}
        {scatterData.length > 0 && (
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {scatterData.length}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Total Players
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">
                    {topRightQuadrant.length}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Elite Performers (Top-Right)
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {new Set(scatterData.map(d => d.team)).size}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Teams Represented
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scatter Plot - Mobile optimized */}
        {xAxisStat && yAxisStat && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <span className="break-words">{xAxisStatName} vs {yAxisStatName}</span>
                </div>
                {loading && <Badge variant="secondary" className="self-start sm:self-auto">Loading...</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {loading ? (
                <div className="h-80 sm:h-96 lg:h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-base sm:text-lg mb-2">Calculating statistics...</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      This may take a moment
                    </div>
                  </div>
                </div>
              ) : scatterData.length > 0 ? (
                <div className="h-80 sm:h-96 lg:h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      data={scatterData}
                      margin={{ 
                        top: 5, 
                        right: 5, 
                        bottom: 45, 
                        left: 45 
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name={xAxisStatName}
                        stroke="var(--chart-text)"
                        fontSize={11}
                        tick={{ fontSize: 11 }}
                        label={{ 
                          value: xAxisStatName, 
                          position: 'insideBottom', 
                          offset: -2,
                          style: { textAnchor: 'middle', fontSize: '13px' }
                        }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name={yAxisStatName}
                        stroke="var(--chart-text)"
                        fontSize={11}
                        tick={{ fontSize: 11 }}
                        label={{ 
                          value: yAxisStatName, 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fontSize: '13px' }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      
                      {/* Average reference lines */}
                      <ReferenceLine 
                        x={avgX} 
                        stroke="#94A3B8" 
                        strokeDasharray="5 5" 
                        opacity={0.5}
                      />
                      <ReferenceLine 
                        y={avgY} 
                        stroke="#94A3B8" 
                        strokeDasharray="5 5" 
                        opacity={0.5}
                      />
                      
                      <Scatter 
                        name="Players" 
                        dataKey="y" 
                        fill="#F97316"
                      >
                        {scatterData.map((entry, index) => (
                          <circle 
                            key={`scatter-${index}`}
                            r={4}
                            fill={entry.teamColor}
                            stroke="#ffffff"
                            strokeWidth={1}
                            opacity={0.8}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 sm:h-96 lg:h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-base sm:text-lg mb-2">No data available</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Please select both X and Y axis statistics
                    </div>
                  </div>
                </div>
              )}

              {/* Elite Performers List */}
              {topRightQuadrant.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Elite Performers (Above Average in Both Stats)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {topRightQuadrant
                      .sort((a, b) => (b.x + b.y) - (a.x + a.y))
                      .slice(0, 12)
                      .map((player, index) => (
                        <div 
                          key={`elite-${index}`}
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: player.teamColor }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{player.name}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              {player.team} • {player.season}
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <div>{player.x.toFixed(1)}</div>
                            <div>{player.y.toFixed(1)}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}