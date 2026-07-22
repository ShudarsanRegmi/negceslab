import React, { useState, useMemo, useEffect } from "react";
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
  FormControlLabel,
  Checkbox,
  FormGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
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
  CalendarToday as CalendarIcon,
  GridOn as GridIcon,
  CompareArrows as CompareIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { computersAPI } from "../services/api";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

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

interface SystemTelemetryAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  computerId: string;
  computerName: string;
  bookings: any[]; // booking history populated with user info
}

const SystemTelemetryAnalyticsModal: React.FC<SystemTelemetryAnalyticsModalProps> = ({
  open,
  onClose,
  computerId,
  computerName,
  bookings = [],
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Time Range States
  const [rangeOption, setRangeOption] = useState<string>("7"); // "7" | "14" | "30" | "custom"
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { startDate, endDate } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (rangeOption === "7") {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { startDate: start, endDate: today };
    }
    if (rangeOption === "14") {
      const start = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { startDate: start, endDate: today };
    }
    if (rangeOption === "30") {
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { startDate: start, endDate: today };
    }
    return { startDate: customStartDate, endDate: customEndDate };
  }, [rangeOption, customStartDate, customEndDate]);

  // Telemetry Fetch States
  const [metrics, setMetrics] = useState<MetricRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open && computerId) {
      setLoading(true);
      computersAPI.getComputerHistoryByRange(computerId, startDate, endDate)
        .then((res) => {
          setMetrics(res.data || []);
        })
        .catch((err) => {
          console.error("Failed to load computer metrics history:", err);
          setMetrics([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open, computerId, startDate, endDate]);

  // Exploratory Controls
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("ALL");
  const [showCpu, setShowCpu] = useState<boolean>(true);
  const [showRam, setShowRam] = useState<boolean>(true);
  const [showGpu, setShowGpu] = useState<boolean>(true);
  const [heatmapMetric, setHeatmapMetric] = useState<"cpu" | "ram" | "gpu" | "vram">("cpu");

  // Dates inside chosen range
  const fullDates = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const list: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      list.push(d.toISOString().split("T")[0]);
    }
    return list;
  }, [startDate, endDate]);

  // Unique dates actually logged in metrics
  const availableMetricsDates = useMemo(() => {
    const set = new Set<string>();
    metrics.forEach((m) => {
      const d = new Date(m.timestamp).toISOString().split("T")[0];
      set.add(d);
    });
    return Array.from(set).sort();
  }, [metrics]);

  // Filter metrics based on chosen date filter
  const filteredMetrics = useMemo(() => {
    if (selectedDayFilter === "ALL") return metrics;
    return metrics.filter((m) => {
      const d = new Date(m.timestamp).toISOString().split("T")[0];
      return d === selectedDayFilter;
    });
  }, [metrics, selectedDayFilter]);

  // Day-wise aggregates for comparative bar chart & heatmap
  const dayAggregates = useMemo(() => {
    const map: Record<
      string,
      {
        date: string;
        avgCpu: number;
        maxCpu: number;
        avgRam: number;
        maxRam: number;
        avgGpu: number;
        maxGpu: number;
        maxVram: number;
        totalNetMB: number;
        count: number;
        hours: Record<number, { cpu: number; ram: number; gpu: number; count: number }>;
      }
    > = {};

    metrics.forEach((m) => {
      const dateStr = new Date(m.timestamp).toISOString().split("T")[0];
      const hour = new Date(m.timestamp).getHours();

      if (!map[dateStr]) {
        map[dateStr] = {
          date: dateStr,
          avgCpu: 0,
          maxCpu: 0,
          avgRam: 0,
          maxRam: 0,
          avgGpu: 0,
          maxGpu: 0,
          maxVram: 0,
          totalNetMB: 0,
          count: 0,
          hours: {},
        };
      }

      const d = map[dateStr];
      d.avgCpu += m.cpuUtil || 0;
      if (m.cpuUtil > d.maxCpu) d.maxCpu = m.cpuUtil;

      d.avgRam += m.ramUtil || 0;
      if (m.ramUtil > d.maxRam) d.maxRam = m.ramUtil;

      d.avgGpu += m.gpuUtil || 0;
      if (m.gpuUtil > d.maxGpu) d.maxGpu = m.gpuUtil;

      if (m.gpuMemUsed > d.maxVram) d.maxVram = m.gpuMemUsed;
      d.totalNetMB += ((m.netSentSpeed || 0) * 10 + (m.netRecvSpeed || 0) * 10) / (1024 * 1024);
      d.count += 1;

      if (!d.hours[hour]) {
        d.hours[hour] = { cpu: 0, ram: 0, gpu: 0, count: 0 };
      }
      d.hours[hour].cpu += m.cpuUtil || 0;
      d.hours[hour].ram += m.ramUtil || 0;
      d.hours[hour].gpu += m.gpuUtil || 0;
      d.hours[hour].count += 1;
    });

    Object.values(map).forEach((d) => {
      if (d.count > 0) {
        d.avgCpu = Math.round(d.avgCpu / d.count);
        d.avgRam = Math.round(d.avgRam / d.count);
        d.avgGpu = Math.round(d.avgGpu / d.count);
        d.maxCpu = Math.round(d.maxCpu);
        d.maxRam = Math.round(d.maxRam);
        d.maxGpu = Math.round(d.maxGpu);
        d.maxVram = Math.round(d.maxVram);
        d.totalNetMB = Math.round(d.totalNetMB * 10) / 10;
      }
      Object.keys(d.hours).forEach((hKey) => {
        const h = d.hours[Number(hKey)];
        if (h.count > 0) {
          h.cpu = Math.round(h.cpu / h.count);
          h.ram = Math.round(h.ram / h.count);
          h.gpu = Math.round(h.gpu / h.count);
        }
      });
    });

    return map;
  }, [metrics]);

  // Comparison bar chart dataset (Day vs Day)
  const comparisonData = useMemo(() => {
    return fullDates.map((dateStr) => {
      const agg = dayAggregates[dateStr];
      const dLabel = new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      return {
        date: dLabel,
        fullDate: dateStr,
        "Avg CPU %": agg ? agg.avgCpu : 0,
        "Max CPU %": agg ? agg.maxCpu : 0,
        "Avg RAM %": agg ? agg.avgRam : 0,
        "Avg GPU %": agg ? agg.avgGpu : 0,
        "Max GPU %": agg ? agg.maxGpu : 0,
        "VRAM (MB)": agg ? agg.maxVram : 0,
      };
    });
  }, [fullDates, dayAggregates]);

  // Compute Statistical Summary
  const analyticsSummary = useMemo(() => {
    if (!filteredMetrics || filteredMetrics.length === 0) {
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
        workloadType: "No Telemetry Recorded",
      };
    }

    let sumCpu = 0, maxCpu = 0, minCpu = Infinity;
    let sumRam = 0, maxRam = 0;
    let sumGpu = 0, maxGpu = 0, maxVram = 0, vramTotal = 0;
    let sumNetSent = 0, sumNetRecv = 0, totalNetBytes = 0;
    let maxCpuTemp = 0, maxGpuTemp = 0;

    filteredMetrics.forEach((m) => {
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
      totalNetBytes += ((m.netSentSpeed || 0) * 10 + (m.netRecvSpeed || 0) * 10); // bytes in 10s tick

      if (m.cpuTemp > maxCpuTemp) maxCpuTemp = m.cpuTemp;
      if (m.gpuTemp > maxGpuTemp) maxGpuTemp = m.gpuTemp;
    });

    const len = filteredMetrics.length;
    const avgCpu = Math.round(sumCpu / len);
    const avgRam = Math.round(sumRam / len);
    const avgGpu = Math.round(sumGpu / len);
    const avgNetSent = Math.round(sumNetSent / len);
    const avgNetRecv = Math.round(sumNetRecv / len);
    const totalNetMB = Math.round((totalNetBytes / (1024 * 1024)) * 10) / 10;

    let workloadType = "General Office / Idle";
    if (avgGpu > 40 || maxVram > 2000) workloadType = "Deep Learning / Heavy AI Training";
    else if (avgCpu > 60) workloadType = "Heavy Computational Simulation";
    else if (avgCpu > 25 || avgRam > 60) workloadType = "Software Development / Compilation";

    return {
      avgCpu,
      maxCpu: Math.round(maxCpu),
      minCpu: minCpu === Infinity ? 0 : Math.round(minCpu),
      avgRam,
      maxRam: Math.round(maxRam),
      avgGpu,
      maxGpu: Math.round(maxGpu),
      maxVram: Math.round(maxVram),
      vramTotal: Math.round(vramTotal),
      avgNetSent,
      avgNetRecv,
      totalNetMB,
      maxCpuTemp,
      maxGpuTemp,
      workloadType,
    };
  }, [filteredMetrics]);

  // Unified Session Audit log extracted from computer's bookings
  const unifiedSessions = useMemo(() => {
    const list: any[] = [];
    bookings.forEach((b: any) => {
      if (b.attendanceHistory) {
        b.attendanceHistory.forEach((h: any) => {
          list.push({
            date: h.date,
            user: b.user?.name || b.userInfo?.name || "Unknown User",
            email: h.email || b.user?.email || b.userInfo?.email || "",
            agenda: h.agenda || b.reason || "Working",
            sessionType: h.sessionType || "Physical GUI",
            checkInTime: h.checkInTime,
            checkOutTime: h.checkOutTime,
          });
        });
      }
    });
    // Sort descending by checkInTime
    return list.sort((a, b) => new Date(b.checkInTime || b.date).getTime() - new Date(a.checkInTime || a.date).getTime());
  }, [bookings]);

  // Area Chart Data Setup
  const chartData = useMemo(() => {
    return filteredMetrics.map((m) => {
      const timeStr = new Date(m.timestamp).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return {
        time: timeStr,
        CPU: Math.round(m.cpuUtil),
        RAM: Math.round(m.ramUtil),
        GPU: Math.round(m.gpuUtil),
        VRAM: Math.round(m.gpuMemUsed),
      };
    });
  }, [filteredMetrics]);

  // Workload Heatmap Grid Data (Hours 8-18 vs Days)
  const heatmapData = useMemo(() => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 to 18:00
    const grid: { hourLabel: string; hour: number; [key: string]: any }[] = hours.map((h) => ({
      hourLabel: `${String(h).padStart(2, "0")}:00`,
      hour: h,
    }));

    fullDates.forEach((dateStr) => {
      const agg = dayAggregates[dateStr];
      grid.forEach((row) => {
        const hourData = agg?.hours[row.hour];
        let val = 0;
        if (hourData) {
          if (heatmapMetric === "cpu") val = hourData.cpu;
          else if (heatmapMetric === "ram") val = hourData.ram;
          else if (heatmapMetric === "gpu") val = hourData.gpu;
        }
        row[dateStr] = val;
      });
    });

    return grid;
  }, [fullDates, dayAggregates, heatmapMetric]);

  const getHeatmapColor = (value: number) => {
    if (!value || value === 0) return "#f8fafc"; // empty
    if (value < 15) return "#eff6ff"; // light blue
    if (value < 35) return "#bfdbfe";
    if (value < 60) return "#60a5fa";
    if (value < 80) return "#2563eb";
    return "#1e3a8a"; // dark blue
  };

  const handleExportCSV = () => {
    if (metrics.length === 0) return;
    const headers = [
      "Timestamp",
      "CPU Util %",
      "RAM Util %",
      "GPU Util %",
      "GPU VRAM Used (MB)",
      "GPU VRAM Total (MB)",
      "Net Sent Speed (B/s)",
      "Net Recv Speed (B/s)",
      "CPU Temp C",
      "GPU Temp C",
    ];

    const rows = metrics.map((m) => [
      new Date(m.timestamp).toISOString(),
      m.cpuUtil,
      m.ramUtil,
      m.gpuUtil,
      m.gpuMemUsed,
      m.gpuMemTotal,
      m.netSentSpeed,
      m.netRecvSpeed,
      m.cpuTemp,
      m.gpuTemp,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telemetry_${computerName}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth scroll="paper" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#0f172a", color: "#fff", py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AssessmentIcon sx={{ color: "#2dd4bf" }} />
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
              System Telemetry Analytics: {computerName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
              InfluxDB Real-Time Compute Cluster Insights Engine
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#94a3b8", "&:hover": { color: "#fff" } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ bgcolor: "#f8fafc", px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={7} sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="range-label">Time Range</InputLabel>
              <Select
                labelId="range-label"
                value={rangeOption}
                label="Time Range"
                onChange={(e) => setRangeOption(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: "#fff" }}
              >
                <MenuItem value="7">Last 7 Days</MenuItem>
                <MenuItem value="14">Last 14 Days</MenuItem>
                <MenuItem value="30">Last 30 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>

            {rangeOption === "custom" && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  type="date"
                  label="Start"
                  size="small"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 140, bgcolor: "#fff" }}
                />
                <Typography variant="caption" color="text.secondary">to</Typography>
                <TextField
                  type="date"
                  label="End"
                  size="small"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 140, bgcolor: "#fff" }}
                />
              </Box>
            )}

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="day-filter-label">Explore Single Day</InputLabel>
              <Select
                labelId="day-filter-label"
                value={selectedDayFilter}
                label="Explore Single Day"
                onChange={(e) => setSelectedDayFilter(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: "#fff" }}
              >
                <MenuItem value="ALL">All Days (Aggregated)</MenuItem>
                {availableMetricsDates.map((d) => (
                  <MenuItem key={d} value={d}>
                    {new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              disabled={metrics.length === 0}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Export CSV Dataset
            </Button>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", py: 15, gap: 2, bgcolor: "#f1f5f9" }}>
          <CircularProgress size={50} />
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            Gathering hardware cluster telemetry...
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#ffffff", px: 2 }}>
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
              <Tab icon={<ChartIcon />} iconPosition="start" label="Interactive Time-Series" />
              <Tab icon={<GridIcon />} iconPosition="start" label="Day-Wise Workload Heatmap" />
              <Tab icon={<CompareIcon />} iconPosition="start" label="Day-to-Day Comparative Analysis" />
              <Tab icon={<AssessmentIcon />} iconPosition="start" label="Statistical Aggregates" />
              <Tab icon={<AuditIcon />} iconPosition="start" label="Session Audit Log" />
              <Tab icon={<TableIcon />} iconPosition="start" label="Raw Telemetry Data" />
            </Tabs>
          </Box>

          <DialogContent sx={{ p: 3, bgcolor: "#f1f5f9", minHeight: 500 }}>
            {/* TAB 0: INTERACTIVE TIME-SERIES */}
            {activeTab === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                      Compute Core Utilization Timeline ({selectedDayFilter === "ALL" ? "Full Range" : selectedDayFilter})
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {showCpu && <Chip size="small" label="CPU Active" sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 700 }} />}
                      {showRam && <Chip size="small" label="RAM Active" sx={{ bgcolor: "#d1fae5", color: "#047857", fontWeight: 700 }} />}
                      {showGpu && <Chip size="small" label="GPU Active" sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 700 }} />}
                    </Box>
                  </Box>

                  {chartData.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                      No telemetry metrics logged for the selected date filter.
                    </Typography>
                  ) : (
                    <Box sx={{ width: "100%", height: 280 }}>
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
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} />
                          <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                          <RechartsTooltip />
                          <Legend />
                          {showCpu && <Area type="monotone" dataKey="CPU" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />}
                          {showRam && <Area type="monotone" dataKey="RAM" stroke="#10b981" fillOpacity={1} fill="url(#colorRam)" />}
                          {showGpu && <Area type="monotone" dataKey="GPU" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorGpu)" />}
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 2 }}>
                        Hardware Explorer Filters
                      </Typography>
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox checked={showCpu} onChange={(e) => setShowCpu(e.target.checked)} />}
                          label={<Typography variant="body2" fontWeight={600}>Visualize CPU Cores Load</Typography>}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={showRam} onChange={(e) => setShowRam(e.target.checked)} />}
                          label={<Typography variant="body2" fontWeight={600}>Visualize System Memory (RAM)</Typography>}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={showGpu} onChange={(e) => setShowGpu(e.target.checked)} />}
                          label={<Typography variant="body2" fontWeight={600}>Visualize Graphic Engine (GPU)</Typography>}
                        />
                      </FormGroup>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #cbd5e1", bgcolor: "#f8fafc" }}>
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                        Dynamic Session Analysis
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Workload Signature: <strong>{analyticsSummary.workloadType}</strong>
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="text.secondary">Avg CPU Utilization</Typography>
                          <Typography variant="caption" fontWeight={700}>{analyticsSummary.avgCpu}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={analyticsSummary.avgCpu} sx={{ height: 6, borderRadius: 3 }} />

                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">Avg GPU Utilization</Typography>
                          <Typography variant="caption" fontWeight={700}>{analyticsSummary.avgGpu}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={analyticsSummary.avgGpu} color="secondary" sx={{ height: 6, borderRadius: 3 }} />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* TAB 1: WORKLOAD HEATMAP */}
            {activeTab === 1 && (
              <Paper sx={{ p: 3, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                      Hour-by-Hour Computational Load Grid
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Monitored active hours (08:00 - 18:00) mapped across selected days
                    </Typography>
                  </Box>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="heatmap-metric-label">Grid Resource</InputLabel>
                    <Select
                      labelId="heatmap-metric-label"
                      value={heatmapMetric}
                      label="Grid Resource"
                      onChange={(e) => setHeatmapMetric(e.target.value as any)}
                    >
                      <MenuItem value="cpu">CPU Core Load</MenuItem>
                      <MenuItem value="ram">RAM Memory Load</MenuItem>
                      <MenuItem value="gpu">GPU Processing Load</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {metrics.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
                    No telemetry metrics logged.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small" sx={{ borderCollapse: "separate", borderSpacing: "3px" }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ border: "none", fontWeight: 800 }}>Hour</TableCell>
                          {fullDates.map((d) => (
                            <TableCell key={d} align="center" sx={{ border: "none", fontWeight: 800, minWidth: 60, fontSize: "0.75rem" }}>
                              {new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {heatmapData.map((row) => (
                          <TableRow key={row.hour}>
                            <TableCell sx={{ border: "none", fontWeight: 700, fontSize: "0.8rem", color: "#64748b" }}>
                              {row.hourLabel}
                            </TableCell>
                            {fullDates.map((dateStr) => {
                              const val = row[dateStr];
                              return (
                                <Tooltip key={dateStr} title={`Hour: ${row.hourLabel} | Load: ${val}%`} arrow>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "none",
                                      bgcolor: getHeatmapColor(val),
                                      color: val > 50 ? "#fff" : "#1e293b",
                                      fontWeight: 700,
                                      borderRadius: 1,
                                      fontSize: "0.75rem",
                                      py: 1,
                                    }}
                                  >
                                    {val > 0 ? `${val}%` : "-"}
                                  </TableCell>
                                </Tooltip>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}

            {/* TAB 2: DAY-TO-DAY COMPARATIVE */}
            {activeTab === 2 && (
              <Paper sx={{ p: 3, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 3 }}>
                  Day-by-Day Historical Utilization Analysis
                </Typography>
                {metrics.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
                    No telemetry metrics logged.
                  </Typography>
                ) : (
                  <Box sx={{ width: "100%", height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <YAxis unit="%" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="Avg CPU %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Avg GPU %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Avg RAM %" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            )}

            {/* TAB 3: STATISTICAL AGGREGATES */}
            {activeTab === 3 && (
              <Grid container spacing={3}>
                {/* CPU KPI Card */}
                <Grid item xs={12} sm={4}>
                  <Card sx={{ borderRadius: 3, border: "1px solid #cbd5e1", boxShadow: "none" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <SpeedIcon color="primary" />
                        <Typography variant="subtitle2" fontWeight={800}>CPU Aggregates</Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Avg Core Load</Typography>
                          <Typography variant="body2" fontWeight={800}>{analyticsSummary.avgCpu}%</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Peak Core Load</Typography>
                          <Typography variant="body2" fontWeight={800}>{analyticsSummary.maxCpu}%</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Idle Core Load</Typography>
                          <Typography variant="body2" fontWeight={800}>{analyticsSummary.minCpu}%</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* GPU KPI Card */}
                <Grid item xs={12} sm={4}>
                  <Card sx={{ borderRadius: 3, border: "1px solid #cbd5e1", boxShadow: "none" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <GpuIcon color="secondary" />
                        <Typography variant="subtitle2" fontWeight={800}>GPU Aggregates</Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Avg Processing Load</Typography>
                          <Typography variant="body2" fontWeight={800}>{analyticsSummary.avgGpu}%</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Peak Processing Load</Typography>
                          <Typography variant="body2" fontWeight={800}>{analyticsSummary.maxGpu}%</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Max VRAM Used</Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {analyticsSummary.maxVram} / {analyticsSummary.vramTotal || "N/A"} MB
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* System Assets KPI Card */}
                <Grid item xs={12} sm={4}>
                  <Card sx={{ borderRadius: 3, border: "1px solid #cbd5e1", boxShadow: "none" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <MemoryIcon sx={{ color: "#10b981" }} />
                        <Typography variant="subtitle2" fontWeight={800}>Environment Aggregates</Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Avg RAM Occupied</Typography>
                          <Typography variant="body2" fontWeight={800}>{analyticsSummary.avgRam}%</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Peak RAM Occupied</Typography>
                          <Typography variant="body2" fontWeight={800}>{analyticsSummary.maxRam}%</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Total Traffic Exchanged</Typography>
                          <Typography variant="body2" fontWeight={800}>{analyticsSummary.totalNetMB} MB</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 2.5, border: "1px solid #cbd5e1" }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 2 }}>
                      Thermal Analysis
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <TempIcon color="error" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Max CPU Thermal Peak</Typography>
                          <Typography variant="h5" fontWeight={800} color="#dc2626">
                            {analyticsSummary.maxCpuTemp > 0 ? `${Math.round(analyticsSummary.maxCpuTemp)}°C` : "N/A"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <TempIcon color="error" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Max GPU Thermal Peak</Typography>
                          <Typography variant="h5" fontWeight={800} color="#dc2626">
                            {analyticsSummary.maxGpuTemp > 0 ? `${Math.round(analyticsSummary.maxGpuTemp)}°C` : "N/A"}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* TAB 4: SESSION AUDIT LOG */}
            {activeTab === 4 && (
              <Paper sx={{ borderRadius: 2.5, border: "1px solid #cbd5e1", overflow: "hidden" }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Student User</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Agenda Purpose</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Session Type</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Check-In</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Check-Out</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unifiedSessions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            No active check-in history logged for this system.
                          </TableCell>
                        </TableRow>
                      ) : (
                        unifiedSessions.map((sess, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {new Date(`${sess.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">{sess.user}</Typography>
                              <Typography variant="caption" color="text.secondary">{sess.email}</Typography>
                            </TableCell>
                            <TableCell>{sess.agenda}</TableCell>
                            <TableCell>
                              <Chip label={sess.sessionType} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.65rem" }} />
                            </TableCell>
                            <TableCell>
                              {sess.checkInTime ? new Date(sess.checkInTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "-"}
                            </TableCell>
                            <TableCell>
                              {sess.checkOutTime ? (
                                new Date(sess.checkOutTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                              ) : (
                                <Chip label="No Check-out" size="small" color="warning" sx={{ height: 16, fontSize: "0.58rem", fontWeight: 700 }} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* TAB 5: RAW TELEMETRY DATA */}
            {activeTab === 5 && (
              <Paper sx={{ borderRadius: 2.5, border: "1px solid #cbd5e1", overflow: "hidden" }}>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader>
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>CPU Util</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>RAM Util</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>GPU Util</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>GPU VRAM</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Network Traffic</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>CPU Temp</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>GPU Temp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            No raw telemetry logged for the selected dates.
                          </TableCell>
                        </TableRow>
                      ) : (
                        metrics.slice().reverse().map((m, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(m.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{Math.round(m.cpuUtil)}%</TableCell>
                            <TableCell>{Math.round(m.ramUtil)}%</TableCell>
                            <TableCell>{m.gpuUtil ? `${Math.round(m.gpuUtil)}%` : "-"}</TableCell>
                            <TableCell>{m.gpuMemTotal ? `${Math.round(m.gpuMemUsed)} / ${Math.round(m.gpuMemTotal)} MB` : "-"}</TableCell>
                            <TableCell sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                              ↑ {formatBytes(m.netSentSpeed)}/s <br /> ↓ {formatBytes(m.netRecvSpeed)}/s
                            </TableCell>
                            <TableCell>{m.cpuTemp > 0 ? `${Math.round(m.cpuTemp)}°C` : "-"}</TableCell>
                            <TableCell>{m.gpuTemp > 0 ? `${Math.round(m.gpuTemp)}°C` : "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </DialogContent>
        </>
      )}

      <DialogActions sx={{ p: 2, bgcolor: "#fff", borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} variant="contained" color="inherit" sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
          Close Telemetry Explorer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SystemTelemetryAnalyticsModal;
