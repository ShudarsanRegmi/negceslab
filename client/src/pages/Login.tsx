import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import SocialLoginButtons from '../components/SocialLoginButtons';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialWarning, setShowSocialWarning] = useState(false);
  const [pendingSocialLogin, setPendingSocialLogin] = useState<'google' | 'microsoft' | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        setIsLoading(true);
        const result = await login(values.email, values.password);
        
        // Check if email is verified
        if (!result.user.emailVerified) {
          navigate('/verify-email');
          return;
        }
        
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } catch (err) {
        setError('Failed to sign in. Please check your credentials.');
        console.error('Login error:', err);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleGoogleLogin = () => {
    setPendingSocialLogin('google');
    setShowSocialWarning(true);
  };

  const handleMicrosoftLogin = () => {
    setPendingSocialLogin('microsoft');
    setShowSocialWarning(true);
  };

  const handleSocialLoginConfirm = async () => {
    try {
      setError('');
      setIsLoading(true);
      setShowSocialWarning(false);
      
      if (pendingSocialLogin === 'google') {
        await loginWithGoogle();
      } else if (pendingSocialLogin === 'microsoft') {
        await loginWithMicrosoft();
      }
      
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(`Failed to sign in with ${pendingSocialLogin === 'google' ? 'Google' : 'Microsoft'}.`);
      console.error('Social login error:', err);
    } finally {
      setIsLoading(false);
      setPendingSocialLogin(null);
    }
  };

  const handleSocialLoginCancel = () => {
    setShowSocialWarning(false);
    setPendingSocialLogin(null);
  };

  return (
    <Container component="main" maxWidth="xs">
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
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Sign in
          </Typography>
          
          <Alert severity="info" sx={{ mt: 1, width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              📧 Use your Amrita email to raise booking requests:
            </Typography>
            <Typography variant="body2" component="div">
              • Students: <strong>ch.rollno@ch.student.amrita.edu</strong><br/>
              • Faculty: <strong>username@ch.amrita.edu</strong>
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ mt: 1, width: '100%' }}
          >
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={isLoading}
            >
              Sign In
            </Button>

            <SocialLoginButtons
              onGoogleClick={handleGoogleLogin}
              onMicrosoftClick={handleMicrosoftLogin}
              isLoading={isLoading}
            />

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot your password?
              </Link>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Social Login Warning Dialog */}
      <Dialog
        open={showSocialWarning}
        onClose={handleSocialLoginCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
  ⚠️ Important: Email Domain Requirement
    </DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Booking requests can only be made using an Amrita email ID:
        </Typography>
        <Typography variant="body2" component="div">
          • Students: <strong>rollno@ch.student.amrita.edu</strong><br/>
          • Faculty: <strong>username@amrita.edu</strong>
        </Typography>
      </Alert>
      <Typography variant="body2" color="text.secondary">
        Your {pendingSocialLogin === 'google' ? 'Google' : 'Microsoft'} ID can be used to browse availability and other information, but not for submitting booking requests. Please sign in with your Amrita Campus ID to proceed with bookings.
      </Typography>
    </DialogContent>
        <DialogActions>
          <Button onClick={handleSocialLoginCancel}>Cancel</Button>
          <Button 
            onClick={handleSocialLoginConfirm}
            variant="contained"
            disabled={isLoading}
          >
            I Understand, Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login; 