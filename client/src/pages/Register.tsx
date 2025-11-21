import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
import { handleFirebaseAuthError } from '../utils/authErrors';
import SocialLoginButtons from '../components/SocialLoginButtons';

const validationSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name should be of minimum 2 characters length'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialWarning, setShowSocialWarning] = useState(false);
  const [pendingSocialLogin, setPendingSocialLogin] = useState<'google' | 'microsoft' | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        setIsLoading(true);
        await register(values.email, values.password, values.name);
        // Redirect to email verification page after successful registration
        navigate('/verify-email');
      } catch (err) {
        setError(handleFirebaseAuthError(err));
        console.error('Registration error:', err);
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
      
      navigate('/');
    } catch (err) {
      setError(handleFirebaseAuthError(err));
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
            Sign up
          </Typography>
          
          <Alert severity="info" sx={{ mt: 1, width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              📧 Use your Amrita email to raise booking requests:
            </Typography>
            <Typography variant="body2" component="div">
              • Students: <strong>rollno@ch.student.amrita.edu</strong><br/>
              • Faculty: <strong>username@amrita.edu</strong>
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
              id="name"
              name="name"
              label="Full Name"
              autoComplete="name"
              autoFocus
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              autoComplete="email"
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
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={isLoading}
            >
              Sign Up
            </Button>

            <SocialLoginButtons
              onGoogleClick={handleGoogleLogin}
              onMicrosoftClick={handleMicrosoftLogin}
              isLoading={isLoading}
            />

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component={RouterLink} to="/login" variant="body2">
                {"Already have an account? Sign in"}
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

export default Register; 