"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scan, Save, RefreshCcw, Loader2 } from "lucide-react";
import { initiateScanWithPrompt } from "@/ai/flows/initiate-scan-with-prompt";
import { useToast } from "@/hooks/use-toast";

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
        photoDataUri,
        prompt: "Extract the license plate number from anywhere in this image."
      });

      if (result.plateNumber && result.plateNumber.trim().length > 0) {
        setDetectedPlate(result.plateNumber);
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
      {/* Video Feed - Mirroring removed to fix OCR reading backwards */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Full Screen Scanner Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="scanner-overlay w-full h-full flex flex-col items-center justify-center p-4">
          {/* Subtle Full-screen frame */}
          <div className="relative w-full h-full border-[1px] border-white/10 rounded-3xl flex items-center justify-center overflow-hidden">
            {isScanning && <div className="scan-line" />}
            
            {/* Corner decorations moved to edges */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-accent rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-accent rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-accent rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-accent rounded-br-xl" />

            {!stream && (
              <div className="flex flex-col items-center gap-2 text-white/50 bg-black/40 p-6 rounded-2xl backdrop-blur-md">
                <Loader2 className="animate-spin h-10 w-10" />
                <p className="font-medium">Initializing Camera...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detection Result Card */}
      {detectedPlate && !isScanning && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-xs animate-in slide-in-from-top-4 duration-300 z-40">
          <Card className="glass-panel p-4 shadow-2xl border-accent/30 plate-highlight">
            <div className="flex flex-col items-center gap-3">
              <Badge variant="outline" className="text-accent border-accent/50 text-[10px] uppercase tracking-widest font-bold">
                Detected Plate
              </Badge>
              <div className="text-4xl font-mono font-bold tracking-tighter text-accent bg-black/40 px-6 py-2 rounded-lg border border-white/10 w-full text-center">
                {detectedPlate}
              </div>
              <div className="flex w-full gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-secondary/50 border-white/10 hover:bg-secondary"
                  onClick={() => setDetectedPlate(null)}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Redo
                </Button>
                <Button 
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
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

      {/* Bottom Controls - Moved lower to bottom-10 */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center z-20">
        <button
          onClick={handleScan}
          disabled={isCapturing || !stream}
          className="group relative flex items-center justify-center w-24 h-24 rounded-full transition-all active:scale-90 disabled:opacity-50"
        >
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 scale-110" />
          <div className="absolute inset-2 rounded-full border-2 border-accent/40 animate-pulse" />
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-primary-foreground shadow-[0_0_30px_rgba(var(--accent),0.4)] group-hover:scale-105 transition-transform">
            {isCapturing ? <Loader2 className="animate-spin h-8 w-8" /> : <Scan className="h-10 w-10" />}
          </div>
        </button>
      </div>
    </div>
  );
}
