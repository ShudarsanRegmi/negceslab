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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Policy as PolicyIcon,
  Timer as TimerIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
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

type FieldKey = keyof PolicyData;

interface FieldConfig {
  label: string;
  key: FieldKey;
  description: string;
  type?: string;
  min?: number;
  max?: number;
  unit?: string;
  formatValue?: (policy: PolicyData) => string;
}

export const AdminPolicySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [savedData, setSavedData] = useState<PolicyData>(defaultPolicy);

  // Field editing states
  const [activeEditingField, setActiveEditingField] = useState<FieldKey | "operatingHours" | "closedDays" | null>(null);
  const [draftValue, setDraftValue] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    pendingAction: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    pendingAction: async () => {},
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
      }
    } catch (err: any) {
      console.error("Failed to load policy:", err);
      setError("Failed to fetch lab policy settings");
    } finally {
      setLoading(false);
    }
  };

  const startEditField = (field: FieldKey | "operatingHours" | "closedDays") => {
    setError(null);
    setSuccess(null);
    if (field === "operatingHours") {
      setDraftValue({
        labOpenHour: savedData.labOpenHour,
        labOpenMinute: savedData.labOpenMinute,
        labCloseHour: savedData.labCloseHour,
        labCloseMinute: savedData.labCloseMinute,
      });
    } else if (field === "closedDays") {
      setDraftValue([...savedData.closedDays]);
    } else {
      setDraftValue(savedData[field]);
    }
    setActiveEditingField(field);
  };

  const cancelEdit = () => {
    setActiveEditingField(null);
    setDraftValue(null);
  };

  const validateAndUpdatePolicy = async (updatedPolicy: PolicyData, changeSummary: string) => {
    // Validate tier ordering
    if (updatedPolicy.shortTierMaxDays >= updatedPolicy.mediumTierMaxDays) {
      setError(`Short tier upper limit (${updatedPolicy.shortTierMaxDays} days) must be strictly less than Medium tier upper limit (${updatedPolicy.mediumTierMaxDays} days).`);
      return;
    }
    if (updatedPolicy.mediumTierMaxDays >= updatedPolicy.maxBookingDays) {
      setError(`Medium tier upper limit (${updatedPolicy.mediumTierMaxDays} days) must be strictly less than Maximum booking duration (${updatedPolicy.maxBookingDays} days).`);
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Confirm Lab Policy Modification",
      description: `Policy changes affect all users across all lab systems immediately. Are you sure you want to update ${changeSummary}?`,
      pendingAction: async () => {
        try {
          setSaving(true);
          setError(null);
          setSuccess(null);
          await policyAPI.updatePolicy(updatedPolicy);
          setSavedData(updatedPolicy);
          setSuccess(`Successfully updated policy: ${changeSummary}. RAM policy cache updated.`);
          setActiveEditingField(null);
          setDraftValue(null);
        } catch (err: any) {
          console.error("Failed to save policy parameter:", err);
          setError(err.response?.data?.message || "Failed to update lab policy");
        } finally {
          setSaving(false);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleSaveSingleField = (fieldKey: FieldKey, label: string) => {
    const val = parseInt(draftValue, 10);
    if (isNaN(val) || val < 0) {
      setError(`Invalid numeric value for ${label}.`);
      return;
    }
    const updated = { ...savedData, [fieldKey]: val };
    validateAndUpdatePolicy(updated, `${label} to ${val}`);
  };

  const handleSaveOperatingHours = () => {
    const { labOpenHour, labOpenMinute, labCloseHour, labCloseMinute } = draftValue;
    const openH = parseInt(labOpenHour, 10);
    const openM = parseInt(labOpenMinute, 10);
    const closeH = parseInt(labCloseHour, 10);
    const closeM = parseInt(labCloseMinute, 10);

    if (openH < 0 || openH > 23 || openM < 0 || openM > 59 || closeH < 0 || closeH > 23 || closeM < 0 || closeM > 59) {
      setError("Please enter valid 24-hour open and close times.");
      return;
    }

    const updated = {
      ...savedData,
      labOpenHour: openH,
      labOpenMinute: openM,
      labCloseHour: closeH,
      labCloseMinute: closeM,
    };
    validateAndUpdatePolicy(updated, `Operating Hours (${pad(openH)}:${pad(openM)} - ${pad(closeH)}:${pad(closeM)})`);
  };

  const handleSaveClosedDays = () => {
    const updated = { ...savedData, closedDays: draftValue };
    const dayNames = draftValue.map((d: number) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label).filter(Boolean).join(", ");
    validateAndUpdatePolicy(updated, `Weekly Closed Days (${dayNames || "None"})`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const shortRangeStr = `1 to ${savedData.shortTierMaxDays} days`;
  const mediumRangeStr = `${savedData.shortTierMaxDays + 1} to ${savedData.mediumTierMaxDays} days`;
  const longRangeStr = `${savedData.mediumTierMaxDays + 1} to ${savedData.maxBookingDays} days`;

  return (
    <Box sx={{ maxWidth: 1050, mx: "auto", p: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PolicyIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Tiered Cool-Down &amp; Lab Booking Policy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Parameters must be edited individually with admin confirmation to prevent unintended rule changes.
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Tiered Cool-Down Policy Card */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, color: "primary.main" }}>
              <TimerIcon />
              <Typography variant="h6" fontWeight="bold">
                Tiered Booking Cool-Down Policy (3-Tier Scaling)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Cool-down periods dynamically scale with booking duration. Click the edit pencil on individual parameters to modify tier thresholds.
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

                  <SingleFieldEditor
                    label="Short Tier Max Days"
                    fieldKey="shortTierMaxDays"
                    currentValue={savedData.shortTierMaxDays}
                    unit="days"
                    activeEditingField={activeEditingField}
                    draftValue={draftValue}
                    setDraftValue={setDraftValue}
                    onStartEdit={() => startEditField("shortTierMaxDays")}
                    onCancel={cancelEdit}
                    onSave={() => handleSaveSingleField("shortTierMaxDays", "Short Tier Max Duration")}
                    saving={saving}
                  />
                </Paper>
              </Grid>

              {/* Tier 2: Medium Duration */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "action.hover", height: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Chip label="Tier 2: Medium Duration" color="warning" size="small" sx={{ fontWeight: 600 }} />
                    <Chip label={`${savedData.mediumTierCoolDownDays} Days Cool-Down`} variant="outlined" color="warning" size="small" />
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Range: {mediumRangeStr}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Standard reservations. Mandates a medium waiting period.
                  </Typography>

                  <Stack spacing={2}>
                    <SingleFieldEditor
                      label="Medium Tier Upper Limit"
                      fieldKey="mediumTierMaxDays"
                      currentValue={savedData.mediumTierMaxDays}
                      unit="days"
                      activeEditingField={activeEditingField}
                      draftValue={draftValue}
                      setDraftValue={setDraftValue}
                      onStartEdit={() => startEditField("mediumTierMaxDays")}
                      onCancel={cancelEdit}
                      onSave={() => handleSaveSingleField("mediumTierMaxDays", "Medium Tier Upper Limit")}
                      saving={saving}
                    />
                    <SingleFieldEditor
                      label="Medium Cool-Down Period"
                      fieldKey="mediumTierCoolDownDays"
                      currentValue={savedData.mediumTierCoolDownDays}
                      unit="days"
                      activeEditingField={activeEditingField}
                      draftValue={draftValue}
                      setDraftValue={setDraftValue}
                      onStartEdit={() => startEditField("mediumTierCoolDownDays")}
                      onCancel={cancelEdit}
                      onSave={() => handleSaveSingleField("mediumTierCoolDownDays", "Medium Cool-Down Days")}
                      saving={saving}
                    />
                  </Stack>
                </Paper>
              </Grid>

              {/* Tier 3: Long Duration */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "action.hover", height: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Chip label="Tier 3: Long Duration" color="error" size="small" sx={{ fontWeight: 600 }} />
                    <Chip label={`${savedData.longTierCoolDownDays} Days Cool-Down`} variant="outlined" color="error" size="small" />
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Range: {longRangeStr}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Extended intensive bookings. Mandates longest cool-down period.
                  </Typography>

                  <Stack spacing={2}>
                    <SingleFieldEditor
                      label="Max Booking Limit"
                      fieldKey="maxBookingDays"
                      currentValue={savedData.maxBookingDays}
                      unit="days"
                      activeEditingField={activeEditingField}
                      draftValue={draftValue}
                      setDraftValue={setDraftValue}
                      onStartEdit={() => startEditField("maxBookingDays")}
                      onCancel={cancelEdit}
                      onSave={() => handleSaveSingleField("maxBookingDays", "Maximum Booking Days")}
                      saving={saving}
                    />
                    <SingleFieldEditor
                      label="Long Cool-Down Period"
                      fieldKey="longTierCoolDownDays"
                      currentValue={savedData.longTierCoolDownDays}
                      unit="days"
                      activeEditingField={activeEditingField}
                      draftValue={draftValue}
                      setDraftValue={setDraftValue}
                      onStartEdit={() => startEditField("longTierCoolDownDays")}
                      onCancel={cancelEdit}
                      onSave={() => handleSaveSingleField("longTierCoolDownDays", "Long Cool-Down Days")}
                      saving={saving}
                    />
                  </Stack>
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
                Operating Hours &amp; Booking Constraints
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2.5}>
              {/* Operating Hours Section */}
              <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Lab Daily Operating Hours
                  </Typography>
                  {activeEditingField !== "operatingHours" && (
                    <Tooltip title="Edit Operating Hours" placement="top" disableInteractive>
                      <IconButton size="small" onClick={() => startEditField("operatingHours")} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {activeEditingField === "operatingHours" ? (
                  <Box sx={{ mt: 1 }}>
                    <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Open Hour (0-23)"
                          type="number"
                          value={draftValue.labOpenHour}
                          onChange={(e) => setDraftValue({ ...draftValue, labOpenHour: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Open Minute (0-59)"
                          type="number"
                          value={draftValue.labOpenMinute}
                          onChange={(e) => setDraftValue({ ...draftValue, labOpenMinute: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Close Hour (0-23)"
                          type="number"
                          value={draftValue.labCloseHour}
                          onChange={(e) => setDraftValue({ ...draftValue, labCloseHour: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Close Minute (0-59)"
                          type="number"
                          value={draftValue.labCloseMinute}
                          onChange={(e) => setDraftValue({ ...draftValue, labCloseMinute: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" color="inherit" onClick={cancelEdit} startIcon={<CloseIcon />}>
                        Cancel
                      </Button>
                      <Button size="small" variant="contained" onClick={handleSaveOperatingHours} startIcon={<CheckIcon />} disabled={saving}>
                        Save Hours
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    {pad(savedData.labOpenHour)}:{pad(savedData.labOpenMinute)} – {pad(savedData.labCloseHour)}:{pad(savedData.labCloseMinute)} (24h)
                  </Typography>
                )}
              </Box>

              {/* Advance Booking Window */}
              <SingleFieldEditor
                label="Advance Booking Window"
                fieldKey="maxBookingAheadDays"
                currentValue={savedData.maxBookingAheadDays}
                unit="days"
                activeEditingField={activeEditingField}
                draftValue={draftValue}
                setDraftValue={setDraftValue}
                onStartEdit={() => startEditField("maxBookingAheadDays")}
                onCancel={cancelEdit}
                onSave={() => handleSaveSingleField("maxBookingAheadDays", "Advance Booking Window")}
                saving={saving}
              />

              {/* Minimum Same-Day Duration */}
              <SingleFieldEditor
                label="Min Same-Day Duration"
                fieldKey="minBookingHours"
                currentValue={savedData.minBookingHours}
                unit="hours"
                activeEditingField={activeEditingField}
                draftValue={draftValue}
                setDraftValue={setDraftValue}
                onStartEdit={() => startEditField("minBookingHours")}
                onCancel={cancelEdit}
                onSave={() => handleSaveSingleField("minBookingHours", "Minimum Same-Day Duration")}
                saving={saving}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Closed Days Policy */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%", borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <CalendarIcon />
                <Typography variant="h6" fontWeight="bold">
                  Weekly Closed Days
                </Typography>
              </Box>
              {activeEditingField !== "closedDays" && (
                <Tooltip title="Edit Weekly Closed Days" placement="top" disableInteractive>
                  <IconButton size="small" onClick={() => startEditField("closedDays")} color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Days when the lab is closed and unavailable for reservations.
            </Typography>

            {activeEditingField === "closedDays" ? (
              <Box>
                <FormGroup row sx={{ mb: 2 }}>
                  {DAYS_OF_WEEK.map((day) => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={draftValue.includes(day.value)}
                          onChange={() => {
                            const updated = draftValue.includes(day.value)
                              ? draftValue.filter((d: number) => d !== day.value)
                              : [...draftValue, day.value];
                            setDraftValue(updated);
                          }}
                        />
                      }
                      label={day.label}
                      sx={{ minWidth: 130 }}
                    />
                  ))}
                </FormGroup>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" color="inherit" onClick={cancelEdit} startIcon={<CloseIcon />}>
                    Cancel
                  </Button>
                  <Button size="small" variant="contained" onClick={handleSaveClosedDays} startIcon={<CheckIcon />} disabled={saving}>
                    Save Closed Days
                  </Button>
                </Stack>
              </Box>
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

      {/* Confirmation Dialog before Applying Policy Edit */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "warning.main", fontWeight: 700 }}>
          <WarningIcon />
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="text.primary">
            {confirmDialog.description}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => confirmDialog.pendingAction()} variant="contained" color="warning" disabled={saving} autoFocus>
            {saving ? <CircularProgress size={20} color="inherit" /> : "Confirm Change"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface SingleFieldEditorProps {
  label: string;
  fieldKey: FieldKey;
  currentValue: number;
  unit: string;
  activeEditingField: string | null;
  draftValue: any;
  setDraftValue: (val: any) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}

const SingleFieldEditor: React.FC<SingleFieldEditorProps> = ({
  label,
  fieldKey,
  currentValue,
  unit,
  activeEditingField,
  draftValue,
  setDraftValue,
  onStartEdit,
  onCancel,
  onSave,
  saving,
}) => {
  const isEditing = activeEditingField === fieldKey;

  return (
    <Box sx={{ p: 1.5, bgcolor: "background.paper", borderRadius: 1.5, border: "1px solid #e2e8f0" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: isEditing ? 1 : 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
        {!isEditing && (
          <Tooltip title={`Edit ${label}`} placement="top" disableInteractive>
            <IconButton size="small" onClick={onStartEdit} color="primary" sx={{ p: 0.5 }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {isEditing ? (
        <Box>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" color="inherit" onClick={onCancel} startIcon={<CloseIcon />}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={onSave} startIcon={<CheckIcon />} disabled={saving}>
              Save
            </Button>
          </Stack>
        </Box>
      ) : (
        <Typography variant="h6" fontWeight={700} color="text.primary">
          {currentValue} <Typography component="span" variant="body2" color="text.secondary">{unit}</Typography>
        </Typography>
      )}
    </Box>
  );
};

export default AdminPolicySettings;

