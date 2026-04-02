import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface CameraScannerProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export default function CameraScanner({ onCapture, isProcessing }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      // Try environment camera first (back camera on mobile)
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      } catch (e) {
        console.warn("Failed with environment facingMode, trying default video", e);
        // Fallback to any available camera
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Camera permission denied. Please enable camera access in your browser settings.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError("No camera found on this device.");
        } else {
          setError("Error accessing camera. Please ensure no other app is using it and try again.");
        }
      } else {
        setError("An unknown error occurred while accessing the camera.");
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
        stopCamera();
      }
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-200">
      <AnimatePresence mode="wait">
        {!isCameraActive ? (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Camera className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-amber-50 mb-2">Scan Your Textbook</h3>
            <p className="text-amber-200/80 text-sm mb-6 max-w-xs">
              Point your camera at a diagram, math problem, or text to get a simple explanation.
            </p>
            
            {error && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs max-w-xs">
                {error}
              </div>
            )}

            <button
              onClick={startCamera}
              disabled={isProcessing}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-full font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {error ? "Try Again" : "Start Camera"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Scanner Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-amber-400/50 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400" />
                
                {/* Scanning Line */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
              <button
                onClick={stopCamera}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <button
                onClick={captureImage}
                className="w-16 h-16 bg-white rounded-full border-4 border-amber-500 flex items-center justify-center shadow-xl active:scale-90 transition-transform"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-full" />
              </button>

              <button
                onClick={startCamera}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
