import { Card, CardContent } from "@/components/ui/card";

interface FormulaExamplesProps {
  onFormulaSelect: (formula: string) => void;
}

const EXAMPLE_FORMULAS = [
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
    name: "Triple-Double Potential",
    formula: "PTS + AST + REB - 30",
    description: "How close a player gets to triple-double numbers"
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
  }
];

export default function FormulaExamples({ onFormulaSelect }: FormulaExamplesProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 mt-8 border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Popular Formula Examples</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXAMPLE_FORMULAS.map((example, index) => (
          <Card
            key={index}
            className="bg-slate-900 border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors group"
            onClick={() => onFormulaSelect(example.formula)}
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
    </div>
  );
}
