"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button, Card, Input, Label, TextField, FieldError, Link } from '@heroui/react';
import { Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      setIsSubmitting(true);
      await registerUser(data.email, data.password);
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <Card.Content className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <Card.Title className="text-center">Account Created</Card.Title>
            <Card.Description className="text-center">
              Your account has been created and is pending admin approval. You will be able to log in once activated.
            </Card.Description>
            <Button variant="secondary" onPress={() => router.push('/login')} className="mt-2">
              Back to Login
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Create an account</Card.Title>
          <Card.Description>Sign up to contribute to AcronyMap</Card.Description>
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
                placeholder="At least 8 characters"
                disabled={isSubmitting}
              />
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </TextField>

            <TextField
              isInvalid={!!errors.confirmPassword}
              name="confirmPassword"
              type="password"
            >
              <Label>Confirm Password</Label>
              <Input
                {...register('confirmPassword')}
                placeholder="Re-enter your password"
                disabled={isSubmitting}
              />
              {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
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
                  {isPending ? 'Creating account...' : 'Create Account'}
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted">
              Already have an account?{' '}
              <Link href="/login">Sign in</Link>
            </p>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
