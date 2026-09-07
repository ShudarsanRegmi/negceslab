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
  Grid
} from '@mui/material';
import {
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Check,
  Ban
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
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
];

// Helper to calculate total minutes from "HH:mm"
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
};

// Helper to convert minutes back to "HH:mm"
const minutesToTime = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// 2D Overlap Checker
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
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

  // Initialize draft resolutions whenever modal opens or group changes
  useEffect(() => {
    if (group && group.length > 0) {
      // Sort chronologically by creation time
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

  // Compute unique dates span
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

    // Buffer 1 day on end
    end.setDate(end.getDate() + 1);

    while (cur <= end) {
      list.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  }, [drafts]);

  // Real-time Collision Detection
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

  // Smart Auto-Resolve Gaps Heuristic Algorithm
  const handleAutoResolve = () => {
    const newDrafts = drafts.map((d) => ({ ...d }));

    // Keep 1st requested booking unchanged
    // For subsequent approved bookings, adjust date or time to non-overlapping slots
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

            // If prev ends before 17:30, try shifting start time on same date
            if (prevEndMin + duration <= 18 * 60) {
              current.startTime = minutesToTime(prevEndMin);
              current.endTime = minutesToTime(prevEndMin + duration);
            } else {
              // Shift date to day after prev's endDate
              const prevEndDate = new Date(prev.endDate + 'T00:00:00');
              prevEndDate.setDate(prevEndDate.getDate() + 1);
              const newDateStr = prevEndDate.toISOString().split('T')[0];

              // Calculate days duration of current
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

              // Reset time to default morning hours
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

  // Reset to original requested slots
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

  // Handle Draft Change
  const updateDraft = (bookingId: string, updates: Partial<DraftResolution>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.bookingId === bookingId ? { ...d, ...updates } : d))
    );
  };

  // Submit batch resolution to backend API
  const handleSubmit = async () => {
    if (collisions.size > 0) {
      setErrorMsg('Cannot apply resolution while overlapping collisions exist among approved requests.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('token');
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '92vh',
          background: '#fafafa'
        }
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          p: 3,
          pb: 2,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Sliders size={22} color="#38bdf8" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#f8fafc">
              2D Visual Conflict Resolution Studio
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              System: <strong style={{ color: '#38bdf8' }}>{computerName}</strong> &bull;{' '}
              {drafts.length} Conflicting Requests
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#fff' } }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Status / Alert Bar */}
        {collisions.size > 0 ? (
          <Alert
            severity="warning"
            icon={<AlertTriangle size={20} />}
            sx={{
              mb: 3,
              borderRadius: 3,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)',
              border: '1px solid #fde68a'
            }}
          >
            Overlap Collision Detected ({collisions.size} requests)! Click <strong>Auto-Resolve Gaps</strong> or adjust start/end dates and times below.
          </Alert>
        ) : (
          <Alert
            severity="success"
            icon={<CheckCircle2 size={20} />}
            sx={{
              mb: 3,
              borderRadius: 3,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)',
              border: '1px solid #a7f3d0'
            }}
          >
            All approved slots are non-overlapping in 2D space! Ready to apply resolution.
          </Alert>
        )}

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Studio Actions Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Sparkles size={18} />}
              onClick={handleAutoResolve}
              sx={{
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)'
              }}
            >
              Auto-Resolve Gaps
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RotateCcw size={16} />}
              onClick={handleReset}
              sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
            >
              Reset to Original
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant={viewMode === 'matrix' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('matrix')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              2D Matrix Canvas
            </Button>
            <Button
              size="small"
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('cards')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Request Cards & Tweaker
            </Button>
          </Box>
        </Paper>

        {/* MAIN VIEW MODE: 2D MATRIX CANVAS */}
        {viewMode === 'matrix' && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: '1px solid #cbd5e1',
              background: '#fff',
              overflowX: 'auto'
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
              2D INTERACTIVE TIMELINE MATRIX (X: Date &bull; Y: Time Slots)
            </Typography>

            <Box sx={{ minWidth: 700 }}>
              {/* Date Header Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: `100px repeat(${dateSpan.length}, 1fr)`, gap: 1, mb: 1 }}>
                <Box sx={{ p: 1, fontWeight: 800, fontSize: '0.75rem', color: '#64748b' }}>
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
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="caption" fontWeight={800} color="#334155" display="block">
                        {dayName}
                      </Typography>
                      <Typography variant="caption" color="#64748b" fontWeight={600}>
                        {dateNum}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>

              {/* Time Matrix Rows (08:00 to 18:00) */}
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((timeHour) => {
                const hourMin = timeToMinutes(timeHour);
                const nextHourMin = hourMin + 60;

                return (
                  <Box
                    key={timeHour}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `100px repeat(${dateSpan.length}, 1fr)`,
                      gap: 1,
                      mb: 1,
                      minHeight: 52
                    }}
                  >
                    {/* Y-Axis Label */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#64748b',
                        background: '#f1f5f9',
                        borderRadius: 1.5
                      }}
                    >
                      {timeHour}
                    </Box>

                    {/* Date Columns for this hour */}
                    {dateSpan.map((d) => {
                      // Find bookings occupying this cell (date d & time hour)
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
                            border: '1px dashed #e2e8f0',
                            borderRadius: 2,
                            p: 0.5,
                            minHeight: 52,
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
                              <Paper
                                key={draft.bookingId}
                                onClick={() => setSelectedBookingId(draft.bookingId)}
                                elevation={isSelected ? 4 : 1}
                                sx={{
                                  p: 0.8,
                                  borderRadius: 1.5,
                                  background: isColliding ? '#ef4444' : draft.color,
                                  color: '#fff',
                                  cursor: 'pointer',
                                  border: isSelected ? '2px solid #000' : 'none',
                                  transition: 'all 0.2s',
                                  '&:hover': { opacity: 0.9, transform: 'scale(1.02)' }
                                }}
                              >
                                <Typography variant="caption" fontWeight={800} display="block" noWrap>
                                  {draft.userLabel}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                                  {draft.startTime} - {draft.endTime}
                                </Typography>
                              </Paper>
                            );
                          })}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* DETAILED REQUESTS SIDE-BY-SIDE EDITOR */}
        <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
          REQUEST ADJUSTMENT & RESOLUTION DECISION ({drafts.length} REQUESTS)
        </Typography>

        <Grid container spacing={2.5}>
          {drafts.map((draft) => {
            const isColliding = collisions.has(draft.bookingId);
            const isSelected = draft.bookingId === selectedBookingId;
            const isModified =
              draft.startDate !== draft.originalStartDate ||
              draft.endDate !== draft.originalEndDate ||
              draft.startTime !== draft.originalStartTime ||
              draft.endTime !== draft.originalEndTime;

            return (
              <Grid item xs={12} md={6} key={draft.bookingId}>
                <Card
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
                      ? `0 6px 20px ${draft.color}25`
                      : '0 2px 8px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: draft.color
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight={800}>
                          {draft.userLabel}
                        </Typography>
                        {isModified && (
                          <Chip
                            label="Slot Modified"
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
                          startIcon={<Check size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateDraft(draft.bookingId, { action: 'APPROVE' });
                          }}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant={draft.action === 'REJECT' ? 'contained' : 'outlined'}
                          color="error"
                          startIcon={<Ban size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateDraft(draft.bookingId, { action: 'REJECT' });
                          }}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </Box>

                    {/* Original Slot Callout */}
                    <Box
                      sx={{
                        p: 1.5,
                        mb: 2,
                        borderRadius: 2,
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Original Request:
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#334155">
                        {draft.originalStartDate} to {draft.originalEndDate} ({draft.originalStartTime} - {draft.originalEndTime})
                      </Typography>
                    </Box>

                    {draft.action === 'APPROVE' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        placeholder="State reason for rejection..."
                        value={draft.rejectionReason}
                        onChange={(e) =>
                          updateDraft(draft.bookingId, { rejectionReason: e.target.value })
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>

      {/* Modal Actions */}
      <DialogActions
        sx={{
          p: 3,
          pt: 2,
          background: '#fff',
          borderTop: '1px solid #e2e8f0',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {drafts.filter((d) => d.action === 'APPROVE').length} to Approve &bull;{' '}
          {drafts.filter((d) => d.action === 'REJECT').length} to Reject
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={onClose}
            disabled={submitting}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            disabled={submitting || collisions.size > 0}
            onClick={handleSubmit}
            sx={{
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
            }}
          >
            {submitting ? 'Applying Resolutions...' : 'Confirm & Save Resolution'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
