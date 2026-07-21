import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { buildExcelReport, exportUserReport, exportSystemReport } from '../utils/excelExport';
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
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  LinearProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { computersAPI } from '../services/api';
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
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from '@mui/icons-material/Storage';
import BarChartIcon from '@mui/icons-material/BarChart';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Booking {
  _id: string;
  userId: string;
  userInfo?: { name: string; email: string };
  user?: { name: string; email: string };
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

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', cancelled: '#6b7280', completed: '#3b82f6',
};
const STATUS_BG: Record<string, string> = {
  pending: '#fffbeb', approved: '#ecfdf5', rejected: '#fef2f2', cancelled: '#f9fafb', completed: '#eff6ff',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUserName(b: Booking): string {
  return b.user?.name || b.userInfo?.name || '';
}
function getUserEmail(b: Booking): string {
  return b.user?.email || b.userInfo?.email || b.userId || '';
}
function getDisplayName(b: Booking): string {
  const name = getUserName(b);
  const email = getUserEmail(b);
  return name || email || 'Unknown User';
}

function calcHours(b: Booking): number {
  const s = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
  const e = new Date(`${b.endDate}T${b.endTime || '00:00'}`);
  const h = Math.ceil((e.getTime() - s.getTime()) / 3600000);
  return isNaN(h) || h <= 0 ? 2 : h;
}

function fmtDate(d: string) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTH_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
}

