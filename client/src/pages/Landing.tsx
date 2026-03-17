import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ClipboardList, Folder, Play, LogOut, Users, Trash2, RefreshCw, Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  useDrivers, 
  useDeleteDriver, 
  useDeleteAllDrivers, 
  useUpdateDriverDate 
} from "@/hooks/use-bus-ops";
import { api } from "@shared/routes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format, differenceInDays, isToday, isYesterday } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface DriverInfo {
  driverName: string;
  lastReportDate: string;
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [driversOpen, setDriversOpen] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [editingDriver, setEditingDriver] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: drivers = [], isLoading: driversLoading } = useDrivers();
  const deleteDriverMutation = useDeleteDriver();
  const deleteAllDriversMutation = useDeleteAllDrivers();
  const updateDriverDateMutation = useUpdateDriverDate();

  const startEditing = (driverName: string, currentDate: string) => {
    setEditingDriver(driverName);
    setEditDate(format(new Date(currentDate), "yyyy-MM-dd"));
  };

  const cancelEditing = () => {
    setEditingDriver(null);
    setEditDate("");
  };

  const saveEdit = (driverName: string) => {
    if (editDate) {
      const isoDate = new Date(editDate).toISOString();
      updateDriverDateMutation.mutate({ driverName, newDate: isoDate });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const savedId = localStorage.getItem("activeSessionId");
    if (savedId) {
      setActiveSessionId(savedId);
    }
  }, []);

  const handleResume = () => {
    if (activeSessionId) {
      setLocation(`/session/${activeSessionId}`);
    }
  };

  const handleStartNew = () => {
    localStorage.removeItem("activeSessionId");
    setLocation("/start");
  };

  const handleLogout = async () => {
    await logout();
  };

  const getSuitabilityLabel = (lastReportDate: string) => {
    const date = new Date(lastReportDate);
    const daysDiff = differenceInDays(new Date(), date);
    if (daysDiff > 3) {
      return { label: "Suitable", variant: "default" as const };
    }
    return { label: "Unsuitable", variant: "destructive" as const };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateFormatted = format(date, "M/d");
    if (isToday(date)) return `Today, ${dateFormatted}`;
    if (isYesterday(date)) return `Yesterday, ${dateFormatted}`;
    const daysDiff = differenceInDays(new Date(), date);
    if (daysDiff < 7) return `${daysDiff} days ago, ${dateFormatted}`;
    return format(date, "M/d/yyyy");
  };

  const toggleDriverSelection = (driverName: string) => {
    setSelectedDrivers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(driverName)) {
        newSet.delete(driverName);
      } else {
        newSet.add(driverName);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    const driversToDelete = Array.from(selectedDrivers);
    for (const driverName of driversToDelete) {
      await deleteDriverMutation.mutateAsync(driverName);
    }
    setSelectedDrivers(new Set());
    toast({ title: `${driversToDelete.length} driver(s) deleted` });
  };

  const handleDeleteAll = () => {
    deleteAllDriversMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col p-4 safe-area-bottom safe-area-top">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {user && (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-user-name">
              {user.username}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
                queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
                toast({ title: "Refreshed list" });
              }}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-foreground">
              Full Loop Report
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {user ? `Welcome, ${user.username}` : "Bus Violation Logging"}
            </p>
          </div>
        
        <div className="flex flex-col gap-3">
          {activeSessionId && (
            <Button 
              onClick={handleResume}
              className="w-full h-14 sm:h-16 text-base sm:text-lg shadow-lg bg-white/20 hover:bg-white/30 border border-white/20 hover-lift"
              data-testid="button-resume-session"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Resume Last Report
            </Button>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleStartNew}
              className="flex-1 h-14 sm:h-16 text-base sm:text-lg shadow-lg bg-white text-black hover:bg-white/90 hover-lift"
              data-testid="button-start-report"
            >
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Start Report
            </Button>
            
            <Link href="/reports" className="flex-1">
              <Button 
                variant="outline"
                className="w-full h-14 sm:h-16 text-base sm:text-lg border-white/20 hover:bg-white/10 hover-lift"
                data-testid="button-reports"
              >
                <Folder className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Reports
              </Button>
            </Link>
          </div>

          <Dialog open={driversOpen} onOpenChange={(open) => {
            setDriversOpen(open);
            if (!open) setSelectedDrivers(new Set());
          }}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="w-full h-14 sm:h-16 text-base sm:text-lg border-white/20 hover:bg-white/10 hover-lift"
                data-testid="button-drivers"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Driver List
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold">Driver Records</DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
                      toast({ title: "Refreshed driver list" });
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    data-testid="button-sync-drivers"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {drivers.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{drivers.length} driver{drivers.length !== 1 ? "s" : ""} tracked</p>
                )}
              </DialogHeader>
              <div className="flex-1 overflow-y-auto mt-3">
                {driversLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : drivers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No drivers reported yet</p>
                ) : (
                  <div className="divide-y divide-border/50">
                    {drivers.map((driver, index) => {
                      const { label, variant } = getSuitabilityLabel(driver.lastReportDate);
                      const isSelected = selectedDrivers.has(driver.driverName);
                      const isEditing = editingDriver === driver.driverName;
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-3 py-3 px-4 transition-colors ${
                            isSelected ? "bg-primary/10" : "hover:bg-muted/30"
                          }`}
                          data-testid={`driver-item-${index}`}
                        >
                          <label className="flex items-center cursor-pointer">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleDriverSelection(driver.driverName)}
                              className="h-6 w-6"
                              data-testid={`checkbox-driver-${index}`}
                            />
                          </label>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate text-sm" data-testid={`text-driver-name-${index}`}>
                              {driver.driverName}
                            </p>
                            {isEditing ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="text-xs px-2 py-1 border rounded bg-background"
                                  data-testid={`input-edit-date-${index}`}
                                />
                                <button
                                  onClick={() => saveEdit(driver.driverName)}
                                  disabled={updateDriverDateMutation.isPending}
                                  className="p-1 text-green-600 hover:text-green-700"
                                  data-testid={`button-save-date-${index}`}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1 text-muted-foreground hover:text-foreground"
                                  data-testid={`button-cancel-edit-${index}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground" data-testid={`text-driver-date-${index}`}>
                                {formatDate(driver.lastReportDate)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span 
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                variant === "default" 
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                                  : "bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                              data-testid={`badge-suitability-${index}`}
                            >
                              {label}
                            </span>
                            {!isEditing && (
                              <button
                                onClick={() => startEditing(driver.driverName, driver.lastReportDate)}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                data-testid={`button-edit-date-${index}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {drivers.length > 0 && (
                <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs">
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedDrivers.size === 0 || deleteDriverMutation.isPending}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    data-testid="button-delete-selected"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove selected {selectedDrivers.size > 0 && `(${selectedDrivers.size})`}
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleteAllDriversMutation.isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    data-testid="button-delete-all"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        </div>
      </div>
    </div>
  );
}
