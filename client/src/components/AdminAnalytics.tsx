import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ComputerIcon from '@mui/icons-material/Computer';
import PeopleIcon from '@mui/icons-material/People';
import MemoryIcon from '@mui/icons-material/Memory';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Booking {
  _id: string;
  userId: string;
  userInfo?: { name: string; email: string };
  computerId: { _id: string; name: string; location: string; specifications: string };
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  createdAt: string;
  requiresGPU: boolean;
  gpuMemoryRequired?: number;
  problemStatement?: string;
  datasetType?: string;
  mentor?: string;
  rejectionReason?: string;
}

interface Props {
  bookings: Booking[];
  onViewDetails: (booking: Booking) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#6b7280',
  completed: '#3b82f6',
};
const STATUS_BG: Record<string, string> = {
  pending: '#fffbeb',
  approved: '#ecfdf5',
  rejected: '#fef2f2',
  cancelled: '#f9fafb',
  completed: '#eff6ff',
};

function getUserName(b: Booking) { return b.userInfo?.name || 'Unknown User'; }
function getUserEmail(b: Booking) { return b.userInfo?.email || b.userId || ''; }

function calcHours(b: Booking): number {
  const s = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
  const e = new Date(`${b.endDate}T${b.endTime || '00:00'}`);
  const h = Math.ceil((e.getTime() - s.getTime()) / 3600000);
  return isNaN(h) || h <= 0 ? 2 : h;
}

function fmtDate(d: string) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
}

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────

