import React, { useState, useEffect, useMemo } from 'react';
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
  InputAdornment,
  Grid,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { notificationsAPI, bookingsAPI } from '../services/api';

interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  name?: string;
}

const AdminNotificationPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchUsers();
    fetchBookings();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await notificationsAPI.getUsers();
      const rawData = response.data;
      if (Array.isArray(rawData)) {
        const normalized = rawData.map((u: any) => {
          if (typeof u === 'string') {
            return { _id: u, firebaseUid: u, name: u, email: u };
          }
          return {
            _id: u._id || u.firebaseUid || '',
            firebaseUid: u.firebaseUid || u._id || '',
            name: u.name || '',
            email: u.email || '',
          };
        });
        setUsers(normalized);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAllBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Helper selectors
  const activeUserIds = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(b => {
        const start = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
        const end = new Date(`${b.endDate}T${b.endTime || '23:59'}`);
        return (b.status === 'approved' || b.status === 'completed') && now >= start && now <= end;
      })
      .map(b => b.userId);
  }, [bookings]);

  const incomingUserIds = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(b => {
        const start = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
        return b.status === 'approved' && now < start;
      })
      .map(b => b.userId);
  }, [bookings]);

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

      setAlert({ type: 'success', message: `Notification successfully sent to ${selectedUsers.length} users!` });
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

  const handleUserToggle = (firebaseUid: string) => {
    setSelectedUsers(prev => 
      prev.includes(firebaseUid) 
        ? prev.filter(uid => uid !== firebaseUid)
        : [...prev, firebaseUid]
    );
  };

  // Checkbox group logic
  const isAllSelected = users.length > 0 && selectedUsers.length === users.length;
  const isActiveSelected = activeUserIds.length > 0 && activeUserIds.every(id => selectedUsers.includes(id));
  const isIncomingSelected = incomingUserIds.length > 0 && incomingUserIds.every(id => selectedUsers.includes(id));

  const handlePresetCheckboxChange = (preset: 'all' | 'active' | 'incoming', checked: boolean) => {
    let targets: string[] = [];
    if (preset === 'all') {
      targets = users.map(u => u.firebaseUid).filter(Boolean);
    } else if (preset === 'active') {
      targets = activeUserIds;
    } else if (preset === 'incoming') {
      targets = incomingUserIds;
    }

    if (checked) {
      setSelectedUsers(prev => Array.from(new Set([...prev, ...targets])));
    } else {
      setSelectedUsers(prev => prev.filter(id => !targets.includes(id)));
    }
  };

  // Filtered users for search list
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const query = userSearch.toLowerCase();
    return users.filter(
      u => (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query)
    );
  }, [users, userSearch]);

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} color="#0f172a" gutterBottom>
          Broadcast & Custom Notifications
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>Automatic Notifications:</strong> The system automatically alerts users regarding slot approvals, overlapping booking rejections, extensions, or cancellations.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Manual Broadcasting:</strong> Dispatch alerts for lab maintenance, hardware updates, dynamic scheduling shifts, or general announcements.
          </Typography>
        </Alert>
        
        {alert && (
          <Alert 
            severity={alert.type} 
            onClose={() => setAlert(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {alert.message}
          </Alert>
        )}

        <Button 
          variant="contained" 
          startIcon={<SendIcon />}
          onClick={() => setIsDialogOpen(true)}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e293b' },
          }}
          fullWidth={isMobile}
        >
          Compose Notification
        </Button>

        <Dialog 
          open={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Compose & Send Notification</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Notification Title"
                    placeholder="e.g. Scheduled Lab Maintenance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Alert Type / Severity</InputLabel>
                    <Select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      label="Alert Type / Severity"
                    >
                      <MenuItem value="info">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InfoIcon sx={{ fontSize: 18, color: 'info.main' }} /> Info
                        </Box>
                      </MenuItem>
                      <MenuItem value="success">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} /> Success
                        </Box>
                      </MenuItem>
                      <MenuItem value="warning">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} /> Warning
                        </Box>
                      </MenuItem>
                      <MenuItem value="error">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} /> Critical Error
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <TextField
                label="Message Content"
                placeholder="Write your detailed announcement here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                multiline
                rows={4}
                required
                size="small"
              />

              <Divider />

              {/* Target options panel */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1, color: '#1e293b' }}>
                  Target Recipients ({selectedUsers.length} Selected)
                </Typography>
                
                {/* Selectors Group */}
                <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mb: 1.5, bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                        onChange={(e) => handlePresetCheckboxChange('all', e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2" fontWeight={700}>Select All Users</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isActiveSelected}
                        indeterminate={
                          activeUserIds.length > 0 && 
                          activeUserIds.some(id => selectedUsers.includes(id)) && 
                          !activeUserIds.every(id => selectedUsers.includes(id))
                        }
                        onChange={(e) => handlePresetCheckboxChange('active', e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2" color="success.main" fontWeight={700}>
                        Current Active Bookings ({activeUserIds.length})
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isIncomingSelected}
                        indeterminate={
                          incomingUserIds.length > 0 && 
                          incomingUserIds.some(id => selectedUsers.includes(id)) && 
                          !incomingUserIds.every(id => selectedUsers.includes(id))
                        }
                        onChange={(e) => handlePresetCheckboxChange('incoming', e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2" color="primary.main" fontWeight={700}>
                        Incoming Bookings ({incomingUserIds.length})
                      </Typography>
                    }
                  />
                  
                  <Button 
                    size="small" 
                    variant="text" 
                    onClick={() => setSelectedUsers([])}
                    disabled={selectedUsers.length === 0}
                    sx={{ ml: 'auto', fontWeight: 700 }}
                  >
                    Deselect All
                  </Button>
                </Box>

                {/* Search box for checklist */}
                <TextField
                  placeholder="Filter users list by name or email..."
                  size="small"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1.5 }}
                />

                <List sx={{ 
                  maxHeight: 220, 
                  overflow: 'auto', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: 2,
                  bgcolor: '#fff',
                  px: 0.5,
                }}>
                  {filteredUsers.map((user) => {
                    const isActive = activeUserIds.includes(user.firebaseUid);
                    const isIncoming = incomingUserIds.includes(user.firebaseUid);
                    
                    return (
                      <ListItem 
                        key={user.firebaseUid || user._id} 
                        dense 
                        onClick={() => handleUserToggle(user.firebaseUid)}
                        sx={{ 
                          cursor: 'pointer',
                          borderRadius: 1.5,
                          mb: 0.5,
                          '&:hover': { bgcolor: '#f1f5f9' },
                          bgcolor: selectedUsers.includes(user.firebaseUid) ? '#f8fafc' : 'transparent',
                        }}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(user.firebaseUid)}
                          onChange={() => handleUserToggle(user.firebaseUid)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={700}>
                                {user.name || 'No Name Set'}
                              </Typography>
                              {isActive && (
                                <Chip label="Active Booking" size="small" variant="outlined" color="success" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
                              )}
                              {isIncoming && (
                                <Chip label="Incoming Booking" size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
                              )}
                            </Box>
                          }
                          secondary={user.email}
                        />
                      </ListItem>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3, fontStyle: 'italic' }}>
                      No matching users found.
                    </Typography>
                  )}
                </List>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button 
              onClick={() => setIsDialogOpen(false)}
              sx={{ fontWeight: 700 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendNotification}
              variant="contained"
              disabled={!title.trim() || !message.trim() || selectedUsers.length === 0}
              sx={{
                fontWeight: 700,
                bgcolor: '#0f172a',
                '&:hover': { bgcolor: '#1e293b' },
              }}
            >
              Send Broadcast
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminNotificationPanel;