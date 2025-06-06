import { useState, useEffect } from "react";

interface ShotData {
  x: number;
  y: number;
  made: boolean;
  value: number; // 2 or 3 points
}

interface ShotChartProps {
  playerName: string;
  season: string;
  shotData?: ShotData[];
}

// Note: This component currently requires actual NBA shot location data from the NBA API
// Shot chart data is not available in our current dataset

export default function ShotChart({ playerName, season, shotData }: ShotChartProps) {
  const [shots, setShots] = useState<ShotData[]>([]);
  
  useEffect(() => {
    if (shotData && shotData.length > 0) {
      setShots(shotData);
    } else {
      setShots([]);
    }
  }, [playerName, season, shotData]);
  
  const madeShots = shots.filter(shot => shot.made);
  const missedShots = shots.filter(shot => !shot.made);
  
  const stats = {
    totalShots: shots.length,
    made: madeShots.length,
    percentage: shots.length > 0 ? ((madeShots.length / shots.length) * 100).toFixed(1) : "0.0",
    threePointers: shots.filter(shot => shot.value === 3 && shot.made).length,
    threePtAttempts: shots.filter(shot => shot.value === 3).length
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {playerName} Shot Chart
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{season} Season</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Shot Chart */}
        <div className="flex-1">
          <div className="relative bg-orange-100 dark:bg-orange-900/20 rounded-lg p-4">
            <svg viewBox="0 0 500 470" className="w-full max-w-md mx-auto">
              {/* Court background */}
              <rect width="500" height="470" fill="#D97706" className="dark:fill-orange-800" />
              
              {/* Court lines */}
              <g stroke="white" strokeWidth="2" fill="none">
                {/* Baseline */}
                <line x1="0" y1="420" x2="500" y2="420" />
                
                {/* Free throw circle */}
                <circle cx="250" cy="340" r="60" />
                
                {/* Paint */}
                <rect x="190" y="340" width="120" height="80" />
                
                {/* 3-point line */}
                <path d="M 30 420 Q 30 180 250 180 Q 470 180 470 420" />
                
                {/* Basket */}
                <circle cx="250" cy="420" r="9" fill="orange" stroke="black" strokeWidth="1" />
              </g>
              
              {/* Missed shots */}
              {missedShots.map((shot, index) => (
                <circle
                  key={`miss-${index}`}
                  cx={shot.x}
                  cy={shot.y}
                  r="2.5"
                  fill="rgba(239, 68, 68, 0.6)"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth="0.5"
                />
              ))}
              
              {/* Made shots */}
              {madeShots.map((shot, index) => (
                <circle
                  key={`make-${index}`}
                  cx={shot.x}
                  cy={shot.y}
                  r="2.5"
                  fill="rgba(34, 197, 94, 0.7)"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="0.5"
                />
              ))}
            </svg>
          </div>
          
          <div className="flex justify-center mt-3 gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">Made</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">Missed</span>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="lg:w-48 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Shooting Stats</h4>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Field Goals</div>
                <div className="font-bold text-lg text-slate-900 dark:text-white">
                  {stats.made}/{stats.totalShots}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stats.percentage}%
                </div>
              </div>
              
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">3-Pointers</div>
                <div className="font-bold text-lg text-slate-900 dark:text-white">
                  {stats.threePointers}/{stats.threePtAttempts}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stats.threePtAttempts > 0 ? ((stats.threePointers / stats.threePtAttempts) * 100).toFixed(1) : "0.0"}%
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Shot locations and accuracy visualized on a half-court representation
          </div>
        </div>
      </div>
    </div>
  );
}