import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { bookingsAPI, slotsAPI } from '../services/api';

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  lab: string;
  description: string;
  isAvailable: boolean;
}

const validationSchema = yup.object({
  purpose: yup
    .string()
    .required('Purpose is required')
    .min(10, 'Purpose should be at least 10 characters'),
});

const BookingForm = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await slotsAPI.getAvailableSlots();
      setSlots(response.data);
    } catch (err) {
      setError('Failed to fetch available slots');
      console.error('Error fetching slots:', err);
    }
  };

  const formik = useFormik({
    initialValues: {
      purpose: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!selectedSlot) {
        setError('Please select a slot');
        return;
      }

      try {
        await bookingsAPI.createBooking({
          slotId: selectedSlot,
          purpose: values.purpose,
        });
        navigate('/');
      } catch (err) {
        setError('Failed to create booking');
        console.error('Error creating booking:', err);
      }
    },
  });

  return (
    <Container>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Book a Lab Slot
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Available Slots
          </Typography>
          <Grid container spacing={2}>
            {slots.map((slot) => (
              <Grid key={slot._id} item xs={12} sm={6} md={4}>
                <Card
                  variant="outlined"
                  sx={{
                    border: selectedSlot === slot._id ? 2 : 1,
                    borderColor: selectedSlot === slot._id ? 'primary.main' : 'divider',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {slot.lab}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {slot.description}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {format(new Date(slot.startTime), 'PPP')}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {format(new Date(slot.startTime), 'p')} -{' '}
                        {format(new Date(slot.endTime), 'p')}
                      </Typography>
                    </Box>
                    <Chip
                      label={`Capacity: ${slot.capacity}`}
                      size="small"
                      color="primary"
                    />
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color={selectedSlot === slot._id ? 'error' : 'primary'}
                      onClick={() =>
                        setSelectedSlot(
                          selectedSlot === slot._id ? null : slot._id
                        )
                      }
                    >
                      {selectedSlot === slot._id ? 'Unselect' : 'Select'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {slots.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body1">
                    No available slots found. Please check back later.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Booking Details
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="purpose"
                name="purpose"
                label="Purpose of Booking"
                multiline
                rows={4}
                value={formik.values.purpose}
                onChange={formik.handleChange}
                error={formik.touched.purpose && Boolean(formik.errors.purpose)}
                helperText={formik.touched.purpose && formik.errors.purpose}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={() => navigate('/')} color="inherit">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!selectedSlot}
                >
                  Submit Booking
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BookingForm; 