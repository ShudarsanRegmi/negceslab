import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Tooltip,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  GlobalStyles
} from '@mui/material';
import {
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Check,
  Ban,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  User,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import axios from 'axios';
import { policyAPI, bookingsAPI } from '../services/api';

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

interface ExistingApprovedBooking {
  _id: string;
  userLabel: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface DateOnlyConflictStudioModalProps {
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

const stepDate = (dateStr: string, deltaDays: number): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().split('T')[0];
};

const getDaysDiff = (startStr: string, endStr: string): number => {
  const s = new Date(startStr + 'T00:00:00').getTime();
  const e = new Date(endStr + 'T00:00:00').getTime();
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

const checkOverlap = (
  b1: { startDate: string; endDate: string; startTime: string; endTime: string },
  b2: { startDate: string; endDate: string; startTime: string; endTime: string }
): boolean => {
  const dateOverlap = b1.startDate <= b2.endDate && b1.endDate >= b2.startDate;
  if (!dateOverlap) return false;
  return b1.startTime < b2.endTime && b1.endTime > b2.startTime;
};

export const DateOnlyConflictStudioModal: React.FC<DateOnlyConflictStudioModalProps> = ({
  open,
  onClose,
  group,
  onSuccess
}) => {
  const [drafts, setDrafts] = useState<DraftResolution[]>([]);
  const [existingApproved, setExistingApproved] = useState<ExistingApprovedBooking[]>([]);
  const [systemPolicy, setSystemPolicy] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Drag State for Date Timeline Bar
  const [activeDrag, setActiveDrag] = useState<{
    bookingId: string;
    handleType: 'move' | 'resize-left' | 'resize-right';
    initialPointerX: number;
    initialStartDate: string;
    initialEndDate: string;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Fetch Policy & Existing Approved Bookings
  useEffect(() => {
    if (open && group && group.length > 0) {
      const fetchPolicyAndApproved = async () => {
        try {
          const policyRes = await policyAPI.getPolicy();
          setSystemPolicy(policyRes.data);

          const computerId = typeof group[0]?.computerId === 'object'
            ? group[0]?.computerId?._id
            : group[0]?.computerId;

          if (computerId) {
            const bookingsRes = await bookingsAPI.getAllBookings({ computerId });
            const allBk: Booking[] = bookingsRes.data || [];
            const conflictIds = new Set(group.map((g) => g._id));

            const approvedList: ExistingApprovedBooking[] = allBk
              .filter((b) => b.status === 'APPROVED' && !conflictIds.has(b._id))
              .map((b) => ({
                _id: b._id,
                userLabel: b.user?.name || b.user?.email || 'Approved Booking',
                startDate: b.startDate,
                endDate: b.endDate,
                startTime: b.startTime,
                endTime: b.endTime
              }));

            setExistingApproved(approvedList);
          }
        } catch (err) {
          console.error('Failed to load system policy or approved bookings:', err);
        }
      };

      fetchPolicyAndApproved();
    }
  }, [open, group]);

  // Initialize Draft Resolutions from Group
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

  // Compute Full Date Range (X-Axis) with 2-Day Buffer Padding
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

    existingApproved.forEach((ex) => {
      const s = new Date(ex.startDate + 'T00:00:00').getTime();
      const e = new Date(ex.endDate + 'T00:00:00').getTime();
      if (s < minTs) minTs = s;
      if (e > maxTs) maxTs = e;
    });

    if (minTs === Infinity || maxTs === -Infinity) return [];

    // Add 2 Days Buffer on left and right
    const startDateObj = new Date(minTs);
    startDateObj.setDate(startDateObj.getDate() - 2);

    const endDateObj = new Date(maxTs);
    endDateObj.setDate(endDateObj.getDate() + 2);

    const dates: string[] = [];
    const cur = new Date(startDateObj);
    while (cur <= endDateObj) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    return dates;
  }, [drafts, existingApproved]);

  // Cell Width for Timeline
  const CELL_WIDTH = 110;

  // Collision Detection across Drafts & Approved Bookings
  const collisions = useMemo(() => {
    const map = new Map<string, string[]>();
    const approvedDrafts = drafts.filter((d) => d.action === 'APPROVE');

    for (let i = 0; i < approvedDrafts.length; i++) {
      for (let j = i + 1; j < approvedDrafts.length; j++) {
        const d1 = approvedDrafts[i];
        const d2 = approvedDrafts[j];
        if (checkOverlap(d1, d2)) {
          map.set(d1.bookingId, [...(map.get(d1.bookingId) || []), `Date overlap with ${d2.userLabel}`]);
          map.set(d2.bookingId, [...(map.get(d2.bookingId) || []), `Date overlap with ${d1.userLabel}`]);
        }
      }

      // Check against existing approved bookings in database
      const d1 = approvedDrafts[i];
      existingApproved.forEach((ex) => {
        if (checkOverlap(d1, ex)) {
          map.set(d1.bookingId, [...(map.get(d1.bookingId) || []), `Conflicts with Already Approved booking (${ex.userLabel})`]);
        }
      });
    }

    return map;
  }, [drafts, existingApproved]);

  // Pointer Drag Handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    bookingId: string,
    handleType: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const draft = drafts.find((d) => d.bookingId === bookingId);
    if (!draft || draft.action === 'REJECT') return;

    setSelectedBookingId(bookingId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveDrag({
      bookingId,
      handleType,
      initialPointerX: e.clientX,
      initialStartDate: draft.startDate,
      initialEndDate: draft.endDate
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag) return;
    const { bookingId, handleType, initialPointerX, initialStartDate, initialEndDate } = activeDrag;

    const deltaX = e.clientX - initialPointerX;
    const deltaDays = Math.round(deltaX / CELL_WIDTH);

    if (deltaDays === 0) return;

    setDrafts((prev) =>
      prev.map((d) => {
        if (d.bookingId !== bookingId) return d;

        let newStart = d.startDate;
        let newEnd = d.endDate;

        if (handleType === 'move') {
          newStart = stepDate(initialStartDate, deltaDays);
          newEnd = stepDate(initialEndDate, deltaDays);

          // Prevent dragging start date prior to today (Past Lock Policy)
          if (newStart < todayStr) {
            const shiftBack = getDaysDiff(newStart, todayStr);
            newStart = todayStr;
            newEnd = stepDate(newEnd, shiftBack);
          }
        } else if (handleType === 'resize-left') {
          newStart = stepDate(initialStartDate, deltaDays);
          if (newStart < todayStr) newStart = todayStr;
          if (newStart > d.endDate) newStart = d.endDate;
        } else if (handleType === 'resize-right') {
          newEnd = stepDate(initialEndDate, deltaDays);
          if (newEnd < d.startDate) newEnd = d.startDate;
        }

        return {
          ...d,
          startDate: newStart,
          endDate: newEnd
        };
      })
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // pointer capture release fallback
      }
      setActiveDrag(null);
    }
  };

  // Manual Input Changes
  const handleDraftChange = (bookingId: string, field: keyof DraftResolution, value: any) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.bookingId !== bookingId) return d;
        const updated = { ...d, [field]: value };
        if (field === 'startDate' && updated.startDate > updated.endDate) {
          updated.endDate = updated.startDate;
        }
        return updated;
      })
    );
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

  const handleSubmit = async () => {
    if (collisions.size > 0) {
      setErrorMsg('Cannot save while overlapping date conflicts exist. Please resolve all overlaps or reject conflicting requests.');
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
          rejectionReason: d.action === 'REJECT' ? (d.rejectionReason || 'Rejected during Date Studio resolution') : undefined
        }))
      };

      await axios.post('/api/bookings/batch-resolve-conflict', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Date Studio batch resolve error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to apply batch resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const computerName = group[0]?.computerId?.name || 'Target Computer';


  return (
    <>
      {isFullScreen && (
        <GlobalStyles
          styles={{
            '.date-conflict-studio-dialog .MuiDialog-container': {
              display: 'block !important',
              width: '100vw !important',
              height: '100vh !important',
              maxWidth: '100vw !important',
              maxHeight: '100vh !important',
              padding: '0 !important',
              margin: '0 !important',
            },
            '.date-conflict-studio-dialog .MuiDialog-paper': {
              width: '100vw !important',
              height: '100vh !important',
              maxWidth: '100vw !important',
              maxHeight: '100vh !important',
              margin: '0 !important',
              borderRadius: '0 !important',
              boxShadow: 'none !important',
            },
          }}
        />
      )}
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={false}
      maxWidth={false}
      className="date-conflict-studio-dialog"
      PaperProps={{
        sx: isFullScreen ? {
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        } : {
          width: '1180px',
          maxWidth: '88vw',
          height: '82vh',
          maxHeight: '840px',
          m: 'auto',
          borderRadius: 3,
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }
      }}
      sx={{
        '& .MuiDialog-container': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }
      }}
    >
      {/* Header Bar */}
      <DialogTitle
        sx={{
          py: 1.5,
          px: 3,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
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
            <Calendar size={20} color="#38bdf8" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={800} color="#f8fafc" sx={{ lineHeight: 1.2 }}>
              Simple Date Conflict Studio (1D Timeline)
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
                border: '1px solid rgba(56, 189, 248, 0.3)'
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

      {/* Main Body */}
      <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5, flexGrow: 1, overflowY: 'auto' }}>
        {errorMsg && (
          <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Status Indicator Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 2,
            borderRadius: 2.5,
            background: collisions.size > 0 ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${collisions.size > 0 ? '#fecaca' : '#bbf7d0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {collisions.size > 0 ? (
              <AlertTriangle size={20} color="#dc2626" />
            ) : (
              <CheckCircle2 size={20} color="#16a34a" />
            )}
            <Typography variant="body2" fontWeight={700} color={collisions.size > 0 ? '#b91c1c' : '#15803d'}>
              {collisions.size > 0
                ? `Conflict Alert: ${collisions.size} participant(s) have date overlaps on timeline.`
                : 'All clear: No date conflicts exist in current draft arrangement.'}
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<RotateCcw size={14} />}
            onClick={handleReset}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Reset Original Dates
          </Button>
        </Paper>

        {/* 1D Date Axis Interactive Canvas */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            background: '#fff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" fontWeight={800} color="#1e293b" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoveHorizontal size={18} color="#2563eb" />
              Interactive Date Axis Canvas &mdash; Drag bars horizontally to adjust request dates
            </Typography>
            <Typography variant="caption" color="text.secondary">
              * Handles on left & right expand/shrink date range. Center bar shifts date range.
            </Typography>
          </Box>

          {/* Timeline View Container */}
          <Box
            ref={gridRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            sx={{
              overflowX: 'auto',
              border: '1px solid #cbd5e1',
              borderRadius: 2,
              background: '#f8fafc',
              position: 'relative',
              userSelect: 'none'
            }}
          >
            {/* Timeline Header Row (Dates) */}
            <Box sx={{ display: 'flex', minWidth: dateSpan.length * CELL_WIDTH, borderBottom: '2px solid #cbd5e1', background: '#f1f5f9' }}>
              {dateSpan.map((dateStr) => {
                const isToday = dateStr === todayStr;
                const dObj = new Date(dateStr + 'T00:00:00');
                const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDay = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <Box
                    key={dateStr}
                    sx={{
                      width: CELL_WIDTH,
                      flexShrink: 0,
                      p: 1,
                      textAlign: 'center',
                      borderRight: '1px solid #e2e8f0',
                      background: isToday ? 'rgba(37, 99, 235, 0.08)' : 'transparent'
                    }}
                  >
                    <Typography variant="caption" fontWeight={800} color={isToday ? '#2563eb' : '#475569'} display="block">
                      {dayName}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color={isToday ? '#1d4ed8' : '#64748b'}>
                      {monthDay}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Existing Approved Bookings Row (Reference Layer) */}
            {existingApproved.length > 0 && (
              <Box sx={{ minWidth: dateSpan.length * CELL_WIDTH, p: 1, borderBottom: '1px dashed #cbd5e1', background: '#fff' }}>
                <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ mb: 0.5, display: 'block' }}>
                  Existing Approved Bookings (Locked)
                </Typography>
                <Box sx={{ position: 'relative', height: 32, width: dateSpan.length * CELL_WIDTH }}>
                  {existingApproved.map((ex) => {
                    const startIdx = dateSpan.indexOf(ex.startDate);
                    const endIdx = dateSpan.indexOf(ex.endDate);
                    if (startIdx === -1 && endIdx === -1) return null;

                    const left = Math.max(0, startIdx) * CELL_WIDTH;
                    const width = (Math.max(startIdx, endIdx) - Math.max(0, startIdx) + 1) * CELL_WIDTH;

                    return (
                      <Tooltip key={ex._id} title={`Already Approved: ${ex.userLabel} (${ex.startDate} to ${ex.endDate})`}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left,
                            width: Math.max(width - 4, 30),
                            height: 28,
                            top: 2,
                            borderRadius: 1.5,
                            background: '#94a3b8',
                            color: '#fff',
                            px: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <ShieldCheck size={14} />
                          <Typography variant="caption" noWrap fontWeight={800}>
                            Approved: {ex.userLabel}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Interactive Draft Rows */}
            <Box sx={{ minWidth: dateSpan.length * CELL_WIDTH, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {drafts.map((draft) => {
                const hasCollision = collisions.has(draft.bookingId);
                const isSelected = selectedBookingId === draft.bookingId;
                const isRejected = draft.action === 'REJECT';

                const startIdx = dateSpan.indexOf(draft.startDate);
                const endIdx = dateSpan.indexOf(draft.endDate);

                const leftPos = (startIdx !== -1 ? startIdx : 0) * CELL_WIDTH;
                const widthPx = (endIdx !== -1 && startIdx !== -1 ? endIdx - startIdx + 1 : 1) * CELL_WIDTH;

                return (
                  <Box
                    key={draft.bookingId}
                    onClick={() => setSelectedBookingId(draft.bookingId)}
                    sx={{
                      position: 'relative',
                      height: 52,
                      width: dateSpan.length * CELL_WIDTH,
                      borderRadius: 2,
                      background: isSelected ? 'rgba(241, 245, 249, 0.8)' : 'transparent',
                      border: isSelected ? '1px dashed #cbd5e1' : '1px transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Date Bar */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: leftPos + 2,
                        width: Math.max(widthPx - 4, 40),
                        height: 44,
                        top: 4,
                        borderRadius: 2,
                        background: isRejected
                          ? '#94a3b8'
                          : hasCollision
                          ? '#ef4444'
                          : draft.color,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        boxShadow: isSelected
                          ? `0 0 0 3px ${draft.color}40, 0 4px 12px rgba(0,0,0,0.15)`
                          : '0 2px 6px rgba(0,0,0,0.1)',
                        cursor: isRejected ? 'not-allowed' : 'grab',
                        opacity: isRejected ? 0.5 : 1,
                        transition: activeDrag?.bookingId === draft.bookingId ? 'none' : 'all 0.15s ease'
                      }}
                      onPointerDown={(e) => handlePointerDown(e, draft.bookingId, 'move')}
                    >
                      {/* Left Resize Handle */}
                      {!isRejected && (
                        <Box
                          onPointerDown={(e) => handlePointerDown(e, draft.bookingId, 'resize-left')}
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 12,
                            borderRadius: '8px 0 0 8px',
                            cursor: 'ew-resize',
                            background: 'rgba(255,255,255,0.25)',
                            '&:hover': { background: 'rgba(255,255,255,0.5)' }
                          }}
                        />
                      )}

                      {/* Content Label */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', zIndex: 1 }}>
                        <Typography variant="body2" fontWeight={800} noWrap sx={{ color: '#fff' }}>
                          {draft.userLabel}
                        </Typography>
                        <Chip
                          label={`${draft.startDate} → ${draft.endDate}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: 'rgba(255,255,255,0.25)',
                            color: '#fff'
                          }}
                        />
                        {hasCollision && (
                          <Chip
                            label="Already Requested Overlap"
                            size="small"
                            color="error"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                          />
                        )}
                      </Box>

                      {/* Right Resize Handle */}
                      {!isRejected && (
                        <Box
                          onPointerDown={(e) => handlePointerDown(e, draft.bookingId, 'resize-right')}
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: 12,
                            borderRadius: '0 8px 8px 0',
                            cursor: 'ew-resize',
                            background: 'rgba(255,255,255,0.25)',
                            '&:hover': { background: 'rgba(255,255,255,0.5)' }
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>

        {/* Conflict Participants List & Manual Fine-Tuning */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            background: '#fff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.2,
            maxHeight: 280,
            overflowY: 'auto',
            flexShrink: 0
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} color="#1e293b" sx={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            <User size={16} color="#2563eb" />
            Conflict Participants & Manual Resolution Controls:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {drafts.map((draft) => {
              const hasCollision = collisions.has(draft.bookingId);
              const isSelected = selectedBookingId === draft.bookingId;

              return (
                <Paper
                  key={draft.bookingId}
                  elevation={0}
                  onClick={() => setSelectedBookingId(draft.bookingId)}
                  sx={{
                    p: 1.2,
                    px: 1.8,
                    borderRadius: 2,
                    border: '1.5px solid',
                    borderColor: hasCollision ? '#ef4444' : isSelected ? draft.color : '#e2e8f0',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    transition: 'all 0.15s',
                    cursor: 'pointer'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: draft.color }} />
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ fontSize: '0.84rem' }}>
                        {draft.userLabel}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        ({draft.userEmail || 'Student'})
                      </Typography>
                      {hasCollision && (
                        <Chip label="Date Clash!" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
                      )}
                    </Box>

                    {/* Approve / Reject Toggles */}
                    <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant={draft.action === 'APPROVE' ? 'contained' : 'outlined'}
                        color="success"
                        startIcon={<Check size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDraftChange(draft.bookingId, 'action', 'APPROVE');
                        }}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', py: 0.2 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant={draft.action === 'REJECT' ? 'contained' : 'outlined'}
                        color="error"
                        startIcon={<Ban size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDraftChange(draft.bookingId, 'action', 'REJECT');
                        }}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', py: 0.2 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>

                  {draft.action === 'APPROVE' ? (
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <TextField
                        label="Start Date"
                        type="date"
                        size="small"
                        value={draft.startDate}
                        onChange={(e) => handleDraftChange(draft.bookingId, 'startDate', e.target.value)}
                        inputProps={{ min: todayStr }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 140, '& .MuiInputBase-input': { fontSize: '0.78rem', py: 0.4 } }}
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        size="small"
                        value={draft.endDate}
                        onChange={(e) => handleDraftChange(draft.bookingId, 'endDate', e.target.value)}
                        inputProps={{ min: draft.startDate }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 140, '& .MuiInputBase-input': { fontSize: '0.78rem', py: 0.4 } }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
                        <Clock size={14} /> Time Slot: {draft.startTime} - {draft.endTime}
                      </Box>
                    </Box>
                  ) : (
                    <TextField
                      label="Rejection Reason"
                      size="small"
                      fullWidth
                      placeholder="Reason for rejection..."
                      value={draft.rejectionReason}
                      onChange={(e) => handleDraftChange(draft.bookingId, 'rejectionReason', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.78rem', py: 0.4 } }}
                    />
                  )}
                </Paper>
              );
            })}
          </Box>
        </Paper>
      </DialogContent>

      {/* Footer Controls */}
      <DialogActions
        sx={{
          py: 2,
          px: 3,
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          * System policies & lead time rules dynamically enforced.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || collisions.size > 0}
            startIcon={submitting ? null : <CheckCircle2 size={18} />}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 800,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            {submitting ? 'Applying Resolution...' : 'Save & Apply Date Resolutions'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  </>
  );
};
