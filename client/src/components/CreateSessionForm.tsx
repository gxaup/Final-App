import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSessionSchema, type InsertSession } from "@shared/schema";
import { useCreateSession } from "@/hooks/use-bus-ops";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, BusFront, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export function CreateSessionForm() {
  const [, setLocation] = useLocation();
  const createSession = useCreateSession();
  const [timeValue, setTimeValue] = useState(format(new Date(), "HH:mm"));

  const form = useForm<InsertSession>({
    resolver: zodResolver(insertSessionSchema),
    defaultValues: {
      busNumber: "",
      driverName: "",
      stopBoarded: "",
      route: "",
      startTime: new Date(),
    },
  });

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    const [hours, minutes] = newTime.split(":").map(Number);
    const timestamp = new Date();
    timestamp.setHours(hours, minutes, 0, 0);
    form.setValue("startTime", timestamp);
  };

  const onSubmit = (data: InsertSession) => {
    createSession.mutate(data, {
      onSuccess: (session) => {
        setLocation(`/session/${session.id}`);
      },
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-2xl shadow-lg border border-border/50">
      <div className="mb-8 text-center">
        <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
          <BusFront className="w-8 h-8 text-foreground" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground">Start Observation</h1>
        <p className="text-muted-foreground mt-2">Enter trip details to begin logging.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="busNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">Bus Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 359" className="h-12 bg-background" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="route"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">Route</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. downtown, uptown, night..." className="h-12 bg-background" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driverName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">Driver Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Doe" className="h-12 bg-background" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stopBoarded"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">Stop Boarded</FormLabel>
                <FormControl>
                  <Input placeholder="1, 2, 3..." className="h-12 bg-background" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2 pt-2">
            <FormLabel className="text-foreground font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Time On (Boarding Time)
            </FormLabel>
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="h-12 text-lg bg-background"
              data-testid="input-start-time"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover-lift"
              disabled={createSession.isPending}
            >
              {createSession.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting...
                </>
              ) : (
                "Start Session"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
