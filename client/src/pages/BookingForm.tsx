import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { format } from "date-fns";
import { useFormik } from "formik";
import * as yup from "yup";
import { computersAPI, bookingsAPI } from "../services/api";

interface Computer {
  _id: string;
  name: string;
  config: any;
  isAvailable: boolean;
}

const validationSchema = yup.object({
  reason: yup
    .string()
    .required("Reason is required")
    .min(10, "Reason should be at least 10 characters"),
  startTime: yup.string().required("Start time is required"),
  endTime: yup.string().required("End time is required"),
});

const BookingForm = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [error, setError] = useState("");
  const [selectedComputer, setSelectedComputer] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComputers();
  }, []);

  const fetchComputers = async () => {
    try {
      const response = await computersAPI.getAllComputers();
      setComputers(response.data);
    } catch (err) {
      setError("Failed to fetch computers");
      console.error("Error fetching computers:", err);
    }
  };

  const formik = useFormik({
    initialValues: {
      reason: "",
      startTime: "",
      endTime: "",
    },
    validationSchema: yup.object({
      reason: yup
        .string()
        .required("Reason is required")
        .min(10, "Reason should be at least 10 characters"),
      startTime: yup.string().required("Start time is required"),
      endTime: yup.string().required("End time is required"),
    }),
    onSubmit: async (values) => {
      if (!selectedComputer) {
        setError("Please select a computer");
        return;
      }
      try {
        await bookingsAPI.createBooking({
          computerId: selectedComputer,
          reason: values.reason,
          startTime: new Date(values.startTime).toISOString(),
          endTime: new Date(values.endTime).toISOString(),
        });
        navigate("/");
      } catch (err) {
        setError("Failed to create booking");
        console.error("Error creating booking:", err);
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
            Available Computers
          </Typography>
          <Grid container spacing={2}>
            {computers.map((computer) => (
              <Grid key={computer._id} item xs={12} sm={6} md={4}>
                <Card
                  variant="outlined"
                  sx={{
                    border: selectedComputer === computer._id ? 2 : 1,
                    borderColor:
                      selectedComputer === computer._id
                        ? "primary.main"
                        : "divider",
                  }}
                  onClick={() => setSelectedComputer(computer._id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {computer.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      {JSON.stringify(computer.config)}
                    </Typography>
                    <Chip
                      label={computer.isAvailable ? "Available" : "Booked"}
                      color={computer.isAvailable ? "success" : "error"}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {computers.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="body1">
                    No available computers found. Please check back later.
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
                id="reason"
                name="reason"
                label="Reason for Booking"
                multiline
                rows={4}
                value={formik.values.reason}
                onChange={formik.handleChange}
                error={formik.touched.reason && Boolean(formik.errors.reason)}
                helperText={formik.touched.reason && formik.errors.reason}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                id="startTime"
                name="startTime"
                label="Start Time"
                type="datetime-local"
                value={formik.values.startTime}
                onChange={formik.handleChange}
                error={
                  formik.touched.startTime && Boolean(formik.errors.startTime)
                }
                helperText={formik.touched.startTime && formik.errors.startTime}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                id="endTime"
                name="endTime"
                label="End Time"
                type="datetime-local"
                value={formik.values.endTime}
                onChange={formik.handleChange}
                error={formik.touched.endTime && Boolean(formik.errors.endTime)}
                helperText={formik.touched.endTime && formik.errors.endTime}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => navigate("/")} color="inherit">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!selectedComputer}
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
