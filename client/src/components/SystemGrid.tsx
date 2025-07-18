import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Computer as ComputerIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import type { System, BookingRequest } from '../services/api';

interface SystemGridProps {
  systems: System[];
  onBookSystem: (systemId: string, bookingData: BookingRequest) => Promise<void>;
  onReleaseSystem: (systemId: string) => Promise<void>;
}

const SystemGrid: React.FC<SystemGridProps> = ({
  systems,
  onBookSystem,
  onReleaseSystem,
}) => {
  const [selectedSystem, setSelectedSystem] = React.useState<System | null>(null);
  const [bookingData, setBookingData] = React.useState<BookingRequest>({
    purpose: '',
    startTime: new Date(),
    endTime: new Date(),
  });

  const handleBookSystem = async () => {
    if (selectedSystem) {
      await onBookSystem(selectedSystem._id, bookingData);
      setSelectedSystem(null);
    }
  };

  const handleReleaseSystem = async (system: System) => {
    await onReleaseSystem(system._id);
  };

  return (
    <>
      <Grid container spacing={3}>
        {systems.map((system) => (
          <Grid item key={system._id} xs={12} sm={6} md={4} lg={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ComputerIcon
                    color={system.status === 'available' ? 'primary' : 'error'}
                    sx={{ fontSize: 40, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6">{system.name}</Typography>
                    <Chip
                      label={system.status === 'available' ? 'Available' : 'In Use'}
                      color={system.status === 'available' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Specifications:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {system.specs.processor}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {system.specs.ram} | {system.specs.storage}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {system.specs.monitor} | {system.specs.os}
                </Typography>

                {system.status === 'in_use' && system.currentUser && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Current User: {system.currentUser.user.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Purpose: {system.currentUser.purpose}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Time: {format(new Date(system.currentUser.startTime), 'PPp')} -{' '}
                      {format(new Date(system.currentUser.endTime), 'PPp')}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2 }}>
                  {system.status === 'available' ? (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => setSelectedSystem(system)}
                    >
                      Book System
                    </Button>
                  ) : (
                    system.currentUser?.user._id === 'CURRENT_USER_ID' && (
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        onClick={() => handleReleaseSystem(system)}
                      >
                        Release System
                      </Button>
                    )
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={!!selectedSystem}
        onClose={() => setSelectedSystem(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Book System {selectedSystem?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Purpose"
              value={bookingData.purpose}
              onChange={(e) =>
                setBookingData({ ...bookingData, purpose: e.target.value })
              }
              fullWidth
              required
            />
            <DateTimePicker
              label="Start Time"
              value={bookingData.startTime}
              onChange={(date) =>
                setBookingData({ ...bookingData, startTime: date || new Date() })
              }
            />
            <DateTimePicker
              label="End Time"
              value={bookingData.endTime}
              onChange={(date) =>
                setBookingData({ ...bookingData, endTime: date || new Date() })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSystem(null)}>Cancel</Button>
          <Button onClick={handleBookSystem} variant="contained" color="primary">
            Book System
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SystemGrid; 