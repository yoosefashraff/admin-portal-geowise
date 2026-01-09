'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';

const loginSchema = z.object({
  UserName: z.string(),
  Password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data.UserName, data.Password);
      toast.success('Login successful!');
      // Small delay to ensure cookie is set before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.message || 'Login failed');
      setIsLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="UserName">Admin User Name</Label>
        <Input
          id="UserName"
          type="text"
          placeholder="UserName"
          {...register('UserName')}
          disabled={isLoading}
        />
        {errors.UserName && (
          <p className="text-sm text-red-500">{errors.UserName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('Password')}
          disabled={isLoading}
        />
        {errors.Password && (
          <p className="text-sm text-red-500">{errors.Password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
