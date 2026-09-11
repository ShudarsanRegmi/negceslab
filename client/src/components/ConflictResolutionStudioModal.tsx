import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  Card,
  CardContent,
  Grid,
  Tooltip
} from '@mui/material';
import {
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Check,
  Ban,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Columns,
  List,
  Film,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  ArrowLeftRight
} from 'lucide-react';
import axios from 'axios';

interface Booking {
  _id: string;
  computerId: any;
  user?: { name?: string; email?: string } | any;
  userId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  createdAt: string;
  status: string;
}

interface DraftResolution {
  bookingId: string;
  userLabel: string;
  userEmail: string;
  action: 'APPROVE' | 'REJECT';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  originalStartDate: string;
  originalEndDate: string;
  originalStartTime: string;
  originalEndTime: string;
  color: string;
  rejectionReason?: string;
}

interface ConflictResolutionStudioModalProps {
  open: boolean;
  onClose: () => void;
  group: Booking[];
  onSuccess: () => void;
}

const COLOR_PALETTE = [
  '#2563eb', // royal blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#d97706', // amber
  '#059669', // emerald
  '#0891b2', // cyan
];

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
};

const minutesToTime = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const stepTime = (timeStr: string, deltaMinutes: number): string => {
  const mins = timeToMinutes(timeStr) + deltaMinutes;
  const clamped = Math.max(8 * 60, Math.min(18 * 60, mins));
  return minutesToTime(clamped);
};

const stepDate = (dateStr: string, deltaDays: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().split('T')[0];
};

const check2DOverlap = (
  b1: { startDate: string; endDate: string; startTime: string; endTime: string },
  b2: { startDate: string; endDate: string; startTime: string; endTime: string }
): boolean => {
  const dateOverlap = b1.startDate <= b2.endDate && b1.endDate >= b2.startDate;
  if (!dateOverlap) return false;
  return b1.startTime < b2.endTime && b1.endTime > b2.startTime;
};

