import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  Alert,
} from "@mui/material";
import {
  Computer as ComputerIcon,
  DesktopWindows as DesktopWindowsIcon,
  Terminal as TerminalIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Thermostat as TempIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  LocalFireDepartment as FireIcon,
  History as HistoryIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import api, { computersAPI, bookingsAPI } from "../services/api";
import SystemTelemetryAnalyticsModal from "../components/SystemTelemetryAnalyticsModal";
import { AdminAttendanceExplorerModal } from "../components/AdminAttendanceExplorerModal";

interface LiveMetrics {
  cpuUtil: number;
  ramUtil: number;
  gpuUtil: number;
  gpuMemUsed: number;
  gpuMemTotal: number;
  cpuTemp: number;
  gpuTemp: number;
  netSentSpeed: number;
  netRecvSpeed: number;
}

interface AgentActiveSession {
  checkedIn: boolean;
  currentUser?: string;
  email?: string;
  agenda?: string;
  sessionType?: string;
  checkInTime?: string;
  activeBookingId?: string;
  lastSession?: {
    currentUser?: string;
    email?: string;
    agenda?: string;
    sessionType?: string;
    checkInTime?: string;
    checkOutTime?: string;
    totalCheckInsToday?: number;
  };
}

interface SystemDetails {
  operatingSystem?: string;
  architecture?: string;
  hostname?: string;
  ipAddress?: string;
}

interface Computer {
  _id: string;
  name: string;
  location: string;
  status: "available" | "maintenance" | "reserved";
  specifications: string;
  isOnline?: boolean;
  lastSeen?: string;
  liveMetrics?: LiveMetrics;
  agentActiveSession?: AgentActiveSession;
  systemDetails?: SystemDetails;
  bookings?: any[];
}

const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getMetricColor = (val: number): "success" | "warning" | "error" => {
  if (val >= 85) return "error";
  if (val >= 65) return "warning";
  return "success";
};

const AdminSystemMonitoring: React.FC = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [osFilter, setOsFilter] = useState<string>("ALL");

  // Selected computer modal inspector
  const [selectedComp, setSelectedComp] = useState<Computer | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Dedicated Attendance Explorer modal state
  const [attendanceExplorerOpen, setAttendanceExplorerOpen] = useState(false);

  // Table pagination for inspector attendance log
  const [attendancePage, setAttendancePage] = useState(0);
  const [attendanceRowsPerPage, setAttendanceRowsPerPage] = useState(5);

  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling for live telemetry
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, bookRes, logsRes] = await Promise.all([
        computersAPI.getComputersWithBookings(),
        bookingsAPI.getAllBookings(),
        api.get('/attendance/logs?limit=300').catch(() => ({ data: { data: [] } }))
      ]);

      const compList: Computer[] = Array.isArray(compRes.data) ? compRes.data : [];
      const bookList: any[] = Array.isArray(bookRes.data) ? bookRes.data : [];
      const logsList: any[] = Array.isArray(logsRes.data?.data) ? logsRes.data.data : [];

      setComputers(compList);
      setBookings(bookList);
      setAttendanceLogs(logsList);

      // Update inspector reference if open
      if (selectedComp) {
        const updated = compList.find((c) => c._id === selectedComp._id);
        if (updated) setSelectedComp(updated);
      }
      setError(null);
    } catch (err: any) {
      console.error("Failed to load monitoring data:", err);
      setError("Failed to connect to backend telemetry feed.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date as local YYYY-MM-DD string
  const getLocalDateStr = (d: any) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());

  // Extract combined attendance history for selected computer (TODAY ONLY)
  const selectedComputerAttendanceHistory = React.useMemo(() => {
    if (!selectedComp) return [];
    const list: any[] = [];

    // 1. Logs from AttendanceLog collection for this computer for TODAY
    attendanceLogs.forEach((log: any) => {
      const cId = log.computerId?._id || log.computerId;
      if (String(cId) === String(selectedComp._id) && log.checkInTime) {
        const logDateStr = getLocalDateStr(log.checkInTime);
        if (logDateStr === todayStr) {
          list.push({
            id: log._id || log.sessionId,
            date: logDateStr,
            user: log.studentName || "Unknown",
            email: log.studentEmail || "-",
            agenda: log.agenda || "General Usage",
            sessionType: log.sessionType || (log.entryType === "RESERVED_BOOKING" ? "Scheduled Lab Booking" : "Walk-In"),
            checkInTime: log.checkInTime,
            checkOutTime: log.checkOutTime,
            sessionStatus: log.sessionStatus || "COMPLETED",
            entryType: log.entryType,
            slotConflict: log.slotConflict
          });
        }
      }
    });

    // 2. Legacy attendanceHistory from bookings for TODAY (deduplicated by checkInTime/user)
    const compBookings = bookings.filter(
      (b) => String(b.computerId?._id || b.computerId) === String(selectedComp._id)
    );

    compBookings.forEach((b) => {
      if (Array.isArray(b.attendanceHistory)) {
        b.attendanceHistory.forEach((h: any) => {
          const hDate = h.date || getLocalDateStr(h.checkInTime);
          if (hDate === todayStr) {
            const exists = list.some(existing => 
              existing.email === (h.email || b.user?.email) && 
              Math.abs(new Date(existing.checkInTime).getTime() - new Date(h.checkInTime).getTime()) < 60000
            );
            if (!exists) {
              list.push({
                id: h._id || Math.random().toString(),
                date: hDate,
                user: h.currentUser || b.user?.name || b.userInfo?.name || "Unknown",
                email: h.email || b.user?.email || b.userInfo?.email || "-",
                agenda: h.agenda || b.reason || "General Usage",
                sessionType: h.sessionType || "Scheduled Lab Booking",
                checkInTime: h.checkInTime,
                checkOutTime: h.checkOutTime,
                sessionStatus: h.checkOutTime ? "COMPLETED" : "ACTIVE",
                entryType: "RESERVED_BOOKING",
                slotConflict: false
              });
            }
          }
        });
      }
    });

    // Sort newest check-in first
    return list.sort((a, b) => new Date(b.checkInTime || 0).getTime() - new Date(a.checkInTime || 0).getTime());
  }, [selectedComp, bookings, attendanceLogs, todayStr]);

  // Filtered Computers
  const filteredComputers = computers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.systemDetails?.hostname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.agentActiveSession?.currentUser || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ONLINE"
        ? c.isOnline
        : statusFilter === "OFFLINE"
        ? !c.isOnline
        : statusFilter === "CHECKED_IN"
        ? c.agentActiveSession?.checkedIn
        : true;

    const matchesOS =
      osFilter === "ALL"
        ? true
        : (c.systemDetails?.operatingSystem || "").toLowerCase() === osFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesOS;
  });

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom>
            System Monitoring & Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time compute cluster hardware telemetry, booted OS inspection, and live student attendance tracking.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<HistoryIcon />}
            onClick={() => setAttendanceExplorerOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)"
            }}
          >
            Attendance Logs Explorer
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {loading ? "Polling Telemetry..." : "Refresh Status"}
          </Button>
        </Box>
      </Box>

      {/* Summary KPI Badges */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              TOTAL SYSTEMS
            </Typography>
            <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ mt: 0.5 }}>
              {computers.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#f0fdf4" }}>
            <Typography variant="caption" color="success.main" fontWeight={700}>
              ONLINE & ACTIVE
            </Typography>
            <Typography variant="h4" fontWeight={800} color="#15803d" sx={{ mt: 0.5 }}>
              {computers.filter((c) => c.isOnline).length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#eff6ff" }}>
            <Typography variant="caption" color="primary" fontWeight={700}>
              ACTIVE ATTENDANCE
            </Typography>
            <Typography variant="h4" fontWeight={800} color="#1d4ed8" sx={{ mt: 0.5 }}>
              {computers.filter((c) => c.agentActiveSession?.checkedIn).length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#fef2f2" }}>
            <Typography variant="caption" color="error.main" fontWeight={700}>
              OFFLINE / DISCONNECTED
            </Typography>
            <Typography variant="h4" fontWeight={800} color="#b91c1c" sx={{ mt: 0.5 }}>
              {computers.filter((c) => !c.isOnline).length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Controls Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Computer Name, Location, Hostname, or Active User..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select value={statusFilter} label="Status Filter" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="ALL">All Telemetry States</MenuItem>
                <MenuItem value="ONLINE">Online Systems Only</MenuItem>
                <MenuItem value="OFFLINE">Offline Systems Only</MenuItem>
                <MenuItem value="CHECKED_IN">Active Check-ins Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>OS Filter</InputLabel>
              <Select value={osFilter} label="OS Filter" onChange={(e) => setOsFilter(e.target.value)}>
                <MenuItem value="ALL">All OS Environments</MenuItem>
                <MenuItem value="Windows">Windows Systems</MenuItem>
                <MenuItem value="Linux">Linux Systems</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Monitoring Grid */}
      <Grid container spacing={3} sx={{ justifyContent: "center" }}>
        {filteredComputers.map((computer) => {
          const live = computer.liveMetrics;
          const session = computer.agentActiveSession;
          const os = computer.systemDetails?.operatingSystem;

          // Stress condition check: CPU >= 85% OR GPU >= 85% OR Temp >= 80°C
          const isUnderStress = computer.isOnline && live && (
            live.cpuUtil >= 85 || live.gpuUtil >= 85 || live.cpuTemp >= 80 || live.gpuTemp >= 80
          );

          const isCheckedIn = session && session.checkedIn;

          return (
            <Grid item xs={12} sm={6} md={4} key={computer._id} sx={{ display: "flex", justifyContent: "center" }}>
              <Card
                sx={{
                  width: "100%",
                  maxWidth: 380,
                  borderRadius: 3,
                  position: "relative",
                  bgcolor: "#ffffff",
                  border: isUnderStress
                    ? "2px solid #ef4444"
                    : isCheckedIn
                    ? "2px solid #10b981"
                    : "1px solid #e2e8f0",
                  boxShadow: isUnderStress
                    ? "0 0 20px rgba(239, 68, 68, 0.25)"
                    : isCheckedIn
                    ? "0 0 16px rgba(16, 185, 129, 0.18)"
                    : "0 4px 12px rgba(0,0,0,0.03)",
                  animation: isUnderStress ? "stressPulse 2s infinite ease-in-out" : "none",
                  "@keyframes stressPulse": {
                    "0%": { transform: "scale(1)", boxShadow: "0 0 10px rgba(239, 68, 68, 0.2)" },
                    "50%": { transform: "scale(1.02)", boxShadow: "0 0 24px rgba(239, 68, 68, 0.45)" },
                    "100%": { transform: "scale(1)", boxShadow: "0 0 10px rgba(239, 68, 68, 0.2)" },
                  },
                  transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: isUnderStress ? "none" : "translateY(-3px)",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
                  },
                }}
                onClick={() => setSelectedComp(computer)}
              >
                {/* Stress Top Banner */}
                {isUnderStress && (
                  <Box
                    sx={{
                      bgcolor: "#ef4444",
                      color: "#ffffff",
                      px: 1.5,
                      py: 0.25,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                    }}
                  >
                    <FireIcon sx={{ fontSize: "0.85rem", animation: "spin 1s infinite linear" }} />
                    <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: 0.5, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      System Under Heavy Stress
                    </Typography>
                  </Box>
                )}

                <CardContent sx={{ p: 2.5 }}>
                  {/* Card Header: Computer Name & Online/OS Status */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ComputerIcon sx={{ color: computer.isOnline ? "#10b981" : "#ef4444", fontSize: 30 }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} color="#0f172a" lineHeight={1.2}>
                          {computer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {computer.location}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                      {/* Red Offline Status Chip */}
                      <Chip
                        icon={computer.isOnline ? <OnlineIcon sx={{ fontSize: "0.8rem !important" }} /> : <OfflineIcon sx={{ fontSize: "0.8rem !important", color: "#fff !important" }} />}
                        label={computer.isOnline ? "Online" : "Offline"}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          backgroundColor: computer.isOnline ? "#10b981" : "#ef4444",
                          color: "#ffffff",
                        }}
                      />

                      {/* OS Badge with Formal Icon */}
                      {computer.isOnline && os && (
                        <Chip
                          icon={
                            os === "Windows" ? (
                              <DesktopWindowsIcon sx={{ fontSize: "0.75rem !important" }} />
                            ) : os === "Linux" ? (
                              <TerminalIcon sx={{ fontSize: "0.75rem !important" }} />
                            ) : (
                              <ComputerIcon sx={{ fontSize: "0.75rem !important" }} />
                            )
                          }
                          label={os}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            backgroundColor: os === "Windows" ? "rgba(25, 118, 210, 0.08)" : "rgba(76, 175, 80, 0.08)",
                            color: os === "Windows" ? "#1976d2" : "#2e7d32",
                            border: "1px solid",
                            borderColor: os === "Windows" ? "rgba(25, 118, 210, 0.2)" : "rgba(76, 175, 80, 0.2)",
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Live Metrics utilization grid */}
                  {computer.isOnline && live ? (
                    <Box sx={{ mb: 2 }}>
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", display: "block" }}>
                            CPU
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color={live.cpuUtil >= 85 ? "error.main" : "#0f172a"}>
                            {Math.round(live.cpuUtil)}%
                          </Typography>
                          <LinearProgress variant="determinate" value={live.cpuUtil} color={getMetricColor(live.cpuUtil)} sx={{ height: 4, borderRadius: 2 }} />
                        </Grid>

                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", display: "block" }}>
                            RAM
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color={live.ramUtil >= 85 ? "error.main" : "#0f172a"}>
                            {Math.round(live.ramUtil)}%
                          </Typography>
                          <LinearProgress variant="determinate" value={live.ramUtil} color={getMetricColor(live.ramUtil)} sx={{ height: 4, borderRadius: 2 }} />
                        </Grid>

                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", display: "block" }}>
                            GPU
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color={live.gpuUtil >= 85 ? "error.main" : "#0f172a"}>
                            {Math.round(live.gpuUtil)}%
                          </Typography>
                          <LinearProgress variant="determinate" value={live.gpuUtil} color={getMetricColor(live.gpuUtil)} sx={{ height: 4, borderRadius: 2 }} />
                        </Grid>
                      </Grid>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                          Net: ↑ {formatBytes(live.netSentSpeed)}/s ↓ {formatBytes(live.netRecvSpeed)}/s
                        </Typography>
                        {live.cpuTemp > 0 && (
                          <Typography variant="caption" color={live.cpuTemp >= 80 ? "error.main" : "text.secondary"} fontWeight={live.cpuTemp >= 80 ? 800 : 400} sx={{ fontSize: "0.65rem" }}>
                            Temp: {Math.round(live.cpuTemp)}°C
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ py: 2, textAlign: "center", bgcolor: "#fef2f2", borderRadius: 2, mb: 2, border: "1px dashed #fca5a5" }}>
                      <Typography variant="caption" color="error.main" fontWeight={700}>
                        System offline / Unreachable
                      </Typography>
                    </Box>
                  )}

                  {/* Attendance Section */}
                  {session && session.checkedIn ? (
                    <Paper sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #86efac" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                          <Typography variant="caption" fontWeight={800} color="#15803d">
                            {session.currentUser}
                          </Typography>
                        </Box>
                        <Chip label={session.sessionType || "Live"} size="small" color="success" sx={{ height: 16, fontSize: "0.55rem", fontWeight: 800 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", wordBreak: "break-word", whiteSpace: "normal", maxHeight: 60, overflowY: "auto" }}>
                        <strong>Agenda:</strong> {session.agenda}
                      </Typography>
                    </Paper>
                  ) : session?.lastSession?.currentUser ? (
                    <Paper sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f0f9ff", border: "1px solid #93c5fd" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CheckIcon sx={{ fontSize: 16, color: "#2563eb" }} />
                          <Typography variant="caption" fontWeight={800} color="#1e40af">
                            {session.lastSession.currentUser}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${session.lastSession.totalCheckInsToday || 1} Submitted (Ended)`}
                          size="small"
                          color="info"
                          sx={{ height: 16, fontSize: "0.55rem", fontWeight: 800 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", wordBreak: "break-word", whiteSpace: "normal", maxHeight: 60, overflowY: "auto" }}>
                        <strong>Agenda:</strong> {session.lastSession.agenda || "Research"}
                      </Typography>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fafc", border: "1px dashed #cbd5e1", textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        Idle (No check-ins submitted today)
                      </Typography>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Inspector Modal Dialog */}
      {selectedComp && (
        <Dialog open={Boolean(selectedComp)} onClose={() => setSelectedComp(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ComputerIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {selectedComp.name} Inspector
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedComp.location} • {selectedComp.systemDetails?.hostname || "No hostname"}
                  </Typography>
                </Box>
              </Box>

              {selectedComp.systemDetails?.operatingSystem && (
                <Chip
                  icon={
                    selectedComp.systemDetails.operatingSystem === "Windows" ? (
                      <DesktopWindowsIcon sx={{ fontSize: "0.85rem !important" }} />
                    ) : selectedComp.systemDetails.operatingSystem === "Linux" ? (
                      <TerminalIcon sx={{ fontSize: "0.85rem !important" }} />
                    ) : (
                      <ComputerIcon sx={{ fontSize: "0.85rem !important" }} />
                    )
                  }
                  label={selectedComp.systemDetails.operatingSystem}
                  color={selectedComp.systemDetails.operatingSystem === "Windows" ? "primary" : "success"}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>
          </DialogTitle>

          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* Active Attendance Session */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom color="#0f172a">
                  Active Attendance Check-in
                </Typography>
                <Paper sx={{ p: 2, mb: 3, bgcolor: selectedComp.agentActiveSession?.checkedIn ? "#f0fdf4" : "#f8fafc", border: "1px solid", borderColor: selectedComp.agentActiveSession?.checkedIn ? "#bbf7d0" : "#e2e8f0", borderRadius: 2 }}>
                  {selectedComp.agentActiveSession?.checkedIn ? (
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" fontWeight={800} color="#15803d">
                          👤 {selectedComp.agentActiveSession.currentUser}
                        </Typography>
                        <Chip label={selectedComp.agentActiveSession.sessionType} size="small" color="success" />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Email: {selectedComp.agentActiveSession.email}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, wordBreak: "break-word", whiteSpace: "normal", maxHeight: 100, overflowY: "auto" }}>
                        <strong>Agenda Purpose:</strong> {selectedComp.agentActiveSession.agenda}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Check-in Time: {selectedComp.agentActiveSession.checkInTime ? new Date(selectedComp.agentActiveSession.checkInTime).toLocaleString() : "N/A"}
                      </Typography>
                    </Box>
                  ) : selectedComp.agentActiveSession?.lastSession?.currentUser ? (
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" fontWeight={800} color="#1e40af">
                          👤 {selectedComp.agentActiveSession.lastSession.currentUser}
                        </Typography>
                        <Chip
                          label={`${selectedComp.agentActiveSession.lastSession.totalCheckInsToday || 1} Check-in(s) Submitted (Ended)`}
                          size="small"
                          color="info"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Email: {selectedComp.agentActiveSession.lastSession.email}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, wordBreak: "break-word", whiteSpace: "normal", maxHeight: 100, overflowY: "auto" }}>
                        <strong>Last Agenda:</strong> {selectedComp.agentActiveSession.lastSession.agenda}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Check-in: {selectedComp.agentActiveSession.lastSession.checkInTime ? new Date(selectedComp.agentActiveSession.lastSession.checkInTime).toLocaleString() : "N/A"}
                        {selectedComp.agentActiveSession.lastSession.checkOutTime && ` • Check-out: ${new Date(selectedComp.agentActiveSession.lastSession.checkOutTime).toLocaleTimeString()}`}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Computer is currently idle with no attendance check-in submitted today.
                    </Typography>
                  )}
                </Paper>

                <Typography variant="subtitle2" fontWeight={800} gutterBottom color="#0f172a">
                  System Specifications
                </Typography>
                <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                  <Typography variant="body2"><strong>Hardware Specs:</strong> {selectedComp.specifications}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}><strong>IP Address:</strong> {selectedComp.systemDetails?.ipAddress || "N/A"}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Last Seen:</strong> {selectedComp.lastSeen ? new Date(selectedComp.lastSeen).toLocaleString() : "Never"}</Typography>
                </Paper>
              </Grid>

              {/* Live Telemetry Resource Load */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom color="#0f172a">
                  Real-time Telemetry Load
                </Typography>
                {selectedComp.isOnline && selectedComp.liveMetrics ? (
                  <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>CPU Core Load</Typography>
                        <Typography variant="body2" fontWeight={700}>{Math.round(selectedComp.liveMetrics.cpuUtil)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={selectedComp.liveMetrics.cpuUtil} color={getMetricColor(selectedComp.liveMetrics.cpuUtil)} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>RAM Occupied</Typography>
                        <Typography variant="body2" fontWeight={700}>{Math.round(selectedComp.liveMetrics.ramUtil)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={selectedComp.liveMetrics.ramUtil} color={getMetricColor(selectedComp.liveMetrics.ramUtil)} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>GPU Core Load</Typography>
                        <Typography variant="body2" fontWeight={700}>{Math.round(selectedComp.liveMetrics.gpuUtil)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={selectedComp.liveMetrics.gpuUtil} color={getMetricColor(selectedComp.liveMetrics.gpuUtil)} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>

                    {selectedComp.liveMetrics.gpuMemTotal > 0 && (
                      <Typography variant="body2">
                        <strong>VRAM Memory:</strong> {Math.round(selectedComp.liveMetrics.gpuMemUsed)} / {Math.round(selectedComp.liveMetrics.gpuMemTotal)} MB
                      </Typography>
                    )}

                    <Box sx={{ display: "flex", gap: 3, mt: 1.5 }}>
                      <Typography variant="caption"><strong>CPU Temp:</strong> {selectedComp.liveMetrics.cpuTemp}°C</Typography>
                      <Typography variant="caption"><strong>GPU Temp:</strong> {selectedComp.liveMetrics.gpuTemp}°C</Typography>
                    </Box>
                  </Paper>
                ) : (
                  <Paper sx={{ p: 2, borderRadius: 2, border: "1px dashed #cbd5e1", textAlign: "center", bgcolor: "#f8fafc" }}>
                    <Typography variant="body2" color="text.secondary">
                      No live telemetry packet feed. System is offline.
                    </Typography>
                  </Paper>
                )}
              </Grid>

              {/* Browseable Historical Attendance Log */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom color="#0f172a">
                  Today's Attendance Logs ({selectedComputerAttendanceHistory.length} Sessions)
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Student User</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Agenda Purpose</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Session Type</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Check-in</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Check-out</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedComputerAttendanceHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                            No attendance check-ins logged for this computer today.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedComputerAttendanceHistory
                          .slice(attendancePage * attendanceRowsPerPage, attendancePage * attendanceRowsPerPage + attendanceRowsPerPage)
                          .map((hist, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{hist.date}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700}>{hist.user}</Typography>
                                <Typography variant="caption" color="text.secondary">{hist.email}</Typography>
                              </TableCell>
                              <TableCell>{hist.agenda}</TableCell>
                              <TableCell>
                                <Chip label={hist.sessionType} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.6rem" }} />
                              </TableCell>
                              <TableCell>
                                {hist.checkInTime ? new Date(hist.checkInTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "-"}
                              </TableCell>
                              <TableCell>
                                {hist.checkOutTime ? (
                                  new Date(hist.checkOutTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                                ) : (
                                  <Chip label="No Check-out" size="small" color="warning" sx={{ height: 16, fontSize: "0.55rem" }} />
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {selectedComputerAttendanceHistory.length > 0 && (
                  <TablePagination
                    component="div"
                    count={selectedComputerAttendanceHistory.length}
                    page={attendancePage}
                    onPageChange={(_, p) => setAttendancePage(p)}
                    rowsPerPage={attendanceRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setAttendanceRowsPerPage(parseInt(e.target.value, 10));
                      setAttendancePage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                )}
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<BarChartIcon />}
              onClick={() => setHistoryModalOpen(true)}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Analyze Historical Telemetry
            </Button>
            <Button onClick={() => setSelectedComp(null)} sx={{ textTransform: "none", fontWeight: 700 }}>
              Close Inspector
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Historical Telemetry Modal */}
      {selectedComp && (
        <SystemTelemetryAnalyticsModal
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          computerId={selectedComp._id}
          computerName={selectedComp.name}
          bookings={selectedComp.bookings || []}
        />
      )}

      {/* Attendance Logs Explorer Modal */}
      <AdminAttendanceExplorerModal
        open={attendanceExplorerOpen}
        onClose={() => setAttendanceExplorerOpen(false)}
      />
    </Box>
  );
};

export default AdminSystemMonitoring;
