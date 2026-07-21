import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Tooltip,
  LinearProgress,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as AbsentIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  DeveloperBoard as GpuIcon,
  Person as PersonIcon,
  Assignment as AgendaIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { computersAPI } from '../services/api';

export interface BookingAttendanceEntry {
  date: string;
  currentUser?: string;
  email?: string;
  agenda?: string;
  sessionType?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface BookingExplorerProps {
  booking: {
    _id: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    computerId: {
      _id: string;
      name: string;
      location?: string;
    };
    user?: {
      name: string;
      email: string;
    };
    attendanceActive?: {
      agentActiveSession?: {
        currentUser: string;
        email: string;
        agenda: string;
        sessionType: string;
        checkInTime: string;
        checkedIn: boolean;
      };
    };
    attendanceHistory?: BookingAttendanceEntry[];
  };
}

export const BookingUsageExplorer: React.FC<BookingExplorerProps> = ({ booking }) => {
  // Generate date list between startDate & endDate
  const daysList = useMemo(() => {
    if (!booking.startDate || !booking.endDate) return [];
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const list: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      list.push(new Date(d));
    }
    return list;
  }, [booking.startDate, booking.endDate]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Default selected date: today if in range, otherwise first date of booking
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const start = booking.startDate;
    const end = booking.endDate;
    if (todayStr >= start && todayStr <= end) {
      return todayStr;
    }
    return start;
  });

  const [metricsLoading, setMetricsLoading] = useState<boolean>(false);
  const [dayMetrics, setDayMetrics] = useState<any[]>([]);

  // Fetch metrics for selected computer across booking date range
  useEffect(() => {
    if (booking.computerId?._id && booking.startDate && booking.endDate) {
      setMetricsLoading(true);
      computersAPI
        .getComputerHistoryByRange(booking.computerId._id, booking.startDate, booking.endDate)
        .then((res) => {
          setDayMetrics(res.data || []);
        })
        .catch((err) => {
          console.error("Failed to load booking metrics history:", err);
          setDayMetrics([]);
        })
        .finally(() => setMetricsLoading(false));
    }
  }, [booking.computerId?._id, booking.startDate, booking.endDate]);

  // Aggregate metrics per day for timeline summary chips
  const metricsByDay = useMemo(() => {
    const map: Record<string, { avgCpu: number; avgRam: number; avgGpu: number; count: number }> = {};
    dayMetrics.forEach((m) => {
      const day = new Date(m.timestamp).toISOString().split('T')[0];
      if (!map[day]) {
        map[day] = { avgCpu: 0, avgRam: 0, avgGpu: 0, count: 0 };
      }
      map[day].avgCpu += m.cpuUtil || 0;
      map[day].avgRam += m.ramUtil || 0;
      map[day].avgGpu += m.gpuUtil || 0;
      map[day].count += 1;
    });

    Object.keys(map).forEach((d) => {
      if (map[d].count > 0) {
        map[d].avgCpu = Math.round(map[d].avgCpu / map[d].count);
        map[d].avgRam = Math.round(map[d].avgRam / map[d].count);
        map[d].avgGpu = Math.round(map[d].avgGpu / map[d].count);
      }
    });
    return map;
  }, [dayMetrics]);

  // Selected date telemetry records
  const selectedDayMetrics = useMemo(() => {
    return dayMetrics.filter(
      (m) => new Date(m.timestamp).toISOString().split('T')[0] === selectedDateStr
    );
  }, [dayMetrics, selectedDateStr]);

  const selectedDayAvg = useMemo(() => {
    if (selectedDayMetrics.length === 0) return null;
    const cpu = Math.round(selectedDayMetrics.reduce((s, m) => s + (m.cpuUtil || 0), 0) / selectedDayMetrics.length);
    const ram = Math.round(selectedDayMetrics.reduce((s, m) => s + (m.ramUtil || 0), 0) / selectedDayMetrics.length);
    const gpu = Math.round(selectedDayMetrics.reduce((s, m) => s + (m.gpuUtil || 0), 0) / selectedDayMetrics.length);
    const maxGpuMem = Math.max(...selectedDayMetrics.map((m) => m.gpuMemUsed || 0));
    const totalGpuMem = Math.max(...selectedDayMetrics.map((m) => m.gpuMemTotal || 0));
    return { cpu, ram, gpu, maxGpuMem, totalGpuMem, count: selectedDayMetrics.length };
  }, [selectedDayMetrics]);

  // Check-in status resolution for a given date
  const getDayAttendance = (formattedDay: string) => {
    const isToday = formattedDay === todayStr;
    const isLive = isToday && booking.attendanceActive?.agentActiveSession?.checkedIn;

    if (isLive) {
      return {
        status: 'live',
        label: 'Live Active',
        session: booking.attendanceActive?.agentActiveSession,
      };
    }

    const historyEntry = (booking.attendanceHistory || []).find((h) => h.date === formattedDay);
    if (historyEntry) {
      return {
        status: 'attended',
        label: 'Attended',
        session: historyEntry,
      };
    }

    const dayDate = new Date(`${formattedDay}T00:00:00`);
    const todayDate = new Date(`${todayStr}T00:00:00`);

    if (dayDate < todayDate) {
      return { status: 'absent', label: 'Unattended', session: null };
    } else if (dayDate > todayDate) {
      return { status: 'future', label: 'Scheduled', session: null };
    } else {
      return { status: 'pending_today', label: 'Pending Check-In', session: null };
    }
  };

  // Overall booking summary statistics
  const bookingSummary = useMemo(() => {
    let attendedDays = 0;
    daysList.forEach((d) => {
      const f = d.toISOString().split('T')[0];
      const att = getDayAttendance(f);
      if (att.status === 'live' || att.status === 'attended') {
        attendedDays += 1;
      }
    });
    const totalDays = daysList.length || 1;
    const rate = Math.round((attendedDays / totalDays) * 100);

    const overallAvgCpu = dayMetrics.length
      ? Math.round(dayMetrics.reduce((s, m) => s + (m.cpuUtil || 0), 0) / dayMetrics.length)
      : 0;

    let intensity = 'Low Demand';
    if (overallAvgCpu > 65) intensity = 'High Demand / Heavy AI Load';
    else if (overallAvgCpu > 30) intensity = 'Moderate Workload';

    return { attendedDays, totalDays, rate, overallAvgCpu, intensity };
  }, [daysList, dayMetrics, booking]);

  const selectedAttendance = getDayAttendance(selectedDateStr);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Top Banner: Booking-Level Insights */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Attendance Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
              <Typography variant="h5" fontWeight={800} color="#10b981">
                {bookingSummary.rate}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                ({bookingSummary.attendedDays} / {bookingSummary.totalDays} Days)
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Avg System Compute Load
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <SpeedIcon sx={{ color: '#3b82f6', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={800}>
                {bookingSummary.overallAvgCpu}% CPU
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Usage Profile Intensity
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={bookingSummary.intensity}
                size="small"
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(96, 165, 250, 0.3)'
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Interactive Date Chronograph / Timeline Cards */}
      <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <TrendingIcon fontSize="small" color="primary" /> Interactive Session Chronograph
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click any date node to inspect detailed usage telemetry
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, pt: 0.5 }}>
          {daysList.map((dayDate) => {
            const formattedDay = dayDate.toISOString().split('T')[0];
            const isSelected = formattedDay === selectedDateStr;
            const att = getDayAttendance(formattedDay);
            const m = metricsByDay[formattedDay];

            let borderColor = '#cbd5e1';
            let bg = '#ffffff';
            let statusBadgeColor = '#64748b';

            if (att.status === 'live') {
              borderColor = '#10b981';
              bg = isSelected ? '#ecfdf5' : '#ffffff';
              statusBadgeColor = '#10b981';
            } else if (att.status === 'attended') {
              borderColor = '#3b82f6';
              bg = isSelected ? '#eff6ff' : '#ffffff';
              statusBadgeColor = '#3b82f6';
            } else if (att.status === 'absent') {
              borderColor = '#f87171';
              statusBadgeColor = '#ef4444';
            }

            return (
              <Card
                key={formattedDay}
                onClick={() => setSelectedDateStr(formattedDay)}
                sx={{
                  minWidth: 115,
                  cursor: 'pointer',
                  borderRadius: 2.5,
                  border: isSelected ? `2px solid ${borderColor}` : `1px solid ${borderColor}`,
                  bgcolor: bg,
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                    {format(dayDate, 'EEE')}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                    {format(dayDate, 'MMM d')}
                  </Typography>

                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                    <Chip
                      size="small"
                      label={att.label}
                      sx={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        height: 18,
                        bgcolor: `${statusBadgeColor}15`,
                        color: statusBadgeColor,
                        border: `1px solid ${statusBadgeColor}30`
                      }}
                    />
                  </Box>

                  {/* Day telemetry mini indicator */}
                  {m && m.count > 0 ? (
                    <Box sx={{ mt: 1, pt: 0.5, borderTop: '1px dashed #e2e8f0' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>
                        ⚡ Avg {m.avgCpu}% CPU
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1, pt: 0.5, borderTop: '1px dashed #e2e8f0' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No Telemetry
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Day Exploration Panel */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ mb: 2 }}>
          🔍 Date Inspection: {format(new Date(`${selectedDateStr}T00:00:00`), 'EEEE, MMMM d, yyyy')}
        </Typography>

        <Grid container spacing={3}>
          {/* Left Side: Session & Attendance Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
              Session & Attendance Status
            </Typography>

            <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: selectedAttendance.status === 'live' || selectedAttendance.status === 'attended' ? '#f0fdf4' : '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                {selectedAttendance.status === 'live' || selectedAttendance.status === 'attended' ? (
                  <CheckIcon color="success" />
                ) : (
                  <AbsentIcon color="action" />
                )}
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                  {selectedAttendance.label}
                </Typography>
              </Box>

              {selectedAttendance.session ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Attendee:</strong> {selectedAttendance.session.currentUser || booking.user?.name || 'User'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AgendaIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Work Agenda:</strong> {selectedAttendance.session.agenda || 'Regular Lab Research'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Access Method:</strong> {selectedAttendance.session.sessionType || 'Physical GUI'}
                    </Typography>
                  </Box>

                  {selectedAttendance.session.checkInTime && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      Checked in at: {new Date(selectedAttendance.session.checkInTime).toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  {selectedAttendance.status === 'future'
                    ? 'This date is scheduled for future usage. Attendance check-in will open on this date.'
                    : 'No attendance check-in was registered for this date.'}
                </Typography>
              )}
            </Card>
          </Grid>

          {/* Right Side: Day Resource Usage Telemetry */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
              System Resource Telemetry
            </Typography>

            {metricsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : selectedDayAvg ? (
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MemoryIcon fontSize="small" color="primary" /> CPU Utilization
                    </Typography>
                    <Typography variant="body2" fontWeight={800}>
                      {selectedDayAvg.cpu}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={selectedDayAvg.cpu}
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0' }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MemoryIcon fontSize="small" color="secondary" /> RAM Memory Load
                    </Typography>
                    <Typography variant="body2" fontWeight={800}>
                      {selectedDayAvg.ram}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={selectedDayAvg.ram}
                    color="secondary"
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0' }}
                  />
                </Box>

                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GpuIcon fontSize="small" color="error" /> GPU Core Utilization
                    </Typography>
                    <Typography variant="body2" fontWeight={800}>
                      {selectedDayAvg.gpu}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={selectedDayAvg.gpu}
                    color="error"
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0' }}
                  />
                </Box>

                {selectedDayAvg.totalGpuMem > 0 && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Peak GPU VRAM: {Math.round(selectedDayAvg.maxGpuMem)} / {Math.round(selectedDayAvg.totalGpuMem)} MB
                  </Typography>
                )}
              </Card>
            ) : (
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No granular telemetry metric packets recorded for this date.
                </Typography>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
export default BookingUsageExplorer;
