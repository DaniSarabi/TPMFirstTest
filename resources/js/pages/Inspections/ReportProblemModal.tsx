import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { InspectionPoint } from './Perform';


// Define the props for the modal
interface ReportProblemModalProps {
    point: InspectionPoint | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (data: { comment: string; image: File | null }) => void;
}

export function ReportProblemModal({ point, isOpen, onOpenChange, onSave }: ReportProblemModalProps) {
    // This modal manages its own internal state for the form fields.
    const [comment, setComment] = React.useState('');
    const [image, setImage] = React.useState<File | null>(null);

    const handleSave = () => {
        // When the user clicks save, we call the onSave function passed from the parent,
        // sending the comment and image data back up.
        onSave({ comment, image });
        onOpenChange(false); // Close the modal
    };

    // Reset the state when the modal is closed to ensure it's fresh next time.
    React.useEffect(() => {
        if (!isOpen) {
            setComment('');
            setImage(null);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className='bg-popover'>
                <DialogHeader>
                    <DialogTitle>Report a Problem</DialogTitle>
                    <DialogDescription>
                        Please provide details for the issue found at: <span className="font-semibold">{point?.name}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Describe the issue..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image">Attach Photo (Optional)</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Details</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
