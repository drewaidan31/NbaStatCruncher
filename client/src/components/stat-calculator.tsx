import { useState } from "react";
import { Delete } from "lucide-react";

interface StatCalculatorProps {
  onFormulaChange: (formula: string) => void;
  onCalculate: () => void;
}

export default function StatCalculator({ onFormulaChange, onCalculate }: StatCalculatorProps) {
  const [display, setDisplay] = useState("");

  const stats = [
    { name: "PPG", value: "PTS" },
    { name: "APG", value: "AST" },
    { name: "RPG", value: "REB" },
    { name: "SPG", value: "STL" },
    { name: "BPG", value: "BLK" },
    { name: "TPG", value: "TOV" },
    { name: "FG%", value: "FG_PCT" },
    { name: "3P%", value: "THREE_PCT" },
    { name: "FT%", value: "FT_PCT" },
    { name: "+/-", value: "PLUS_MINUS" },
    { name: "MPG", value: "MIN" },
    { name: "GP", value: "GP" }
  ];

  const operations = [
    { symbol: "+", value: " + " },
    { symbol: "-", value: " - " },
    { symbol: "×", value: " * " },
    { symbol: "÷", value: " / " },
    { symbol: "(", value: "(" },
    { symbol: ")", value: ")" }
  ];

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

  const handleClick = (value: string) => {
    const newDisplay = display + value;
    setDisplay(newDisplay);
    onFormulaChange(newDisplay);
  };

  const handleClear = () => {
    setDisplay("");
    onFormulaChange("");
  };

  const handleDelete = () => {
    const newDisplay = display.slice(0, -1);
    setDisplay(newDisplay);
    onFormulaChange(newDisplay);
  };

  const handleCalculate = () => {
    onCalculate();
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
          
          <div className="grid grid-cols-4 gap-2 mt-4">
            {numbers.map((num) => (
              <button
                key={num}
                onClick={() => handleClick(num)}
                className="bg-slate-600 hover:bg-slate-500 text-white text-lg py-2 px-3 rounded transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              disabled={!display.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded transition-colors flex items-center justify-center"
            >
              <Delete className="w-4 h-4" />
            </button>
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
          </div>


        </div>
      </div>
    </div>
  );
}