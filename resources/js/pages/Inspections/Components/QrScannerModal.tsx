import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';
import * as React from 'react';

// Define the props for the modal
interface QrScannerModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScan: (url: string) => void;
}

export function QrScannerModal({ isOpen, onOpenChange, onScan }: QrScannerModalProps) {
  // --- ACTION 1: Use the hook to get a list of available cameras ---
  const devices = useDevices();
  const [deviceId, setDeviceId] = React.useState<string | undefined>(undefined);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>Point your device's camera at the QR code on the machine.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isOpen && (
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) {
                  onScan(result[0].rawValue);
                  onOpenChange(false);
                }
              }}
              onError={(error) => {
                console.error(error?.message);
              }}
              // --- ACTION 2: Pass the selected device ID to the scanner ---
              constraints={{ deviceId }}
            />
          )}
        </div>
        {/* --- ACTION 3: Conditionally render the camera selector --- */}
        {devices && devices.length > 1 && (
          <DialogFooter className="sm:justify-start">
            <div className="w-full space-y-2">
              <Label>Select Camera</Label>
              <Select value={deviceId} onValueChange={setDeviceId}>
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
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
