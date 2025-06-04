import { useState, useEffect } from "react";
import { Delete } from "lucide-react";

interface StatCalculatorProps {
  onFormulaChange: (formula: string) => void;
  onCalculate: () => void;
  formula?: string;
}

export default function StatCalculator({ onFormulaChange, onCalculate, formula = "" }: StatCalculatorProps) {
  const [display, setDisplay] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  // Update display when formula prop changes
  useEffect(() => {
    if (formula !== display) {
      setDisplay(formula);
      setCursorPosition(formula.length);
    }
  }, [formula]);

  const insertAtCursor = (insertion: string) => {
    const newDisplay = display.slice(0, cursorPosition) + insertion + display.slice(cursorPosition);
    setDisplay(newDisplay);
    setCursorPosition(cursorPosition + insertion.length);
    onFormulaChange(newDisplay);
  };

  const moveCursor = (direction: 'left' | 'right') => {
    if (direction === 'left' && cursorPosition > 0) {
      setCursorPosition(cursorPosition - 1);
    } else if (direction === 'right' && cursorPosition < display.length) {
      setCursorPosition(cursorPosition + 1);
    }
  };

  const stats = [
    { name: "PPG", value: "PTS" },
    { name: "APG", value: "AST" },
    { name: "RPG", value: "REB" },
    { name: "SPG", value: "STL" },
    { name: "BPG", value: "BLK" },
    { name: "TPG", value: "TOV" },
    { name: "FG%", value: "FG_PCT" },
    { name: "FGA", value: "FGA" },
    { name: "3P%", value: "THREE_PCT" },
    { name: "3PA", value: "3PA" },
    { name: "FT%", value: "FT_PCT" },
    { name: "FTA", value: "FTA" },
    { name: "+/-", value: "PLUS_MINUS" },
    { name: "W%", value: "W_PCT" },
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

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."];

  const handleClick = (value: string) => {
    insertAtCursor(value);
  };

  const handleClear = () => {
    setDisplay("");
    setCursorPosition(0);
    onFormulaChange("");
  };

  const handleBackspace = () => {
    if (cursorPosition > 0) {
      const newDisplay = display.slice(0, cursorPosition - 1) + display.slice(cursorPosition);
      setDisplay(newDisplay);
      setCursorPosition(cursorPosition - 1);
      onFormulaChange(newDisplay);
    }
  };

  const handleDelete = () => {
    if (cursorPosition < display.length) {
      const newDisplay = display.slice(0, cursorPosition) + display.slice(cursorPosition + 1);
      setDisplay(newDisplay);
      onFormulaChange(newDisplay);
    }
  };

  const handleCalculate = () => {
    onCalculate();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Custom Stats Calculator</h3>
      
      {/* Display */}
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 mb-4 border border-slate-300 dark:border-slate-600">
        <div className="text-slate-600 dark:text-slate-300 text-sm mb-1">Formula:</div>
        <div className="text-slate-900 dark:text-white text-lg font-mono min-h-[2rem] break-all">
          {display ? (
            <span>
              {display.slice(0, cursorPosition)}
              <span className="bg-blue-500 text-white px-0.5 animate-pulse">|</span>
              {display.slice(cursorPosition)}
            </span>
          ) : (
            <span>
              <span className="bg-blue-500 text-white px-0.5 animate-pulse">|</span>
              Select stats and operations to build your formula
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Player Statistics</h4>
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
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Operations</h4>
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
                className="bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-500 text-white text-lg py-2 px-3 rounded transition-colors"
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

        {/* Navigation Controls */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Navigation</h4>
          <div className="flex gap-2">
            <button
              onClick={() => moveCursor('left')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded transition-colors"
              title="Move cursor left"
            >
              ←
            </button>
            <button
              onClick={() => moveCursor('right')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded transition-colors"
              title="Move cursor right"
            >
              →
            </button>
            <button
              onClick={handleDelete}
              disabled={cursorPosition >= display.length}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded transition-colors"
              title="Delete character at cursor"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Actions</h4>
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