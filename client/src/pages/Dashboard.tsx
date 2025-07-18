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
} from '@mui/material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../services/api';

interface Booking {
  _id: string;
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

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
} as const;

const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getUserBookings();
      setBookings(response.data);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingsAPI.cancelBooking(bookingId);
      fetchBookings(); // Refresh the list
    } catch (err) {
      setError('Failed to cancel booking');
      console.error('Error cancelling booking:', err);
    }
  };

  return (
    <Container>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          My Bookings
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/book')}
        >
          New Booking
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
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
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => handleCancelBooking(booking._id)}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No bookings found. Create your first booking!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Dashboard; 