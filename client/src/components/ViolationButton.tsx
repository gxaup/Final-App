import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateViolation } from "@/hooks/use-bus-ops";
import { Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ViolationButtonProps {
  sessionId: number;
  type: string;
  count: number;
}

export function ViolationButton({ sessionId, type, count }: ViolationButtonProps) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const createViolation = useCreateViolation();

  const isUniform = type.toLowerCase() === "uniform";

  const handleOpen = () => {
    const now = new Date();
    setTime(format(now, "HH:mm"));
    setNotes("");
    setOpen(true);
  };

  const handleSubmit = () => {
    let timestamp = new Date();
    
    if (!isUniform) {
      if (!time) return;
      const [hours, minutes] = time.split(":").map(Number);
      timestamp.setHours(hours, minutes, 0, 0);
    }

    createViolation.mutate(
      {
        sessionId,
        type,
        timestamp,
        notes: notes || null,
      },
      {
        onSuccess: () => setOpen(false),
      }
    );
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          className="violation-btn w-full h-20 sm:h-24 md:h-28 flex flex-col items-center justify-center gap-1.5 border-2 border-white/10 hover:border-white/30 hover:bg-white/10 text-wrap text-center rounded-2xl shadow-sm px-3"
          onClick={handleOpen}
          data-testid={`button-violation-${type.replace(/\s+/g, '-').toLowerCase()}`}
        >
          <AlertCircle className="w-6 h-6 text-muted-foreground shrink-0" />
          <span className="font-semibold text-sm leading-tight line-clamp-2 break-words">{type}</span>
        </Button>
        {count > 0 && (
          <Badge className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white text-black shadow-lg border-2 border-background text-xs font-bold">
            {count}
          </Badge>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg">Log Violation</DialogTitle>
            <DialogDescription>
              {isUniform 
                ? <>Add notes for <span className="font-semibold text-foreground">{type}</span> violation.</>
                : <>Confirm the time for <span className="font-semibold text-foreground">{type}</span>.</>
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!isUniform && (
              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-12 text-lg"
                  data-testid="input-violation-time"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes (optional)
              </Label>
              <Input
                id="notes"
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-12"
                data-testid="input-violation-notes"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="h-12 sm:h-10">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createViolation.isPending} className="h-12 sm:h-10" data-testid="button-confirm-violation">
              {createViolation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
