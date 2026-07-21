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
  History,
  CheckCircle,
  Computer as ComputerIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI } from '../services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';

const AdminAttendanceHistory: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsAPI.getUserBookings()
      .then(res => {
        // Filter bookings that have active or historic attendance sessions checked into them
        const withAttendance = res.data.filter((b: any) => b.attendanceActive || (b.status === 'completed' && b.attendanceActive));
        setBookings(res.data); // Display all bookings but highlight attendance state
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch bookings for attendance history:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Typography variant="body2" color="text.secondary">Loading attendance history...</Typography>;
  }

  const attendanceSessions = bookings.filter(b => b.attendanceActive?.agentActiveSession?.checkedIn || b.status === 'completed');

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <History color="primary" />
        <Typography variant="h6" fontWeight="600">Global Lab Attendance Registry (Admin-Only)</Typography>
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>System</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Agenda</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Connectivity</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Check-In Time</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">No active attendance logs found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              attendanceSessions.map((b) => {
                const session = b.attendanceActive?.agentActiveSession;
                const studentName = session?.currentUser || b.user?.name || 'Active Student';
                const studentEmail = session?.email || b.user?.email || '';
                const systemName = b.computerId?.name || 'System';
                const agenda = session?.agenda || b.reason;
                const sessType = session?.sessionType || 'Physical GUI';
                const checkInTime = session?.checkInTime ? new Date(session.checkInTime).toLocaleString() : 'N/A';

                return (
                  <TableRow key={b._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{studentName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{studentEmail}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ComputerIcon fontSize="inherit" color="action" />
                        <Typography variant="body2" fontWeight={600}>{systemName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {agenda}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={sessType} size="small" sx={{ fontSize: '0.62rem', height: 18 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{checkInTime}</Typography>
                    </TableCell>
                    <TableCell>
                      {session?.checkedIn ? (
                        <Chip label="Currently Live" size="small" color="success" sx={{ fontSize: '0.6rem', fontWeight: 800, height: 18 }} />
                      ) : (
                        <Chip label="Completed" size="small" variant="outlined" sx={{ fontSize: '0.6rem', fontWeight: 700, height: 18 }} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

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

              {/* Attendance History Section (Visible for Admin users only) */}
              {userRole === 'admin' && (
                <AdminAttendanceHistory />
              )}
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
