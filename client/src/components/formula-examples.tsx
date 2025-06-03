import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

interface FormulaExamplesProps {
  onFormulaSelect: (formula: string, name?: string) => void;
}

const EXAMPLE_FORMULAS = [
  {
    name: "True Shooting % (TS%)",
    formula: "PTS / (2 * (FGA + (0.44 * FTA)))",
    description: "Combines all forms of scoring into one metric - field goals, 3-pointers, and free throws"
  },
  {
    name: "Effective FG% (eFG%)",
    formula: "((FGA * FG_PCT) + (0.5 * 3PA * THREE_PCT)) / FGA",
    description: "Shooting efficiency that weights 3-pointers as 1.5x more valuable than 2-pointers"
  },
  {
    name: "Player Efficiency Rating",
    formula: "PTS + REB + AST - TOV",
    description: "Basic efficiency combining production and protecting the ball"
  },
  {
    name: "Impact Score",
    formula: "(PTS + AST) * PLUS_MINUS / MIN",
    description: "Per-minute impact weighted by team performance"
  },
  {
    name: "Shooting Efficiency",
    formula: "PTS * FG_PCT * FT_PCT",
    description: "Points scored weighted by shooting accuracy"
  },
  {
    name: "Defensive Impact",
    formula: "STL + BLK - (TOV / 2)",
    description: "Defensive contributions minus half of turnovers"
  },
  {
    name: "Balanced Scorer",
    formula: "(PTS + AST + REB) / (TOV + 1)",
    description: "Well-rounded production with turnover penalty"
  },
  {
    name: "Usage Rate (USG%)",
    formula: "100 * (0.33 * AST + FGA + 0.44 * FTA + TOV) / (MIN * 2.4)",
    description: "Usage rate - percentage of team possessions used by player (using minutes played × 2.4 as possession estimate)"
  },
  {
    name: "Winning Impact",
    formula: "PTS * W_PCT + AST * W_PCT",
    description: "Offensive production weighted by team success when player plays"
  },
  {
    name: "3 Point Attempt Rate",
    formula: "3PA / FGA",
    description: "Percentage of field goal attempts that are three-pointers"
  }
];

export default function FormulaExamples({ onFormulaSelect }: FormulaExamplesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  console.log("FormulaExamples component rendering, examples count:", EXAMPLE_FORMULAS.length);
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 mt-8 border border-slate-700">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-slate-50">Popular Formula Examples</h3>
        <button className="text-slate-400 hover:text-slate-200 transition-colors">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {EXAMPLE_FORMULAS.map((example, index) => (
            <Card
              key={index}
              className="bg-slate-900 border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors group"
              onClick={() => {
                console.log("Formula selected:", example.formula);
                onFormulaSelect(example.formula, example.name);
              }}
            >
              <CardContent className="p-4">
                <h4 className="font-medium text-slate-50 mb-2">{example.name}</h4>
                <code className="text-sm text-slate-300 font-mono block mb-2 p-2 bg-slate-800 rounded">
                  {example.formula}
                </code>
                <div className="text-xs text-slate-400 group-hover:text-slate-300">
                  {example.description}
                </div>
                <div className="mt-2 text-xs text-orange-400 group-hover:text-orange-300">
                  Click to use this formula
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
