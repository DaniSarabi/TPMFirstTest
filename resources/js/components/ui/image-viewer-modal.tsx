import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import * as React from 'react';

interface ImageViewerModalProps {
    imageUrl: string;
    imageAlt: string;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function ImageViewerModal({ imageUrl, imageAlt, isOpen, onOpenChange }: ImageViewerModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Image Preview</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="max-h-[80vh] w-full rounded-md object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
