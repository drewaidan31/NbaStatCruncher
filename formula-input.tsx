import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NBA_STAT_MAPPINGS, NBA_STAT_DESCRIPTIONS } from "@shared/schema";
import { AlertCircle, CheckCircle } from "lucide-react";

interface FormulaInputProps {
  formula: string;
  onFormulaChange: (formula: string) => void;
}

export default function FormulaInput({ formula, onFormulaChange }: FormulaInputProps) {
  const [validationError, setValidationError] = useState("");
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateFormula(formula);
  }, [formula]);

  const validateFormula = (formula: string) => {
    if (!formula.trim()) {
      setValidationError("");
      setIsValid(false);
      return;
    }

    const formulaUpper = formula.toUpperCase();
    const availableStats = Object.keys(NBA_STAT_MAPPINGS);
    const usedStats = availableStats.filter(stat => 
      new RegExp(`\\b${stat}\\b`).test(formulaUpper)
    );

    if (usedStats.length === 0) {
      setValidationError("Formula must contain at least one valid NBA stat");
      setIsValid(false);
      return;
    }

    // Basic syntax validation - check for balanced parentheses
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      setValidationError("Unbalanced parentheses in formula");
      setIsValid(false);
      return;
    }

    setValidationError("");
    setIsValid(true);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
      <h2 className="text-2xl font-bold mb-6 text-slate-50">Custom Stat Formula</h2>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Label htmlFor="formula" className="block text-sm font-medium text-slate-300 mb-2">
            Enter Your Formula
          </Label>
          
          <div className="relative">
            <Input
              id="formula"
              type="text"
              placeholder="e.g., (PTS + AST + REB) / TOV * PLUS_MINUS"
              value={formula}
              onChange={(e) => onFormulaChange(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-900 border text-slate-50 placeholder-slate-400 font-mono text-lg pr-24 focus:text-slate-50 ${
                validationError 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : isValid 
                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500'
                    : 'border-slate-600 focus:border-orange-500 focus:ring-orange-500'
              }`}
            />
          </div>

          {validationError && (
            <Alert className="mt-2 border-red-500 bg-red-950 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {isValid && !validationError && (
            <Alert className="mt-2 border-emerald-500 bg-emerald-950 text-emerald-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Formula is valid and ready to calculate</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="bg-slate-900 rounded-lg p-4">
          <h3 className="font-semibold text-slate-300 mb-3">Available Stats</h3>
          <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {Object.entries(NBA_STAT_DESCRIPTIONS).map(([abbrev, description]) => (
              <div key={abbrev} className="flex justify-between">
                <span className="text-slate-400 font-mono">{abbrev}</span>
                <span className="text-slate-300 text-xs">{description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
