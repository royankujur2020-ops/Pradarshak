import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, X, Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface CameraScannerProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export default function CameraScanner({ onCapture, isProcessing }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');

  const startCamera = async () => {
    setError(null);
    setShowUrlInput(false);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support camera access. Please try a modern browser like Chrome or Firefox.");
      return;
    }

    try {
      // Check if any video input devices exist
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        setError("No camera detected. Please connect a camera or use the upload/URL options.");
        return;
      }

      // Try environment camera first (back camera on mobile)
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });
      } catch (e) {
        console.warn("Failed with environment facingMode, trying default video", e);
        // Fallback to any available camera with minimal constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
      }

      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(
            "Camera permission denied. Please allow access or use the upload/URL options below."
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError("No camera found on this device.");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError("Camera is already in use by another application.");
        } else {
          setError(`Error: ${err.message}. Please ensure camera permissions are granted.`);
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

  // Handle stream attachment to video element
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        onCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    try {
      // We can't easily convert a cross-origin URL to base64 in the browser due to CORS
      // So we'll pass the URL directly and handle it in App.tsx
      onCapture(url.trim());
      setUrl('');
      setShowUrlInput(false);
    } catch (err) {
      setError("Failed to process URL. Please try uploading a file instead.");
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-200">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />
      
      <AnimatePresence mode="wait">
        {!isCameraActive ? (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
          >
            {showUrlInput ? (
              <motion.form 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleUrlSubmit}
                className="w-full max-w-xs space-y-4"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <LinkIcon className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-amber-50">Paste Image URL</h3>
                <input 
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(false)}
                    className="flex-1 px-4 py-2 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-400 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </motion.form>
            ) : (
              <>
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

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    onClick={startCamera}
                    disabled={isProcessing}
                    className="w-full px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-full font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    {error ? "Try Camera Again" : "Start Camera"}
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Gallery
                    </button>
                    <button
                      onClick={() => setShowUrlInput(true)}
                      disabled={isProcessing}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      <LinkIcon className="w-4 h-4" />
                      URL
                    </button>
                  </div>
                </div>
              </>
            )}
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
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
