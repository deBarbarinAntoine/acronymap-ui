"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button, Card, Input, Label, TextField, FieldError, Link } from '@heroui/react';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      setIsSubmitting(true);
      await login(data.email, data.password);
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Welcome back</Card.Title>
          <Card.Description>Sign in to your AcronyMap account</Card.Description>
        </Card.Header>

        <Card.Content>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600 dark:bg-danger-900/20 dark:text-danger-400">
                {error}
              </div>
            )}

            <TextField
              isInvalid={!!errors.email}
              name="email"
              type="email"
            >
              <Label>Email</Label>
              <Input
                {...register('email')}
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </TextField>

            <TextField
              isInvalid={!!errors.password}
              name="password"
              type="password"
            >
              <Label>Password</Label>
              <Input
                {...register('password')}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </TextField>

            <Button
              type="submit"
              isPending={isSubmitting}
              isDisabled={isSubmitting}
              size="lg"
              className="mt-2"
            >
              {({ isPending }) => (
                <>
                  {isPending ? 'Signing in...' : 'Sign In'}
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register">Create one</Link>
            </p>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
