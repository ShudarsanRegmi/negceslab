import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  Email,
  Language,
  Security,
  Palette,
  Save,
  RestartAlt,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const { mode, setThemeMode } = useAppTheme();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    bookingReminders: true,
    maintenanceAlerts: true,
    language: 'en',
    autoLogout: false,
    sessionTimeout: 30,
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleSave = async () => {
    try {
      // Here you would typically call an API to save the settings
      setAlert({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to save settings' });
    }
  };

  const handleReset = () => {
    setSettings({
      emailNotifications: true,
      pushNotifications: true,
      bookingReminders: true,
      maintenanceAlerts: true,
      language: 'en',
      theme: 'light',
      autoLogout: false,
      sessionTimeout: 30,
    });
    setAlert({ type: 'success', message: 'Settings reset to defaults!' });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notification Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications />
                Notification Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email Notifications"
                    secondary="Receive notifications via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Push Notifications"
                    secondary="Receive browser notifications"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Booking Reminders"
                    secondary="Get reminded about upcoming bookings"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.bookingReminders}
                      onChange={(e) => handleSettingChange('bookingReminders', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Maintenance Alerts"
                    secondary="Get notified about computer maintenance"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.maintenanceAlerts}
                      onChange={(e) => handleSettingChange('maintenanceAlerts', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={handleReset}
              size={isMobile ? "small" : "medium"}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              size={isMobile ? "small" : "medium"}
            >
              Save Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 