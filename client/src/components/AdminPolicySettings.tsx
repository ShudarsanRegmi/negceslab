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
  Chip,
  Stack,
} from "@mui/material";
import {
  Policy as PolicyIcon,
  Save as SaveIcon,
  Timer as TimerIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
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

interface PolicyData {
  labOpenHour: number;
  labOpenMinute: number;
  labCloseHour: number;
  labCloseMinute: number;
  maxBookingDays: number;
  minBookingHours: number;
  coolDownPeriodDays: number;
  maxBookingAheadDays: number;
  closedDays: number[];
}

const defaultPolicy: PolicyData = {
  labOpenHour: 8,
  labOpenMinute: 30,
  labCloseHour: 17,
  labCloseMinute: 30,
  maxBookingDays: 15,
  minBookingHours: 1,
  coolDownPeriodDays: 3,
  maxBookingAheadDays: 30,
  closedDays: [0],
};

const pad = (n: number) => String(n).padStart(2, "0");

export const AdminPolicySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [savedData, setSavedData] = useState<PolicyData>(defaultPolicy);
  const [formData, setFormData] = useState<PolicyData>(defaultPolicy);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policyAPI.getPolicy();
      if (res.data) {
        const loaded: PolicyData = {
          labOpenHour: res.data.labOpenHour ?? 8,
          labOpenMinute: res.data.labOpenMinute ?? 30,
          labCloseHour: res.data.labCloseHour ?? 17,
          labCloseMinute: res.data.labCloseMinute ?? 30,
          maxBookingDays: res.data.maxBookingDays ?? 15,
          minBookingHours: res.data.minBookingHours ?? 1,
          coolDownPeriodDays: res.data.coolDownPeriodDays ?? 3,
          maxBookingAheadDays: res.data.maxBookingAheadDays ?? 30,
          closedDays: Array.isArray(res.data.closedDays) ? res.data.closedDays : [0],
        };
        setSavedData(loaded);
        setFormData(loaded);
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
    setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleClosedDayToggle = (dayVal: number) => {
    setFormData((prev) => {
      const updated = prev.closedDays.includes(dayVal)
        ? prev.closedDays.filter((d) => d !== dayVal)
        : [...prev.closedDays, dayVal];
      return { ...prev, closedDays: updated };
    });
  };

  const handleEdit = () => {
    setFormData(savedData);
    setSuccess(null);
    setError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData(savedData);
    setEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await policyAPI.updatePolicy(formData);
      setSavedData(formData);
      setSuccess("Lab booking policy updated successfully!");
      setEditing(false);
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
    <Box component={editing ? "form" : "div"} onSubmit={editing ? handleSubmit : undefined} sx={{ maxWidth: 1000, mx: "auto", p: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PolicyIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Lab Booking Policy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure lab operating hours, booking rules, and cool-down periods.
            </Typography>
          </Box>
        </Box>
        {!editing ? (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ minWidth: 120 }}
          >
            Edit Policy
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              disabled={saving}
              sx={{ minWidth: 140 }}
            >
              {saving ? "Saving..." : "Save Policy"}
            </Button>
          </Stack>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Cool-Down & Duration Policy */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
              <TimerIcon />
              <Typography variant="h6" fontWeight="bold">
                Cool-Down &amp; Booking Limits
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {editing ? (
              <>
                <TextField
                  fullWidth
                  label="Cool-Down Period (Days)"
                  name="coolDownPeriodDays"
                  type="number"
                  value={formData.coolDownPeriodDays}
                  onChange={handleTextChange}
                  helperText="Mandatory waiting period after a booking ends before the user can book again."
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
              </>
            ) : (
              <Stack spacing={2.5}>
                <PolicyRow label="Cool-Down Period" value={`${savedData.coolDownPeriodDays} days`} desc="Wait time after booking ends before re-booking." />
                <PolicyRow label="Max Booking Duration" value={`${savedData.maxBookingDays} days`} desc="Maximum consecutive days per booking." />
                <PolicyRow label="Advance Booking Window" value={`${savedData.maxBookingAheadDays} days`} desc="How far ahead users can book." />
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Operating Hours */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
              <AccessTimeIcon />
              <Typography variant="h6" fontWeight="bold">
                Operating Hours &amp; Slot Limits
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {editing ? (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Lab Open Hour (24h)" name="labOpenHour" type="number" value={formData.labOpenHour} onChange={handleTextChange} inputProps={{ min: 0, max: 23 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Open Minute" name="labOpenMinute" type="number" value={formData.labOpenMinute} onChange={handleTextChange} inputProps={{ min: 0, max: 59 }} />
                  </Grid>
                </Grid>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Lab Close Hour (24h)" name="labCloseHour" type="number" value={formData.labCloseHour} onChange={handleTextChange} inputProps={{ min: 0, max: 23 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Close Minute" name="labCloseMinute" type="number" value={formData.labCloseMinute} onChange={handleTextChange} inputProps={{ min: 0, max: 59 }} />
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
              </>
            ) : (
              <Stack spacing={2.5}>
                <PolicyRow
                  label="Lab Opens"
                  value={`${pad(savedData.labOpenHour)}:${pad(savedData.labOpenMinute)}`}
                  desc="Daily lab opening time (24-hour format)."
                />
                <PolicyRow
                  label="Lab Closes"
                  value={`${pad(savedData.labCloseHour)}:${pad(savedData.labCloseMinute)}`}
                  desc="Daily lab closing time (24-hour format)."
                />
                <PolicyRow
                  label="Min Same-Day Duration"
                  value={`${savedData.minBookingHours} hour${savedData.minBookingHours !== 1 ? "s" : ""}`}
                  desc="Minimum hours required for same-day bookings."
                />
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Closed Days */}
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
              Days when the lab is closed and unavailable for reservations.
            </Typography>

            {editing ? (
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
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {DAYS_OF_WEEK.map((day) => (
                  <Chip
                    key={day.value}
                    label={day.label}
                    color={savedData.closedDays.includes(day.value) ? "error" : "default"}
                    variant={savedData.closedDays.includes(day.value) ? "filled" : "outlined"}
                    size="medium"
                    sx={{ fontWeight: savedData.closedDays.includes(day.value) ? 600 : 400 }}
                  />
                ))}
                {savedData.closedDays.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No closed days configured.</Typography>
                )}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper: read-only row for view mode
const PolicyRow: React.FC<{ label: string; value: string; desc: string }> = ({ label, value, desc }) => (
  <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.25 }}>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
      <Typography variant="body1" fontWeight={700} color="text.primary">{value}</Typography>
    </Box>
    <Typography variant="caption" color="text.disabled">{desc}</Typography>
    <Divider sx={{ mt: 1 }} />
  </Box>
);

export default AdminPolicySettings;
