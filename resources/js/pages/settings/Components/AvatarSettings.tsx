import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { UserAvatar } from '@/components/user-avatar'; // ---  Import the new reusable component ---
import { getCroppedImg } from '@/lib/crop-image';
import { type User } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';
import * as React from 'react';
import { HexColorPicker } from 'react-colorful';
import Cropper, { type Area } from 'react-easy-crop';

export function AvatarSettings({ user }: { user: User }) {
  const { data, setData, errors, processing, reset } = useForm({
    avatar: null as File | null,
    avatar_color: user.avatar_color || '#4f46e5',
  });

  const [sourceImage, setSourceImage] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onCropComplete = React.useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSourceImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('avatar_color', data.avatar_color);

    if (sourceImage && croppedAreaPixels) {
      try {
        const croppedImageBlob = await getCroppedImg(sourceImage, croppedAreaPixels);
        const croppedFile = new File([croppedImageBlob], 'avatar.jpeg', { type: 'image/jpeg' });
        formData.append('avatar', croppedFile);
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        return;
      }
    }

    router.post(route('profile.avatar.update'), formData, {
      forceFormData: true,
      onSuccess: () => {
        // ---  Reset the source image after a successful save ---
        // This returns the view to the final preview state.
        setSourceImage(null);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  return (
    <Card className='drop-shadow-lg shadow'>
      <CardHeader>
        <CardTitle>Profile Picture & Color</CardTitle>
        <CardDescription>Customize your profile picture and the background color for your avatar initials.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
            {/* Live Preview & Editor */}
            <div className="flex flex-col items-center gap-4">
              <Label>Preview & Crop</Label>
              <div className="relative h-48 w-48 rounded-full bg-muted">
                {sourceImage ? (
                  <Cropper
                    image={sourceImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="round"
                    showGrid={false}
                  />
                ) : (
                  // ---  Use the new UserAvatar component for the preview ---
                  <UserAvatar user={{ ...user, avatar_color: data.avatar_color }} className="h-48 w-48 text-6xl" />
                )}
              </div>
              {sourceImage && (
                <div className="w-full px-4">
                  <Label>Zoom</Label>
                  <Slider value={[zoom]} onValueChange={(val) => setZoom(val[0])} min={1} max={3} step={0.1} />
                </div>
              )}
              <Input id="avatar" type="file" accept="image/*" onChange={handleFileChange} className="w-full ring-1 ring-primary hover:bg-accent" disabled={processing} />
              <InputError message={errors.avatar} />
            </div>

            {/* Color Picker */}
            <div className="flex flex-col items-center gap-4">
              <Label htmlFor="avatar_color">Avatar Color</Label>
              <HexColorPicker color={data.avatar_color} onChange={(color) => setData('avatar_color', color)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || processing}>
                <Send/>
              {isSubmitting || processing ? 'Saving...' : 'Save Avatar Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
