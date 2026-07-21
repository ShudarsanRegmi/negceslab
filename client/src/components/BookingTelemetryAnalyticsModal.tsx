import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  AssignmentTurnedIn as AuditIcon,
  TableChart as TableIcon,
  Download as DownloadIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  DeveloperBoard as GpuIcon,
  Thermostat as TempIcon,
  WifiTethering as NetworkIcon,
  ShowChart as ChartIcon,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface MetricRecord {
  timestamp: string;
  cpuUtil: number;
  ramUtil: number;
  gpuUtil: number;
  gpuMemUsed: number;
  gpuMemTotal: number;
  netSentSpeed: number;
  netRecvSpeed: number;
  diskUtil: number;
  cpuTemp: number;
  gpuTemp: number;
}

interface AttendanceRecord {
  date: string;
  currentUser?: string;
  email?: string;
  agenda?: string;
  sessionType?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

interface BookingTelemetryAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  bookingName: string;
  userName: string;
  computerId: string;
  startDate: string;
  endDate: string;
  metrics: MetricRecord[];
  attendanceHistory?: AttendanceRecord[];
}

const BookingTelemetryAnalyticsModal: React.FC<BookingTelemetryAnalyticsModalProps> = ({
  open,
  onClose,
  bookingName,
  userName,
  startDate,
  endDate,
  metrics,
  attendanceHistory = [],
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Compute Statistical Summary (Averages, Peaks, Totals)
  const analyticsSummary = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        avgCpu: 0,
        maxCpu: 0,
        minCpu: 0,
        avgRam: 0,
        maxRam: 0,
        avgGpu: 0,
        maxGpu: 0,
        maxVram: 0,
        vramTotal: 0,
        avgNetSent: 0,
        avgNetRecv: 0,
        totalNetMB: 0,
        maxCpuTemp: 0,
        maxGpuTemp: 0,
        workloadType: "Idle / Unused",
      };
    }

    let sumCpu = 0, maxCpu = 0, minCpu = Infinity;
    let sumRam = 0, maxRam = 0;
    let sumGpu = 0, maxGpu = 0, maxVram = 0, vramTotal = 0;
    let sumNetSent = 0, sumNetRecv = 0, totalNetBytes = 0;
    let maxCpuTemp = 0, maxGpuTemp = 0;

    metrics.forEach((m) => {
      sumCpu += m.cpuUtil || 0;
      if (m.cpuUtil > maxCpu) maxCpu = m.cpuUtil;
      if (m.cpuUtil < minCpu) minCpu = m.cpuUtil;

      sumRam += m.ramUtil || 0;
      if (m.ramUtil > maxRam) maxRam = m.ramUtil;

      sumGpu += m.gpuUtil || 0;
      if (m.gpuUtil > maxGpu) maxGpu = m.gpuUtil;
      if (m.gpuMemUsed > maxVram) maxVram = m.gpuMemUsed;
      if (m.gpuMemTotal > vramTotal) vramTotal = m.gpuMemTotal;

      sumNetSent += m.netSentSpeed || 0;
      sumNetRecv += m.netRecvSpeed || 0;
      totalNetBytes += (m.netSentSpeed || 0) * 10 + (m.netRecvSpeed || 0) * 10;

      if (m.cpuTemp > maxCpuTemp) maxCpuTemp = m.cpuTemp;
      if (m.gpuTemp > maxGpuTemp) maxGpuTemp = m.gpuTemp;
    });

    const count = metrics.length;
    const avgCpu = Math.round((sumCpu / count) * 10) / 10;
    const avgRam = Math.round((sumRam / count) * 10) / 10;
    const avgGpu = Math.round((sumGpu / count) * 10) / 10;

    let workloadType = "Standard Workload";
    if (avgGpu > 50 || maxVram > 2000) workloadType = "Heavy AI / GPU Computation";
    else if (avgCpu > 60) workloadType = "High CPU Compute Task";
    else if (avgCpu < 10 && avgGpu < 5) workloadType = "Light / Idle Activity";

    return {
      avgCpu,
      maxCpu: Math.round(maxCpu * 10) / 10,
      minCpu: minCpu === Infinity ? 0 : Math.round(minCpu * 10) / 10,
      avgRam,
      maxRam: Math.round(maxRam * 10) / 10,
      avgGpu,
      maxGpu: Math.round(maxGpu * 10) / 10,
      maxVram: Math.round(maxVram),
      vramTotal: Math.round(vramTotal),
      avgNetSent: Math.round(sumNetSent / count),
      avgNetRecv: Math.round(sumNetRecv / count),
      totalNetMB: Math.round((totalNetBytes / (1024 * 1024)) * 10) / 10,
      maxCpuTemp: Math.round(maxCpuTemp),
      maxGpuTemp: Math.round(maxGpuTemp),
      workloadType,
    };
  }, [metrics]);

  // Formatted chart time series data
  const chartData = useMemo(() => {
    return metrics.map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      date: new Date(m.timestamp).toLocaleDateString(),
      "CPU Load (%)": Math.round(m.cpuUtil),
      "RAM Load (%)": Math.round(m.ramUtil),
      "GPU Load (%)": Math.round(m.gpuUtil),
      "VRAM (MB)": Math.round(m.gpuMemUsed),
      "Net In (KB/s)": Math.round((m.netRecvSpeed || 0) / 1024),
      "Net Out (KB/s)": Math.round((m.netSentSpeed || 0) / 1024),
    }));
  }, [metrics]);

  const exportCSV = () => {
    if (!metrics || metrics.length === 0) return;
    const headers = [
      "Timestamp",
      "CPU Util (%)",
      "RAM Util (%)",
      "GPU Util (%)",
      "VRAM Used (MB)",
      "VRAM Total (MB)",
      "Net Sent (B/s)",
      "Net Recv (B/s)",
      "Disk Util (%)",
      "CPU Temp (C)",
      "GPU Temp (C)",
    ];

    const rows = metrics.map((m) => [
      `"${new Date(m.timestamp).toLocaleString()}"`,
      m.cpuUtil,
      m.ramUtil,
      m.gpuUtil,
      m.gpuMemUsed,
      m.gpuMemTotal,
      m.netSentSpeed,
      m.netRecvSpeed,
      m.diskUtil,
      m.cpuTemp,
      m.gpuTemp,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `telemetry_export_${bookingName.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatNetSpeed = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          bgcolor: "#0f172a",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
            Telemetry & Usage Analytics Explorer
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Booking: {bookingName} | Assigned User: {userName} | Slot: {startDate} to {endDate}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#94a3b8", "&:hover": { color: "#ffffff" } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc", px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            "& .MuiTab-root": {
              fontWeight: 700,
              textTransform: "none",
              minHeight: 48,
            },
          }}
        >
          <Tab icon={<ChartIcon />} iconPosition="start" label="Interactive Charts & Time-Series" />
          <Tab icon={<AssessmentIcon />} iconPosition="start" label="Statistical Aggregates" />
          <Tab icon={<AuditIcon />} iconPosition="start" label="Session Audit Log" />
          <Tab icon={<TableIcon />} iconPosition="start" label="Raw Telemetry Data" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: "#f1f5f9", minHeight: 480 }}>
        {/* TAB 0: INTERACTIVE CHARTS & TIME-SERIES */}
        {activeTab === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Chart 1: CPU, RAM, GPU Utilization */}
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 2 }}>
                Compute Core Utilization % Timeline (CPU / RAM / GPU)
              </Typography>
              {chartData.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No telemetry metrics logged for this date range yet.
                </Typography>
              ) : (
                <Box sx={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="CPU Load (%)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                      <Area type="monotone" dataKey="RAM Load (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorRam)" />
                      <Area type="monotone" dataKey="GPU Load (%)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorGpu)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>

            {/* Chart 2: Network Throughput Speed */}
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 2 }}>
                Network Throughput Speed (Ingress & Egress KB/s)
              </Typography>
              {chartData.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No network metrics logged for this date range yet.
                </Typography>
              ) : (
                <Box sx={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNetIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNetOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit=" KB/s" />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="Net In (KB/s)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorNetIn)" />
                      <Area type="monotone" dataKey="Net Out (KB/s)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorNetOut)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* TAB 1: STATISTICAL AGGREGATES */}
        {activeTab === 1 && (
          <Box>
            <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: "none", border: "1px solid #cbd5e1" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                      COMPUTE WORKLOAD PROFILE
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
                      {analyticsSummary.workloadType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Aggregated metrics recorded across {metrics.length} telemetry polling points.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: { md: "right" } }}>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={exportCSV}
                      sx={{ bgcolor: "#0f172a", textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                    >
                      Export Telemetry CSV
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#3b82f6", mb: 1 }}>
                    <SpeedIcon />
                    <Typography variant="subtitle2" fontWeight={800} color="#334155">
                      CPU UTILIZATION
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={800} color="#0f172a">
                    {analyticsSummary.avgCpu}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Min: {analyticsSummary.minCpu}% | Peak: {analyticsSummary.maxCpu}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsSummary.avgCpu}
                    sx={{ height: 6, borderRadius: 3, mt: 1, bgcolor: "#dbeafe" }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#10b981", mb: 1 }}>
                    <MemoryIcon />
                    <Typography variant="subtitle2" fontWeight={800} color="#334155">
                      RAM MEMORY LOAD
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={800} color="#0f172a">
                    {analyticsSummary.avgRam}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Peak Memory Load: {analyticsSummary.maxRam}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsSummary.avgRam}
                    color="success"
                    sx={{ height: 6, borderRadius: 3, mt: 1 }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#8b5cf6", mb: 1 }}>
                    <GpuIcon />
                    <Typography variant="subtitle2" fontWeight={800} color="#334155">
                      GPU COMPUTE & VRAM
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={800} color="#0f172a">
                    {analyticsSummary.avgGpu}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Peak VRAM: {analyticsSummary.maxVram} MB / {analyticsSummary.vramTotal || "N/A"} MB
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsSummary.avgGpu}
                    sx={{ height: 6, borderRadius: 3, mt: 1, bgcolor: "#f3e8ff", "& .MuiLinearProgress-bar": { bgcolor: "#8b5cf6" } }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#f59e0b", mb: 1 }}>
                    <NetworkIcon />
                    <Typography variant="subtitle2" fontWeight={800} color="#334155">
                      NETWORK TRAFFIC
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={800} color="#0f172a">
                    {analyticsSummary.totalNetMB} MB
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Avg In: {formatNetSpeed(analyticsSummary.avgNetRecv)} | Out: {formatNetSpeed(analyticsSummary.avgNetSent)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (analyticsSummary.totalNetMB / 500) * 100)}
                    sx={{ height: 6, borderRadius: 3, mt: 1, bgcolor: "#fef3c7", "& .MuiLinearProgress-bar": { bgcolor: "#f59e0b" } }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Thermal & System Health Metrics */}
            <Paper sx={{ p: 2.5, mt: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <TempIcon color="error" /> Thermal & Health Diagnostics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #cbd5e1" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      MAXIMUM CPU PACKAGE TEMP
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color={analyticsSummary.maxCpuTemp > 80 ? "error.main" : "#0f172a"}>
                      {analyticsSummary.maxCpuTemp > 0 ? `${analyticsSummary.maxCpuTemp} °C` : "Normal Operating Range"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #cbd5e1" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      MAXIMUM GPU DIE TEMP
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color={analyticsSummary.maxGpuTemp > 80 ? "error.main" : "#0f172a"}>
                      {analyticsSummary.maxGpuTemp > 0 ? `${analyticsSummary.maxGpuTemp} °C` : "Normal Operating Range"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* TAB 2: SESSION & ATTENDANCE AUDIT LOG */}
        {activeTab === 2 && (
          <Box>
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
              <Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ mb: 2 }}>
                Attendance Check-In & Session Audit Logs
              </Typography>

              {attendanceHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No check-in session events recorded for this booking slot.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Student / User</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Session Type</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Agenda</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Check-In Time</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Check-Out Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceHistory.map((att, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{att.date}</TableCell>
                          <TableCell>{att.currentUser || userName}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={att.sessionType || "GUI"}
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontStyle: att.agenda ? "normal" : "italic" }}>
                            {att.agenda || "General Workload"}
                          </TableCell>
                          <TableCell sx={{ color: "#10b981", fontWeight: 700 }}>
                            {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString() : "-"}
                          </TableCell>
                          <TableCell sx={{ color: "#64748b" }}>
                            {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : "Active / Session Ended"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Box>
        )}

        {/* TAB 3: RAW DATA TABLE */}
        {activeTab === 3 && (
          <Box>
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#334155">
                  Raw InfluxDB Time-Series Record Ingestion Table
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={exportCSV}
                  sx={{ fontWeight: 700, textTransform: "none" }}
                >
                  Download CSV
                </Button>
              </Box>

              <TableContainer sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "#ffffff" }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "#ffffff" }}>CPU %</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "#ffffff" }}>RAM %</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "#ffffff" }}>GPU %</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "#ffffff" }}>VRAM (MB)</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "#ffffff" }}>Net Sent</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: "#0f172a", color: "#ffffff" }}>Net Recv</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.map((m, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {new Date(m.timestamp).toISOString()}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{Math.round(m.cpuUtil)}%</TableCell>
                        <TableCell>{Math.round(m.ramUtil)}%</TableCell>
                        <TableCell>{Math.round(m.gpuUtil)}%</TableCell>
                        <TableCell>{Math.round(m.gpuMemUsed)} MB</TableCell>
                        <TableCell>{formatNetSpeed(m.netSentSpeed)}</TableCell>
                        <TableCell>{formatNetSpeed(m.netRecvSpeed)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: "#0f172a", fontWeight: 700, textTransform: "none", borderRadius: 2 }}>
          Close Analytics Explorer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingTelemetryAnalyticsModal;
