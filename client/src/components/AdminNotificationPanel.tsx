import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormGroup,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { notificationsAPI } from '../services/api';

interface User {
  _id: string;
  email: string;
  name?: string;
}

const AdminNotificationPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await notificationsAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim() || selectedUsers.length === 0) {
      setAlert({ type: 'error', message: 'Please fill all fields and select at least one user' });
      return;
    }

    try {
      await notificationsAPI.createNotification({
        targetUsers: selectedUsers,
        title: title.trim(),
        message: message.trim(),
        type,
      });

      setAlert({ type: 'success', message: `Notification sent to ${selectedUsers.length} users` });
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
      setType('info');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      setAlert({ type: 'error', message: 'Failed to send notification' });
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Manual Notifications
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Automatic Notifications:</strong> Users automatically receive notifications when their booking status changes (approved/rejected) or when they create/cancel bookings.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Manual Notifications:</strong> Use this panel to send custom notifications to users for maintenance alerts, announcements, or other important messages.
          </Typography>
        </Alert>
        
        {alert && (
          <Alert 
            severity={alert.type} 
            onClose={() => setAlert(null)}
            sx={{ mb: 2 }}
          >
            {alert.message}
          </Alert>
        )}

        <Button 
          variant="contained" 
          onClick={() => setIsDialogOpen(true)}
          sx={{ mb: 2 }}
          fullWidth={isMobile}
        >
          Send Custom Notification to Users
        </Button>

        <Dialog 
          open={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Send Notification</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
                size={isMobile ? "small" : "medium"}
              />
              
              <TextField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                multiline
                rows={isMobile ? 4 : 3}
                required
                size={isMobile ? "small" : "medium"}
              />
              
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  label="Type"
                >
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Select Users ({selectedUsers.length} selected)
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                      onChange={handleSelectAll}
                    />
                  }
                  label="Select All"
                />
                <List sx={{ 
                  maxHeight: isMobile ? '50vh' : 200, 
                  overflow: 'auto', 
                  border: 1, 
                  borderColor: 'divider' 
                }}>
                  {users.map((user) => (
                    <ListItem key={user._id} dense>
                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleUserToggle(user._id)}
                      />
                      <ListItemText 
                        primary={user.name || user.email}
                        secondary={user.email}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1 : 0
          }}>
            <Button 
              onClick={() => setIsDialogOpen(false)}
              fullWidth={isMobile}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendNotification}
              variant="contained"
              disabled={!title.trim() || !message.trim() || selectedUsers.length === 0}
              fullWidth={isMobile}
            >
              Send
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminNotificationPanel; 