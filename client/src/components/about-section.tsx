import { useState } from "react";
import { BookOpen, Calculator, TrendingUp, Target, Users, Award, ChevronDown, ChevronRight } from "lucide-react";

export default function AboutSection() {
  const [expandedSection, setExpandedSection] = useState<string | null>("basics");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const StatExample = ({ title, formula, description, weight }: {
    title: string;
    formula: string;
    description: string;
    weight?: string;
  }) => (
    <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 mb-4">
      <h4 className="font-medium text-slate-50 mb-2">{title}</h4>
      <code className="text-sm text-slate-300 font-mono block mb-2 p-2 bg-slate-800 rounded">
        {formula}
      </code>
      <p className="text-sm text-slate-400 mb-2">{description}</p>
      {weight && (
        <div className="text-xs text-orange-400 bg-orange-400/10 p-2 rounded">
          <strong>Weighting:</strong> {weight}
        </div>
      )}
    </div>
  );

  const sections = [
    {
      id: "basics",
      title: "Getting Started with Custom Stats",
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">What are Custom Statistics?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Custom statistics let you create your own metrics by combining basic NBA stats (points, rebounds, assists, etc.) 
              using mathematical formulas. This allows you to measure specific aspects of player performance that traditional 
              stats might not capture.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Available Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "PTS (Points)", "AST (Assists)", "REB (Rebounds)", "STL (Steals)", 
                "BLK (Blocks)", "TOV (Turnovers)", "FG_PCT (Field Goal %)", "FGA (Field Goal Attempts)",
                "3P_PCT (3-Point %)", "3PA (3-Point Attempts)", "FT_PCT (Free Throw %)", "FTA (Free Throw Attempts)",
                "PLUS_MINUS (+/-)", "MIN (Minutes)", "GP (Games Played)", "W_PCT (Win %)"
              ].map((stat) => (
                <div key={stat} className="bg-blue-600 text-white text-sm py-2 px-3 rounded font-mono">
                  {stat}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Basic Operations</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { symbol: "+", name: "Addition" },
                { symbol: "-", name: "Subtraction" },
                { symbol: "*", name: "Multiplication" },
                { symbol: "/", name: "Division" },
                { symbol: "()", name: "Parentheses" },
                { symbol: ".", name: "Decimals" }
              ].map((op) => (
                <div key={op.symbol} className="bg-green-600 text-white text-sm py-2 px-3 rounded text-center">
                  <div className="font-mono text-lg">{op.symbol}</div>
                  <div className="text-xs">{op.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: "weighting",
      title: "Understanding Weighting in Formulas",
      icon: <Calculator className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">What is Weighting?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Weighting means giving different importance to different statistics. By multiplying stats by different numbers, 
              you can emphasize what matters most for your custom metric.
            </p>
          </div>

          <StatExample
            title="Basic Weighting Example"
            formula="(PTS * 1.5) + AST + (REB * 0.8)"
            description="This formula values scoring most (1.5x), assists normally (1x), and rebounds less (0.8x)"
            weight="Points are 50% more valuable, rebounds are 20% less valuable than assists"
          />

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Common Weighting Strategies</h3>
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Position-Based Weighting</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Weight stats based on what's important for different positions:
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Guards: Weight AST and STL higher</li>
                  <li>• Forwards: Balance PTS, REB, and AST</li>
                  <li>• Centers: Weight REB and BLK higher</li>
                </ul>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Impact-Based Weighting</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Weight stats based on their impact on winning:
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• High impact: PTS, AST, PLUS_MINUS (weight 1.2-2.0)</li>
                  <li>• Medium impact: REB, STL, BLK (weight 0.8-1.2)</li>
                  <li>• Negative impact: TOV (subtract or use negative weight)</li>
                </ul>
              </div>
            </div>
          </div>

          <StatExample
            title="Advanced Weighting Formula"
            formula="(PTS * 1.2 + AST * 1.5 + REB * 0.7 + STL * 2.0 - TOV * 1.8) * PLUS_MINUS / 10"
            description="Comprehensive player value that heavily weights playmaking and steals, penalizes turnovers, and scales by team impact"
            weight="Assists and steals are most valuable, turnovers heavily penalized, scaled by team performance"
          />
        </div>
      )
    },
    {
      id: "examples",
      title: "Formula Examples & Templates",
      icon: <Target className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Efficiency Metrics</h3>
            
            <StatExample
              title="True Shooting Percentage"
              formula="PTS / (2 * (FGA + (0.44 * FTA)))"
              description="Measures shooting efficiency accounting for 2-pointers, 3-pointers, and free throws"
              weight="0.44 weights free throw attempts to account for and-one opportunities"
            />

            <StatExample
              title="Usage Rate"
              formula="100 * (0.33 * AST + FGA + 0.44 * FTA + TOV) / (MIN * 2.4)"
              description="Estimates percentage of team plays used by a player when on court"
              weight="Assists weighted at 0.33, FTA at 0.44, normalized per minute"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Impact Metrics</h3>
            
            <StatExample
              title="Offensive Impact"
              formula="(PTS + AST * 2) * FG_PCT"
              description="Combines scoring and playmaking, weighted by shooting efficiency"
              weight="Assists worth 2 points each, multiplied by efficiency"
            />

            <StatExample
              title="Defensive Impact"
              formula="(STL * 2 + BLK * 1.5 + REB * 0.8) - (TOV * 0.5)"
              description="Values defensive actions while slightly penalizing turnovers"
              weight="Steals most valuable, blocks second, rebounds contribute, turnovers penalized"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Role-Specific Metrics</h3>
            
            <StatExample
              title="Point Guard Value"
              formula="(AST * 2.5 + STL * 2) / TOV + (PTS * 0.8)"
              description="Emphasizes playmaking and ball security for point guards"
              weight="Assists and steals heavily weighted, scoring less important, penalizes turnovers"
            />

            <StatExample
              title="Big Man Efficiency"
              formula="(PTS + REB * 1.5 + BLK * 2) * FG_PCT / MIN * 36"
              description="Values interior presence and efficiency for centers/power forwards"
              weight="Rebounds 1.5x value, blocks 2x value, per-36-minute basis"
            />
          </div>
        </div>
      )
    },
    {
      id: "advanced",
      title: "Advanced Formula Techniques",
      icon: <TrendingUp className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Normalization Techniques</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Make your stats comparable across different playing times and eras.
            </p>

            <StatExample
              title="Per-36-Minute Stats"
              formula="(PTS + REB + AST) * 36 / MIN"
              description="Normalizes stats to a 36-minute game for fair comparison"
              weight="Multiplies by 36 and divides by actual minutes played"
            />

            <StatExample
              title="Pace-Adjusted Scoring"
              formula="PTS * 100 / (MIN * 2.4)"
              description="Adjusts for different team paces and playing time"
              weight="2.4 represents average possessions per minute in modern NBA"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Efficiency Ratios</h3>
            
            <StatExample
              title="Assist-to-Turnover Ratio"
              formula="AST / TOV"
              description="Measures playmaking efficiency and ball security"
              weight="Higher is better - more assists per turnover"
            />

            <StatExample
              title="Steal-to-Foul Rate"
              formula="STL * 10 / (TOV + 1)"
              description="Measures aggressive defense without gambling"
              weight="Multiplied by 10 for readable scale, +1 prevents division by zero"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Composite Metrics</h3>
            
            <StatExample
              title="Player Efficiency Rating (PER)"
              formula="(PTS + REB + AST + STL + BLK - TOV) / MIN * 15"
              description="Simplified version of NBA's PER statistic"
              weight="All positive stats added, turnovers subtracted, normalized per minute"
            />

            <StatExample
              title="Win Impact Score"
              formula="((PTS * 1.2 + AST * 1.8 + REB * 0.9) - TOV * 1.5) * PLUS_MINUS / 100"
              description="Estimates individual contribution to team wins"
              weight="Playmaking valued highest, scaled by actual team performance"
            />
          </div>
        </div>
      )
    },
    {
      id: "tips",
      title: "Best Practices & Tips",
      icon: <Award className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Formula Design Tips</h3>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">✓ DO</h4>
                <ul className="text-sm text-green-700 dark:text-green-200 space-y-1">
                  <li>• Start simple and add complexity gradually</li>
                  <li>• Test your formula on players you know well</li>
                  <li>• Use parentheses to ensure correct order of operations</li>
                  <li>• Consider normalizing by minutes or possessions</li>
                  <li>• Weight stats based on their actual impact on winning</li>
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">✗ AVOID</h4>
                <ul className="text-sm text-red-700 dark:text-red-200 space-y-1">
                  <li>• Over-weighting one stat (makes others irrelevant)</li>
                  <li>• Forgetting to account for negative stats like turnovers</li>
                  <li>• Creating formulas too complex to interpret</li>
                  <li>• Ignoring position differences and roles</li>
                  <li>• Not testing across different player types</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Common Weighting Ranges</h3>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Positive Stats</h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <li>• High impact: 1.5 - 2.5 (AST, PTS)</li>
                    <li>• Medium impact: 0.8 - 1.5 (REB, STL, BLK)</li>
                    <li>• Situational: 0.5 - 1.0 (depending on role)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Negative Stats</h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <li>• Turnovers: -1.0 to -2.0</li>
                    <li>• Missed shots: Usually handled via percentages</li>
                    <li>• Fouls: -0.3 to -0.8 (if included)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Testing Your Formulas</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Always test your custom stats on known players to validate the results:
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li>• Elite players (LeBron, Jordan) should score highly</li>
                <li>• Role players should score appropriately for their role</li>
                <li>• Compare results across different positions and eras</li>
                <li>• Ensure your stat correlates with winning/success</li>
                <li>• Check that bench players don't unfairly dominate</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-2xl font-bold">Custom Statistics Guide</h1>
            <p className="text-slate-300">Learn how to create powerful NBA analytics using custom formulas</p>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-orange-500">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-500" />
              )}
            </button>
            
            {expandedSection === section.id && (
              <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-600">
                <div className="pt-6">
                  {section.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Reference */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-3">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-orange-700 dark:text-orange-200 mb-2">Most Common Formulas</h4>
            <ul className="text-orange-600 dark:text-orange-300 space-y-1">
              <li>• <code>PTS + REB + AST</code> - Basic production</li>
              <li>• <code>(PTS + AST * 2) / TOV</code> - Offensive efficiency</li>
              <li>• <code>PTS / (2 * (FGA + 0.44 * FTA))</code> - True Shooting %</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-orange-700 dark:text-orange-200 mb-2">Remember</h4>
            <ul className="text-orange-600 dark:text-orange-300 space-y-1">
              <li>• Use parentheses for order of operations</li>
              <li>• Test on known players first</li>
              <li>• Consider per-minute normalization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}