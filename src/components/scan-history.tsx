"use client";

import { useState } from "react";
import { type ScanResult } from "./scanner-layout";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Search, Car, Calendar, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { summarizeScanHistory } from "@/ai/flows/summarize-scan-history";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ScanHistoryProps {
  history: ScanResult[];
  onClear: () => void;
}

export function ScanHistory({ history, onClear }: ScanHistoryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const handleGenerateSummary = async () => {
    if (history.length === 0) return;
    setIsSummarizing(true);
    setIsSummaryOpen(true);
    try {
      const historyStr = history
        .map((h) => `${h.plateNumber} at ${format(new Date(h.timestamp), "yyyy-MM-dd HH:mm:ss")}`)
        .join("\n");
      const result = await summarizeScanHistory({ scanHistory: historyStr });
      setSummary(result.summary);
    } catch (e) {
      console.error(e);
      setSummary("Failed to generate summary. Please try again later.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scan Log</h2>
          <p className="text-muted-foreground text-sm">
            {history.length} {history.length === 1 ? "record" : "records"} captured
          </p>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateSummary}
                className="bg-secondary/50 border-accent/20 hover:border-accent/50"
              >
                <FileText className="h-4 w-4 mr-2 text-accent" />
                Analyze
              </Button>
              <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-secondary p-6 rounded-full">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">No scans yet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Start by pointing your camera at a car number plate in the Scan tab.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((scan) => (
            <Card key={scan.id} className="bg-card/40 border-white/5 hover:border-accent/20 transition-all p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/30 p-3 rounded-lg border border-accent/10">
                    <Car className="text-accent h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-mono font-bold tracking-tight text-accent">
                      {scan.plateNumber}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(scan.timestamp), "MMM d, yyyy • h:mm a")}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-secondary text-accent border-accent/10">
                  Verified
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="bg-card border-accent/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-accent">
              <Info className="h-5 w-5" />
              Intelligence Report
            </DialogTitle>
            <DialogDescription>
              AI-driven insights from your scan history log.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 min-h-[100px] text-sm leading-relaxed text-foreground/90 font-body">
            {isSummarizing ? (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <Loader2 className="animate-spin h-6 w-6 text-accent" />
                <p className="text-xs text-muted-foreground">Analyzing patterns...</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{summary}</div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsSummaryOpen(false)} className="border-accent/20 hover:bg-accent/10 hover:text-accent">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
