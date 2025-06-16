import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
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
import {type LoginFormData, loginSchema } from '../schemas/authSchemas';
import { useLoginMutation } from '../store/api/authApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import {type ButtonColor } from '../types';
import { getUserFriendlyErrorMessage } from '../utils/errorUtils';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  
  // RTK Query mutation hook
  const [loginMutation, { error: loginError, isSuccess }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  // Get the intended destination from location state
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Navigate after successful login
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data: LoginFormData) => {
    dispatch(loginStart());
    
    try {
      // RTK Query handles the API call
      const result = await loginMutation(data).unwrap();
      
      // Dispatch success action with user data
      dispatch(loginSuccess({
        user: result.user,
        token: result.access_token
      }));
      
      console.log('Login successful:', result);
      
    } catch (err) {
      dispatch(loginFailure());
      console.error('Login failed:', err);
    }
  };

  // Helper function to safely extract error message
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object') {
      // RTK Query error structure
      if ('data' in error && error.data && typeof error.data === 'object') {
        if ('detail' in error.data && typeof error.data.detail === 'string') {
          return error.data.detail;
        }
        if ('message' in error.data && typeof error.data.message === 'string') {
          return error.data.message;
        }
      }
      
      // Our custom error structure from authApi
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
      
      // Standard Error object
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }
    
    return 'Login failed. Please try again.';
  };
  const getButtonContent = () => {
    if (isLoading) return <CircularProgress size={24} color="inherit" />;
    if (isSuccess) return '✓ Success';
    if (loginError) return 'Try Again';
    return 'Sign In';
  };

  const isFormDisabled = () => {
    return isLoading || isSuccess;
  };

  const getButtonColor = (): ButtonColor => {
    if (isSuccess) return 'success';
    if (loginError) return 'error';
    return 'primary';
  };

  const handleRetry = () => {
    // Reset error state is handled automatically by RTK Query
    // when a new mutation is triggered
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

            {loginError && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {getUserFriendlyErrorMessage(loginError)}
              </Alert>
            )}

            {isSuccess && (
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
                type={loginError ? 'button' : 'submit'}
                fullWidth
                variant="contained"
                color={getButtonColor()}
                sx={{ mt: 3, mb: 2, height: 48 }}
                disabled={isFormDisabled()}
                onClick={loginError ? handleRetry : undefined}
              >
                {getButtonContent()}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/signup')}
                >
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