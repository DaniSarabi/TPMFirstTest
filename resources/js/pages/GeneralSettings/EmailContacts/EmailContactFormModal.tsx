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
import * as React from 'react';
import InputError from '@/components/input-error';
import { EmailContact } from './Columns';

// Define the props for the modal
interface EmailContactFormModalProps {
    contact: Partial<EmailContact> | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    data: any;
    setData: (key: string, value: any) => void;
    processing: boolean;
    errors: any;
}

export function EmailContactFormModal({
    contact,
    isOpen,
    onOpenChange,
    onSubmit,
    data,
    setData,
    processing,
    errors,
}: EmailContactFormModalProps) {
    const isEditing = !!contact?.id;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Contact' : 'Create Contact'}</DialogTitle>
                    <DialogDescription>
                        Add or update a contact for email notifications.
                    </DialogDescription>
                </DialogHeader>
                <form id="contact-form" onSubmit={onSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        <InputError message={errors.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                        <InputError message={errors.email} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" value={data.department} onChange={(e) => setData('department', e.target.value)} required />
                        <InputError message={errors.department} />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" form="contact-form" disabled={processing}>
                        {processing ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
