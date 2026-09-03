import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Paper,
} from "@mui/material";
import {
  Policy as PolicyIcon,
  Save as SaveIcon,
  Timer as TimerIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import { policyAPI } from "../services/api";

const DAYS_OF_WEEK = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

export const AdminPolicySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    labOpenHour: 8,
    labOpenMinute: 30,
    labCloseHour: 17,
    labCloseMinute: 30,
    maxBookingDays: 15,
    minBookingHours: 1,
    coolDownPeriodDays: 3,
    maxBookingAheadDays: 30,
    closedDays: [0],
  });

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policyAPI.getPolicy();
      if (res.data) {
        setFormData({
          labOpenHour: res.data.labOpenHour ?? 8,
          labOpenMinute: res.data.labOpenMinute ?? 30,
          labCloseHour: res.data.labCloseHour ?? 17,
          labCloseMinute: res.data.labCloseMinute ?? 30,
          maxBookingDays: res.data.maxBookingDays ?? 15,
          minBookingHours: res.data.minBookingHours ?? 1,
          coolDownPeriodDays: res.data.coolDownPeriodDays ?? 3,
          maxBookingAheadDays: res.data.maxBookingAheadDays ?? 30,
          closedDays: Array.isArray(res.data.closedDays) ? res.data.closedDays : [0],
        });
      }
    } catch (err: any) {
      console.error("Failed to load policy:", err);
      setError("Failed to fetch lab policy settings");
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleClosedDayToggle = (dayVal: number) => {
    setFormData((prev) => {
      const current = prev.closedDays;
      const updated = current.includes(dayVal)
        ? current.filter((d) => d !== dayVal)
        : [...current, dayVal];
      return { ...prev, closedDays: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await policyAPI.updatePolicy(formData);
      setSuccess("Lab booking policy updated successfully! In-memory RAM cache refreshed.");
    } catch (err: any) {
      console.error("Failed to save policy:", err);
      setError(err.response?.data?.message || "Failed to save lab policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1000, mx: "auto", p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <PolicyIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">
          Lab Booking Policy & Cool-Down Settings
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Cool-Down & Duration Policy */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
              <TimerIcon />
              <Typography variant="h6" fontWeight="bold">
                Cool-Down & Booking Limits
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <TextField
              fullWidth
              label="Cool-Down Period (Days)"
              name="coolDownPeriodDays"
              type="number"
              value={formData.coolDownPeriodDays}
              onChange={handleTextChange}
              helperText="Mandatory waiting period after a user's booking ends before they can book again."
              sx={{ mb: 3 }}
              inputProps={{ min: 0, max: 90 }}
            />

            <TextField
              fullWidth
              label="Maximum Booking Duration (Days)"
              name="maxBookingDays"
              type="number"
              value={formData.maxBookingDays}
              onChange={handleTextChange}
              helperText="Maximum consecutive days allowed per booking request."
              sx={{ mb: 3 }}
              inputProps={{ min: 1, max: 90 }}
            />

            <TextField
              fullWidth
              label="Advance Booking Window (Days)"
              name="maxBookingAheadDays"
              type="number"
              value={formData.maxBookingAheadDays}
              onChange={handleTextChange}
              helperText="How far in advance users can place bookings."
              inputProps={{ min: 1, max: 365 }}
            />
          </Paper>
        </Grid>

        {/* Operating Hours Policy */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
              <AccessTimeIcon />
              <Typography variant="h6" fontWeight="bold">
                Operating Hours & Slot Limits
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Lab Open Hour (24h)"
                  name="labOpenHour"
                  type="number"
                  value={formData.labOpenHour}
                  onChange={handleTextChange}
                  inputProps={{ min: 0, max: 23 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Lab Open Minute"
                  name="labOpenMinute"
                  type="number"
                  value={formData.labOpenMinute}
                  onChange={handleTextChange}
                  inputProps={{ min: 0, max: 59 }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Lab Close Hour (24h)"
                  name="labCloseHour"
                  type="number"
                  value={formData.labCloseHour}
                  onChange={handleTextChange}
                  inputProps={{ min: 0, max: 23 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Lab Close Minute"
                  name="labCloseMinute"
                  type="number"
                  value={formData.labCloseMinute}
                  onChange={handleTextChange}
                  inputProps={{ min: 0, max: 59 }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Minimum Same-Day Booking (Hours)"
              name="minBookingHours"
              type="number"
              value={formData.minBookingHours}
              onChange={handleTextChange}
              helperText="Minimum duration in hours required for same-day bookings."
              inputProps={{ min: 1, max: 12 }}
            />
          </Paper>
        </Grid>

        {/* Closed Days Policy */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
              <CalendarIcon />
              <Typography variant="h6" fontWeight="bold">
                Weekly Closed Days
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select days when the lab is closed and unavailable for reservations.
            </Typography>

            <FormGroup row>
              {DAYS_OF_WEEK.map((day) => (
                <FormControlLabel
                  key={day.value}
                  control={
                    <Checkbox
                      checked={formData.closedDays.includes(day.value)}
                      onChange={() => handleClosedDayToggle(day.value)}
                    />
                  }
                  label={day.label}
                  sx={{ minWidth: 130 }}
                />
              ))}
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={saving}
          sx={{ px: 4, py: 1.5 }}
        >
          {saving ? "Saving Policy..." : "Save Lab Policy"}
        </Button>
      </Box>
    </Box>
  );
};

export default AdminPolicySettings;
