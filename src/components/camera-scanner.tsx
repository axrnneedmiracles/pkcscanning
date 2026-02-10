"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scan, Save, RefreshCcw, Loader2 } from "lucide-react";
import { initiateScanWithPrompt } from "@/ai/flows/initiate-scan-with-prompt";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CameraScannerProps {
  onScan: (plate: string) => void;
}

export function CameraScanner({ onScan }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function setupCamera() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment", 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 } 
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
        setStream(userStream);
      } catch (err) {
        console.error("Camera access denied", err);
        toast({
          title: "Camera Error",
          description: "Could not access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    }

    setupCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleScan = async () => {
    if (isCapturing || !videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setIsScanning(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg', 0.8);

      const result = await initiateScanWithPrompt({ 
        photoDataUri
      });

      if (result.plateNumber && result.plateNumber.trim().length > 0) {
        setDetectedPlate(result.plateNumber.toUpperCase());
        toast({
          title: "Plate Detected",
          description: `Identified: ${result.plateNumber}`,
        });
      } else {
        toast({
          title: "No Plate Found",
          description: "Could not identify a license plate. Try a different angle or better lighting.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Scan failed", error);
      toast({
        title: "Scan Failed",
        description: "An error occurred during OCR scanning.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setIsCapturing(false);
    }
  };

  const savePlate = () => {
    if (detectedPlate) {
      onScan(detectedPlate);
      setDetectedPlate(null);
      toast({
        title: "Saved",
        description: `Plate ${detectedPlate} added to history.`,
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
      />
      
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500">
        <div className="scanner-overlay w-full h-full flex flex-col items-center justify-center p-4">
          <div className="relative w-full h-full border-[1px] border-white/5 rounded-3xl flex items-center justify-center overflow-hidden">
            {isScanning && <div className="scan-line" />}
            
            {!stream && (
              <div className="flex flex-col items-center gap-4 text-white/50 bg-black/40 p-8 rounded-3xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <Loader2 className="animate-spin h-12 w-12 text-accent" />
                <p className="font-medium tracking-wide">Initializing Lens...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {detectedPlate && !isScanning && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-xs animate-in slide-in-from-top-12 fade-in duration-500 z-40 float-animation">
          <Card className="glass-panel p-5 shadow-2xl border-accent/40 plate-highlight">
            <div className="flex flex-col items-center gap-4">
              <Badge variant="outline" className="text-accent border-accent/50 text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1">
                Detected Plate
              </Badge>
              <div className="text-4xl font-mono font-bold tracking-tighter text-accent bg-black/60 px-6 py-3 rounded-xl border border-white/10 w-full text-center shadow-inner">
                {detectedPlate}
              </div>
              <div className="flex w-full gap-3 mt-1">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-secondary/30 border-white/10 hover:bg-secondary/60 transition-all"
                  onClick={() => setDetectedPlate(null)}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Redo
                </Button>
                <Button 
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_20px_rgba(var(--accent),0.3)] transition-all"
                  onClick={savePlate}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="absolute bottom-32 left-0 right-0 flex justify-center items-center z-20">
        <button
          onClick={handleScan}
          disabled={isCapturing || !stream}
          className={cn(
            "group relative flex items-center justify-center w-28 h-28 rounded-full transition-all duration-300 active:scale-95 disabled:opacity-50",
            isCapturing && "scale-110"
          )}
        >
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 scale-110 group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute inset-2 rounded-full border border-accent/40 animate-pulse" />
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-primary-foreground shadow-[0_0_40px_rgba(var(--accent),0.5)] group-hover:shadow-[0_0_60px_rgba(var(--accent),0.7)] group-hover:scale-105 transition-all duration-300">
            {isCapturing ? (
              <Loader2 className="animate-spin h-10 w-10" />
            ) : (
              <Scan className="h-10 w-10 group-hover:rotate-90 transition-transform duration-500" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}