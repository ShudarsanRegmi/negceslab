import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Box,
  Chip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { bookingsAPI, slotsAPI } from '../services/api';

interface Booking {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  slot: {
    startTime: string;
    endTime: string;
    lab: string;
    description: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  purpose: string;
  createdAt: string;
}

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  lab: string;
  description: string;
  isAvailable: boolean;
}

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
} as const;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState('');
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startTime: new Date(),
    endTime: new Date(),
    capacity: 1,
    lab: '',
    description: '',
  });

  useEffect(() => {
    if (activeTab === 0) {
      fetchBookings();
    } else {
      fetchSlots();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAllBookings();
      setBookings(response.data);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await slotsAPI.getAvailableSlots();
      setSlots(response.data);
    } catch (err) {
      setError('Failed to fetch slots');
      console.error('Error fetching slots:', err);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await bookingsAPI.updateBookingStatus(bookingId, status);
      fetchBookings();
    } catch (err) {
      setError('Failed to update booking status');
      console.error('Error updating booking status:', err);
    }
  };

  const handleCreateSlot = async () => {
    try {
      await slotsAPI.createSlot(newSlot);
      setIsCreateSlotOpen(false);
      fetchSlots();
    } catch (err) {
      setError('Failed to create slot');
      console.error('Error creating slot:', err);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await slotsAPI.deleteSlot(slotId);
      fetchSlots();
    } catch (err) {
      setError('Failed to delete slot');
      console.error('Error deleting slot:', err);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Bookings" />
          <Tab label="Slots" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Lab</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>
                    <Typography variant="body1">{booking.user.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {booking.user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">{booking.slot.lab}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {booking.slot.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(booking.slot.startTime), 'PPP')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {format(new Date(booking.slot.startTime), 'p')} -{' '}
                      {format(new Date(booking.slot.endTime), 'p')}
                    </Typography>
                  </TableCell>
                  <TableCell>{booking.purpose}</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status.toUpperCase()}
                      color={statusColors[booking.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {booking.status === 'pending' && (
                      <Box>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleUpdateBookingStatus(booking._id, 'approved')}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleUpdateBookingStatus(booking._id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsCreateSlotOpen(true)}
            >
              Create New Slot
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lab</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow key={slot._id}>
                    <TableCell>
                      <Typography variant="body1">{slot.lab}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {slot.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(slot.startTime), 'PPP')}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {format(new Date(slot.startTime), 'p')} -{' '}
                        {format(new Date(slot.endTime), 'p')}
                      </Typography>
                    </TableCell>
                    <TableCell>{slot.capacity}</TableCell>
                    <TableCell>
                      <Chip
                        label={slot.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                        color={slot.isAvailable ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteSlot(slot._id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={isCreateSlotOpen} onClose={() => setIsCreateSlotOpen(false)}>
        <DialogTitle>Create New Slot</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <DateTimePicker
              label="Start Time"
              value={newSlot.startTime}
              onChange={(newValue) =>
                setNewSlot({ ...newSlot, startTime: newValue || new Date() })
              }
              sx={{ mb: 2 }}
            />
            <DateTimePicker
              label="End Time"
              value={newSlot.endTime}
              onChange={(newValue) =>
                setNewSlot({ ...newSlot, endTime: newValue || new Date() })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Lab"
              value={newSlot.lab}
              onChange={(e) => setNewSlot({ ...newSlot, lab: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={newSlot.description}
              onChange={(e) =>
                setNewSlot({ ...newSlot, description: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Capacity"
              value={newSlot.capacity}
              onChange={(e) =>
                setNewSlot({ ...newSlot, capacity: parseInt(e.target.value) || 1 })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateSlotOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSlot} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 