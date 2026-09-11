import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  X,
  Search,
  Filter,
  Download,
  Clock,
  Laptop,
  User,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Ban,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

interface AttendanceLog {
  _id: string;
  sessionId: string;
  computerId: string;
  computer?: {
    name: string;
    location: string;
  };
  studentName: string;
  studentEmail: string;
  agenda: string;
  sessionType: string;
  entryType: 'RESERVED_BOOKING' | 'WALK_IN' | 'ADMIN_OVERRIDE';
  osType: 'windows' | 'linux' | 'darwin' | 'unknown';
  osHostname: string;
  macAddress: string;
  hardwareUuid: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes: number;
  sessionStatus: 'ACTIVE' | 'COMPLETED' | 'AUTO_CLOSED_REBOOT' | 'ADMIN_TERMINATED';
  slotConflict?: boolean;
  segments?: Array<{
    checkIn: string;
    checkOut?: string;
    osType: string;
    reason: string;
  }>;
}

interface AdminAttendanceExplorerModalProps {
  open: boolean;
  onClose: () => void;
}

export const AdminAttendanceExplorerModal: React.FC<AdminAttendanceExplorerModalProps> = ({
  open,
  onClose
}) => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [entryType, setEntryType] = useState('ALL');
  const [osType, setOsType] = useState('ALL');
  const [sessionStatus, setSessionStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal for multi-segment logs
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);

  const fetchAttendanceLogs = async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        entryType,
        osType,
        sessionStatus
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/attendance/logs', { params });
      if (res.data && res.data.success) {
        setLogs(res.data.data || []);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch attendance logs:', err);
      setError(err.response?.data?.message || 'Failed to load historical attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceLogs();
  }, [open, page, rowsPerPage, entryType, osType, sessionStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchAttendanceLogs();
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to force terminate this active attendance session?')) return;
    try {
      await api.post(`/attendance/admin-terminate/${sessionId}`);
      fetchAttendanceLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to terminate session');
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Session ID', 'Date/Time', 'Student Name', 'Email', 'Computer', 'Entry Type', 'OS', 'Duration (min)', 'Status'];
    const rows = logs.map(l => [
      l.sessionId,
      new Date(l.checkInTime).toLocaleString(),
      `"${l.studentName}"`,
      l.studentEmail,
      l.computer?.name || 'Unknown',
      l.entryType,
      l.osType,
      l.durationMinutes,
      l.sessionStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NegcesLab_Attendance_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <Clock size={22} color="#38bdf8" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#f8fafc" sx={{ lineHeight: 1.2 }}>
              Historical Attendance Explorer & Analytics
            </Typography>
            <Typography variant="caption" color="#94a3b8">
              Audit student check-ins, walk-ins, accidental re-entries, and cross-OS session handovers
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' } }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* Filter Bar */}
      <Box sx={{ p: 2.5, background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search student, email, computer, agenda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              }}
              sx={{ minWidth: 260, flexGrow: 1 }}
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Entry Type</InputLabel>
              <Select value={entryType} label="Entry Type" onChange={(e) => setEntryType(e.target.value)}>
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="RESERVED_BOOKING">Reserved Booking</MenuItem>
                <MenuItem value="WALK_IN">Walk-In Usage</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>OS</InputLabel>
              <Select value={osType} label="OS" onChange={(e) => setOsType(e.target.value)}>
                <MenuItem value="ALL">All OS</MenuItem>
                <MenuItem value="windows">Windows</MenuItem>
                <MenuItem value="linux">Linux / Ubuntu</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={sessionStatus} label="Status" onChange={(e) => setSessionStatus(e.target.value)}>
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active Session</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="AUTO_CLOSED_REBOOT">Reboot Auto-closed</MenuItem>
                <MenuItem value="ADMIN_TERMINATED">Admin Terminated</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 140 }}
            />

            <TextField
              size="small"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 140 }}
            />

            <Button
              variant="contained"
              type="submit"
              size="small"
              startIcon={<Filter size={16} />}
              sx={{ background: '#0f172a', fontWeight: 700, textTransform: 'none', height: 40 }}
            >
              Filter
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={exportToCSV}
              startIcon={<Download size={16} />}
              sx={{ fontWeight: 700, textTransform: 'none', height: 40, borderColor: '#cbd5e1', color: '#334155' }}
            >
              Export CSV
            </Button>
          </Box>
        </form>
      </Box>

      {/* Main Logs Table */}
      <DialogContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer sx={{ flexGrow: 1, maxHeight: '55vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ background: '#f1f5f9', fontWeight: 800 }}>Check-in Date & Time</TableCell>
                <TableCell sx={{ background: '#f1f5f9', fontWeight: 800 }}>Student Name & Email</TableCell>
                <TableCell sx={{ background: '#f1f5f9', fontWeight: 800 }}>Computer</TableCell>
                <TableCell sx={{ background: '#f1f5f9', fontWeight: 800 }}>Entry Type</TableCell>
                <TableCell sx={{ background: '#f1f5f9', fontWeight: 800 }}>OS & Segments</TableCell>
                <TableCell sx={{ background: '#f1f5f9', fontWeight: 800 }}>Duration</TableCell>
                <TableCell sx={{ background: '#f1f5f9', fontWeight: 800 }}>Session Status</TableCell>
                <TableCell sx={{ background: '#f1f5f9', fontWeight: 800, textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading attendance records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      No attendance logs match the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">
                        {new Date(log.checkInTime).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">
                        {log.studentName}
                      </Typography>
                      <Typography variant="caption" color="#2563eb">
                        {log.studentEmail}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {log.computer?.name || 'Computer'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={log.entryType === 'RESERVED_BOOKING' ? 'Reserved' : 'Walk-In'}
                        size="small"
                        color={log.entryType === 'RESERVED_BOOKING' ? 'primary' : 'default'}
                        variant={log.entryType === 'RESERVED_BOOKING' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                      />
                      {log.slotConflict && (
                        <Tooltip title="Walk-in usage occurred during another student's reserved slot">
                          <Chip label="Conflict" size="small" color="error" sx={{ ml: 0.5, fontSize: '0.65rem', height: 18 }} />
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={log.osType.toUpperCase()}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            background: log.osType === 'windows' ? '#e0f2fe' : '#fef3c7',
                            color: log.osType === 'windows' ? '#0369a1' : '#b45309'
                          }}
                        />
                        {log.segments && log.segments.length > 1 && (
                          <Chip
                            label={`${log.segments.length} segs`}
                            size="small"
                            onClick={() => setSelectedLog(log)}
                            sx={{ fontSize: '0.65rem', cursor: 'pointer', background: '#e2e8f0' }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {log.sessionStatus === 'ACTIVE'
                          ? 'In Progress'
                          : `${log.durationMinutes} min`}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={log.sessionStatus}
                        size="small"
                        color={
                          log.sessionStatus === 'ACTIVE'
                            ? 'success'
                            : log.sessionStatus === 'COMPLETED'
                            ? 'default'
                            : 'warning'
                        }
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="View Session Details & Segments">
                          <IconButton size="small" onClick={() => setSelectedLog(log)}>
                            <Layers size={16} color="#3b82f6" />
                          </IconButton>
                        </Tooltip>
                        {log.sessionStatus === 'ACTIVE' && (
                          <Tooltip title="Force Terminate Active Session">
                            <IconButton size="small" onClick={() => handleTerminateSession(log.sessionId)}>
                              <Ban size={16} color="#ef4444" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </DialogContent>

      {/* Segment & Session Details Sub-Dialog */}
      {selectedLog && (
        <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              Attendance Session Timeline
            </Typography>
            <IconButton onClick={() => setSelectedLog(null)}>
              <X size={18} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Student: <strong>{selectedLog.studentName}</strong> ({selectedLog.studentEmail})
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Computer: <strong>{selectedLog.computer?.name}</strong> | Session ID: <code>{selectedLog.sessionId}</code>
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Hardware BIOS UUID: <code>{selectedLog.hardwareUuid || 'N/A'}</code>
              </Typography>
            </Box>

            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Session Segments & OS Switch Trail ({selectedLog.segments?.length || 0})
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(selectedLog.segments || []).map((seg, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1.5, background: '#f8fafc', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={`Segment ${idx + 1}: ${seg.reason}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    <Chip label={seg.osType.toUpperCase()} size="small" variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Check-in: {new Date(seg.checkIn).toLocaleString()}
                  </Typography>
                  {seg.checkOut && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Check-out: {new Date(seg.checkOut).toLocaleString()}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedLog(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
};
