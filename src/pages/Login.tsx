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

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authRequests.login(data);
      
      // Store token in localStorage (you might want to use a more secure method later)
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('Login successful:', response);
      // TODO: Navigate to dashboard or home page
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: 48 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
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