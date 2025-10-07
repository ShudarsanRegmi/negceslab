import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  CircularProgress,
  Link,
} from '@mui/material';
import { Mail, CheckCircle, Refresh } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const EmailVerification = () => {
  const navigate = useNavigate();
  const { currentUser, sendVerificationEmail, reloadUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // If email is already verified, redirect to dashboard
    if (currentUser.emailVerified) {
      navigate('/dashboard');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Cooldown timer for resend button
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      setError('');
      await sendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox and spam folder.');
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setIsCheckingVerification(true);
      setError('');
      await reloadUser();
      
      // Check if email is now verified
      if (currentUser?.emailVerified) {
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError('Email not verified yet. Please check your email and click the verification link.');
      }
    } catch (err: any) {
      setError('Failed to check verification status. Please try again.');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Mail sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          
          <Typography component="h1" variant="h4" gutterBottom>
            Verify Your Email
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            We've sent a verification email to:
          </Typography>
          
          <Typography variant="h6" color="primary" gutterBottom>
            {currentUser.email}
          </Typography>

          <Alert severity="info" sx={{ mt: 2, mb: 3, width: '100%' }}>
            <Typography variant="body2">
              📧 <strong>Check your email inbox</strong> (including spam folder) and click the verification link to activate your account.
            </Typography>
          </Alert>

          {message && (
            <Alert severity="success" sx={{ mt: 2, mb: 2, width: '100%' }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={isCheckingVerification ? <CircularProgress size={16} /> : <CheckCircle />}
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              sx={{ minWidth: 180 }}
            >
              {isCheckingVerification ? 'Checking...' : 'I\'ve Verified'}
            </Button>

            <Button
              variant="outlined"
              startIcon={isLoading ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleResendVerification}
              disabled={isLoading || resendCooldown > 0}
              sx={{ minWidth: 180 }}
            >
              {isLoading 
                ? 'Sending...' 
                : resendCooldown > 0 
                  ? `Resend (${resendCooldown}s)` 
                  : 'Resend Email'
              }
            </Button>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', width: '100%' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Need help? Wrong email address?
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={handleLogout}
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
            >
              Sign out and try again with a different email
            </Link>
          </Box>

          <Alert severity="warning" sx={{ mt: 3, width: '100%' }}>
            <Typography variant="body2">
              <strong>⚠️ Important:</strong> You must verify your email before you can create booking requests. 
              You can browse computer availability but cannot make bookings until verification is complete.
            </Typography>
          </Alert>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerification;
