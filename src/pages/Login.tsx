import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Container,
  Link,
  CircularProgress
} from '@mui/material';
import { type LoginFormData, loginSchema } from '../schemas/authSchemas';
import { authRequests } from '../requests/authRequests';
import type { LoadingState, ButtonColor } from '../types';

const LoginPage: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoadingState('loading');
    setError(null);
    
    try {
      const response = await authRequests.login(data);
      
      // Store token in localStorage (you might want to use a more secure method later)
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setLoadingState('succeeded');
      console.log('Login successful:', response);
      
      // TODO: Navigate to dashboard or home page after short delay
      setTimeout(() => {
        // Navigation logic will go here
        console.log('Redirecting to dashboard...');
      }, 1000);
      
    } catch (err) {
      setLoadingState('failed');
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  // Helper functions for UI state
  const getButtonContent = () => {
    switch (loadingState) {
      case 'idle':
        return 'Sign In';
      case 'loading':
        return <CircularProgress size={24} color="inherit" />;
      case 'succeeded':
        return '✓ Success';
      case 'failed':
        return 'Try Again';
      default:
        return 'Sign In';
    }
  };

  const isFormDisabled = () => {
    return loadingState === 'loading' || loadingState === 'succeeded';
  };

  const getButtonColor = (): ButtonColor => {
    switch (loadingState) {
      case 'succeeded':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'primary';
    }
  };

  const handleRetry = () => {
    setLoadingState('idle');
    setError(null);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h4" gutterBottom>
              Smart News
            </Typography>
            <Typography component="h2" variant="h6" color="text.secondary" gutterBottom>
              Sign in to your account
            </Typography>

            {error && loadingState === 'failed' && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            {loadingState === 'succeeded' && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                Login successful! Redirecting...
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isFormDisabled()}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isFormDisabled()}
              />

              <Button
                type={loadingState === 'failed' ? 'button' : 'submit'}
                fullWidth
                variant="contained"
                color={getButtonColor()}
                sx={{ mt: 3, mb: 2, height: 48 }}
                disabled={isFormDisabled()}
                onClick={loadingState === 'failed' ? handleRetry : undefined}
              >
                {getButtonContent()}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link href="#" variant="body2">
                  Don't have an account? Sign Up
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;