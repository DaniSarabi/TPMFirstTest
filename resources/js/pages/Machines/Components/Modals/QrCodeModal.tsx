import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Machine } from '@/types/machine';
import { Download, Printer } from 'lucide-react';
import * as React from 'react';

// Define the props for the modal
interface QrCodeModalProps {
    machine: Machine | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function QrCodeModal({ machine, isOpen, onOpenChange }: QrCodeModalProps) {
    if (!machine) {
        return null;
    }

    // This function opens the print-friendly page and triggers the print dialog
    const handlePrint = () => {
        const printWindow = window.open(route('machines.print.qr-code', machine.id), '_blank', 'height=600,width=800');
        printWindow?.addEventListener('load', function () {
            printWindow.print();
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code for: {machine.name}</DialogTitle>
                    <DialogDescription>
                        Scan this QR code with a mobile device to start a new inspection for this machine.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center py-4">
                    <img
                        src={route('machines.qr-code', machine.id)}
                        alt={`QR Code for ${machine.name}`}
                        className="rounded-lg border"
                    />
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button asChild>
                            <a href={route('machines.pdf.qr-code', machine.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </a>
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