function DonutChart({ slices }: { slices: { value: number; color: string; label: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
        <Typography variant="body2" color="text.secondary">No data for this period</Typography>
      </Box>
    );
  }

  const cx = 90; const cy = 90; const r = 66; const innerR = 42;
  let startAngle = -Math.PI / 2;
  const arcs = slices.map(s => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(startAngle + sweep);
    const y2 = cy + r * Math.sin(startAngle + sweep);
    const xi1 = cx + innerR * Math.cos(startAngle);
    const yi1 = cy + innerR * Math.sin(startAngle);
    const xi2 = cx + innerR * Math.cos(startAngle + sweep);
    const yi2 = cy + innerR * Math.sin(startAngle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${large} 0 ${xi1} ${yi1} Z`;
    startAngle += sweep;
    return { ...s, path };
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        {arcs.map((a, i) => (
          <Tooltip key={i} title={`${a.label}: ${a.value} (${Math.round((a.value / total) * 100)}%)`} arrow>
            <path d={a.path} fill={a.color} stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')} />
          </Tooltip>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={800} fill="#1e293b">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="#64748b">Total</text>
      </svg>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {slices.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70 }}>{s.label}</Typography>
            <Typography variant="caption" fontWeight={700} color="text.primary">{s.value}</Typography>
            <Typography variant="caption" color="text.secondary">({Math.round((s.value / total) * 100)}%)</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── SVG Daily Bar Chart ──────────────────────────────────────────────────────

function DailyChart({ days }: { days: { day: number; approved: number; pending: number; rejected: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...days.map(d => d.approved + d.pending + d.rejected), 1);
  const W = 560; const H = 140; const PAD_L = 28; const PAD_B = 22; const PAD_T = 10;
  const chartW = W - PAD_L - 4;
  const chartH = H - PAD_B - PAD_T;
  const barW = Math.max(Math.floor((chartW / days.length) * 0.6), 4);
  const gap = chartW / days.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
      {/* Y grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = PAD_T + chartH - frac * chartH;
        const val = Math.round(frac * maxVal);
        return (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={W - 4} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray={frac > 0 ? '3 3' : undefined} />
            <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{val}</text>
          </g>
        );
      })}

      {days.map((d, i) => {
        const x = PAD_L + i * gap + (gap - barW) / 2;
        const total = d.approved + d.pending + d.rejected;
        const bH = (total / maxVal) * chartH;
        const isH = hovered === i;

        // Stacked bar heights
        const aH = maxVal > 0 ? (d.approved / maxVal) * chartH : 0;
        const pHt = maxVal > 0 ? (d.pending / maxVal) * chartH : 0;
        const rH = maxVal > 0 ? (d.rejected / maxVal) * chartH : 0;
        const baseY = PAD_T + chartH;

        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            {/* Rejected (bottom) */}
            {rH > 0 && <rect x={x} y={baseY - rH} width={barW} height={rH} fill="#ef4444" rx={1} opacity={isH ? 1 : 0.85} />}
            {/* Pending (middle) */}
            {pHt > 0 && <rect x={x} y={baseY - rH - pHt} width={barW} height={pHt} fill="#f59e0b" opacity={isH ? 1 : 0.85} />}
            {/* Approved (top) */}
            {aH > 0 && <rect x={x} y={baseY - rH - pHt - aH} width={barW} height={aH} fill="#10b981" rx={1} opacity={isH ? 1 : 0.85} />}

            {/* Hover tooltip */}
            {isH && total > 0 && (
              <g>
                <rect x={x - 20} y={PAD_T + chartH - bH - 44} width={barW + 40} height={40} rx={4} fill="#1e293b" opacity={0.9} />
                <text x={x + barW / 2} y={PAD_T + chartH - bH - 28} textAnchor="middle" fontSize={9} fill="#10b981">✓ {d.approved}</text>
                <text x={x + barW / 2} y={PAD_T + chartH - bH - 18} textAnchor="middle" fontSize={9} fill="#f59e0b">⏳ {d.pending}</text>
                <text x={x + barW / 2} y={PAD_T + chartH - bH - 8} textAnchor="middle" fontSize={9} fill="#ef4444">✗ {d.rejected}</text>
              </g>
            )}

            {/* X label — show every 5th day */}
            {(d.day === 1 || d.day % 5 === 0) && (
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.day}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminAnalytics: React.FC<Props> = ({ bookings, onViewDetails }) => {
  const now = new Date();

  // ─── Month navigation state ──────────────────────────────
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [mode, setMode] = useState<'month' | 'custom'>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // ─── Table state ─────────────────────────────────────────
  const [tableStatus, setTableStatus] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ─── Filtered bookings for the selected period ────────────
  const periodBookings = useMemo(() => {
    if (mode === 'custom' && customFrom && customTo) {
      return bookings.filter(b => {
        const d = (b.createdAt ? new Date(b.createdAt) : new Date(b.startDate));
        return d >= new Date(customFrom) && d <= new Date(customTo + 'T23:59:59');
      });
    }
    // Month mode: filter by createdAt month/year
    return bookings.filter(b => {
      const d = b.createdAt ? new Date(b.createdAt) : new Date(b.startDate);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });
  }, [bookings, mode, viewMonth, viewYear, customFrom, customTo]);

  // ─── KPI metrics ──────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = periodBookings.length;
    const approved = periodBookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
    const rejected = periodBookings.filter(b => b.status === 'rejected').length;
    const pending = periodBookings.filter(b => b.status === 'pending').length;
    const cancelled = periodBookings.filter(b => b.status === 'cancelled').length;
    const gpuCount = periodBookings.filter(b => b.requiresGPU).length;
    const approvalRate = (approved + rejected) > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0;
    return { total, approved, rejected, pending, cancelled, gpuCount, approvalRate };
  }, [periodBookings]);

  // ─── Daily breakdown (for chart) ─────────────────────────
  const dailyData = useMemo(() => {
    const daysInMonth = mode === 'month'
      ? new Date(viewYear, viewMonth + 1, 0).getDate()
      : 31;
    const arr = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      approved: 0,
      pending: 0,
      rejected: 0,
    }));
    periodBookings.forEach(b => {
      const d = b.createdAt ? new Date(b.createdAt) : new Date(b.startDate);
      const dayIdx = d.getDate() - 1;
      if (dayIdx >= 0 && dayIdx < arr.length) {
        if (b.status === 'approved' || b.status === 'completed') arr[dayIdx].approved++;
        else if (b.status === 'pending') arr[dayIdx].pending++;
        else if (b.status === 'rejected' || b.status === 'cancelled') arr[dayIdx].rejected++;
      }
    });
    return arr;
  }, [periodBookings, viewMonth, viewYear, mode]);

  // ─── Computer utilization ─────────────────────────────────
  const computerStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; hours: number }> = {};
    periodBookings.filter(b => b.status === 'approved' || b.status === 'completed').forEach(b => {
      const id = b.computerId?._id || 'unknown';
      const name = b.computerId?.name || 'Unknown';
      if (!map[id]) map[id] = { name, count: 0, hours: 0 };
      map[id].count++;
      map[id].hours += calcHours(b);
    });
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [periodBookings]);

  // ─── Top users ────────────────────────────────────────────
  const userStats = useMemo(() => {
    const map: Record<string, { name: string; email: string; total: number; approved: number }> = {};
    periodBookings.forEach(b => {
      const email = getUserEmail(b);
      if (!map[email]) map[email] = { name: getUserName(b), email, total: 0, approved: 0 };
      map[email].total++;
      if (b.status === 'approved' || b.status === 'completed') map[email].approved++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [periodBookings]);

  // ─── Donut slices ─────────────────────────────────────────
  const donutSlices = useMemo(() => [
    { value: kpis.approved, color: '#10b981', label: 'Approved' },
    { value: kpis.pending, color: '#f59e0b', label: 'Pending' },
    { value: kpis.rejected, color: '#ef4444', label: 'Rejected' },
    { value: kpis.cancelled, color: '#94a3b8', label: 'Cancelled' },
  ], [kpis]);

  // ─── Table bookings (filtered) ────────────────────────────
  const tableBookings = useMemo(() => {
    let rows = periodBookings;
    if (tableStatus !== 'all') rows = rows.filter(b => b.status === tableStatus);
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter(b =>
        getUserName(b).toLowerCase().includes(q) ||
        getUserEmail(b).toLowerCase().includes(q) ||
        (b.computerId?.name || '').toLowerCase().includes(q)
      );
    }
    return rows.slice().sort((a, b) => {
      const da = new Date(a.createdAt || a.startDate).getTime();
      const db = new Date(b.createdAt || b.startDate).getTime();
      return db - da;
    });
  }, [periodBookings, tableStatus, tableSearch]);

  const paginatedRows = useMemo(
    () => tableBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [tableBookings, page, rowsPerPage]
  );

  // Reset page when filters change
  const handleStatusChange = useCallback((s: string) => { setTableStatus(s); setPage(0); }, []);
  const handleSearchChange = useCallback((v: string) => { setTableSearch(v); setPage(0); }, []);

  // ─── Month navigation ─────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setMode('month');
  };
  const nextMonth = () => {
    const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setMode('month');
  };
  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();
  const periodLabel = mode === 'custom' && customFrom && customTo
    ? `${customFrom} → ${customTo}`
    : `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  // ─── Month pill selector (last 12 months + current) ───────
  const monthPills = useMemo(() => {
    const pills = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      pills.push({ month: d.getMonth(), year: d.getFullYear(), label: `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}` });
    }
    return pills;
  }, []);

  // ─── Render ───────────────────────────────────────────────
  return (
    <Box>
      {/* ── Section 1: Header & Period Selector ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a">Booking Analytics</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Browse historic booking data by month, or set a custom date range below.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={mode === 'month' ? 'Month View' : 'Custom Range'}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </Box>

        {/* Month Pill Scroll */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          mb: 2,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 2 },
        }}>
          {monthPills.map((p, i) => {
            const isActive = mode === 'month' && viewMonth === p.month && viewYear === p.year;
            return (
              <Button
                key={i}
                size="small"
                variant={isActive ? 'contained' : 'outlined'}
                onClick={() => { setViewMonth(p.month); setViewYear(p.year); setMode('month'); setPage(0); }}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 800 : 500,
                  borderRadius: 5,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  borderColor: isActive ? undefined : '#e2e8f0',
                  color: isActive ? undefined : '#64748b',
                }}
              >
                {p.label}
              </Button>
            );
          })}
        </Box>

        {/* Month nav + Custom Range */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, px: 1.5, py: 0.75 }}>
            <IconButton size="small" onClick={prevMonth}><ArrowBackIosNewIcon fontSize="inherit" /></IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 120, justifyContent: 'center' }}>
              <CalendarMonthIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={700} color="#1e293b">{periodLabel}</Typography>
            </Box>
            <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth && mode === 'month'}>
              <ArrowForwardIosIcon fontSize="inherit" />
            </IconButton>
          </Box>

          <Typography variant="caption" color="text.secondary">or</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              type="date"
              size="small"
              label="From"
              value={customFrom}
              onChange={e => { setCustomFrom(e.target.value); setMode('custom'); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              value={customTo}
              onChange={e => { setCustomTo(e.target.value); setMode('custom'); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />
            {mode === 'custom' && (
              <Button size="small" variant="text" onClick={() => { setMode('month'); setCustomFrom(''); setCustomTo(''); }}>
                Clear
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Section 2: KPI Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Total', value: kpis.total, color: '#3b82f6', bg: '#eff6ff', icon: <CalendarMonthIcon sx={{ fontSize: 20 }} /> },
          { label: 'Approved', value: kpis.approved, color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleIcon sx={{ fontSize: 20 }} /> },
          { label: 'Pending', value: kpis.pending, color: '#f59e0b', bg: '#fffbeb', icon: <ScheduleIcon sx={{ fontSize: 20 }} /> },
          { label: 'Rejected', value: kpis.rejected, color: '#ef4444', bg: '#fef2f2', icon: <CancelIcon sx={{ fontSize: 20 }} /> },
          { label: 'Cancelled', value: kpis.cancelled, color: '#6b7280', bg: '#f9fafb', icon: <CancelIcon sx={{ fontSize: 20 }} /> },
          { label: 'GPU Requests', value: kpis.gpuCount, color: '#8b5cf6', bg: '#f5f3ff', icon: <MemoryIcon sx={{ fontSize: 20 }} /> },
          { label: 'Approval Rate', value: `${kpis.approvalRate}%`, color: '#0891b2', bg: '#ecfeff', icon: <CheckCircleIcon sx={{ fontSize: 20 }} /> },
        ].map((k, i) => (
          <Card key={i} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.4px', lineHeight: 1.3 }}>
                  {k.label}
                </Typography>
                <Avatar sx={{ width: 28, height: 28, bgcolor: k.bg, color: k.color }}>{k.icon}</Avatar>
              </Box>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 1, color: k.color }}>{k.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Section 3: Charts Row ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '3fr 2fr' }, gap: 2.5, mb: 3 }}>

        {/* Daily Activity Bar Chart */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a">Daily Activity — {periodLabel}</Typography>
                <Typography variant="caption" color="text.secondary">Bookings per calendar day (hover bar for breakdown)</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[{ color: '#10b981', label: 'Approved' }, { color: '#f59e0b', label: 'Pending' }, { color: '#ef4444', label: 'Rejected' }].map(l => (
                  <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: l.color }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{l.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ height: 160, width: '100%' }}>
              <DailyChart days={dailyData} />
            </Box>
          </CardContent>
        </Card>

        {/* Donut Status Distribution */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>Status Distribution</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Proportional breakdown of request outcomes
            </Typography>
            <DonutChart slices={donutSlices} />
          </CardContent>
        </Card>
      </Box>

      {/* ── Section 4: Utilization & Users Row ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>

        {/* Computer Utilization */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ComputerIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">System Utilization Ranking</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Computers ranked by total allocated hours (approved only)
            </Typography>
            {computerStats.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">No approved bookings in this period.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {computerStats.slice(0, 6).map((c, i) => {
                  const maxH = computerStats[0]?.hours || 1;
                  const pct = Math.max((c.hours / maxH) * 100, 5);
                  return (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ minWidth: 16 }}>#{i + 1}</Typography>
                          <Typography variant="body2" fontWeight={700} noWrap>{c.name}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {c.hours}h · {c.count} booking{c.count !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: i === 0 ? '#3b82f6' : '#93c5fd', borderRadius: 3, transition: 'width 0.4s' }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <PeopleIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">Most Active Users</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Ranked by booking requests in this period
            </Typography>
            {userStats.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">No user activity in this period.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {userStats.map((u, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: i < userStats.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#ede9fe', color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 800 }}>
                        {(u.name[0] || '?').toUpperCase()}
                      </Avatar>
                      <Box sx={{ maxWidth: 160 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{u.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">{u.email}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography variant="caption" fontWeight={700} color="#1e293b">{u.total} req</Typography>
                      <Typography variant="caption" color="#10b981" display="block">{u.approved} approved</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── Section 5: Booking Records Table ── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5, pb: '0 !important' }}>

          {/* Table header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                Booking Records — {periodLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tableBookings.length} record{tableBookings.length !== 1 ? 's' : ''} · Click any row to view full details
              </Typography>
            </Box>
            <TextField
              size="small"
              placeholder="Search user, email, or computer…"
              value={tableSearch}
              onChange={e => handleSearchChange(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ width: 280 }}
            />
          </Box>

          {/* Status filter chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {['all', 'pending', 'approved', 'rejected', 'cancelled', 'completed'].map(s => {
              const count = s === 'all' ? periodBookings.length : periodBookings.filter(b => b.status === s).length;
              return (
                <Chip
                  key={s}
                  label={`${s.charAt(0).toUpperCase() + s.slice(1)} (${count})`}
                  onClick={() => handleStatusChange(s)}
                  variant={tableStatus === s ? 'filled' : 'outlined'}
                  size="small"
                  sx={{
                    fontWeight: tableStatus === s ? 800 : 500,
                    textTransform: 'capitalize',
                    bgcolor: tableStatus === s ? (s === 'all' ? '#1e293b' : STATUS_BG[s]) : undefined,
                    color: tableStatus === s ? (s === 'all' ? '#fff' : STATUS_COLORS[s]) : '#64748b',
                    borderColor: tableStatus === s ? 'transparent' : '#e2e8f0',
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </Box>

          <Divider sx={{ mb: 0 }} />
        </CardContent>

        {/* Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>Computer</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>Booking Dates</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>GPU</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>Mentor</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>Requested On</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }} align="center">View</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      {periodBookings.length === 0
                        ? `No booking records for ${periodLabel}.`
                        : 'No records match your current filter.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.map((b, i) => (
                <TableRow
                  key={b._id}
                  hover
                  onClick={() => onViewDetails(b)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                >
                  <TableCell sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {page * rowsPerPage + i + 1}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 140 }}>{getUserName(b)}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 140 }}>{getUserEmail(b)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 110 }}>{b.computerId?.name || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" color="text.primary">
                      {fmtDate(b.startDate)}
                    </Typography>
                    {b.startDate !== b.endDate && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        → {fmtDate(b.endDate)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption">{b.startTime} – {b.endTime}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={b.status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        textTransform: 'capitalize',
                        bgcolor: STATUS_BG[b.status] || '#f1f5f9',
                        color: STATUS_COLORS[b.status] || '#64748b',
                        border: `1px solid ${STATUS_COLORS[b.status] || '#e2e8f0'}22`,
                        height: 20,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {b.requiresGPU ? (
                      <Chip label="GPU" size="small" sx={{ bgcolor: '#f5f3ff', color: '#8b5cf6', fontWeight: 700, fontSize: '0.62rem', height: 18 }} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">CPU</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" noWrap sx={{ maxWidth: 100, display: 'block' }} color="text.secondary">
                      {b.mentor || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      {b.createdAt ? fmtDate(b.createdAt) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" onClick={e => { e.stopPropagation(); onViewDetails(b); }}>
                    <Tooltip title="View full details">
                      <IconButton size="small" sx={{ color: 'primary.main' }}>
                        <OpenInNewIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={tableBookings.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: '1px solid #f1f5f9' }}
        />
      </Card>
    </Box>
  );
};

export default AdminAnalytics;
