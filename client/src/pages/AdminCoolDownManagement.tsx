import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Timer as TimerIcon,
  CheckCircle as WaiveIcon,
  History as HistoryIcon,
  Shield as ShieldIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { cooldownsAPI } from "../services/api";
import { format, parseISO } from "date-fns";

interface ActiveCoolDownUser {
  userId: string;
  userName: string;
  userEmail: string;
  tierName: string;
  lastBookingId: string;
  lastBookingEndDate: string;
  lastBookingDurationDays: number;
  coolDownDays: number;
  coolDownExpiryDate: string;
  eligibleDate: string;
}

interface CooldownWaiverLog {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  waivedByAdminId: string;
  waivedByAdminEmail: string;
  waivedByAdminName: string;
  reason: string;
  tierName: string;
  originalCoolDownExpiry: string;
  waivedAt: string;
}

export const AdminCoolDownManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeCoolDowns, setActiveCoolDowns] = useState<ActiveCoolDownUser[]>([]);
  const [waiverLogs, setWaiverLogs] = useState<CooldownWaiverLog[]>([]);

  // Waive Dialog State
  const [waiveDialogOpen, setWaiveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ActiveCoolDownUser | null>(null);
  const [waiveReason, setWaiveReason] = useState("");
  const [waiveLoading, setWaiveLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [activeRes, logsRes] = await Promise.all([
        cooldownsAPI.getActiveCoolDowns(),
        cooldownsAPI.getCoolDownLogs(),
      ]);
      setActiveCoolDowns(activeRes.data || []);
      setWaiverLogs(logsRes.data || []);
    } catch (err: any) {
      console.error("Failed to fetch cool-down data:", err);
      setError(err.response?.data?.message || "Failed to load cool-down management data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWaiveDialog = (user: ActiveCoolDownUser) => {
    setSelectedUser(user);
    setWaiveReason("");
    setDialogError(null);
    setWaiveDialogOpen(true);
  };

  const handleCloseWaiveDialog = () => {
    setWaiveDialogOpen(false);
    setSelectedUser(null);
    setWaiveReason("");
    setDialogError(null);
  };

  const handleConfirmWaive = async () => {
    if (!selectedUser || !waiveReason.trim()) {
      setDialogError("Mandatory justification reason is required.");
      return;
    }
    if (waiveReason.trim().length < 5) {
      setDialogError("Please provide a detailed reason (minimum 5 characters).");
      return;
    }

    try {
      setWaiveLoading(true);
      setDialogError(null);
      await cooldownsAPI.waiveCoolDown({
        targetUserId: selectedUser.userId,
        reason: waiveReason.trim(),
        tierName: selectedUser.tierName,
        lastBookingEndDate: selectedUser.lastBookingEndDate,
      });

      setSuccess(`Cool-down period successfully waived for ${selectedUser.userEmail}.`);
      handleCloseWaiveDialog();
      fetchData();
    } catch (err: any) {
      console.error("Error waiving cool-down:", err);
      setDialogError(err.response?.data?.message || "Failed to waive cool-down period.");
    } finally {
      setWaiveLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TimerIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Cool-Down Management &amp; Audit Logs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Audit active student cool-downs, grant administrative waivers with mandatory justification, and inspect historical waiver logs.
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <TimerIcon fontSize="small" />
                <span>Active Cool-Downs ({activeCoolDowns.length})</span>
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryIcon fontSize="small" />
                <span>Waiver Audit Logs ({waiverLogs.length})</span>
              </Stack>
            }
          />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* TAB 0: Active Cool-Downs */}
          {activeTab === 0 && (
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell fontWeight={700}>Student User</TableCell>
                    <TableCell fontWeight={700}>Cool-Down Tier</TableCell>
                    <TableCell fontWeight={700}>Last Booking Duration</TableCell>
                    <TableCell fontWeight={700}>Last Booking Ended</TableCell>
                    <TableCell fontWeight={700}>Cool-Down Expiry</TableCell>
                    <TableCell fontWeight={700}>Next Eligible Date</TableCell>
                    <TableCell align="right" fontWeight={700}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeCoolDowns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">
                          No users are currently in an active cool-down period.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeCoolDowns.map((user) => (
                      <TableRow key={user.userId} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>{user.userName}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.userEmail}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={user.tierName} color="warning" size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>{user.lastBookingDurationDays} Days</TableCell>
                        <TableCell>{user.lastBookingEndDate}</TableCell>
                        <TableCell>{user.coolDownExpiryDate}</TableCell>
                        <TableCell>
                          <Chip label={user.eligibleDate} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            startIcon={<WaiveIcon />}
                            onClick={() => handleOpenWaiveDialog(user)}
                            sx={{ fontWeight: 600 }}
                          >
                            Waive Cool-Down
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* TAB 1: Waiver Audit Logs */}
          {activeTab === 1 && (
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell fontWeight={700}>Date &amp; Time</TableCell>
                    <TableCell fontWeight={700}>Target Student</TableCell>
                    <TableCell fontWeight={700}>Waived By Admin</TableCell>
                    <TableCell fontWeight={700}>Tier Category</TableCell>
                    <TableCell fontWeight={700}>Mandatory Reason / Justification</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {waiverLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">
                          No cool-down waivers have been recorded yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    waiverLogs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {format(parseISO(log.waivedAt), "yyyy-MM-dd HH:mm")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>{log.userName}</Typography>
                          <Typography variant="caption" color="text.secondary">{log.userEmail}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>{log.waivedByAdminName}</Typography>
                          <Typography variant="caption" color="text.secondary">{log.waivedByAdminEmail}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={log.tierName || "Waived"} color="secondary" variant="outlined" size="small" />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 320 }}>
                          <Typography variant="body2" color="text.primary">
                            {log.reason}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Waive Modal Dialog */}
      <Dialog open={waiveDialogOpen} onClose={handleCloseWaiveDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Remove Cool-Down Period for Student
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="warning" icon={<ShieldIcon />} sx={{ mb: 3 }}>
                You are waiving the mandatory cool-down period for <strong>{selectedUser.userName} ({selectedUser.userEmail})</strong>.
                This will immediately unlock their ability to place new system booking requests.
              </Alert>

              {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mandatory Reason for Waiving Cool-Down *"
                placeholder="e.g. Approved by Head of Dept for urgent research project extension."
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                helperText="Required for administrative audit log."
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseWaiveDialog} color="inherit" disabled={waiveLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmWaive}
            variant="contained"
            color="warning"
            startIcon={waiveLoading ? <CircularProgress size={18} color="inherit" /> : <WaiveIcon />}
            disabled={waiveLoading}
          >
            {waiveLoading ? "Waiving..." : "Confirm & Waive Cool-Down"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCoolDownManagement;
