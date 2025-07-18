import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { format } from 'date-fns';
import ComputerIcon from '@mui/icons-material/Computer';

interface System {
  _id: string;
  systemNo: number;
  specs: string;
  isAvailable: boolean;
}

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  lab: string;
  description: string;
}

interface SystemBookingDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { purpose: string }) => void;
  selectedSlot: Slot | null;
  selectedSystem: System | null;
}

const validationSchema = yup.object({
  purpose: yup
    .string()
    .required('Purpose is required')
    .min(10, 'Purpose should be at least 10 characters')
    .max(500, 'Purpose should not exceed 500 characters'),
});

const SystemBookingDialog: React.FC<SystemBookingDialogProps> = ({
  open,
  onClose,
  onSubmit,
  selectedSlot,
  selectedSystem,
}) => {
  const formik = useFormik({
    initialValues: {
      purpose: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
      formik.resetForm();
    },
  });

  if (!selectedSlot || !selectedSystem) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Book Lab System</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Selected Slot Details
            </Typography>
            <Typography variant="body1">
              Lab: {selectedSlot.lab}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {selectedSlot.description}
            </Typography>
            <Typography variant="body2">
              Date: {format(new Date(selectedSlot.startTime), 'PPP')}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Time: {format(new Date(selectedSlot.startTime), 'p')} -{' '}
              {format(new Date(selectedSlot.endTime), 'p')}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Selected System
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <ComputerIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="body1">
                  System {selectedSystem.systemNo}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedSystem.specs}
                </Typography>
              </Box>
              <Chip
                label="Available"
                color="success"
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>
            Booking Details
          </Typography>
          <TextField
            fullWidth
            id="purpose"
            name="purpose"
            label="Purpose of Booking"
            multiline
            rows={4}
            placeholder="Please describe why you need to book this system. For example: 'Need to use AutoCAD for my final year project work'"
            value={formik.values.purpose}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.purpose && Boolean(formik.errors.purpose)}
            helperText={formik.touched.purpose && formik.errors.purpose}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              formik.resetForm();
              onClose();
            }} 
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={formik.isSubmitting}
          >
            Book System
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SystemBookingDialog; 