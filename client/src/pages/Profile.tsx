import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Grid,
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  Save,
  Cancel,
  Edit,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

const Profile: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const { isDark } = useAppTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setFormData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
    });
  }, [currentUser]);

  const handleSave = async () => {
    try {
      // Here you would typically call an API to update the user profile
      // For now, we'll just simulate a successful update
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update profile' });
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
    });
    setIsEditing(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                fontSize: '2rem',
                bgcolor: 'primary.main',
              }}
            >
              {currentUser?.displayName ? getUserInitials(currentUser.displayName) : <Person />}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {currentUser?.email}
            </Typography>
            <Chip
              icon={userRole === 'admin' ? <AdminPanelSettings /> : <Person />}
              label={userRole === 'admin' ? 'Administrator' : 'User'}
              color={userRole === 'admin' ? 'primary' : 'default'}
              sx={{ mt: 1 }}
            />
          </Paper>
        </Grid>

        {/* Profile Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Personal Information</Typography>
                {!isEditing && (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Display Name"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    fullWidth
                    disabled={!isEditing}
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    fullWidth
                    disabled={!isEditing}
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box sx={{ display: 'flex', gap: 2, mt: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button
                    startIcon={<Save />}
                    onClick={handleSave}
                    variant="contained"
                    fullWidth={isMobile}
                  >
                    Save Changes
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    variant="outlined"
                    fullWidth={isMobile}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Account Type
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {userRole === 'admin' ? 'Administrator' : 'Standard User'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : 'N/A'
                  }
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Sign In
                </Typography>
                <Typography variant="body1">
                  {currentUser?.metadata?.lastSignInTime 
                    ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString()
                    : 'N/A'
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 