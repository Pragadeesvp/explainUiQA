import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '@/services/authentication.service';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof formSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      const cognitoUser = new CognitoUser({
        Username: values.email,
        Pool: userPool,
      });

      await new Promise<void>((resolve, reject) => {
        cognitoUser.forgotPassword({
          onSuccess: () => {
            resolve();
          },
          onFailure: (err) => {
            reject(err);
          },
        });
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/auth/change-password');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    }
  };

  return (
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a password reset link.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

        {success && (
            <Alert>
            <AlertTitle>
              Password reset instructions have been sent to your email!
            </AlertTitle>
            </Alert>
          )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        <Button type="submit" className="w-full">
          Send Reset Instructions
            </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/auth/login')}
        >
          Back to Login
        </Button>
        </form>
      </Form>
  );
}
