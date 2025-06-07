import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save } from "lucide-react";

interface SaveStatDialogProps {
  formula: string;
  onSave: (name: string, description: string, isPublic?: boolean) => void;
  disabled?: boolean;
}

export default function SaveStatDialog({ formula, onSave, disabled }: SaveStatDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim(), isPublic);
      setName("");
      setDescription("");
      setIsPublic(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || !formula.trim()}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Custom Stat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Custom Stat</DialogTitle>
          <DialogDescription>
            Give your custom stat formula a name and description.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Formula:</div>
            <div className="font-mono text-sm">{formula}</div>
          </div>
          
          <div>
            <label htmlFor="stat-name" className="block text-sm font-medium mb-2">
              Stat Name
            </label>
            <Input
              id="stat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Triple-Double Impact"
              maxLength={50}
            />
          </div>
          
          <div>
            <label htmlFor="stat-description" className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <Textarea
              id="stat-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Measures overall impact by combining points, assists, and rebounds"
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle">Share with community</Label>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Make this formula visible to other users
              </div>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Stat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}