// src/pages/Signup.tsx - Complete Signup with Redux Integration
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

// === IMPORTS FOR REDUX INTEGRATION ===
import { type SignupFormData, signupSchema } from '../schemas/authSchemas';
import { useSignupMutation } from '../store/api/authApi'; // RTK Query hook
import { useAppDispatch, useAppSelector } from '../store/hooks'; // Typed Redux hooks
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'; // Redux actions
import { type ButtonColor } from '../types';
import { getUserFriendlyErrorMessage } from '../utils/errorUtils';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // === REDUX STATE MANAGEMENT ===
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  
  // === RTK QUERY API CALL ===
  const [signupMutation, { error: signupError, isSuccess }] = useSignupMutation();

  // === FORM MANAGEMENT ===
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange'
  });

  // Get redirect destination
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // === AUTO-REDIRECT AFTER SUCCESSFUL AUTH ===
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // === FORM SUBMISSION HANDLER ===
  const onSubmit = async (data: SignupFormData) => {
    console.log('🚀 Starting signup process...', data);
    
    // 1. Dispatch loading state to Redux
    dispatch(loginStart());
    
    try {
      // 2. Make API call through RTK Query
      console.log('📡 Making API call...');
      const result = await signupMutation(data).unwrap();
      
      console.log('✅ Signup API Success:', result);
      
      // 3. Dispatch success to Redux store (saves user + token)
      dispatch(loginSuccess({
        user: result.user,
        token: result.access_token
      }));
      
      console.log('🎉 User authenticated and saved to Redux');
      
      // 4. Form will reset and user will be redirected by useEffect
      
    } catch (err) {
      console.error('❌ Signup failed:', err);
      
      // 5. Dispatch failure to Redux (stops loading)
      dispatch(loginFailure());
    }
  };

  // === UI STATE HELPERS ===
  const getButtonContent = () => {
    if (isLoading) return <CircularProgress size={24} color="inherit" />;
    if (isSuccess) return '✓ Account Created';
    if (signupError) return 'Try Again';
    return 'Create Account';
  };

  const isFormDisabled = () => {
    return isLoading || isSuccess;
  };

  const getButtonColor = (): ButtonColor => {
    if (isSuccess) return 'success';
    if (signupError) return 'error';
    return 'primary';
  };

  const handleRetry = () => {
    // RTK Query automatically resets error state on new mutation
    console.log('🔄 Retrying signup...');
  };

  // === RENDER COMPONENT ===
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
        <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 500 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* === HEADER === */}
            <Typography component="h1" variant="h4" gutterBottom>
              Smart News
            </Typography>
            <Typography component="h2" variant="h6" color="text.secondary" gutterBottom>
              Create your account
            </Typography>

            {/* === ERROR DISPLAY === */}
            {signupError && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {getUserFriendlyErrorMessage(signupError)}
              </Alert>
            )}

            {/* === SUCCESS DISPLAY === */}
            {isSuccess && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                Account created successfully! Redirecting...
              </Alert>
            )}

            {/* === SIGNUP FORM === */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
              
              {/* Full Name Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                autoComplete="name"
                autoFocus
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isFormDisabled()}
              />
              
              {/* Email Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isFormDisabled()}
              />

              {/* Phone Number Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="phone_number"
                label="Phone Number"
                autoComplete="tel"
                placeholder="+1234567890"
                {...register('phone_number')}
                error={!!errors.phone_number}
                helperText={errors.phone_number?.message}
                disabled={isFormDisabled()}
              />
              
              {/* Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isFormDisabled()}
              />

              {/* Profile Picture Field (Optional) */}
              <TextField
                margin="normal"
                fullWidth
                id="profile_picture"
                label="Profile Picture URL (Optional)"
                {...register('profile_picture')}
                error={!!errors.profile_picture}
                helperText={errors.profile_picture?.message}
                disabled={isFormDisabled()}
              />

              {/* === SUBMIT BUTTON === */}
              <Button
                type={signupError ? 'button' : 'submit'}
                fullWidth
                variant="contained"
                color={getButtonColor()}
                sx={{ mt: 3, mb: 2, height: 48 }}
                disabled={isFormDisabled()}
                onClick={signupError ? handleRetry : undefined}
              >
                {getButtonContent()}
              </Button>

              {/* === NAVIGATION LINK === */}
              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  type="button"
                >
                  Already have an account? Sign In
                </Link>
              </Box>
              
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupPage;