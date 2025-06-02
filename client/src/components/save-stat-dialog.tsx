import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Loader2 } from "lucide-react";

interface SaveStatDialogProps {
  formula: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function SaveStatDialog({ formula, onClose, isOpen }: SaveStatDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const generateNameMutation = useMutation({
    mutationFn: async (formula: string) => {
      const response = await apiRequest("POST", "/api/custom-stats/generate-name", { formula });
      return response.json();
    },
    onSuccess: (data) => {
      setName(data.name);
      setDescription(data.description);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; formula: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/custom-stats/save", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-stats/my"] });
      setName("");
      setDescription("");
      onClose();
    },
  });

  const handleSave = () => {
    if (name.trim() && formula.trim()) {
      saveMutation.mutate({
        name: name.trim(),
        formula,
        description: description.trim() || undefined,
      });
    }
  };

  const handleGenerateName = () => {
    if (formula.trim()) {
      generateNameMutation.mutate(formula);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-slate-50 mb-4">Save Custom Stat</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Stat Name *
              </label>
              <button
                onClick={handleGenerateName}
                disabled={!formula.trim() || generateNameMutation.isPending}
                className="flex items-center gap-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-1 rounded transition-colors"
              >
                {generateNameMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI Generate
              </button>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Triple-Double Impact"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what this stat measures"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Formula
            </label>
            <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 font-mono text-sm">
              {formula}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !formula.trim() || saveMutation.isPending}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
          >
            {saveMutation.isPending ? "Saving..." : "Save Stat"}
          </button>
        </div>
      </div>
    </div>
  );
}