export const ConflictResolutionStudioModal: React.FC<ConflictResolutionStudioModalProps> = ({
  open,
  onClose,
  group,
  onSuccess
}) => {
  const [drafts, setDrafts] = useState<DraftResolution[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'trimmer' | 'canvas' | 'cards'>('split');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (group && group.length > 0) {
      const sorted = [...group].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const initialDrafts: DraftResolution[] = sorted.map((b, index) => {
        const userName = b.user?.name || b.user?.email || `User ${index + 1}`;
        return {
          bookingId: b._id,
          userLabel: userName,
          userEmail: b.user?.email || '',
          action: 'APPROVE',
          startDate: b.startDate,
          endDate: b.endDate,
          startTime: b.startTime,
          endTime: b.endTime,
          originalStartDate: b.startDate,
          originalEndDate: b.endDate,
          originalStartTime: b.startTime,
          originalEndTime: b.endTime,
          color: COLOR_PALETTE[index % COLOR_PALETTE.length],
          rejectionReason: ''
        };
      });

      setDrafts(initialDrafts);
      setSelectedBookingId(initialDrafts[0]?.bookingId || null);
      setErrorMsg(null);
    }
  }, [group, open]);

  const dateSpan = useMemo(() => {
    if (!drafts.length) return [];
    let minTs = Infinity;
    let maxTs = -Infinity;

    drafts.forEach((d) => {
      const s = new Date(d.startDate + 'T00:00:00').getTime();
      const e = new Date(d.endDate + 'T00:00:00').getTime();
      if (s < minTs) minTs = s;
      if (e > maxTs) maxTs = e;
    });

    if (minTs === Infinity || maxTs === -Infinity) return [];

    const list: string[] = [];
    const cur = new Date(minTs);
    const end = new Date(maxTs);

    end.setDate(end.getDate() + 1);

    while (cur <= end) {
      list.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  }, [drafts]);

  const collisions = useMemo(() => {
    const collidingIds = new Set<string>();
    const approvedDrafts = drafts.filter((d) => d.action === 'APPROVE');

    for (let i = 0; i < approvedDrafts.length; i++) {
      for (let j = i + 1; j < approvedDrafts.length; j++) {
        const d1 = approvedDrafts[i];
        const d2 = approvedDrafts[j];
        if (check2DOverlap(d1, d2)) {
          collidingIds.add(d1.bookingId);
          collidingIds.add(d2.bookingId);
        }
      }
    }
    return collidingIds;
  }, [drafts]);

  const handleAutoResolve = () => {
    const newDrafts = drafts.map((d) => ({ ...d }));

    for (let i = 1; i < newDrafts.length; i++) {
      if (newDrafts[i].action === 'REJECT') continue;

      let current = newDrafts[i];
      let hasConflict = true;
      let attempts = 0;

      while (hasConflict && attempts < 20) {
        attempts++;
        hasConflict = false;

        for (let j = 0; j < i; j++) {
          if (newDrafts[j].action === 'REJECT') continue;
          const prev = newDrafts[j];

          if (check2DOverlap(current, prev)) {
            hasConflict = true;

            const curStartMin = timeToMinutes(current.startTime);
            const curEndMin = timeToMinutes(current.endTime);
            const duration = Math.max(30, curEndMin - curStartMin);

            const prevEndMin = timeToMinutes(prev.endTime);

            if (prevEndMin + duration <= 18 * 60) {
              current.startTime = minutesToTime(prevEndMin);
              current.endTime = minutesToTime(prevEndMin + duration);
            } else {
              const prevEndDate = new Date(prev.endDate + 'T00:00:00');
              prevEndDate.setDate(prevEndDate.getDate() + 1);
              const newDateStr = prevEndDate.toISOString().split('T')[0];

              const curS = new Date(current.startDate + 'T00:00:00');
              const curE = new Date(current.endDate + 'T00:00:00');
              const dayDiff = Math.max(
                0,
                Math.round((curE.getTime() - curS.getTime()) / (1000 * 3600 * 24))
              );

              current.startDate = newDateStr;
              const newEndObj = new Date(prevEndDate);
              newEndObj.setDate(newEndObj.getDate() + dayDiff);
              current.endDate = newEndObj.toISOString().split('T')[0];

              current.startTime = '09:00';
              current.endTime = minutesToTime(9 * 60 + duration);
            }
            break;
          }
        }
      }
    }

    setDrafts(newDrafts);
  };

  const handleReset = () => {
    setDrafts(
      drafts.map((d) => ({
        ...d,
        startDate: d.originalStartDate,
        endDate: d.originalEndDate,
        startTime: d.originalStartTime,
        endTime: d.originalEndTime,
        action: 'APPROVE',
        rejectionReason: ''
      }))
    );
  };

  const updateDraft = (bookingId: string, updates: Partial<DraftResolution>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.bookingId === bookingId ? { ...d, ...updates } : d))
    );
  };

  const handleSubmit = async () => {
    if (collisions.size > 0) {
      setErrorMsg('Cannot apply resolution while overlapping collisions exist among approved requests.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('dev_token');
      const payload = {
        resolutions: drafts.map((d) => ({
          bookingId: d.bookingId,
          action: d.action === 'REJECT' ? 'REJECT' : (
            d.startDate !== d.originalStartDate ||
            d.endDate !== d.originalEndDate ||
            d.startTime !== d.originalStartTime ||
            d.endTime !== d.originalEndTime ? 'APPROVE_MODIFIED' : 'APPROVE_ORIGINAL'
          ),
          startDate: d.startDate,
          endDate: d.endDate,
          startTime: d.startTime,
          endTime: d.endTime,
          rejectionReason: d.action === 'REJECT' ? (d.rejectionReason || 'Rejected during 2D conflict resolution') : undefined
        }))
      };

      await axios.post('/api/bookings/batch-resolve-conflict', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Batch resolve error:', err);
      setErrorMsg(
        err.response?.data?.message || 'Failed to apply batch resolution. Please check inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const computerName = group[0]?.computerId?.name || 'Target Computer';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isFullScreen}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: isFullScreen ? '100vw !important' : '95vw',
          height: isFullScreen ? '100vh !important' : '92vh',
          maxWidth: isFullScreen ? '100vw !important' : '1800px',
          maxHeight: isFullScreen ? '100vh !important' : '960px',
          m: isFullScreen ? '0 !important' : 'auto',
          borderRadius: isFullScreen ? '0 !important' : 3,
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isFullScreen ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
      sx={{
        '& .MuiDialog-container': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: isFullScreen ? '0 !important' : '16px !important',
        }
      }}
    >
      {/* Header Bar */}
      <DialogTitle
        sx={{
          py: 1,
          px: 3,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          minHeight: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 0.8,
              borderRadius: 2,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Sliders size={20} color="#38bdf8" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={800} color="#f8fafc" sx={{ lineHeight: 1.2 }}>
              2D Visual Conflict Resolution Studio
            </Typography>
            <Chip
              label={`System: ${computerName} • ${drafts.length} Conflicting Requests`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(255,255,255,0.1)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Studio"}>
            <IconButton
              size="small"
              onClick={() => setIsFullScreen(!isFullScreen)}
              sx={{ color: '#94a3b8', p: 0.8, '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' } }}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: '#94a3b8', p: 0.8, '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' } }}
          >
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Main Body Content */}
      <DialogContent sx={{ p: 1.5, px: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Status Alert Banner */}
        {collisions.size > 0 ? (
          <Alert
            severity="warning"
            icon={<AlertTriangle size={16} />}
            sx={{
              py: 0.4,
              px: 1.5,
              mb: 1,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.82rem',
              border: '1px solid #fde68a',
              flexShrink: 0
            }}
          >
            Overlap Collision Detected ({collisions.size} requests)! Click <strong>Auto-Resolve Gaps</strong> or adjust start/end slots on the right panel.
          </Alert>
        ) : (
          <Alert
            severity="success"
            icon={<CheckCircle2 size={16} />}
            sx={{
              py: 0.4,
              px: 1.5,
              mb: 1,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.82rem',
              border: '1px solid #a7f3d0',
              flexShrink: 0
            }}
          >
            All approved slots are non-overlapping in 2D space! Ready to apply resolution.
          </Alert>
        )}

        {/* Toolbar & Layout Switcher */}
        <Paper
          elevation={0}
          sx={{
            p: 0.8,
            px: 1.5,
            mb: 1,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<Sparkles size={16} />}
              onClick={handleAutoResolve}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                fontSize: '0.82rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                py: 0.6,
                px: 2.5,
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
              }}
            >
              Auto-Resolve Gaps
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RotateCcw size={15} />}
              onClick={handleReset}
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.82rem', textTransform: 'none', py: 0.6, px: 2, borderColor: '#cbd5e1' }}
            >
              Reset to Original
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 0.5, fontSize: '0.78rem' }}>
              View Mode:
            </Typography>
            <Button
              size="small"
              variant={viewMode === 'split' ? 'contained' : 'outlined'}
              startIcon={<Columns size={15} />}
              onClick={() => setViewMode('split')}
              sx={{ borderRadius: 1.8, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', py: 0.4, px: 1.5 }}
            >
              Split Studio
            </Button>
            <Button
              size="small"
              variant={viewMode === 'canvas' ? 'contained' : 'outlined'}
              startIcon={<LayoutGrid size={15} />}
              onClick={() => setViewMode('canvas')}
              sx={{ borderRadius: 1.8, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', py: 0.4, px: 1.5 }}
            >
              Full Canvas
            </Button>
            <Button
              size="small"
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              startIcon={<List size={15} />}
              onClick={() => setViewMode('cards')}
              sx={{ borderRadius: 1.8, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', py: 0.4, px: 1.5 }}
            >
              Cards Only
            </Button>
          </Box>
        </Paper>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0.5, px: 2, borderRadius: 2, fontSize: '0.82rem', flexShrink: 0 }}>
            {errorMsg}
          </Alert>
        )}

        {/* WORKSPACE AREA - SPACIOUS SPLIT VIEW */}
        <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', gap: 2.5, width: '100%', overflow: 'hidden' }}>
          {/* LEFT PANEL: 2D MATRIX CANVAS (SPACIOUS GOOGLE-CALENDAR STYLE) */}
          {(viewMode === 'split' || viewMode === 'canvas') && (
            <Paper
              elevation={0}
              sx={{
                flex: viewMode === 'split' ? '1 1 65%' : '1 1 100%',
                p: 2,
                borderRadius: 3,
                border: '1px solid #cbd5e1',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                width: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexShrink: 0 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#1e293b" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.8rem' }}>
                  2D TIMELINE MATRIX (X: Calendar Dates • Y: Hour Slots 08:00 - 18:00)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Hover/Click slot tile to select request
                </Typography>
              </Box>

              {/* Scrollable Timeline Grid */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', pr: 0.5 }}>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Date Header Row */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `80px repeat(${dateSpan.length}, 1fr)`,
                      gap: 1,
                      mb: 1,
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      background: '#fff',
                      pb: 0.5,
                      width: '100%'
                    }}
                  >
                    <Box sx={{ p: 1, fontWeight: 800, fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      TIME / DATE
                    </Box>
                    {dateSpan.map((d) => {
                      const dateObj = new Date(d + 'T00:00:00');
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const dateNum = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return (
                        <Paper
                          key={d}
                          elevation={0}
                          sx={{
                            p: 1,
                            textAlign: 'center',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="caption" fontWeight={800} color="#1e293b" display="block" sx={{ fontSize: '0.82rem' }}>
                            {dayName}
                          </Typography>
                          <Typography variant="caption" color="#64748b" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
                            {dateNum}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>

                  {/* Hourly Rows (GENEROUS 56px MIN-HEIGHT PER HOUR!) */}
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((timeHour) => {
                    const hourMin = timeToMinutes(timeHour);
                    const nextHourMin = hourMin + 60;

                    return (
                      <Box
                        key={timeHour}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: `80px repeat(${dateSpan.length}, 1fr)`,
                          gap: 1,
                          mb: 1,
                          minHeight: 56, // GENEROUS 56px HEIGHT FOR COMFORTABLE EVENT CARDS!
                          width: '100%'
                        }}
                      >
                        {/* Y-Axis Label */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#475569',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 1.8
                          }}
                        >
                          {timeHour}
                        </Box>

                        {/* Date Columns for this hour */}
                        {dateSpan.map((d) => {
                          const occupyingDrafts = drafts.filter((draft) => {
                            if (draft.action === 'REJECT') return false;
                            const inDateRange = draft.startDate <= d && draft.endDate >= d;
                            if (!inDateRange) return false;

                            const draftStartMin = timeToMinutes(draft.startTime);
                            const draftEndMin = timeToMinutes(draft.endTime);

                            return draftStartMin < nextHourMin && draftEndMin > hourMin;
                          });

                          return (
                            <Box
                              key={d}
                              sx={{
                                border: '1px dashed #cbd5e1',
                                borderRadius: 1.8,
                                p: 0.5,
                                minHeight: 56,
                                background: occupyingDrafts.length > 1 ? '#fff1f2' : '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                position: 'relative'
                              }}
                            >
                              {occupyingDrafts.map((draft) => {
                                const isColliding = collisions.has(draft.bookingId);
                                const isSelected = draft.bookingId === selectedBookingId;

                                return (
                                  <Tooltip
                                    key={draft.bookingId}
                                    title={`${draft.userLabel} (${draft.startDate} to ${draft.endDate}, ${draft.startTime}-${draft.endTime})`}
                                    arrow
                                  >
                                    <Paper
                                      onClick={() => setSelectedBookingId(draft.bookingId)}
                                      elevation={isSelected ? 4 : 1}
                                      sx={{
                                        p: 0.8,
                                        px: 1.2,
                                        borderRadius: 1.5,
                                        background: isColliding ? '#ef4444' : draft.color,
                                        color: '#fff',
                                        cursor: 'pointer',
                                        border: isSelected ? '2.5px solid #000' : 'none',
                                        transition: 'all 0.15s',
                                        '&:hover': { opacity: 0.95, transform: 'scale(1.01)' }
                                      }}
                                    >
                                      <Typography variant="body2" fontWeight={800} display="block" noWrap sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                                        {draft.userLabel}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.95, display: 'block', fontWeight: 600 }}>
                                        {draft.startTime} - {draft.endTime}
                                      </Typography>
                                    </Paper>
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Paper>
          )}

          {/* RIGHT PANEL: REQUEST ADJUSTMENT CARDS (SPACIOUS 380px SIDEBAR) */}
          {(viewMode === 'split' || viewMode === 'cards') && (
            <Paper
              elevation={0}
              sx={{
                flex: viewMode === 'split' ? '0 0 380px' : '1 1 100%',
                maxWidth: viewMode === 'split' ? '380px' : '100%',
                p: 2,
                borderRadius: 3,
                border: '1px solid #cbd5e1',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} color="#1e293b" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.8rem', flexShrink: 0 }}>
                Request Adjuster & Decisions ({drafts.length})
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', pr: 0.5, flexGrow: 1 }}>
                {drafts.map((draft) => {
                  const isColliding = collisions.has(draft.bookingId);
                  const isSelected = draft.bookingId === selectedBookingId;
                  const isModified =
                    draft.startDate !== draft.originalStartDate ||
                    draft.endDate !== draft.originalEndDate ||
                    draft.startTime !== draft.originalStartTime ||
                    draft.endTime !== draft.originalEndTime;

                  return (
                    <Card
                      key={draft.bookingId}
                      variant="outlined"
                      onClick={() => setSelectedBookingId(draft.bookingId)}
                      sx={{
                        borderRadius: 3,
                        borderColor: isColliding
                          ? '#ef4444'
                          : isSelected
                          ? draft.color
                          : '#e2e8f0',
                        borderWidth: isColliding || isSelected ? '2px' : '1px',
                        boxShadow: isSelected
                          ? `0 6px 16px ${draft.color}25`
                          : '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s',
                        flexShrink: 0
                      }}
                    >
                      <CardContent sx={{ p: 2, pb: '16px !important' }}>
                        {/* Card Top */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: draft.color }} />
                            <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ fontSize: '0.9rem' }}>
                              {draft.userLabel}
                            </Typography>
                            {isModified && (
                              <Chip
                                label="Modified"
                                size="small"
                                color="info"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                              />
                            )}
                          </Box>

                          {/* Action Switcher */}
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              variant={draft.action === 'APPROVE' ? 'contained' : 'outlined'}
                              color="success"
                              startIcon={<Check size={13} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDraft(draft.bookingId, { action: 'APPROVE' });
                              }}
                              sx={{ borderRadius: 1.8, textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', py: 0.3 }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant={draft.action === 'REJECT' ? 'contained' : 'outlined'}
                              color="error"
                              startIcon={<Ban size={13} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDraft(draft.bookingId, { action: 'REJECT' });
                              }}
                              sx={{ borderRadius: 1.8, textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', py: 0.3 }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </Box>

                        {/* Original Callout */}
                        <Box sx={{ p: 1, px: 1.2, mb: 1.5, borderRadius: 1.5, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ fontSize: '0.75rem' }}>
                            Original: {draft.originalStartDate} to {draft.originalEndDate} ({draft.originalStartTime} - {draft.originalEndTime})
                          </Typography>
                        </Box>

                        {draft.action === 'APPROVE' ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Grid container spacing={1.5}>
                              <Grid item xs={6}>
                                <TextField
                                  label="Start Date"
                                  type="date"
                                  size="small"
                                  fullWidth
                                  value={draft.startDate}
                                  onChange={(e) =>
                                    updateDraft(draft.bookingId, { startDate: e.target.value })
                                  }
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  label="End Date"
                                  type="date"
                                  size="small"
                                  fullWidth
                                  value={draft.endDate}
                                  onChange={(e) =>
                                    updateDraft(draft.bookingId, { endDate: e.target.value })
                                  }
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                            </Grid>

                            <Grid container spacing={1.5}>
                              <Grid item xs={6}>
                                <TextField
                                  label="Start Time"
                                  type="time"
                                  size="small"
                                  fullWidth
                                  value={draft.startTime}
                                  onChange={(e) =>
                                    updateDraft(draft.bookingId, { startTime: e.target.value })
                                  }
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  label="End Time"
                                  type="time"
                                  size="small"
                                  fullWidth
                                  value={draft.endTime}
                                  onChange={(e) =>
                                    updateDraft(draft.bookingId, { endTime: e.target.value })
                                  }
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        ) : (
                          <TextField
                            label="Rejection Reason"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Reason for rejection..."
                            value={draft.rejectionReason}
                            onChange={(e) =>
                              updateDraft(draft.bookingId, { rejectionReason: e.target.value })
                            }
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>

      {/* Footer Bar */}
      <DialogActions
        sx={{
          py: 1,
          px: 3,
          background: '#fff',
          borderTop: '1px solid #e2e8f0',
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: 0,
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
          Summary: <span style={{ color: '#059669' }}>{drafts.filter((d) => d.action === 'APPROVE').length} Approvals</span> •{' '}
          <span style={{ color: '#dc2626' }}>{drafts.filter((d) => d.action === 'REJECT').length} Rejections</span>
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={onClose}
            disabled={submitting}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            disabled={submitting || collisions.size > 0}
            onClick={handleSubmit}
            sx={{
              borderRadius: 2,
              fontWeight: 800,
              fontSize: '0.875rem',
              textTransform: 'none',
              px: 3.5,
              py: 0.8,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
            }}
          >
            {submitting ? 'Applying Resolutions...' : 'Confirm & Save Resolution'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
