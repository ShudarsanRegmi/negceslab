import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AdminPanelSettings,
  Logout,
  PersonAdd,
  Refresh,
  Search,
  Shield,
  SupervisorAccount,
  Timer,
  VerifiedUser,
  Block,
} from "@mui/icons-material";
import { superadminAPI } from "../services/api";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

interface Stats {
  userCount: number;
  adminCount: number;
  totalCount: number;
}

const SESSION_KEY = "negces_superadmin_session";

const SuperAdmin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const sessionRemaining = useMemo(() => {
    if (!expiresAt) return 0;
    return Math.max(0, new Date(expiresAt).getTime() - now);
  }, [expiresAt, now]);

  const sessionMinutes = Math.floor(sessionRemaining / 60000);
  const sessionSeconds = Math.floor((sessionRemaining % 60000) / 1000);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed.token && parsed.expiresAt && new Date(parsed.expiresAt).getTime() > Date.now()) {
        setToken(parsed.token);
        setExpiresAt(parsed.expiresAt);
        setEmail(parsed.email || "");
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token || !expiresAt) return;
    if (new Date(expiresAt).getTime() <= Date.now()) {
      clearSession("Superadmin session expired. Please login again.");
      return;
    }
    loadDashboard(token);
  }, [token, expiresAt]);

  const showError = (value: unknown, fallback: string) => {
    const apiError = value as { response?: { data?: { message?: string } } };
    setError(apiError.response?.data?.message || fallback);
    setMessage(null);
  };

  const clearSession = (notice?: string) => {
    setToken(null);
    setExpiresAt(null);
    setStats(null);
    setAdmins([]);
    setSearchResults([]);
    localStorage.removeItem(SESSION_KEY);
    if (notice) setMessage(notice);
  };

  const handleRequestOtp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await superadminAPI.requestOtp(email);
      setOtpSent(true);
      setMessage("OTP sent. Check the configured superadmin email inbox.");
    } catch (err) {
      showError(err, "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await superadminAPI.verifyOtp(email, otp);
      const session = {
        token: response.data.token,
        email: response.data.email,
        expiresAt: response.data.expiresAt,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setToken(session.token);
      setExpiresAt(session.expiresAt);
      setOtp("");
      setOtpSent(false);
      setMessage("Superadmin session started for 15 minutes.");
    } catch (err) {
      showError(err, "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (sessionToken = token) => {
    if (!sessionToken) return;
    setDashboardLoading(true);
    setError(null);
    try {
      const [statsRes, adminsRes] = await Promise.all([
        superadminAPI.getStats(sessionToken),
        superadminAPI.getAdmins(sessionToken),
      ]);
      setStats(statsRes.data);
      setAdmins(adminsRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearSession("Superadmin session expired. Please login again.");
      } else {
        showError(err, "Failed to load superadmin dashboard");
      }
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!token) return;
    setDashboardLoading(true);
    setError(null);
    try {
      const response = await superadminAPI.searchUsers(token, searchEmail);
      setSearchResults(response.data);
    } catch (err) {
      showError(err, "Failed to search users");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleMakeAdmin = async (targetEmail: string) => {
    if (!token) return;
    setDashboardLoading(true);
    setError(null);
    try {
      await superadminAPI.makeAdmin(token, targetEmail);
      setMessage(`${targetEmail} is now an admin.`);
      setSearchEmail("");
      setSearchResults([]);
      await loadDashboard(token);
    } catch (err) {
      showError(err, "Failed to make user admin");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleRevokeAdmin = async (adminUser: AdminUser) => {
    if (!token) return;
    setDashboardLoading(true);
    setError(null);
    try {
      await superadminAPI.revokeAdmin(token, adminUser._id);
      setMessage(`Admin access revoked for ${adminUser.email}.`);
      await loadDashboard(token);
    } catch (err) {
      showError(err, "Failed to revoke admin access");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await superadminAPI.logout(token);
      } catch {
        // Expired sessions are cleared locally either way.
      }
    }
    clearSession("Logged out of superadmin.");
  };

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <Shield sx={{ fontSize: 56, color: "primary.main", mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>
              Superadmin
            </Typography>
            <Typography color="text.secondary">
              OTP-only access for configured superadmin emails
            </Typography>
          </Box>

          {(message || error) && (
            <Alert severity={error ? "error" : "success"}>
              {error || message}
            </Alert>
          )}

          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="Superadmin email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                />
                {otpSent && (
                  <TextField
                    label="OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputProps={{ inputMode: "numeric", maxLength: 6 }}
                    fullWidth
                  />
                )}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={otpSent ? <VerifiedUser /> : <Timer />}
                    disabled={loading || !email || (otpSent && otp.length !== 6)}
                    onClick={otpSent ? handleVerifyOtp : handleRequestOtp}
                    fullWidth
                  >
                    {loading ? "Working..." : otpSent ? "Verify OTP" : "Send OTP"}
                  </Button>
                  {otpSent && (
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      disabled={loading || !email}
                      onClick={handleRequestOtp}
                      fullWidth
                    >
                      Resend
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Superadmin Dashboard
            </Typography>
            <Typography color="text.secondary">
              Manage admin access and monitor user totals
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<Timer />}
              label={`${sessionMinutes}m ${sessionSeconds}s left`}
              color={sessionRemaining < 3 * 60 * 1000 ? "warning" : "primary"}
              variant="outlined"
            />
            <Tooltip title="Refresh dashboard">
              <IconButton onClick={() => loadDashboard()} disabled={dashboardLoading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton onClick={handleLogout}>
                <Logout />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {(message || error) && (
          <Alert severity={error ? "error" : "success"} onClose={() => { setError(null); setMessage(null); }}>
            {error || message}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <SupervisorAccount color="primary" />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats?.userCount ?? "-"}
                    </Typography>
                    <Typography color="text.secondary">Normal users</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <AdminPanelSettings color="primary" />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats?.adminCount ?? "-"}
                    </Typography>
                    <Typography color="text.secondary">Admins</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Shield color="primary" />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats?.totalCount ?? "-"}
                    </Typography>
                    <Typography color="text.secondary">Total accounts</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Make Admin
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField
                  label="Search registered user by email"
                  value={searchEmail}
                  onChange={(event) => setSearchEmail(event.target.value)}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  disabled={dashboardLoading || searchEmail.trim().length < 3}
                  sx={{ minWidth: 130 }}
                >
                  Search
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => handleMakeAdmin(searchEmail)}
                  disabled={dashboardLoading || !searchEmail.trim()}
                  sx={{ minWidth: 150 }}
                >
                  Make Admin
                </Button>
              </Stack>

              {searchResults.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip label={user.role} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              startIcon={<PersonAdd />}
                              disabled={user.role === "admin" || dashboardLoading}
                              onClick={() => handleMakeAdmin(user.email)}
                            >
                              Make Admin
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={700}>
                  Current Admins
                </Typography>
                {dashboardLoading && <CircularProgress size={22} />}
              </Stack>
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Access</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin._id}>
                        <TableCell>{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Button
                            color="error"
                            variant="outlined"
                            size="small"
                            startIcon={<Block />}
                            disabled={dashboardLoading}
                            onClick={() => handleRevokeAdmin(admin)}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {admins.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography color="text.secondary" textAlign="center" py={3}>
                            No admins found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default SuperAdmin;
