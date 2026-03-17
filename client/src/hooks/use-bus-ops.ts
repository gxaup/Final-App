import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertSession, type InsertViolation, type InsertViolationType, type Session, type Violation, type ViolationType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/lib/offline-storage";
import { generateReportContent } from "@/lib/report-generator";

// ============================================
// SESSIONS
// ============================================

export function useCreateSession() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertSession) => {
      const session = await offlineStorage.createSession(data);
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
    },
    onError: (error) => {
      toast({
        title: "Error starting session",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: ["/api/sessions", id],
    queryFn: async () => {
      const session = await offlineStorage.getSession(id);
      if (!session) return null;
      const violations = await offlineStorage.getViolations(id);
      return { ...session, violations };
    },
    enabled: !!id,
  });
}

export function useEndSession() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, endTime }: { id: number, endTime: string }) => {
      return await offlineStorage.endSession(id, new Date(endTime));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useUpdateSession() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertSession> }) => {
      return await offlineStorage.updateSession(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session Updated",
        description: "Session details have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await offlineStorage.deleteSession(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Deleted",
        description: "Session and violations removed.",
      });
    }
  });
}

export function useDeleteAllSessions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      await offlineStorage.deleteAllSessions();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "All Cleared",
        description: "All your sessions have been deleted.",
      });
    }
  });
}

export function useGenerateReport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const session = await offlineStorage.getSession(sessionId);
      if (!session) throw new Error("Session not found");
      const violations = await offlineStorage.getViolations(sessionId);
      const user = await offlineStorage.getCurrentUser();
      
      const report = generateReportContent(session, violations, user?.username || "Inspector");
      return report;
    },
    onSuccess: (data) => {
      // Trigger download
      const blob = new Blob([data.content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Generated",
        description: "Your session report has been downloaded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Report Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

// ============================================
// VIOLATIONS
// ============================================

export function useViolations(sessionId: number) {
  return useQuery({
    queryKey: ["/api/sessions", sessionId, "violations"],
    queryFn: async () => {
      return await offlineStorage.getViolations(sessionId);
    },
    enabled: !!sessionId,
  });
}

export function useCreateViolation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertViolation) => {
      return await offlineStorage.createViolation(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", variables.sessionId, "violations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", variables.sessionId] });
      toast({
        title: "Violation Logged",
        description: "Added to session log.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteViolation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: number, sessionId: number }) => {
      await offlineStorage.deleteViolation(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", variables.sessionId, "violations"] });
      toast({
        title: "Removed",
        description: "Violation removed from log.",
      });
    }
  });
}

// ============================================
// VIOLATION TYPES
// ============================================

export function useViolationTypes() {
  return useQuery({
    queryKey: ["/api/violation-types"],
    queryFn: async () => {
      return await offlineStorage.getViolationTypes();
    },
  });
}

export function useCreateViolationType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertViolationType) => {
      return await offlineStorage.createViolationType(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/violation-types"] });
      toast({
        title: "Success",
        description: "New violation type added.",
      });
    }
  });
}

// ============================================
// DRIVERS
// ============================================

export function useDrivers() {
  return useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const drivers = await offlineStorage.getDrivers();
      return drivers.map(d => ({
        ...d,
        lastReportDate: d.lastReportDate.toISOString()
      }));
    }
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      await offlineStorage.deleteDriver(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Removed",
        description: "Driver removed from list.",
      });
    }
  });
}

export function useDeleteAllDrivers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      await offlineStorage.deleteAllDrivers();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Cleared",
        description: "Driver list has been cleared.",
      });
    }
  });
}

export function useUpdateDriverDate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ driverName, newDate }: { driverName: string; newDate: string }) => {
      await offlineStorage.updateDriverDate(driverName, new Date(newDate));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Updated",
        description: "Driver report date updated.",
      });
    }
  });
}
