import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateViolationType } from "@/hooks/use-bus-ops";
import { Plus, Loader2 } from "lucide-react";

export function AddViolationTypeDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createType = useCreateViolationType();

  const handleSubmit = () => {
    if (!name.trim()) return;

    createType.mutate(
      {
        name,
        isDefault: false,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="violation-btn h-20 sm:h-24 md:h-28 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/10 rounded-2xl"
          data-testid="button-add-violation-type"
        >
          <Plus className="w-6 h-6 text-muted-foreground" />
          <span className="text-muted-foreground font-medium text-sm">Add Type</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg">New Violation Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Violation Name</Label>
            <Input
              id="name"
              placeholder="e.g. Speeding, Early Arrival"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
              data-testid="input-violation-type-name"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-12 sm:h-10">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createType.isPending || !name.trim()} className="h-12 sm:h-10" data-testid="button-add-type-confirm">
            {createType.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
