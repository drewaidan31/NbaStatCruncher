import { useState, useEffect } from "react";

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDisplay(newValue);
    onFormulaChange(newValue);
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
  
  const handleDelete = () => {
    const textarea = document.querySelector('textarea[data-formula-input]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      let newValue;
      
      if (start !== end) {
        // If text is selected, delete the selection
        newValue = display.slice(0, start) + display.slice(end);
      } else if (start > 0) {
        // Delete the character before the cursor
        newValue = display.slice(0, start - 1) + display.slice(start);
      } else {
        // Nothing to delete
        return;
      }
      
      setDisplay(newValue);
      onFormulaChange(newValue);
      
      // Set cursor position
      const newCursorPos = start !== end ? start : start - 1;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // Fallback if textarea not found
      setDisplay(display.slice(0, -1));
      onFormulaChange(display.slice(0, -1));
    }
  };

  const handleClick = (value: string) => {
    const textarea = document.querySelector('textarea[data-formula-input]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = display.slice(0, start) + value + display.slice(end);
      setDisplay(newValue);
      onFormulaChange(newValue);
      
      // Set cursor position after the inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + value.length, start + value.length);
      }, 0);
    } else {
      // Fallback if textarea not found
      setDisplay(display + value);
      onFormulaChange(display + value);
    }
  };

  const handleClear = () => {
    setDisplay("");
    onFormulaChange("");
    const textarea = document.querySelector('textarea[data-formula-input]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  };

  const handleCalculate = () => {
    onCalculate();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Custom Stats Calculator</h3>
      
      {/* Formula Input */}
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 mb-4 border border-slate-300 dark:border-slate-600">
        <label htmlFor="formula-input" className="text-slate-600 dark:text-slate-300 text-sm mb-1 block">
          Formula:
        </label>
        <textarea
          id="formula-input"
          data-formula-input
          value={display}
          onChange={handleInputChange}
          placeholder="Type your formula or use the buttons below to build it"
          className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-mono min-h-[4rem] p-3 rounded border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
        />
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
              disabled={!display}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-lg py-2 px-3 rounded transition-colors"
              title="Delete last character"
            >
              ⌫
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