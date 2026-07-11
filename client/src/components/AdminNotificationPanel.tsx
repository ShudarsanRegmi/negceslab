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
  Tabs,
  Tab,
  IconButton,
  Badge,
  Tooltip,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DraftsIcon from '@mui/icons-material/Drafts';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { notificationsAPI, bookingsAPI } from '../services/api';

interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  name?: string;
  role?: string;
}

interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  metadata?: {
    bookingId?: string;
    computerId?: string;
    computerName?: string;
    userId?: string;
    userName?: string;
    [key: string]: any;
  };
}

interface Props {
  bookings?: any[];
  setActiveTab?: (index: number) => void;
  onViewDetails?: (booking: any) => void;
}

const AdminNotificationPanel: React.FC<Props> = ({
  bookings = [],
  setActiveTab,
  onViewDetails,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [dbBookings, setDbBookings] = useState<any[]>(bookings);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin Received Notifications State
  const [receivedNotifs, setReceivedNotifs] = useState<Notification[]>([]);
  const [notifSearch, setNotifSearch] = useState('');
  const [filterTab, setFilterTab] = useState<string>('all'); // 'all', 'requests', 'cancellations', 'freed', 'broadcasts'

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchUsers();
    fetchBookings();
    fetchReceivedNotifications();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await notificationsAPI.getUsers();
      const rawData = response.data;
      if (Array.isArray(rawData)) {
        const normalized = rawData
          .map((u: any) => {
            if (typeof u === 'string') {
              return { _id: u, firebaseUid: u, name: u, email: u, role: 'user' };
            }
            return {
              _id: u._id || u.firebaseUid || '',
              firebaseUid: u.firebaseUid || u._id || '',
              name: u.name || '',
              email: u.email || '',
              role: u.role || 'user',
            };
          })
          // Exclude admins and superadmins from the recipient selector list
          .filter((u: any) => u.role !== 'admin' && u.role !== 'superadmin');
        setUsers(normalized);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAllBookings();
      if (response.data) {
        setDbBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchReceivedNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      setReceivedNotifs(response.data || []);
    } catch (error) {
      console.error('Error fetching received notifications:', error);
    }
  };

  // Helper selectors for active/incoming users
  const activeUserIds = useMemo(() => {
    const now = new Date();
    return dbBookings
      .filter(b => {
        const start = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
        const end = new Date(`${b.endDate}T${b.endTime || '23:59'}`);
        return (b.status === 'approved' || b.status === 'completed') && now >= start && now <= end;
      })
      .map(b => b.userId);
  }, [dbBookings]);

  const incomingUserIds = useMemo(() => {
    const now = new Date();
    return dbBookings
      .filter(b => {
        const start = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
        return b.status === 'approved' && now < start;
      })
      .map(b => b.userId);
  }, [dbBookings]);

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
      // Refresh notifications list to show the admin's broadcast too (if applicable)
      fetchReceivedNotifications();
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
      targets = activeUserIds.filter(id => users.some(u => u.firebaseUid === id));
    } else if (preset === 'incoming') {
      targets = incomingUserIds.filter(id => users.some(u => u.firebaseUid === id));
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

  // Interactive navigation / inspection
  const handleNotificationClick = async (notif: Notification) => {
    // 1. Mark as read
    if (!notif.isRead) {
      try {
        await notificationsAPI.markAsRead(notif._id);
        setReceivedNotifs(prev =>
          prev.map(n => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    // 2. Parse booking code
    const code = notif.metadata?.bookingId || notif.message.match(/ID:\s*([A-F0-9]{6})/i)?.[1];
    if (code && onViewDetails) {
      const match = dbBookings.find(b => b._id.toUpperCase().endsWith(code.toUpperCase()));
      if (match) {
        onViewDetails(match);
        return;
      }
    }

    // 3. Fallback Navigation
    if (setActiveTab) {
      const titleLower = notif.title.toLowerCase();
      const msgLower = notif.message.toLowerCase();
      if (titleLower.includes('request') || msgLower.includes('request')) {
        setActiveTab(0); // Pending Requests tab
      } else if (titleLower.includes('cancel') || msgLower.includes('cancel') || titleLower.includes('freed') || msgLower.includes('freed')) {
        setActiveTab(1); // Approved Bookings tab
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setReceivedNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Filter & Categorization logic for Received Notifications
  const filteredNotifs = useMemo(() => {
    let result = receivedNotifs;

    // Search query filter
    if (notifSearch.trim()) {
      const q = notifSearch.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.message.toLowerCase().includes(q) ||
        (n.metadata?.userName || '').toLowerCase().includes(q)
      );
    }

    // Tab/Category filter
    if (filterTab === 'requests') {
      result = result.filter(n => n.title.toLowerCase().includes('request') || n.message.toLowerCase().includes('request'));
    } else if (filterTab === 'cancellations') {
      result = result.filter(n => n.title.toLowerCase().includes('cancel') || n.message.toLowerCase().includes('cancel'));
    } else if (filterTab === 'freed') {
      result = result.filter(n => n.title.toLowerCase().includes('freed') || n.message.toLowerCase().includes('freed') || n.message.toLowerCase().includes('available'));
    } else if (filterTab === 'broadcasts') {
      // Manual broadcasts or warnings/info not matching booking workflow
      result = result.filter(n => 
        !n.title.toLowerCase().includes('request') && 
        !n.message.toLowerCase().includes('request') &&
        !n.title.toLowerCase().includes('cancel') && 
        !n.message.toLowerCase().includes('cancel') &&
        !n.title.toLowerCase().includes('freed') && 
        !n.message.toLowerCase().includes('freed')
      );
    }

    return result;
  }, [receivedNotifs, notifSearch, filterTab]);

  const getNotifIcon = (notif: Notification) => {
    const titleLower = notif.title.toLowerCase();
    const msgLower = notif.message.toLowerCase();

    if (titleLower.includes('cancel') || msgLower.includes('cancel')) {
      return <CancelScheduleSendIcon sx={{ color: 'error.main' }} />;
    }
    if (titleLower.includes('freed') || msgLower.includes('freed') || msgLower.includes('available')) {
      return <EventAvailableIcon sx={{ color: 'success.main' }} />;
    }
    if (titleLower.includes('request') || msgLower.includes('request')) {
      return <NotificationsIcon sx={{ color: 'primary.main' }} />;
    }

    switch (notif.type) {
      case 'success': return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning': return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error': return <ErrorIcon sx={{ color: 'error.main' }} />;
      default: return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  const unreadCount = receivedNotifs.filter(n => !n.isRead).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── BROADCAST CONTROL CENTER ── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                Broadcast Center
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Create announcements or manual warnings for selected user groups
              </Typography>
            </Box>
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
              Compose Broadcast
            </Button>
          </Box>



          {alert && (
            <Alert 
              severity={alert.type} 
              onClose={() => setAlert(null)}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {alert.message}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── NOTIFICATION HUB / RECEIVED CENTER ── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Notification Hub
                </Typography>
              </Badge>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                placeholder="Search announcements, user names..."
                size="small"
                value={notifSearch}
                onChange={e => setNotifSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 260 } }}
              />
              {unreadCount > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleMarkAllRead}
                  startIcon={<MarkEmailReadIcon />}
                  sx={{
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                  }}
                >
                  Mark all as read
                </Button>
              )}
            </Box>
          </Box>

          {/* Categorization Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={filterTab}
              onChange={(_, val) => setFilterTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              TabIndicatorProps={{ style: { backgroundColor: '#0f172a' } }}
              sx={{
                minHeight: 38,
                '& .MuiTab-root': { fontWeight: 700, fontSize: '0.78rem', textTransform: 'none', color: '#64748b', minHeight: 38, py: 1 },
                '& .Mui-selected': { color: '#0f172a !important' },
              }}
            >
              <Tab value="all" label={`All (${receivedNotifs.length})`} />
              <Tab value="requests" label={`Booking Requests (${receivedNotifs.filter(n => n.title.toLowerCase().includes('request') || n.message.toLowerCase().includes('request')).length})`} />
              <Tab value="cancellations" label={`Cancellations (${receivedNotifs.filter(n => n.title.toLowerCase().includes('cancel') || n.message.toLowerCase().includes('cancel')).length})`} />
              <Tab value="freed" label={`System Freed (${receivedNotifs.filter(n => n.title.toLowerCase().includes('freed') || n.message.toLowerCase().includes('freed') || n.message.toLowerCase().includes('available')).length})`} />
              <Tab value="broadcasts" label={`Manual Alerts (${receivedNotifs.filter(n => !n.title.toLowerCase().includes('request') && !n.message.toLowerCase().includes('request') && !n.title.toLowerCase().includes('cancel') && !n.message.toLowerCase().includes('cancel') && !n.title.toLowerCase().includes('freed') && !n.message.toLowerCase().includes('freed')).length})`} />
            </Tabs>
          </Box>

          {/* List of Notification Cards */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredNotifs.map((notif) => {
              const formattedDate = new Date(notif.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card 
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    border: '1px solid',
                    borderColor: notif.isRead ? '#f1f5f9' : '#bfdbfe',
                    borderRadius: 2.5,
                    boxShadow: 'none',
                    bgcolor: notif.isRead ? '#fff' : '#eff6ff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#93c5fd',
                      bgcolor: notif.isRead ? '#f8fafc' : '#eff6ff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  <CardContent sx={{ p: '16px !important' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Avatar sx={{ bgcolor: notif.isRead ? '#f1f5f9' : '#fff', color: '#1e293b', width: 38, height: 38, border: '1px solid #e2e8f0' }}>
                        {getNotifIcon(notif)}
                      </Avatar>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={notif.isRead ? 700 : 800} color="#0f172a">
                            {notif.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!notif.isRead && (
                              <Chip 
                                label="New" 
                                size="small" 
                                color="primary" 
                                sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, borderRadius: 1 }} 
                              />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {formattedDate}
                            </Typography>
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.45, mb: 1 }}>
                          {notif.message}
                        </Typography>

                        {/* Interactive Actions footer */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif);
                            }}
                            sx={{ fontSize: '0.72rem', fontWeight: 700, p: 0, textTransform: 'none' }}
                          >
                            Inspect & Take Action
                          </Button>
                          
                          {notif.metadata?.userName && (
                            <Chip 
                              icon={<AccountCircleIcon style={{ fontSize: 14 }} />}
                              label={notif.metadata.userName} 
                              size="small" 
                              variant="outlined" 
                              sx={{ height: 18, fontSize: '0.65rem', color: '#64748b', ml: 'auto' }} 
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}

            {filteredNotifs.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <DraftsIcon sx={{ fontSize: 42, color: '#94a3b8', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  No notifications match your current filter
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── BROADCAST COMPOSE DIALOG ── */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Compose Custom Announcement</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            {/* Title field spanning full row */}
            <TextField
              label="Announcement Title"
              placeholder="e.g. Scheduled Lab Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              size="small"
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Alert Type / Severity Level</InputLabel>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    label="Alert Type / Severity Level"
                  >
                    <MenuItem value="info">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoIcon sx={{ fontSize: 18, color: 'info.main' }} /> General Info Broadcast
                      </Box>
                    </MenuItem>
                    <MenuItem value="success">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} /> Success / Complete Broadcast
                      </Box>
                    </MenuItem>
                    <MenuItem value="warning">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} /> Warning Announcement
                      </Box>
                    </MenuItem>
                    <MenuItem value="error">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} /> Critical System Warning
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <TextField
              label="Message Body"
              placeholder="Enter details of the update, schedules, or restrictions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              multiline
              rows={4}
              required
              size="small"
            />

            <Divider />

            {/* Target selection group */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1, color: '#1e293b' }}>
                Select Recipients ({selectedUsers.length} Selected)
              </Typography>
              
              {/* Presets Group */}
              <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mb: 1.5, bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                      onChange={(e) => handlePresetCheckboxChange('all', e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={700}>All Users</Typography>}
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
                      Active Bookings ({activeUserIds.length})
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
                  sx={{ ml: 'auto', fontWeight: 700, textTransform: 'none' }}
                >
                  Clear Selection
                </Button>
              </Box>

              {/* Filtering checklist */}
              <TextField
                placeholder="Search users..."
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
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendNotification}
            variant="contained"
            disabled={!title.trim() || !message.trim() || selectedUsers.length === 0}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#0f172a',
              '&:hover': { bgcolor: '#1e293b' },
            }}
          >
            Send Broadcast
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminNotificationPanel;