import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Check, RotateCcw, X } from 'lucide-react';
import * as React from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraModal({ isOpen, onOpenChange, onCapture }: CameraModalProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  const streamRef = React.useRef<MediaStream | null>(null);

  // NEW FIX: Always clear the state when the modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setCapturedImage(null);
      setError(null);
    }
  }, [isOpen]);

  // 1. Load Devices
  React.useEffect(() => {
    if (!isOpen) return;

    const getDevices = async () => {
      try {
        let devs = await navigator.mediaDevices.enumerateDevices();
        let videoDevs = devs.filter((d) => d.kind === 'videoinput');

        if (videoDevs.length > 0 && videoDevs[0].label === '') {
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(t => t.stop());
            
            devs = await navigator.mediaDevices.enumerateDevices();
            videoDevs = devs.filter((d) => d.kind === 'videoinput');
        }

        setDevices(videoDevs);
        
        if (videoDevs.length > 0 && !selectedDeviceId) {
           const backCam = videoDevs.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
           setSelectedDeviceId(backCam ? backCam.deviceId : videoDevs[0].deviceId);
        }
      } catch (err) {
        console.error("Device enumeration failed", err);
        setError("Could not list camera devices.");
      }
    };

    getDevices();
  }, [isOpen]);

  // 2. Handle Stream Lifecycle
  React.useEffect(() => {
    if (!isOpen || !selectedDeviceId || capturedImage) return;

    let isMounted = true;

    const startCamera = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      } catch (err: any) {
        console.error("Camera start failed", err);
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
           setError("Camera is in use by another app or is busy. Please wait a moment.");
        } else {
           setError("Failed to access camera.");
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, selectedDeviceId, capturedImage]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
          
          if (streamRef.current) {
             streamRef.current.getTracks().forEach(t => t.stop());
             streamRef.current = null;
          }
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
        fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onOpenChange(false); // FIX: Explicitly close the modal here
        });
    }
  };

  const handleRetake = () => {
    setCapturedImage(null); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take Photo</DialogTitle>
          <DialogDescription>Use your camera to document the inspection.</DialogDescription>
        </DialogHeader>

        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-black">
          {error ? (
             <div className="px-4 text-center text-red-400">
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={() => setCapturedImage(null)} className="mt-2 border-red-400 text-red-400 hover:bg-red-900/20">Retry</Button>
             </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="h-full w-full object-contain" />
          ) : (
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="h-full w-full object-cover" 
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {!capturedImage && devices.length > 1 && (
                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((d) => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,5)}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            )}

            <div className="flex w-full justify-end gap-2">
                {capturedImage ? (
                    <>
                        <Button variant="outline" onClick={handleRetake}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Retake
                        </Button>
                        <Button onClick={handleConfirm}>
                            <Check className="mr-2 h-4 w-4" /> Confirm
                        </Button>
                    </>
                ) : (
                    <Button onClick={handleCapture} disabled={!!error}>
                        <Camera className="mr-2 h-4 w-4" /> Capture
                    </Button>
                )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}