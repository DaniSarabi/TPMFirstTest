import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import * as React from 'react';
import { Camera, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Define the props for the modal
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
    const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | undefined>(undefined);

    // --- ACTION: Consolidated all camera logic into a single, robust useEffect hook ---
    // This hook now manages starting and stopping the camera and fetching devices, preventing infinite loops.
    React.useEffect(() => {
        let stream: MediaStream | null = null;

        const setupCamera = async () => {
            try {
                // Get the list of available video devices
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);

                const deviceId = selectedDeviceId || videoDevices.find(d => d.label.toLowerCase().includes('back'))?.deviceId || videoDevices[0]?.deviceId;

                if (!deviceId) {
                    console.error("No camera found.");
                    return;
                }

                // Start the video stream with the selected device
                const constraints: MediaStreamConstraints = {
                    video: {
                        deviceId: { exact: deviceId },
                        facingMode: 'environment'
                    }
                };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error("Error accessing camera:", error);
                alert("Could not access camera. Please ensure you have given permission and are using a secure connection (HTTPS).");
                onOpenChange(false);
            }
        };

        if (isOpen && !capturedImage) {
            setupCamera();
        }

        // Cleanup function to stop the camera stream when the modal closes or component unmounts
        return () => {
            stream?.getTracks().forEach(track => track.stop());
            if (!isOpen) {
                setCapturedImage(null);
            }
        };
    }, [isOpen, selectedDeviceId, capturedImage, onOpenChange]);


    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
        }
    };

    const handleConfirm = () => {
        if (canvasRef.current) {
            canvasRef.current.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `inspection-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    onOpenChange(false);
                }
            }, 'image/jpeg');
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        // The useEffect will automatically restart the camera
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Take Photo</DialogTitle>
                    <DialogDescription>
                        Capture a photo for the inspection point.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 flex items-center justify-center bg-black rounded-md">
                    {capturedImage ? (
                        <img src={capturedImage} alt="Captured" className="max-h-96 rounded-md" />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
                    {/* Camera Selector */}
                    {devices.length > 1 && !capturedImage && (
                        <div className="flex-1 space-y-2">
                            <Label>Select Camera</Label>
                            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a camera..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {devices.map((device) => (
                                        <SelectItem key={device.deviceId} value={device.deviceId}>
                                            {device.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                        {capturedImage ? (
                            <>
                                <Button variant="outline" onClick={handleRetake}>
                                    <X className="mr-2 h-4 w-4" /> Retake
                                </Button>
                                <Button onClick={handleConfirm}>
                                    <Check className="mr-2 h-4 w-4" /> Confirm Photo
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleCapture} className="w-full sm:w-auto">
                                <Camera className="mr-2 h-4 w-4" /> Take Photo
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
