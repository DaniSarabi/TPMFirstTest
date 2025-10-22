import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scanner } from '@yudiel/react-qr-scanner';
import * as React from 'react';

// Define the props for the modal
interface QrScannerModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScan: (url: string) => void;
}

export function QrScannerModal({ isOpen, onOpenChange, onScan }: QrScannerModalProps) {
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | undefined>(undefined);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // --- REWRITTEN: This hook now fully controls the camera stream ---
  React.useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        // 1. Get permissions and device list
        await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((device) => device.kind === 'videoinput');
        setDevices(videoDevices);

        if (videoDevices.length === 0) {
          alert('No camera detected.');
          onOpenChange(false);
          return;
        }

        // 2. Determine which camera to use
        const deviceToUse = selectedDeviceId
          ? videoDevices.find((d) => d.deviceId === selectedDeviceId)
          : videoDevices.find((d) => /back|rear|environment/i.test(d.label)) || videoDevices[0];

        if (!deviceToUse?.deviceId) {
          alert('Could not find a suitable camera.');
          onOpenChange(false);
          return;
        }

        // This keeps the dropdown in sync with the active camera
        setSelectedDeviceId(deviceToUse.deviceId);

        // 3. Get the stream from the chosen device
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceToUse.deviceId } },
        });

        // 4. Attach the stream directly to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera for scanner:', error);
        alert('Could not access camera. Please ensure you have given permission.');
        onOpenChange(false);
      }
    };

    if (isOpen) {
      setupCamera();
    }

    // This cleanup function is CRITICAL: it stops the camera stream
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [isOpen, selectedDeviceId, onOpenChange]); // Re-run when the selected device changes

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>Point your device's camera at the QR code on the machine.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center overflow-hidden rounded-md bg-black py-4">
          {/* The Scanner component now receives the video element via a ref */}
          <Scanner
            onScan={(result) => {
              if (result && result.length > 0) {
                onScan(result[0].rawValue);
                onOpenChange(false);
              }
            }}
            onError={(error: any) => {
              console.error('QR Scanner Error:', error?.message);
            }}
            viewFinder={() => <div />} // Hides the default viewfinder
            components={{
              video: () => <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />,
            }}
          />
        </div>
        {devices && devices.length > 1 && (
          <DialogFooter className="sm:justify-start">
            <div className="w-full space-y-2">
              <Label>Select Camera</Label>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a camera..." />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device, index) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
