import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import SystemGrid from '../components/SystemGrid';
import { systemsAPI, type System, type BookingRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SystemManagement = () => {
  const [systems, setSystems] = useState<System[]>([]);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    try {
      const response = await systemsAPI.getAllSystems();
      setSystems(response.data);
    } catch (err) {
      setError('Failed to fetch systems');
      console.error('Error fetching systems:', err);
    }
  };

  const handleBookSystem = async (systemId: string, bookingData: BookingRequest) => {
    try {
      await systemsAPI.bookSystem(systemId, bookingData);
      fetchSystems(); // Refresh systems list
    } catch (err) {
      setError('Failed to book system');
      console.error('Error booking system:', err);
    }
  };

  const handleReleaseSystem = async (systemId: string) => {
    try {
      await systemsAPI.releaseSystem(systemId);
      fetchSystems(); // Refresh systems list
    } catch (err) {
      setError('Failed to release system');
      console.error('Error releasing system:', err);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lab Systems
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <SystemGrid
          systems={systems}
          onBookSystem={handleBookSystem}
          onReleaseSystem={handleReleaseSystem}
        />
      </Box>
    </Container>
  );
};

export default SystemManagement; 