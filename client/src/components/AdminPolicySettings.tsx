import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  Tooltip,
} from "@mui/material";
import {
  Policy as PolicyIcon,
  Save as SaveIcon,
  Timer as TimerIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Shield as ShieldIcon,
  Speed as SpeedIcon,
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
  shortTierMaxDays: number;
  mediumTierMaxDays: number;
  mediumTierCoolDownDays: number;
  longTierCoolDownDays: number;
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
  shortTierMaxDays: 5,
  mediumTierMaxDays: 10,
  mediumTierCoolDownDays: 5,
  longTierCoolDownDays: 10,
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
          shortTierMaxDays: res.data.shortTierMaxDays ?? 5,
          mediumTierMaxDays: res.data.mediumTierMaxDays ?? 10,
          mediumTierCoolDownDays: res.data.mediumTierCoolDownDays ?? 5,
          longTierCoolDownDays: res.data.longTierCoolDownDays ?? 10,
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

      // Validate tier order
      if (formData.shortTierMaxDays >= formData.mediumTierMaxDays) {
        setError(`Short tier max (${formData.shortTierMaxDays}d) must be strictly less than Medium tier max (${formData.mediumTierMaxDays}d).`);
        setSaving(false);
        return;
      }
      if (formData.mediumTierMaxDays >= formData.maxBookingDays) {
        setError(`Medium tier max (${formData.mediumTierMaxDays}d) must be strictly less than Max booking duration (${formData.maxBookingDays}d).`);
        setSaving(false);
        return;
      }

      await policyAPI.updatePolicy(formData);
      setSavedData(formData);
      setSuccess("Tiered lab booking policy updated successfully! RAM cache refreshed.");
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

  const activeData = editing ? formData : savedData;
  const shortRangeStr = `1 to ${activeData.shortTierMaxDays} days`;
  const mediumRangeStr = `${activeData.shortTierMaxDays + 1} to ${activeData.mediumTierMaxDays} days`;
  const longRangeStr = `${activeData.mediumTierMaxDays + 1} to ${activeData.maxBookingDays} days`;

  return (
    <Box component={editing ? "form" : "div"} onSubmit={editing ? handleSubmit : undefined} sx={{ maxWidth: 1050, mx: "auto", p: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PolicyIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Tiered Cool-Down &amp; Lab Booking Policy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure dynamic duration-based cool-down tiers, operating hours, and booking constraints.
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
        {/* Tiered Cool-Down Policy Card */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
              <TimerIcon />
              <Typography variant="h6" fontWeight="bold">
                Tiered Booking Cool-Down Policy (3-Tier Scaling)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Cool-down periods dynamically scale with booking duration. Shorter bookings incur zero penalty, while longer reservations require mandatory waiting windows before making any new booking.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2.5}>
              {/* Tier 1: Short Duration */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "action.hover", height: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Chip label="Tier 1: Short Duration" color="success" size="small" sx={{ fontWeight: 600 }} />
                    <Chip label="0 Days Cool-Down" variant="outlined" color="success" size="small" />
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Range: {shortRangeStr}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Quick usage bookings. No cool-down period is enforced.
                  </Typography>

                  {editing ? (
                    <TextField
                      fullWidth
                      size="small"
                      label="Short Tier Upper Max (Days)"
                      name="shortTierMaxDays"
                      type="number"
                      value={formData.shortTierMaxDays}
                      onChange={handleTextChange}
                      inputProps={{ min: 1, max: formData.mediumTierMaxDays - 1 }}
                      helperText={`Bookings ≤ ${formData.shortTierMaxDays}d get 0 cool-down days.`}
                    />
                  ) : (
                    <Box sx={{ p: 1.5, bgcolor: "background.paper", borderRadius: 1, border: "1px dashed rgba(0,0,0,0.12)" }}>
                      <Typography variant="body2" color="text.secondary">Cool-Down Period:</Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">0 Days (None)</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Tier 2: Medium Duration */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "action.hover", height: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Chip label="Tier 2: Medium Duration" color="warning" size="small" sx={{ fontWeight: 600 }} />
                    <Chip label={`${activeData.mediumTierCoolDownDays} Days Cool-Down`} variant="outlined" color="warning" size="small" />
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Range: {mediumRangeStr}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Standard reservations. Mandates a medium waiting period.
                  </Typography>

                  {editing ? (
                    <Stack spacing={1.5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Medium Tier Upper Max (Days)"
                        name="mediumTierMaxDays"
                        type="number"
                        value={formData.mediumTierMaxDays}
                        onChange={handleTextChange}
                        inputProps={{ min: formData.shortTierMaxDays + 1, max: formData.maxBookingDays - 1 }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Medium Cool-Down (Days)"
                        name="mediumTierCoolDownDays"
                        type="number"
                        value={formData.mediumTierCoolDownDays}
                        onChange={handleTextChange}
                        inputProps={{ min: 1, max: 30 }}
                      />
                    </Stack>
                  ) : (
                    <Box sx={{ p: 1.5, bgcolor: "background.paper", borderRadius: 1, border: "1px dashed rgba(0,0,0,0.12)" }}>
                      <Typography variant="body2" color="text.secondary">Cool-Down Period:</Typography>
                      <Typography variant="h6" fontWeight={700} color="warning.main">{savedData.mediumTierCoolDownDays} Days</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Tier 3: Long Duration */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "action.hover", height: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Chip label="Tier 3: Long Duration" color="error" size="small" sx={{ fontWeight: 600 }} />
                    <Chip label={`${activeData.longTierCoolDownDays} Days Cool-Down`} variant="outlined" color="error" size="small" />
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Range: {longRangeStr}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Extended intensive bookings. Mandates longest cool-down period.
                  </Typography>

                  {editing ? (
                    <Stack spacing={1.5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Max Allowed Booking (Days)"
                        name="maxBookingDays"
                        type="number"
                        value={formData.maxBookingDays}
                        onChange={handleTextChange}
                        inputProps={{ min: formData.mediumTierMaxDays + 1, max: 180 }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Long Cool-Down (Days)"
                        name="longTierCoolDownDays"
                        type="number"
                        value={formData.longTierCoolDownDays}
                        onChange={handleTextChange}
                        inputProps={{ min: formData.mediumTierCoolDownDays, max: 90 }}
                      />
                    </Stack>
                  ) : (
                    <Box sx={{ p: 1.5, bgcolor: "background.paper", borderRadius: 1, border: "1px dashed rgba(0,0,0,0.12)" }}>
                      <Typography variant="body2" color="text.secondary">Cool-Down Period:</Typography>
                      <Typography variant="h6" fontWeight={700} color="error.main">{savedData.longTierCoolDownDays} Days</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Operating Hours & Rules */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
              <AccessTimeIcon />
              <Typography variant="h6" fontWeight="bold">
                Operating Hours &amp; Booking Window
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
                  label="Advance Booking Window (Days)"
                  name="maxBookingAheadDays"
                  type="number"
                  value={formData.maxBookingAheadDays}
                  onChange={handleTextChange}
                  helperText="How far in advance users can place bookings."
                  inputProps={{ min: 1, max: 365 }}
                  sx={{ mb: 3 }}
                />
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
                <PolicyRow label="Lab Opens" value={`${pad(savedData.labOpenHour)}:${pad(savedData.labOpenMinute)}`} desc="Daily lab opening time (24-hour format)." />
                <PolicyRow label="Lab Closes" value={`${pad(savedData.labCloseHour)}:${pad(savedData.labCloseMinute)}`} desc="Daily lab closing time (24-hour format)." />
                <PolicyRow label="Advance Window" value={`${savedData.maxBookingAheadDays} days`} desc="How far ahead users can book." />
                <PolicyRow label="Min Same-Day Duration" value={`${savedData.minBookingHours} hour${savedData.minBookingHours !== 1 ? "s" : ""}`} desc="Minimum hours required for same-day bookings." />
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Closed Days Policy */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
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
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
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
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

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
