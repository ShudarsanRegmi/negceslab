import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { agentRegistrationAPI } from '../services/api';

const AdminAgentRegistration: React.FC = () => {
  const [registrationToken, setRegistrationToken] = useState<{ token: string; expiresAt: string; minutesRemaining: number } | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tokenRes, requestsRes] = await Promise.all([
        agentRegistrationAPI.getRegistrationToken(),
        agentRegistrationAPI.getRegistrationRequests()
      ]);
      setRegistrationToken(tokenRes.data);
      setRequests(requestsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching registration data:', err);
      setError('Failed to load agent registration details');
    } finally {
      setLoading(false);
    }
  };

  const handleRotateToken = async () => {
    try {
      setTokenLoading(true);
      const response = await agentRegistrationAPI.rotateRegistrationToken();
      setRegistrationToken(response.data);
      setSuccessMessage('Installation token rotated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error rotating token:', err);
      setError('Failed to rotate registration token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      await agentRegistrationAPI.handleRequestAction(requestId, action);
      const requestsRes = await agentRegistrationAPI.getRegistrationRequests();
      setRequests(requestsRes.data);
      setSuccessMessage(`Registration request ${action === 'approve' ? 'approved' : 'declined'} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error executing action:', err);
      setError('Failed to update registration request');
    } finally {
      setActionLoading(false);
    }
  };

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={800}>
            Agent Registration Manager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Securely authorize and monitor hardware agent installations
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
          size="small"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Token Section */}
        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
            Secure Installation Ingress Key
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use this active key in terminal installers on Linux or Windows. Rotates automatically every 30 minutes.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2.5 }}>
            {tokenLoading || loading ? (
              <Skeleton width={180} height={40} />
            ) : (
              <Box
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  bgcolor: '#f1f5f9',
                  p: '8px 16px',
                  borderRadius: 1.5,
                  border: '1px solid #cbd5e1',
                  color: '#0f172a'
                }}
              >
                {registrationToken?.token || "NO_ACTIVE_TOKEN"}
              </Box>
            )}

            <Button
              variant="outlined"
              color="primary"
              onClick={handleRotateToken}
              disabled={tokenLoading || loading}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Rotate Token Now
            </Button>

            {!tokenLoading && !loading && registrationToken && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Active for: {registrationToken.minutesRemaining} mins (Expires: {new Date(registrationToken.expiresAt).toLocaleTimeString()})
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Requests Section */}
        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
            Pending Machine Approvals ({requests.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review hardware specifications submitted by registering agents before formal token allocation.
          </Typography>

          {actionLoading || loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : requests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
              <Typography variant="body2" color="text.secondary">
                No pending registration approval requests.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>System / Hostname</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Operating System</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>CPU Processor</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>RAM Total</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Disk Storage</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Graphics Card</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req._id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {req.systemId?.name || req.hostname}
                        {req.systemId && (
                          <Chip size="small" label="Assigned" color="primary" sx={{ fontSize: '0.65rem', height: 16, ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{req.os}</Typography>
                        <Typography variant="caption" color="text.secondary">{req.osVersion}</Typography>
                      </TableCell>
                      <TableCell>{req.cpuModel || "N/A"}</TableCell>
                      <TableCell>
                        {req.ram ? `${Math.round(parseInt(req.ram) / (1024*1024*1024))} GB` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {req.storage ? `${Math.round(parseInt(req.storage) / (1024*1024*1024))} GB` : "N/A"}
                      </TableCell>
                      <TableCell>{req.gpu || "N/A"}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAction(req._id, 'approve')}
                            sx={{ textTransform: 'none', fontWeight: 700, p: '2px 8px', fontSize: '0.75rem' }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleAction(req._id, 'reject')}
                            sx={{ textTransform: 'none', fontWeight: 700, p: '2px 8px', fontSize: '0.75rem' }}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminAgentRegistration;
