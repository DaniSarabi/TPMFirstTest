import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
//import AuthLayout from '@/layouts/auth-layout';
import loginImg from '../../../../public/home.png';

// Define the shape of the form data
type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    // --- Your existing Inertia form logic remains unchanged ---
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div >
            <Head title="Log in" />

            {/* --- ACTION 1: Use the new Card-based layout --- */}
            <Card className="w-full max-w-4xl">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {/* --- ACTION 2: Connect your form logic to the new design --- */}
                    <form className="p-6 md:p-8 flex flex-col justify-center" onSubmit={submit}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Welcome Back</h1>
                                <p className="text-muted-foreground text-balance">
                                    Login to your TPM account
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        autoFocus
                                        required
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        {/* Use your existing logic for the "Forgot Password" link */}
                                        {canResetPassword && (
                                            <TextLink href={route('password.request')} className="ml-auto text-sm">
                                                Forgot your password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <InputError message={errors.password} />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Login
                            </Button>
                            
                            <div className="text-center text-sm">
                                Don&apos;t have an account?{' '}
                                {/* Use your existing TextLink for the "Sign up" link */}
                                <TextLink href={route('register')}>
                                    Sign up
                                </TextLink>
                            </div>
                        </div>
                    </form>
                    {/* --- ACTION 3: Keep the image column --- */}
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src={loginImg}
                            alt="TPM application visual"
                            className="absolute inset-0 h-full w-full object-cover"
                            //onError={(e) => (e.currentTarget.src = 'https://placehold.co/1080x1920/e2e8f0/e2e8f0?text=Image')}
                        />
                    </div>
                </CardContent>
            </Card>

            {status && <div className="mt-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </div>
    );
}
