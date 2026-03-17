import { type Session, type Violation } from "@shared/schema";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "America/New_York";

export function generateReportContent(session: Session, violations: Violation[], username: string): { filename: string, content: string } {
  const lines = [];
  lines.push(`SESSION REPORT`);
  lines.push(`================================`);
  lines.push(`Bus Number: ${session.busNumber}`);
  lines.push(`Bus Driver: ${session.driverName}`);
  lines.push(`Route: ${session.route}`);
  lines.push(`Stop Boarded: ${session.stopBoarded}`);
  lines.push(`Time Boarded: ${formatInTimeZone(new Date(session.startTime), TZ, "h:mm a")}`);
  lines.push(`Time Off: ${session.endTime ? formatInTimeZone(new Date(session.endTime), TZ, "h:mm a") : "N/A"}`);
  lines.push(``);
  lines.push(`VIOLATIONS LOG (${violations.length})`);
  lines.push(`--------------------------------`);
  
  if (violations.length === 0) {
    lines.push(`No violations recorded.`);
  } else {
    // Sort violations by timestamp (earliest first)
    const sortedViolations = [...violations].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Group violations by type
    const grouped: Record<string, Array<{time: string, timestamp: Date, note?: string}>> = {};
    sortedViolations.forEach((v) => {
      const timeStr = formatInTimeZone(new Date(v.timestamp), TZ, "h:mm a");
      if (!grouped[v.type]) {
        grouped[v.type] = [];
      }
      grouped[v.type].push({ time: timeStr, timestamp: new Date(v.timestamp), note: v.notes || undefined });
    });
    
    // Sort groups by earliest violation time
    const sortedGroups = Object.entries(grouped).sort((a, b) => 
      a[1][0].timestamp.getTime() - b[1][0].timestamp.getTime()
    );
    
    for (const [type, entries] of sortedGroups) {
      if (type.toLowerCase() === "uniform") {
        const notesOnly = entries.filter(e => e.note).map(e => e.note);
        if (notesOnly.length > 0) {
          lines.push(notesOnly.join(", "));
        } else {
          lines.push(`Uniform violation (${entries.length})`);
        }
      } else {
        const timesWithNotes = entries.map(e => e.note ? `${e.time} (${e.note})` : e.time);
        lines.push(`[${timesWithNotes.join(", ")}] || ${type}`);
      }
    }
  }

  const content = lines.join("\n");
  const reportName = `${username}_${session.busNumber}`;
  const filename = `${reportName}_${format(new Date(), "yyyyMMdd_HHmm")}.txt`;

  return { filename, content };
}
