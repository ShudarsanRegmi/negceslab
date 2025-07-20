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
  Chip,
} from '@mui/material';
import {
  Person,
  AdminPanelSettings,
  Save,
  Cancel,
  Edit,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { currentUser, userRole } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setFormData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
    });
  }, [currentUser]);

  const handleSave = async () => {
    try {
      // Replace with API call
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setAlert(null), 3000);
    } catch {
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

  const getUserInitials = (name: string) =>
    name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="600" gutterBottom>
          User Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account information and preferences
        </Typography>
      </Box>

      {/* Alert */}
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* Profile Card */}
        <Box sx={{ flex: { lg: '1 1 66%' } }}>
          <Card sx={{ height: 'fit-content', borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              {/* Profile Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: '1.75rem',
                    mr: 3,
                    bgcolor: 'primary.main',
                  }}
                >
                  {currentUser?.displayName
                    ? getUserInitials(currentUser.displayName)
                    : <Person />}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" fontWeight="600" gutterBottom>
                    {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {currentUser?.email}
                  </Typography>
                  <Chip
                    icon={userRole === 'admin' ? <AdminPanelSettings /> : <Person />}
                    label={userRole === 'admin' ? 'Administrator' : 'User'}
                    color={userRole === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </Box>
                {!isEditing && (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                    variant="outlined"
                    sx={{ ml: 2 }}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Edit Form */}
              <Box>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 3 }}>
                  <TextField
                    label="Display Name"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    fullWidth
                    disabled={!isEditing}
                    variant="outlined"
                  />
                  <TextField
                    label="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    fullWidth
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Box>

                {isEditing && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mt: 4,
                      justifyContent: 'flex-end',
                      flexDirection: { xs: 'column', sm: 'row' },
                    }}
                  >
                    <Button
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      variant="outlined"
                      size="large"
                    >
                      Cancel
                    </Button>
                    <Button
                      startIcon={<Save />}
                      onClick={handleSave}
                      variant="contained"
                      size="large"
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Account Details Sidebar */}
        <Box sx={{ flex: { lg: '0 0 33%' } }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Account Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="500" gutterBottom>
                    Account Role
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userRole === 'admin' ? 'Administrator' : 'Standard User'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="500" gutterBottom>
                    Member Since
                  </Typography>
                  <Typography variant="body1">
                    {currentUser?.metadata?.creationTime
                      ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not available'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="500" gutterBottom>
                    Last Sign-In
                  </Typography>
                  <Typography variant="body1">
                    {currentUser?.metadata?.lastSignInTime
                      ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not available'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
