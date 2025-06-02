import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Loader2 } from "lucide-react";

interface StatCalculatorProps {
  onFormulaChange: (formula: string) => void;
  onCalculate: () => void;
}

export default function StatCalculator({ onFormulaChange, onCalculate }: StatCalculatorProps) {
  const [display, setDisplay] = useState("");
  const [aiName, setAiName] = useState("");
  const [aiDescription, setAiDescription] = useState("");

  const generateNameMutation = useMutation({
    mutationFn: async (formula: string) => {
      const response = await apiRequest("POST", "/api/custom-stats/generate-name", { formula });
      return response.json();
    },
    onSuccess: (data) => {
      setAiName(data.name);
      setAiDescription(data.description);
    },
  });

  const stats = [
    { name: "PTS", value: "PTS" },
    { name: "AST", value: "AST" },
    { name: "REB", value: "REB" },
    { name: "STL", value: "STL" },
    { name: "BLK", value: "BLK" },
    { name: "TOV", value: "TOV" },
    { name: "FG%", value: "FG_PCT" },
    { name: "3P%", value: "THREE_PCT" },
    { name: "FT%", value: "FT_PCT" },
    { name: "+/-", value: "PLUS_MINUS" },
    { name: "MIN", value: "MIN" }
  ];

  const operations = [
    { symbol: "+", value: " + " },
    { symbol: "-", value: " - " },
    { symbol: "×", value: " * " },
    { symbol: "÷", value: " / " },
    { symbol: "(", value: "(" },
    { symbol: ")", value: ")" }
  ];

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  const handleClick = (value: string) => {
    const newDisplay = display + value;
    setDisplay(newDisplay);
    onFormulaChange(newDisplay);
  };

  const handleClear = () => {
    setDisplay("");
    onFormulaChange("");
  };

  const handleCalculate = () => {
    onCalculate();
  };

  const handleGenerateName = () => {
    if (display.trim()) {
      generateNameMutation.mutate(display);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Custom Stats Calculator</h3>
      
      {/* Display */}
      <div className="bg-slate-900 rounded-lg p-4 mb-4 border border-slate-600">
        <div className="text-slate-300 text-sm mb-1">Formula:</div>
        <div className="text-white text-lg font-mono min-h-[2rem] break-all">
          {display || "Select stats and operations to build your formula"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">Player Statistics</h4>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <button
                key={stat.value}
                onClick={() => handleClick(stat.value)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
              >
                {stat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Operations */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">Operations</h4>
          <div className="grid grid-cols-3 gap-2">
            {operations.map((op) => (
              <button
                key={op.symbol}
                onClick={() => handleClick(op.value)}
                className="bg-orange-600 hover:bg-orange-700 text-white text-lg py-2 px-3 rounded transition-colors"
              >
                {op.symbol}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-5 gap-2 mt-4">
            {numbers.map((num) => (
              <button
                key={num}
                onClick={() => handleClick(num)}
                className="bg-slate-600 hover:bg-slate-500 text-white text-lg py-2 px-3 rounded transition-colors"
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">Actions</h4>
          <div className="space-y-3">
            <button
              onClick={handleClear}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleCalculate}
              disabled={!display.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded font-medium transition-colors"
            >
              Calculate Rankings
            </button>
            
            <button
              onClick={handleGenerateName}
              disabled={!display.trim() || generateNameMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2"
            >
              {generateNameMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI Generate Name
            </button>
          </div>

          {(aiName || aiDescription) && (
            <div className="mt-6 bg-purple-900/30 border border-purple-600/50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Generated Name
              </h5>
              {aiName && (
                <div className="text-lg font-semibold text-purple-100 mb-2">{aiName}</div>
              )}
              {aiDescription && (
                <div className="text-sm text-purple-200">{aiDescription}</div>
              )}
            </div>
          )}

          {/* Quick Formulas */}
          <div className="mt-6">
            <h5 className="text-sm font-medium text-slate-400 mb-2">Quick Formulas</h5>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const formula = "PTS + AST + REB";
                  setDisplay(formula);
                  onFormulaChange(formula);
                }}
                className="w-full text-left bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2 px-3 rounded transition-colors"
              >
                Triple-Double Impact
              </button>
              <button
                onClick={() => {
                  const formula = "FG_PCT * PTS";
                  setDisplay(formula);
                  onFormulaChange(formula);
                }}
                className="w-full text-left bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2 px-3 rounded transition-colors"
              >
                Efficient Scoring
              </button>
              <button
                onClick={() => {
                  const formula = "(PTS + AST) / TOV";
                  setDisplay(formula);
                  onFormulaChange(formula);
                }}
                className="w-full text-left bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2 px-3 rounded transition-colors"
              >
                Ball Security
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}