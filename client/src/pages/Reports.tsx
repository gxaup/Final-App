import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Clock, CheckCircle, Trash2, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useDeleteSession, 
  useDeleteAllSessions,
  useGenerateReport 
} from "@/hooks/use-bus-ops";
import { offlineStorage } from "@/lib/offline-storage";
import type { Session } from "@shared/schema";

export default function Reports() {
  const [viewingReport, setViewingReport] = useState<{ content: string; filename: string } | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    queryFn: async () => await offlineStorage.getSessions()
  });

  const deleteSession = useDeleteSession();
  const deleteAllSessions = useDeleteAllSessions();
  const generateReport = useGenerateReport();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this report?")) {
      deleteSession.mutate(id);
    }
  };

  const handleDeleteAll = () => {
    if (confirm("Delete ALL reports? This cannot be undone.")) {
      deleteAllSessions.mutate();
    }
  };

  const handleViewReport = async (sessionId: number) => {
    setLoadingReportId(sessionId);
    try {
      const data = await generateReport.mutateAsync(sessionId);
      setViewingReport(data);
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleDownload = () => {
    if (!viewingReport) return;
    const blob = new Blob([viewingReport.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = viewingReport.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const drafts = sessions?.filter(s => !s.endTime) || [];
  const completed = sessions?.filter(s => s.endTime) || [];

  return (
    <div className="min-h-screen w-full bg-background p-4 safe-area-top safe-area-bottom">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold flex-1">Reports</h1>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDeleteAll}
            disabled={deleteAllSessions.isPending || !sessions?.length}
            className="h-10"
            data-testid="button-delete-all"
          >
            <Trash2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Delete All</span>
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                Drafts
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {isLoading ? "..." : drafts.length} reports
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No drafts</p>
              ) : (
                <div className="space-y-2">
                  {drafts.map((session) => (
                    <Link key={session.id} href={`/session/${session.id}`}>
                      <div className="touch-card flex items-center gap-3 p-3 min-h-[3.5rem] bg-background rounded-lg border cursor-pointer">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            Bus {session.busNumber || "Unknown"} - {session.route || "No route"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Started {new Date(session.startTime).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0"
                          onClick={(e) => handleDelete(e, session.id)}
                          data-testid={`button-delete-session-${session.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-white/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                Completed
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {isLoading ? "..." : completed.length} reports
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : completed.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No completed reports</p>
              ) : (
                <div className="space-y-2">
                  {completed.map((session) => (
                    <div 
                      key={session.id} 
                      className="touch-card flex items-center gap-3 p-3 min-h-[3.5rem] bg-background rounded-lg border cursor-pointer"
                      onClick={() => handleViewReport(session.id)}
                      data-testid={`card-completed-session-${session.id}`}
                    >
                      <FileText className="w-4 h-4 text-green-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          Bus {session.busNumber || "Unknown"} - {session.route || "No route"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Completed {new Date(session.endTime!).toLocaleDateString()}
                        </p>
                      </div>
                      {loadingReportId === session.id && (
                        <span className="text-xs text-muted-foreground">Loading...</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0"
                        onClick={(e) => handleDelete(e, session.id)}
                        data-testid={`button-delete-session-${session.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between gap-4">
            <DialogTitle className="font-mono text-sm truncate">
              {viewingReport?.filename}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              data-testid="button-download-report"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogHeader>
          <ScrollArea className="flex-1 mt-4">
            <pre className="text-sm font-mono whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {viewingReport?.content}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