function fmtDateFull(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, bg, icon }: { label: string; value: string | number; color: string; bg: string; icon: React.ReactNode }) {
  return (
    <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', flex: 1, minWidth: 0 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.5px', lineHeight: 1.4, maxWidth: '70%' }}>
            {label}
          </Typography>
          <Avatar sx={{ width: 26, height: 26, bgcolor: bg, color }}>{icon}</Avatar>
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75, color }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ slices }: { slices: { value: number; color: string; label: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}>
      <Typography variant="body2" color="text.secondary">No data</Typography>
    </Box>
  );
  const cx = 80; const cy = 80; const r = 60; const iR = 38;
  let angle = -Math.PI / 2;
  const arcs = slices.map(s => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep);
    const xi1 = cx + iR * Math.cos(angle), yi1 = cy + iR * Math.sin(angle);
    const xi2 = cx + iR * Math.cos(angle + sweep), yi2 = cy + iR * Math.sin(angle + sweep);
    const lg = sweep > Math.PI ? 1 : 0;
    const path = `M${x1} ${y1} A${r} ${r} 0 ${lg} 1 ${x2} ${y2} L${xi2} ${yi2} A${iR} ${iR} 0 ${lg} 0 ${xi1} ${yi1}Z`;
    angle += sweep;
    return { ...s, path };
  });
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {arcs.map((a, i) => (
          <Tooltip key={i} title={`${a.label}: ${a.value} (${Math.round((a.value / total) * 100)}%)`} arrow>
            <path d={a.path} fill={a.color} stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')} />
          </Tooltip>
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={800} fill="#1e293b">{total}</text>
        <text x={cx} y={cx + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">bookings</text>
      </svg>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {slices.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 65, fontSize: '0.7rem' }}>{s.label}</Typography>
            <Typography variant="caption" fontWeight={700} color="text.primary">{s.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Daily/Monthly Bar Chart (SVG) ────────────────────────────────────────────

function ActivityChart({
  bars,
  xLabel,
}: {
  bars: { label: string; approved: number; pending: number; rejected: number }[];
  xLabel?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...bars.map(d => d.approved + d.pending + d.rejected), 1);
  const W = 560; const H = 150; const PL = 28; const PB = 22; const PT = 10;
  const cW = W - PL - 4; const cH = H - PB - PT;
  const barW = Math.max(Math.floor((cW / bars.length) * 0.55), 4);
  const gap = cW / bars.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map((frac, i) => {
        const y = PT + cH - frac * cH;
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - 4} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray={frac > 0 ? '3 3' : undefined} />
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{Math.round(frac * maxVal)}</text>
          </g>
        );
      })}
      {bars.map((d, i) => {
        const x = PL + i * gap + (gap - barW) / 2;
        const total = d.approved + d.pending + d.rejected;
        const bH = (total / maxVal) * cH;
        const aH = (d.approved / maxVal) * cH;
        const pH = (d.pending / maxVal) * cH;
        const rH = (d.rejected / maxVal) * cH;
        const baseY = PT + cH;
        const isH = hovered === i;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            {rH > 0 && <rect x={x} y={baseY - rH} width={barW} height={rH} fill="#ef4444" opacity={isH ? 1 : 0.82} rx={1} />}
            {pH > 0 && <rect x={x} y={baseY - rH - pH} width={barW} height={pH} fill="#f59e0b" opacity={isH ? 1 : 0.82} />}
            {aH > 0 && <rect x={x} y={baseY - rH - pH - aH} width={barW} height={aH} fill="#10b981" opacity={isH ? 1 : 0.82} rx={1} />}
            {isH && total > 0 && (
              <g>
                <rect x={x - 18} y={PT + cH - bH - 46} width={barW + 36} height={42} rx={4} fill="#1e293b" opacity={0.92} />
                <text x={x + barW / 2} y={PT + cH - bH - 31} textAnchor="middle" fontSize={9} fill="#10b981">✓ {d.approved}</text>
                <text x={x + barW / 2} y={PT + cH - bH - 20} textAnchor="middle" fontSize={9} fill="#f59e0b">⏳ {d.pending}</text>
                <text x={x + barW / 2} y={PT + cH - bH - 9} textAnchor="middle" fontSize={9} fill="#ef4444">✗ {d.rejected}</text>
              </g>
            )}
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize={bars.length > 20 ? 7 : 9} fill="#94a3b8">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Booking Table (reusable) ─────────────────────────────────────────────────

function BookingTable({
  rows,
  onViewDetails,
  emptyMsg = 'No booking records found.',
}: {
  rows: Booking[];
  onViewDetails: (b: Booking) => void;
  emptyMsg?: string;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    let r = rows;
    if (statusFilter !== 'all') r = r.filter(b => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(b =>
        getDisplayName(b).toLowerCase().includes(q) ||
        getUserEmail(b).toLowerCase().includes(q) ||
        (b.computerId?.name || '').toLowerCase().includes(q) ||
        (b.reason || '').toLowerCase().includes(q)
      );
    }
    return r;
  }, [rows, statusFilter, search]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = { all: rows.length };
    rows.forEach(b => { m[b.status] = (m[b.status] || 0) + 1; });
    return m;
  }, [rows]);

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Search user, computer, reason…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 260 }}
        />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'rejected', 'cancelled', 'completed'].map(s => (
            <Chip
              key={s}
              label={`${s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] || 0})`}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              size="small"
              variant={statusFilter === s ? 'filled' : 'outlined'}
              sx={{
                fontWeight: statusFilter === s ? 800 : 500,
                fontSize: '0.68rem',
                textTransform: 'capitalize',
                bgcolor: statusFilter === s ? (s === 'all' ? '#0f172a' : STATUS_BG[s]) : undefined,
                color: statusFilter === s ? (s === 'all' ? '#fff' : STATUS_COLORS[s]) : '#64748b',
                borderColor: '#e2e8f0',
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              {['#', 'User', 'Computer', 'Booking Dates', 'Time', 'Status', 'GPU', 'Mentor', 'Requested On', ''].map((h, i) => (
                <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', whiteSpace: 'nowrap' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">{emptyMsg}</Typography>
                </TableCell>
              </TableRow>
            ) : paginated.map((b, i) => (
              <TableRow key={b._id} hover onClick={() => onViewDetails(b)} sx={{ cursor: 'pointer' }}>
                <TableCell sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>{page * rowsPerPage + i + 1}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 130 }}>{getDisplayName(b)}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 130 }}>{getUserEmail(b)}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 100 }}>{b.computerId?.name || '—'}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="caption">{fmtDate(b.startDate)}</Typography>
                  {b.startDate !== b.endDate && (
                    <Typography variant="caption" color="text.secondary" display="block">→ {fmtDate(b.endDate)}</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="caption">{b.startTime} – {b.endTime}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={b.status} size="small" sx={{ fontWeight: 700, fontSize: '0.62rem', textTransform: 'capitalize', bgcolor: STATUS_BG[b.status], color: STATUS_COLORS[b.status], height: 19 }} />
                </TableCell>
                <TableCell>
                  {b.requiresGPU
                    ? <Chip label="GPU" size="small" sx={{ bgcolor: '#f5f3ff', color: '#8b5cf6', fontWeight: 700, fontSize: '0.6rem', height: 18 }} />
                    : <Typography variant="caption" color="text.secondary">CPU</Typography>}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" noWrap sx={{ maxWidth: 90, display: 'block' }} color="text.secondary">{b.mentor || '—'}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="caption" color="text.secondary">{b.createdAt ? fmtDate(b.createdAt) : '—'}</Typography>
                </TableCell>
                <TableCell align="center" onClick={e => { e.stopPropagation(); onViewDetails(b); }}>
                  <Tooltip title="View details">
                    <IconButton size="small" sx={{ color: 'primary.main' }}><OpenInNewIcon fontSize="inherit" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        sx={{ borderTop: '1px solid #f1f5f9' }}
      />
    </Box>
  );
}

// ─── Excel Export Logic ───────────────────────────────────────────────────────

function buildExcel(
  periodLabel: string,
  allBookings: Booking[],
  periodBookings: Booking[],
) {
  buildExcelReport(periodLabel, allBookings, periodBookings).catch(err =>
    console.error('Export failed:', err)
  );
}

// ─── Period Navigator ─────────────────────────────────────────────────────────

function PeriodNavigator({
  viewMode, setViewMode,
  viewYear, setViewYear,
  viewMonth, setViewMonth,
}: {
  viewMode: 'month' | 'year';
  setViewMode: (m: 'month' | 'year') => void;
  viewYear: number;
  setViewYear: React.Dispatch<React.SetStateAction<number>>;
  viewMonth: number;
  setViewMonth: React.Dispatch<React.SetStateAction<number>>;
}) {
  const now = new Date();
  const isCurrentPeriod = viewMode === 'month'
    ? viewMonth === now.getMonth() && viewYear === now.getFullYear()
    : viewYear === now.getFullYear();

  const prev = () => {
    if (viewMode === 'month') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    } else {
      setViewYear(y => y - 1);
    }
  };
  const next = () => {
    if (isCurrentPeriod) return;
    if (viewMode === 'month') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    } else {
      setViewYear(y => y + 1);
    }
  };

  const periodLabel = viewMode === 'month' ? `${MONTH_NAMES[viewMonth]} ${viewYear}` : `Year ${viewYear}`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      {/* Month / Year toggle */}
      <Box sx={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        {(['month', 'year'] as const).map(m => (
          <Button
            key={m}
            size="small"
            onClick={() => setViewMode(m)}
            variant={viewMode === m ? 'contained' : 'text'}
            disableElevation
            sx={{
              px: 2, py: 0.5, fontWeight: 700, fontSize: '0.75rem', borderRadius: 0,
              textTransform: 'capitalize', minWidth: 70,
              bgcolor: viewMode === m ? '#0f172a' : 'transparent',
              color: viewMode === m ? '#fff' : '#64748b',
              '&:hover': { bgcolor: viewMode === m ? '#1e293b' : '#f1f5f9' },
            }}
          >
            {m}
          </Button>
        ))}
      </Box>

      {/* Navigator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, px: 1, py: 0.5 }}>
        <IconButton size="small" onClick={prev} sx={{ color: '#475569', p: 0.5 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 12 }} />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 160, justifyContent: 'center' }}>
          <CalendarMonthIcon sx={{ fontSize: 14, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={700} color="#0f172a">{periodLabel}</Typography>
        </Box>
        <IconButton size="small" onClick={next} disabled={isCurrentPeriod} sx={{ color: '#475569', p: 0.5 }}>
          <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  periodBookings,
  viewMode,
  viewYear,
  viewMonth,
  onViewDetails,
  periodLabel,
}: {
  periodBookings: Booking[];
  viewMode: 'month' | 'year';
  viewYear: number;
  viewMonth: number;
  onViewDetails: (b: Booking) => void;
  periodLabel: string;
}) {
  // KPI
  const kpis = useMemo(() => {
    const total = periodBookings.length;
    const approved = periodBookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
    const rejected = periodBookings.filter(b => b.status === 'rejected').length;
    const pending = periodBookings.filter(b => b.status === 'pending').length;
    const cancelled = periodBookings.filter(b => b.status === 'cancelled').length;
    const gpu = periodBookings.filter(b => b.requiresGPU).length;
    const rate = (approved + rejected) > 0 ? `${Math.round((approved / (approved + rejected)) * 100)}%` : 'N/A';
    return { total, approved, rejected, pending, cancelled, gpu, rate };
  }, [periodBookings]);

  // Activity bars
  const activityBars = useMemo(() => {
    if (viewMode === 'month') {
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const label = day === 1 || day % 5 === 0 || day === daysInMonth ? String(day) : '';
        const dayBs = periodBookings.filter(b => {
          const d = new Date(b.createdAt || b.startDate);
          return d.getDate() === day;
        });
        return { label, approved: dayBs.filter(b => b.status === 'approved' || b.status === 'completed').length, pending: dayBs.filter(b => b.status === 'pending').length, rejected: dayBs.filter(b => b.status === 'rejected' || b.status === 'cancelled').length };
      });
    } else {
      return MONTH_SHORT.map((label, mi) => {
        const mb = periodBookings.filter(b => new Date(b.createdAt || b.startDate).getMonth() === mi);
        return { label, approved: mb.filter(b => b.status === 'approved' || b.status === 'completed').length, pending: mb.filter(b => b.status === 'pending').length, rejected: mb.filter(b => b.status === 'rejected' || b.status === 'cancelled').length };
      });
    }
  }, [periodBookings, viewMode, viewMonth, viewYear]);

  // Computer utilization
  const sysStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; hours: number }> = {};
    periodBookings.filter(b => b.status === 'approved' || b.status === 'completed').forEach(b => {
      const id = b.computerId?._id || 'x';
      if (!map[id]) map[id] = { name: b.computerId?.name || 'Unknown', count: 0, hours: 0 };
      map[id].count++; map[id].hours += calcHours(b);
    });
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [periodBookings]);

  // Top users
  const userStats = useMemo(() => {
    const map: Record<string, { name: string; email: string; total: number; approved: number }> = {};
    periodBookings.forEach(b => {
      const key = getUserEmail(b) || b._id;
      if (!map[key]) map[key] = { name: getDisplayName(b), email: getUserEmail(b), total: 0, approved: 0 };
      map[key].total++;
      if (b.status === 'approved' || b.status === 'completed') map[key].approved++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [periodBookings]);

  return (
    <Box>
      {/* KPI Cards */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
        <KpiCard label="Total Requests" value={kpis.total} color="#3b82f6" bg="#eff6ff" icon={<CalendarMonthIcon sx={{ fontSize: 14 }} />} />
        <KpiCard label="Approved" value={kpis.approved} color="#10b981" bg="#ecfdf5" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} />
        <KpiCard label="Pending" value={kpis.pending} color="#f59e0b" bg="#fffbeb" icon={<ScheduleIcon sx={{ fontSize: 14 }} />} />
        <KpiCard label="Rejected" value={kpis.rejected} color="#ef4444" bg="#fef2f2" icon={<CancelIcon sx={{ fontSize: 14 }} />} />
        <KpiCard label="Cancelled" value={kpis.cancelled} color="#6b7280" bg="#f9fafb" icon={<CancelIcon sx={{ fontSize: 14 }} />} />
        <KpiCard label="GPU Requests" value={kpis.gpu} color="#8b5cf6" bg="#f5f3ff" icon={<MemoryIcon sx={{ fontSize: 14 }} />} />
        <KpiCard label="Approval Rate" value={kpis.rate} color="#0891b2" bg="#ecfeff" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} />
      </Box>

      {/* Charts row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 2.5 }}>
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                  {viewMode === 'month' ? 'Daily Activity' : 'Monthly Activity'} — {periodLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">Hover bars to see breakdown</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[{ c: '#10b981', l: 'Approved' }, { c: '#f59e0b', l: 'Pending' }, { c: '#ef4444', l: 'Rejected' }].map(l => (
                  <Box key={l.l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: l.c }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>{l.l}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ height: 155 }}><ActivityChart bars={activityBars} /></Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>Status Distribution</Typography>
            <DonutChart slices={[
              { value: kpis.approved, color: '#10b981', label: 'Approved' },
              { value: kpis.pending, color: '#f59e0b', label: 'Pending' },
              { value: kpis.rejected, color: '#ef4444', label: 'Rejected' },
              { value: kpis.cancelled, color: '#94a3b8', label: 'Cancelled' },
            ]} />
          </CardContent>
        </Card>
      </Box>

      {/* Rankings */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
        {/* System utilization */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ComputerIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">System Utilization (Approved hrs)</Typography>
            </Box>
            {sysStats.length === 0 ? (
              <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 3, textAlign: 'center' }}>No approved bookings.</Typography>
            ) : sysStats.slice(0, 6).map((c, i) => {
              const pct = Math.max((c.hours / (sysStats[0]?.hours || 1)) * 100, 5);
              return (
                <Box key={i} sx={{ mb: 1.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="caption" fontWeight={700} color="#94a3b8">#{i + 1}</Typography>
                      <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{c.hours}h · {c.count} bookings</Typography>
                  </Box>
                  <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                    <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: i === 0 ? '#3b82f6' : '#93c5fd', borderRadius: 3 }} />
                  </Box>
                </Box>
              );
            })}
          </CardContent>
        </Card>

        {/* Top users */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <PeopleIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">Most Active Users</Typography>
            </Box>
            {userStats.length === 0 ? (
              <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 3, textAlign: 'center' }}>No user activity.</Typography>
            ) : userStats.map((u, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: i < userStats.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 26, height: 26, bgcolor: '#ede9fe', color: '#8b5cf6', fontSize: '0.7rem', fontWeight: 800 }}>
                    {(u.name[0] || '?').toUpperCase()}
                  </Avatar>
                  <Box sx={{ maxWidth: 150 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{u.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{u.email}</Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" fontWeight={700}>{u.total} req</Typography>
                  <Typography variant="caption" color="#10b981" display="block">{u.approved} ✓</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* Full records table */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2, pb: '0 !important' }}>
          <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>
            Booking Records — {periodLabel}
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
        </CardContent>
        <BookingTable rows={periodBookings} onViewDetails={onViewDetails} emptyMsg={`No records for ${periodLabel}.`} />
      </Card>
    </Box>
  );
}

// ─── Per User Tab ─────────────────────────────────────────────────────────────

function PerUserTab({ allBookings, onViewDetails }: { allBookings: Booking[]; onViewDetails: (b: Booking) => void }) {
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Build user list from all bookings
  const userList = useMemo(() => {
    const map: Record<string, { name: string; email: string; total: number }> = {};
    allBookings.forEach(b => {
      const key = getUserEmail(b) || b._id;
      if (!map[key]) map[key] = { name: getDisplayName(b), email: getUserEmail(b), total: 0 };
      map[key].total++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allBookings]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return userList;
    const q = search.toLowerCase();
    return userList.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [userList, search]);

  const selectedUser = selectedEmail ? userList.find(u => u.email === selectedEmail) : null;
  const userBookings = useMemo(() =>
    selectedEmail ? allBookings.filter(b => getUserEmail(b) === selectedEmail) : []
  , [allBookings, selectedEmail]);

  // User KPIs
  const uKpis = useMemo(() => {
    const total = userBookings.length;
    const approved = userBookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
    const rejected = userBookings.filter(b => b.status === 'rejected').length;
    const pending = userBookings.filter(b => b.status === 'pending').length;
    const gpu = userBookings.filter(b => b.requiresGPU).length;
    const hours = userBookings.filter(b => b.status === 'approved' || b.status === 'completed').reduce((s, b) => s + calcHours(b), 0);
    return { total, approved, rejected, pending, gpu, hours };
  }, [userBookings]);

  // Activity chart for user (monthly, last 12 months)
  const userChartBars = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const mb = userBookings.filter(b => {
        const bd = new Date(b.createdAt || b.startDate);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      });
      return {
        label: MONTH_SHORT[d.getMonth()],
        approved: mb.filter(b => b.status === 'approved' || b.status === 'completed').length,
        pending: mb.filter(b => b.status === 'pending').length,
        rejected: mb.filter(b => b.status === 'rejected' || b.status === 'cancelled').length,
      };
    });
  }, [userBookings]);

  // System preference
  const sysPreference = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    userBookings.forEach(b => {
      const id = b.computerId?._id || 'x';
      if (!map[id]) map[id] = { name: b.computerId?.name || 'Unknown', count: 0 };
      map[id].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [userBookings]);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 2 }}>
      {/* Left: User Search Panel */}
      <Box>
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', position: 'sticky', top: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <PersonIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">Search User</Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ mb: 1.5 }}
            />
            <Box sx={{ maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {filteredUsers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 2, textAlign: 'center' }}>No users found</Typography>
              ) : filteredUsers.map(u => (
                <Box
                  key={u.email}
                  onClick={() => setSelectedEmail(u.email)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: 1.5, cursor: 'pointer',
                    bgcolor: selectedEmail === u.email ? '#ede9fe' : 'transparent',
                    border: selectedEmail === u.email ? '1px solid #c4b5fd' : '1px solid transparent',
                    '&:hover': { bgcolor: selectedEmail === u.email ? '#ede9fe' : '#f8fafc' },
                  }}
                >
                  <Avatar sx={{ width: 28, height: 28, bgcolor: '#f5f3ff', color: '#8b5cf6', fontSize: '0.72rem', fontWeight: 800 }}>
                    {(u.name[0] || '?').toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{u.name || u.email}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{u.email}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.total} bookings</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Right: User Analytics */}
      <Box>
        {!selectedUser ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 1.5 }}>
            <PersonIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>Select a user to view analytics</Typography>
            <Typography variant="body2" color="text.secondary">Search and click a user from the left panel</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* User header */}
            <Card sx={{ borderRadius: 3, border: '1px solid #c4b5fd', bgcolor: '#faf5ff', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: '#8b5cf6', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
                    {(selectedUser.name[0] || '?').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={800} color="#0f172a">{selectedUser.name}</Typography>
                    <Typography variant="body2" color="#64748b">{selectedUser.email}</Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportUserReport(selectedUser.name, selectedUser.email, userBookings, uKpis).catch(console.error)}
                    sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.72rem', borderColor: '#c4b5fd', color: '#8b5cf6' }}
                  >
                    Export
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* User KPIs */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <KpiCard label="Total Requests" value={uKpis.total} color="#3b82f6" bg="#eff6ff" icon={<CalendarMonthIcon sx={{ fontSize: 14 }} />} />
              <KpiCard label="Approved" value={uKpis.approved} color="#10b981" bg="#ecfdf5" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} />
              <KpiCard label="Pending" value={uKpis.pending} color="#f59e0b" bg="#fffbeb" icon={<ScheduleIcon sx={{ fontSize: 14 }} />} />
              <KpiCard label="Rejected" value={uKpis.rejected} color="#ef4444" bg="#fef2f2" icon={<CancelIcon sx={{ fontSize: 14 }} />} />
              <KpiCard label="GPU Requests" value={uKpis.gpu} color="#8b5cf6" bg="#f5f3ff" icon={<MemoryIcon sx={{ fontSize: 14 }} />} />
              <KpiCard label="Total Approved Hours" value={`${uKpis.hours}h`} color="#0891b2" bg="#ecfeff" icon={<ScheduleIcon sx={{ fontSize: 14 }} />} />
            </Box>

            {/* Chart + System preference */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>Monthly Booking Activity (12 months)</Typography>
                  <Box sx={{ height: 150 }}><ActivityChart bars={userChartBars} /></Box>
                </CardContent>
              </Card>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>Preferred Systems</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {sysPreference.slice(0, 5).map((s, i) => {
                      const pct = Math.max((s.count / (sysPreference[0]?.count || 1)) * 100, 10);
                      return (
                        <Box key={i}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                            <Typography variant="caption" fontWeight={700}>{s.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{s.count}</Typography>
                          </Box>
                          <Box sx={{ height: 5, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                            <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: '#8b5cf6', borderRadius: 3 }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* User bookings table */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2, pb: '0 !important' }}>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>All Bookings by {selectedUser.name}</Typography>
                <Divider sx={{ mb: 1.5 }} />
              </CardContent>
              <BookingTable rows={userBookings} onViewDetails={onViewDetails} emptyMsg="No bookings for this user." />
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Per System Tab ───────────────────────────────────────────────────────────

function PerSystemTab({ allBookings, onViewDetails }: { allBookings: Booking[]; onViewDetails: (b: Booking) => void }) {
  const [selectedSysId, setSelectedSysId] = useState<string>('');

  // Build systems list
  const sysList = useMemo(() => {
    const map: Record<string, { id: string; name: string; count: number }> = {};
    allBookings.forEach(b => {
      const id = b.computerId?._id || 'unknown';
      if (!map[id]) map[id] = { id, name: b.computerId?.name || 'Unknown', count: 0 };
      map[id].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [allBookings]);

  const sysBookings = useMemo(() =>
    selectedSysId ? allBookings.filter(b => b.computerId?._id === selectedSysId) : []
  , [allBookings, selectedSysId]);

  const selectedSys = sysList.find(s => s.id === selectedSysId);

  // System KPIs
  const sKpis = useMemo(() => {
    const total = sysBookings.length;
    const approved = sysBookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
    const rejected = sysBookings.filter(b => b.status === 'rejected').length;
    const pending = sysBookings.filter(b => b.status === 'pending').length;
    const gpu = sysBookings.filter(b => b.requiresGPU).length;
    const hours = sysBookings.filter(b => b.status === 'approved' || b.status === 'completed').reduce((s, b) => s + calcHours(b), 0);
    const uniqueUsers = new Set(sysBookings.map(b => getUserEmail(b) || b.userId)).size;
    return { total, approved, rejected, pending, gpu, hours, uniqueUsers };
  }, [sysBookings]);

  // Monthly chart for system
  const sysChartBars = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const mb = sysBookings.filter(b => {
        const bd = new Date(b.createdAt || b.startDate);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      });
      return {
        label: MONTH_SHORT[d.getMonth()],
        approved: mb.filter(b => b.status === 'approved' || b.status === 'completed').length,
        pending: mb.filter(b => b.status === 'pending').length,
        rejected: mb.filter(b => b.status === 'rejected' || b.status === 'cancelled').length,
      };
    });
  }, [sysBookings]);

  // Top users for this system
  const sysUserStats = useMemo(() => {
    const map: Record<string, { name: string; email: string; total: number; approved: number }> = {};
    sysBookings.forEach(b => {
      const key = getUserEmail(b) || b._id;
      if (!map[key]) map[key] = { name: getDisplayName(b), email: getUserEmail(b), total: 0, approved: 0 };
      map[key].total++;
      if (b.status === 'approved' || b.status === 'completed') map[key].approved++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [sysBookings]);

  return (
    <Box>
      {/* System selector */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">Select System</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Choose a computer / system</InputLabel>
              <Select
                value={selectedSysId}
                label="Choose a computer / system"
                onChange={e => setSelectedSysId(e.target.value)}
              >
                {sysList.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.count} bookings</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedSys && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportSystemReport(selectedSys.name, sysBookings, sKpis).catch(console.error)}
                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
              >
                Export System
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {!selectedSysId ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 1.5 }}>
          <StorageIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Select a system to view analytics</Typography>
          <Typography variant="body2" color="text.secondary">Use the dropdown above to choose a computer</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* System KPIs */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <KpiCard label="Total Bookings" value={sKpis.total} color="#3b82f6" bg="#eff6ff" icon={<CalendarMonthIcon sx={{ fontSize: 14 }} />} />
            <KpiCard label="Approved" value={sKpis.approved} color="#10b981" bg="#ecfdf5" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} />
            <KpiCard label="Pending" value={sKpis.pending} color="#f59e0b" bg="#fffbeb" icon={<ScheduleIcon sx={{ fontSize: 14 }} />} />
            <KpiCard label="Rejected" value={sKpis.rejected} color="#ef4444" bg="#fef2f2" icon={<CancelIcon sx={{ fontSize: 14 }} />} />
            <KpiCard label="GPU Requests" value={sKpis.gpu} color="#8b5cf6" bg="#f5f3ff" icon={<MemoryIcon sx={{ fontSize: 14 }} />} />
            <KpiCard label="Total Approved Hours" value={`${sKpis.hours}h`} color="#0891b2" bg="#ecfeff" icon={<ScheduleIcon sx={{ fontSize: 14 }} />} />
            <KpiCard label="Unique Users" value={sKpis.uniqueUsers} color="#f97316" bg="#fff7ed" icon={<PeopleIcon sx={{ fontSize: 14 }} />} />
          </Box>

          {/* Chart + Top users */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>Monthly Booking Activity</Typography>
                <Box sx={{ height: 150 }}><ActivityChart bars={sysChartBars} /></Box>
              </CardContent>
            </Card>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <PeopleIcon sx={{ fontSize: 16, color: '#f97316' }} />
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a">Top Users (this system)</Typography>
                </Box>
                {sysUserStats.map((u, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.65, borderBottom: i < sysUserStats.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 22, height: 22, bgcolor: '#fff7ed', color: '#f97316', fontSize: '0.62rem', fontWeight: 800 }}>
                        {(u.name[0] || '?').toUpperCase()}
                      </Avatar>
                      <Box sx={{ maxWidth: 120 }}>
                        <Typography variant="caption" fontWeight={700} noWrap display="block">{u.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">{u.email}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" fontWeight={700}>{u.total}</Typography>
                      <Typography variant="caption" color="#10b981" display="block">{u.approved} ✓</Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>

          {/* System bookings table */}
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, pb: '0 !important' }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>All Bookings for {selectedSys?.name}</Typography>
              <Divider sx={{ mb: 1.5 }} />
            </CardContent>
            <BookingTable rows={sysBookings} onViewDetails={onViewDetails} emptyMsg="No bookings for this system." />
          </Card>
        </Box>
      )}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminAnalytics: React.FC<Props> = ({ bookings, onViewDetails }) => {
  const now = new Date();
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [innerTab, setInnerTab] = useState(0); // 0=Overview, 1=Per User, 2=Per System

  const periodLabel = viewMode === 'month' ? `${MONTH_NAMES[viewMonth]} ${viewYear}` : `Year ${viewYear}`;

  // Filter bookings for overview/period tab
  const periodBookings = useMemo(() => {
    return bookings.filter(b => {
      const d = b.createdAt ? new Date(b.createdAt) : new Date(b.startDate);
      if (viewMode === 'month') return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
      return d.getFullYear() === viewYear;
    });
  }, [bookings, viewMode, viewMonth, viewYear]);

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a">Booking Analytics</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
            Data exploratory dashboard — browse by period, user, or system
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Period navigator (only relevant for Overview tab) */}
          {innerTab === 0 && (
            <PeriodNavigator
              viewMode={viewMode} setViewMode={setViewMode}
              viewYear={viewYear} setViewYear={setViewYear}
              viewMonth={viewMonth} setViewMonth={setViewMonth}
            />
          )}
          {/* Export full report */}
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            disableElevation
            onClick={() => buildExcel(periodLabel, bookings, periodBookings)}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: 2,
              bgcolor: '#0f172a',
              '&:hover': { bgcolor: '#1e293b' },
              whiteSpace: 'nowrap',
            }}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* ── Sub-tabs ── */}
      <Box sx={{ mb: 2.5, borderBottom: '1px solid #e2e8f0' }}>
        <Tabs
          value={innerTab}
          onChange={(_, v) => setInnerTab(v)}
          TabIndicatorProps={{ style: { backgroundColor: '#0f172a' } }}
          sx={{
            '& .MuiTab-root': { fontWeight: 700, fontSize: '0.8rem', textTransform: 'none', color: '#64748b', minHeight: 42 },
            '& .Mui-selected': { color: '#0f172a !important' },
          }}
        >
          <Tab icon={<BarChartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Overview" />
          <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="User Analytics" />
          <Tab icon={<StorageIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="System Analytics" />
          <Tab icon={<ComputerIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Real-Time View" />
        </Tabs>
      </Box>

      {/* ── Tab Panels ── */}
      {innerTab === 0 && (
        <OverviewTab
          periodBookings={periodBookings}
          viewMode={viewMode}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onViewDetails={onViewDetails}
          periodLabel={periodLabel}
        />
      )}
      {innerTab === 1 && <PerUserTab allBookings={bookings} onViewDetails={onViewDetails} />}
      {innerTab === 2 && <PerSystemTab allBookings={bookings} onViewDetails={onViewDetails} />}
      {innerTab === 3 && <RealTimeTab />}
    </Box>
  );
};

interface RealTimeComputer {
  _id: string;
  name: string;
  location: string;
  isOnline: boolean;
  lastSeen: string | null;
  agentActiveSession?: {
    currentUser: string;
    email: string;
    agenda: string;
    sessionType: string;
    checkedIn: boolean;
    checkInTime: string;
  };
  liveMetrics?: {
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
  };
}

function RealTimeTab() {
  const [computers, setComputers] = useState<RealTimeComputer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOnline, setFilterOnline] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedComp, setSelectedComp] = useState<RealTimeComputer | null>(null);

  const fetchLive = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await computersAPI.getAllComputers(false);
      const sorted = res.data.sort((a: any, b: any) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      setComputers(sorted);
    } catch (err) {
      console.error("Failed to load real-time agent metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive(true);
    const interval = setInterval(() => {
      fetchLive(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  const filtered = useMemo(() => {
    return computers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase()) ||
        (c.agentActiveSession?.currentUser || '').toLowerCase().includes(search.toLowerCase());
      
      if (filterOnline === 'online') return matchSearch && c.isOnline;
      if (filterOnline === 'offline') return matchSearch && !c.isOnline;
      return matchSearch;
    });
  }, [computers, search, filterOnline]);

  const stats = useMemo(() => {
    const total = computers.length;
    const online = computers.filter(c => c.isOnline).length;
    const activeSessions = computers.filter(c => c.isOnline && c.agentActiveSession?.checkedIn).length;
    return { total, online, activeSessions };
  }, [computers]);

  const formatNetSpeed = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getMetricColor = (val: number) => {
    if (val > 80) return 'error';
    if (val > 50) return 'warning';
    return 'primary';
  };

  if (loading && computers.length === 0) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">Connecting to live metrics gateway...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                Total Computers
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                Online Agents
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                <Typography variant="h4" fontWeight={800} color="#10b981">
                  {stats.online}
                </Typography>
                <Chip label="Live" color="success" size="small" sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                Active Checked-In Sessions
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#3b82f6" sx={{ mt: 0.5 }}>
                {stats.activeSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by machine name, user, location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={filterOnline}
            onChange={e => setFilterOnline(e.target.value as any)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">All Systems</MenuItem>
            <MenuItem value="online">Online Only</MenuItem>
            <MenuItem value="offline">Offline Only</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Machine</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Logged User / Agenda</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Session</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>CPU</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>RAM</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>GPU</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Network Traffic</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Temps</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No online computers or matching results found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(computer => (
                <TableRow key={computer._id} hover onClick={() => setSelectedComp(computer)} sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <ComputerIcon sx={{ color: computer.isOnline ? '#10b981' : '#94a3b8' }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">{computer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{computer.location}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {computer.isOnline ? (
                      <Chip label="Online" color="success" size="small" sx={{ fontWeight: 800, height: 22 }} />
                    ) : (
                      <Tooltip title={computer.lastSeen ? `Last seen: ${new Date(computer.lastSeen).toLocaleString()}` : 'Never seen'}>
                        <Chip label="Offline" color="default" size="small" sx={{ fontWeight: 700, height: 22 }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {computer.isOnline && computer.agentActiveSession?.checkedIn ? (
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {computer.agentActiveSession.currentUser}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Agenda: {computer.agentActiveSession.agenda}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Idle / Available
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {computer.isOnline && computer.agentActiveSession?.checkedIn ? (
                      <Chip 
                        label={computer.agentActiveSession.sessionType} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontSize: '0.65rem', fontWeight: 700 }} 
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  <TableCell>
                    {computer.isOnline && computer.liveMetrics ? (
                      <Box sx={{ minWidth: 60 }}>
                        <Typography variant="body2" fontWeight={700}>{Math.round(computer.liveMetrics.cpuUtil)}%</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={computer.liveMetrics.cpuUtil} 
                          color={getMetricColor(computer.liveMetrics.cpuUtil)}
                          sx={{ height: 4, borderRadius: 2, mt: 0.5 }} 
                        />
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  <TableCell>
                    {computer.isOnline && computer.liveMetrics ? (
                      <Box sx={{ minWidth: 60 }}>
                        <Typography variant="body2" fontWeight={700}>{Math.round(computer.liveMetrics.ramUtil)}%</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={computer.liveMetrics.ramUtil} 
                          color={getMetricColor(computer.liveMetrics.ramUtil)}
                          sx={{ height: 4, borderRadius: 2, mt: 0.5 }} 
                        />
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  <TableCell>
                    {computer.isOnline && computer.liveMetrics ? (
                      <Box sx={{ minWidth: 60 }}>
                        <Typography variant="body2" fontWeight={700}>{Math.round(computer.liveMetrics.gpuUtil)}%</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={computer.liveMetrics.gpuUtil} 
                          color={getMetricColor(computer.liveMetrics.gpuUtil)}
                          sx={{ height: 4, borderRadius: 2, mt: 0.5 }} 
                        />
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  <TableCell>
                    {computer.isOnline && computer.liveMetrics ? (
                      <Box>
                        <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap' }}>
                          ↑ {formatNetSpeed(computer.liveMetrics.netSentSpeed)}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap' }}>
                          ↓ {formatNetSpeed(computer.liveMetrics.netRecvSpeed)}
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  <TableCell>
                    {computer.isOnline && computer.liveMetrics && (computer.liveMetrics.cpuTemp > 0 || computer.liveMetrics.gpuTemp > 0) ? (
                      <Box>
                        {computer.liveMetrics.cpuTemp > 0 && (
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            CPU: {Math.round(computer.liveMetrics.cpuTemp)}°C
                          </Typography>
                        )}
                        {computer.liveMetrics.gpuTemp > 0 && (
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            GPU: {Math.round(computer.liveMetrics.gpuTemp)}°C
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Selected Computer Data Explorer Modal */}
      <Dialog open={!!selectedComp} onClose={() => setSelectedComp(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight="800">
            💻 Data Explorer: {selectedComp?.name}
          </Typography>
          <Chip
            label={selectedComp?.isOnline ? "Online" : "Offline"}
            color={selectedComp?.isOnline ? "success" : "default"}
            size="small"
            sx={{ fontWeight: 800 }}
          />
        </DialogTitle>
        <DialogContent dividers>
          {selectedComp && (
            <Grid container spacing={3}>
              {/* Specs & Active Session */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 1 }}>Live Attendance Session</Typography>
                <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: selectedComp.agentActiveSession?.checkedIn ? "#f0fdf4" : "#f8fafc" }}>
                  {selectedComp.agentActiveSession?.checkedIn ? (
                    <Box>
                      <Typography variant="body2" fontWeight="700">Student: {selectedComp.agentActiveSession.currentUser}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">Email: {selectedComp.agentActiveSession.email}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}><strong>Agenda:</strong> {selectedComp.agentActiveSession.agenda}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Check-In: {new Date(selectedComp.agentActiveSession.checkInTime).toLocaleString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">Machine is currently available / idle.</Typography>
                  )}
                </Card>

                <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 1 }}>Static System Specs</Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2"><strong>Location:</strong> {selectedComp.location}</Typography>
                    <Typography variant="body2"><strong>Last Seen:</strong> {selectedComp.lastSeen ? new Date(selectedComp.lastSeen).toLocaleString() : "Never"}</Typography>
                  </Box>
                </Card>
              </Grid>

              {/* Live Metrics Breakdown */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 1 }}>Live Resource Telemetry</Typography>
                {selectedComp.isOnline && selectedComp.liveMetrics ? (
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>CPU Load</Typography>
                        <Typography variant="body2" fontWeight={700}>{Math.round(selectedComp.liveMetrics.cpuUtil)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={selectedComp.liveMetrics.cpuUtil} color={getMetricColor(selectedComp.liveMetrics.cpuUtil)} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>Memory Load (RAM)</Typography>
                        <Typography variant="body2" fontWeight={700}>{Math.round(selectedComp.liveMetrics.ramUtil)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={selectedComp.liveMetrics.ramUtil} color={getMetricColor(selectedComp.liveMetrics.ramUtil)} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>GPU Core Util</Typography>
                        <Typography variant="body2" fontWeight={700}>{Math.round(selectedComp.liveMetrics.gpuUtil)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={selectedComp.liveMetrics.gpuUtil} color={getMetricColor(selectedComp.liveMetrics.gpuUtil)} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>

                    {selectedComp.liveMetrics.gpuMemTotal > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2"><strong>GPU VRAM:</strong> {Math.round(selectedComp.liveMetrics.gpuMemUsed)} / {Math.round(selectedComp.liveMetrics.gpuMemTotal)} MB</Typography>
                      </Box>
                    )}

                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <Typography variant="caption"><strong>CPU Temp:</strong> {selectedComp.liveMetrics.cpuTemp}°C</Typography>
                      <Typography variant="caption"><strong>GPU Temp:</strong> {selectedComp.liveMetrics.gpuTemp}°C</Typography>
                    </Box>
                  </Card>
                ) : (
                  <Card variant="outlined" sx={{ p: 2, bgcolor: "#fffbeb", border: "1px dashed #f59e0b" }}>
                    <Typography variant="body2" color="text.secondary">No live telemetry packets. Computer is currently offline.</Typography>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedComp(null)}>Close Explorer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminAnalytics;
