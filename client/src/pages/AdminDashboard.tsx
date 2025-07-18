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
import { bookingsAPI, computersAPI } from '../services/api';

interface Booking {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  computer: {
    _id: string;
    name: string;
    description: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  purpose: string;
  createdAt: string;
}

interface Computer {
  _id: string;
  name: string;
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
  const [computers, setComputers] = useState<Computer[]>([]);
  const [error, setError] = useState('');
  const [isCreateComputerOpen, setIsCreateComputerOpen] = useState(false);
  const [newComputer, setNewComputer] = useState({
    name: '',
    description: '',
    cpu: 'Intel Core i5',
    ram: '8GB',
    storage: '256GB SSD',
    os: 'Windows 10',
  });

  useEffect(() => {
    if (activeTab === 0) {
      fetchBookings();
    } else {
      fetchComputers();
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

  const fetchComputers = async () => {
    try {
      const response = await computersAPI.getAllComputers();
      setComputers(response.data);
    } catch (err) {
      setError('Failed to fetch computers');
      console.error('Error fetching computers:', err);
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

  const handleCreateComputer = async () => {
    try {
      const config = {
        cpu: newComputer.cpu,
        ram: newComputer.ram,
        storage: newComputer.storage,
        os: newComputer.os,
      };
      await computersAPI.createComputer({ ...newComputer, config });
      setIsCreateComputerOpen(false);
      fetchComputers();
    } catch (err) {
      setError('Failed to create computer');
      console.error('Error creating computer:', err);
    }
  };

  const handleDeleteComputer = async (computerId: string) => {
    try {
      await computersAPI.deleteComputer(computerId);
      fetchComputers();
    } catch (err) {
      setError('Failed to delete computer');
      console.error('Error deleting computer:', err);
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
          <Tab label="Computers" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Computer</TableCell>
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
                    <Typography variant="body1">{booking.computer.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {booking.computer.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(booking.createdAt), 'PPP')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {format(new Date(booking.createdAt), 'p')} -{' '}
                      {format(new Date(booking.createdAt), 'p')}
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
              onClick={() => setIsCreateComputerOpen(true)}
            >
              Create New Computer
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {computers.map((computer) => (
                  <TableRow key={computer._id}>
                    <TableCell>
                      <Typography variant="body1">{computer.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {computer.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={computer.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                        color={computer.isAvailable ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteComputer(computer._id)}
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

      <Dialog open={isCreateComputerOpen} onClose={() => setIsCreateComputerOpen(false)}>
        <DialogTitle>Create New Computer</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={newComputer.name}
              onChange={(e) => setNewComputer({ ...newComputer, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={newComputer.description}
              onChange={(e) =>
                setNewComputer({ ...newComputer, description: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="CPU"
              value={newComputer.cpu}
              onChange={(e) => setNewComputer({ ...newComputer, cpu: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="RAM"
              value={newComputer.ram}
              onChange={(e) => setNewComputer({ ...newComputer, ram: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Storage"
              value={newComputer.storage}
              onChange={(e) => setNewComputer({ ...newComputer, storage: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="OS"
              value={newComputer.os}
              onChange={(e) => setNewComputer({ ...newComputer, os: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateComputerOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateComputer} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 