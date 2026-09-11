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
  Grid as GridIcon,
  Move,
  Calendar,
  Clock,
  Lock,
  Users
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

interface DraftResolutionV2 {
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

interface BookingStudioV2ModalProps {
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

export const BookingStudioV2Modal: React.FC<BookingStudioV2ModalProps> = ({
  open,
  onClose,
  group,
  onSuccess
}) => {
  const [drafts, setDrafts] = useState<DraftResolutionV2[]>([]);
  const [existingApproved, setExistingApproved] = useState<ExistingApprovedBooking[]>([]);
  const [systemPolicy, setSystemPolicy] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Drag Locking Mode: 'both' | 'date' | 'time'
  const [axisLock, setAxisLock] = useState<'both' | 'date' | 'time'>('both');

  // Drag State
  const [activeDrag, setActiveDrag] = useState<{
    bookingId: string;
    handleType: 'move' | 'resize-left' | 'resize-right' | 'resize-top' | 'resize-bottom';
    initialPointerX: number;
    initialPointerY: number;
    initialStartDate: string;
    initialEndDate: string;
    initialStartTime: string;
    initialEndTime: string;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch Dynamic System Policy & Existing Approved Bookings on Open
  useEffect(() => {
    if (open) {
      const fetchPolicyAndApproved = async () => {
        try {
          // 1. Fetch Dynamic Policy
          const policyRes = await policyAPI.getPolicy();
          setSystemPolicy(policyRes.data);

          // 2. Fetch Existing Approved Bookings for target computer
          const targetComputerId = group[0]?.computerId?._id || group[0]?.computerId;
          if (targetComputerId) {
            const bookingsRes = await bookingsAPI.getAllBookings();
            const allBookings: any[] = bookingsRes.data?.bookings || bookingsRes.data || [];
            
            const groupIds = new Set(group.map((b) => b._id));
            const approvedList: ExistingApprovedBooking[] = allBookings
              .filter((b) => {
                const bCompId = b.computerId?._id || b.computerId;
                return (
                  bCompId === targetComputerId &&
                  b.status === 'approved' &&
                  !groupIds.has(b._id)
                );
              })
              .map((b) => ({
                _id: b._id,
                userLabel: b.user?.name || b.user?.email || 'Approved User',
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

  // Generate Dynamic Time Slots based on System Policy (e.g. 08:30 to 17:30)
  const timeSlots = useMemo(() => {
    const openH = systemPolicy?.labOpenHour ?? systemPolicy?.LAB_OPEN_HOUR ?? 8;
    const openM = systemPolicy?.labOpenMinute ?? systemPolicy?.LAB_OPEN_MINUTE ?? 30;
    const closeH = systemPolicy?.labCloseHour ?? systemPolicy?.LAB_CLOSE_HOUR ?? 17;
    const closeM = systemPolicy?.labCloseMinute ?? systemPolicy?.LAB_CLOSE_MINUTE ?? 30;

    const startMins = openH * 60 + openM;
    const endMins = closeH * 60 + closeM;

    const slots: string[] = [];
    let current = startMins;

    while (current <= endMins) {
      slots.push(minutesToTime(current));
      current += 30; // 30-minute interval slots
    }

    if (!slots.includes(minutesToTime(endMins))) {
      slots.push(minutesToTime(endMins));
    }

    return slots;
  }, [systemPolicy]);

  const findClosestSlotIndex = (timeStr: string): number => {
    if (!timeStr || !timeSlots.length) return 0;
    const targetMins = timeToMinutes(timeStr);
    let bestIdx = 0;
    let minDiff = Infinity;
    timeSlots.forEach((slot, idx) => {
      const diff = Math.abs(timeToMinutes(slot) - targetMins);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  useEffect(() => {
    if (group && group.length > 0) {
      const sorted = [...group].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const initialDrafts: DraftResolutionV2[] = sorted.map((b, index) => {
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

  // Today's Date String for Past Protection
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Global Date Axis Scale (X-Axis) bounded by System Policy & Buffer Rules
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

    const todayTs = new Date(todayStr + 'T00:00:00').getTime();
    
    // Lower bound: min requested minus 2 days buffer, but NEVER before today
    const calcMinTs = Math.max(todayTs, minTs - 2 * 24 * 3600 * 1000);
    
    // Upper bound: max requested plus 2 days buffer, capped by maxBookingAheadDays
    const maxAheadDays = systemPolicy?.maxBookingAheadDays ?? systemPolicy?.MAX_BOOKING_AHEAD_DAYS ?? 30;
    const maxAllowedAheadTs = todayTs + maxAheadDays * 24 * 3600 * 1000;
    const calcMaxTs = Math.min(maxAllowedAheadTs, maxTs + 2 * 24 * 3600 * 1000);

    const list: string[] = [];
    const cur = new Date(calcMinTs);
    const end = new Date(calcMaxTs);

    while (cur <= end) {
      list.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  }, [drafts, todayStr, systemPolicy]);

  // Collision Detection against other Approved Requests in Studio AND Existing Approved Bookings
  const collisions = useMemo(() => {
    const collidingIds = new Set<string>();
    const approvedDrafts = drafts.filter((d) => d.action === 'APPROVE');

    // 1. Check collisions among group resolutions
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

    // 2. Check collisions against Already Approved Bookings
    approvedDrafts.forEach((d) => {
      existingApproved.forEach((ex) => {
        if (check2DOverlap(d, ex)) {
          collidingIds.add(d.bookingId);
        }
      });
    });

    return collidingIds;
  }, [drafts, existingApproved]);

  const updateDraft = (bookingId: string, updates: Partial<DraftResolutionV2>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.bookingId === bookingId ? { ...d, ...updates } : d))
    );
  };

  // Pointer Drag Handler for Graph Grid
  const handlePointerDown = (
    e: React.PointerEvent,
    bookingId: string,
    handleType: 'move' | 'resize-left' | 'resize-right' | 'resize-top' | 'resize-bottom'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedBookingId(bookingId);

    const targetDraft = drafts.find((d) => d.bookingId === bookingId);
    if (!targetDraft || targetDraft.action === 'REJECT') return;

    setActiveDrag({
      bookingId,
      handleType,
      initialPointerX: e.clientX,
      initialPointerY: e.clientY,
      initialStartDate: targetDraft.startDate,
      initialEndDate: targetDraft.endDate,
      initialStartTime: targetDraft.startTime,
      initialEndTime: targetDraft.endTime
    });

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Fixed Rock-Solid Single Unit Snapping Algorithm (No Double Jumps!)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const dateColWidth = (gridRect.width - 70) / Math.max(1, dateSpan.length);
    const slotRowHeight = 28;

    // Calculate grid cell offsets directly from pointer coordinates relative to container
    const currentPointerColIdx = Math.floor((e.clientX - gridRect.left - 70) / dateColWidth);
    const initialPointerColIdx = Math.floor((activeDrag.initialPointerX - gridRect.left - 70) / dateColWidth);
    const deltaCols = currentPointerColIdx - initialPointerColIdx;

    const currentPointerRowIdx = Math.floor((e.clientY - gridRect.top - 40) / slotRowHeight);
    const initialPointerRowIdx = Math.floor((activeDrag.initialPointerY - gridRect.top - 40) / slotRowHeight);
    const deltaRows = currentPointerRowIdx - initialPointerRowIdx;

    const draft = drafts.find((d) => d.bookingId === activeDrag.bookingId);
    if (!draft) return;

    const minDateBound = dateSpan[0] || todayStr;
    const maxDateBound = dateSpan[dateSpan.length - 1] || activeDrag.initialEndDate;

    if (activeDrag.handleType === 'move') {
      // Respect Axis Drag Locking ('both' | 'date' | 'time')
      if ((axisLock === 'both' || axisLock === 'date') && deltaCols !== 0) {
        const newStart = stepDate(activeDrag.initialStartDate, deltaCols);
        const newEnd = stepDate(activeDrag.initialEndDate, deltaCols);

        if (newStart >= minDateBound && newEnd <= maxDateBound) {
          updateDraft(draft.bookingId, { startDate: newStart, endDate: newEnd });
        }
      }

      if ((axisLock === 'both' || axisLock === 'time') && deltaRows !== 0) {
        const initStartIdx = findClosestSlotIndex(activeDrag.initialStartTime);
        const initEndIdx = findClosestSlotIndex(activeDrag.initialEndTime);
        const spanRows = initEndIdx - initStartIdx;

        const newStartIdx = Math.max(0, Math.min(timeSlots.length - 1 - spanRows, initStartIdx + deltaRows));
        const newEndIdx = newStartIdx + spanRows;

        updateDraft(draft.bookingId, {
          startTime: timeSlots[newStartIdx],
          endTime: timeSlots[newEndIdx]
        });
      }
    } else if (activeDrag.handleType === 'resize-right') {
      if (deltaCols !== 0) {
        const newEnd = stepDate(activeDrag.initialEndDate, deltaCols);
        if (newEnd >= draft.startDate && newEnd <= maxDateBound) {
          updateDraft(draft.bookingId, { endDate: newEnd });
        }
      }
    } else if (activeDrag.handleType === 'resize-left') {
      if (deltaCols !== 0) {
        const newStart = stepDate(activeDrag.initialStartDate, deltaCols);
        if (newStart <= draft.endDate && newStart >= minDateBound) {
          updateDraft(draft.bookingId, { startDate: newStart });
        }
      }
    } else if (activeDrag.handleType === 'resize-bottom') {
      if (deltaRows !== 0) {
        const initEndIdx = findClosestSlotIndex(activeDrag.initialEndTime);
        const startIdx = findClosestSlotIndex(draft.startTime);
        
        const minHours = systemPolicy?.minBookingHours ?? systemPolicy?.MIN_BOOKING_HOURS ?? 1;
        const minSlotsRequired = Math.ceil(minHours * 2);

        const newEndIdx = Math.max(startIdx + minSlotsRequired, Math.min(timeSlots.length - 1, initEndIdx + deltaRows));
        updateDraft(draft.bookingId, { endTime: timeSlots[newEndIdx] });
      }
    } else if (activeDrag.handleType === 'resize-top') {
      if (deltaRows !== 0) {
        const initStartIdx = findClosestSlotIndex(activeDrag.initialStartTime);
        const endIdx = findClosestSlotIndex(draft.endTime);
        
        const minHours = systemPolicy?.minBookingHours ?? systemPolicy?.MIN_BOOKING_HOURS ?? 1;
        const minSlotsRequired = Math.ceil(minHours * 2);

        const newStartIdx = Math.max(0, Math.min(endIdx - minSlotsRequired, initStartIdx + deltaRows));
        updateDraft(draft.bookingId, { startTime: timeSlots[newStartIdx] });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      setActiveDrag(null);
    }
  };

  const handleAutoShiftOverlaps = () => {
    const newDrafts = drafts.map((d) => ({ ...d }));

    const firstTimeMin = timeToMinutes(timeSlots[0] || '08:30');
    const lastTimeMin = timeToMinutes(timeSlots[timeSlots.length - 1] || '17:30');

    for (let i = 1; i < newDrafts.length; i++) {
      if (newDrafts[i].action === 'REJECT') continue;

      let current = newDrafts[i];
      let hasConflict = true;
      let attempts = 0;

      while (hasConflict && attempts < 25) {
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

            if (prevEndMin + duration <= lastTimeMin) {
              current.startTime = minutesToTime(prevEndMin);
              current.endTime = minutesToTime(prevEndMin + duration);
            } else {
              const prevEndDateObj = new Date(prev.endDate + 'T00:00:00');
              prevEndDateObj.setDate(prevEndDateObj.getDate() + 1);
              const nextDateStr = prevEndDateObj.toISOString().split('T')[0];

              const curS = new Date(current.startDate + 'T00:00:00');
              const curE = new Date(current.endDate + 'T00:00:00');
              const daySpan = Math.max(0, Math.round((curE.getTime() - curS.getTime()) / (1000 * 3600 * 24)));

              current.startDate = nextDateStr;
              const newEndObj = new Date(prevEndDateObj);
              newEndObj.setDate(newEndObj.getDate() + daySpan);
              current.endDate = newEndObj.toISOString().split('T')[0];

              current.startTime = minutesToTime(firstTimeMin);
              current.endTime = minutesToTime(firstTimeMin + duration);
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

  const handleSubmit = async () => {
    if (collisions.size > 0) {
      setErrorMsg('Cannot save while overlapping collisions exist on graph grid.');
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
          rejectionReason: d.action === 'REJECT' ? (d.rejectionReason || 'Rejected during Graph Studio V2 resolution') : undefined
        }))
      };

      await axios.post('/api/bookings/batch-resolve-conflict', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Graph Studio V2 Batch resolve error:', err);
      setErrorMsg(
        err.response?.data?.message || 'Failed to apply batch resolution.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const computerName = group[0]?.computerId?.name || 'Target Machine';

  const labOpenLabel = timeSlots[0] || '08:30';
  const labCloseLabel = timeSlots[timeSlots.length - 1] || '17:30';

  return (
    <>
      {isFullScreen && (
        <GlobalStyles
          styles={{
            '.booking-studio-v2-dialog .MuiDialog-container': {
              display: 'block !important',
              width: '100vw !important',
              height: '100vh !important',
              maxWidth: '100vw !important',
              maxHeight: '100vh !important',
              padding: '0 !important',
              margin: '0 !important',
            },
            '.booking-studio-v2-dialog .MuiDialog-paper': {
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
      className="booking-studio-v2-dialog"
      PaperProps={{
        sx: isFullScreen ? {
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        } : {
          width: '1200px',
          maxWidth: '88vw',
          height: '82vh',
          maxHeight: '840px',
          m: 'auto',
          borderRadius: 3,
          background: '#fafafa',
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
      {/* Studio Header Bar */}
      <DialogTitle
        sx={{
          py: 1,
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
            <GridIcon size={20} color="#38bdf8" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={800} color="#f8fafc" sx={{ lineHeight: 1.2 }}>
              Booking Studio V2 (Spatial 2D Canvas)
            </Typography>
            <Chip
              label={`System: ${computerName} • Operating Hours: ${labOpenLabel} - ${labCloseLabel}`}
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

      {/* Main Content Area */}
      <DialogContent sx={{ p: 1.5, px: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Status Alert Banner */}
        {collisions.size > 0 ? (
          <Alert
            severity="warning"
            icon={<AlertTriangle size={16} />}
            sx={{ py: 0.4, px: 1.5, mb: 1, borderRadius: 2, fontWeight: 700, fontSize: '0.82rem', border: '1px solid #fde68a', flexShrink: 0 }}
          >
            Overlap Collision Detected ({collisions.size} requests)! Drag blocks apart or edit participant dates/times below.
          </Alert>
        ) : (
          <Alert
            severity="success"
            icon={<CheckCircle2 size={16} />}
            sx={{ py: 0.4, px: 1.5, mb: 1, borderRadius: 2, fontWeight: 700, fontSize: '0.82rem', border: '1px solid #a7f3d0', flexShrink: 0 }}
          >
            All requests are non-overlapping and clear of Already Approved bookings! Ready to save.
          </Alert>
        )}

        {/* Toolbar & Drag Locking Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 0.8,
            px: 1.5,
            mb: 1.2,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            gap: 1.5,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Sparkles size={15} />}
              onClick={handleAutoShiftOverlaps}
              sx={{
                borderRadius: 1.8,
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                py: 0.4,
                px: 2,
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
              }}
            >
              Auto-Shift Overlaps
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RotateCcw size={14} />}
              onClick={handleReset}
              sx={{ borderRadius: 1.8, fontWeight: 700, fontSize: '0.78rem', textTransform: 'none', py: 0.4, px: 1.5, borderColor: '#cbd5e1' }}
            >
              Reset Graph
            </Button>
          </Box>

          {/* AXIS DRAG LOCKING MODE SWITCHER */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, background: '#f8fafc', p: 0.4, px: 1, borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" fontWeight={800} color="#475569" sx={{ fontSize: '0.75rem', mr: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Lock size={13} /> Drag Mode:
            </Typography>
            <Button
              size="small"
              variant={axisLock === 'both' ? 'contained' : 'text'}
              color="primary"
              onClick={() => setAxisLock('both')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', py: 0.2, px: 1.2 }}
            >
              Both (2D)
            </Button>
            <Button
              size="small"
              variant={axisLock === 'date' ? 'contained' : 'text'}
              color="primary"
              startIcon={<Calendar size={13} />}
              onClick={() => setAxisLock('date')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', py: 0.2, px: 1.2 }}
            >
              Date Only
            </Button>
            <Button
              size="small"
              variant={axisLock === 'time' ? 'contained' : 'text'}
              color="primary"
              startIcon={<Clock size={13} />}
              onClick={() => setAxisLock('time')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', py: 0.2, px: 1.2 }}
            >
              Time Only
            </Button>
          </Box>
        </Paper>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 1, py: 0.5, px: 2, borderRadius: 2, fontSize: '0.82rem', flexShrink: 0 }}>
            {errorMsg}
          </Alert>
        )}

        {/* NATIVE SYSTEM THEME GRAPH CANVAS GRID */}
        <Paper
          elevation={0}
          ref={gridRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          sx={{
            flexGrow: 1,
            minHeight: 0,
            p: 1.5,
            borderRadius: 2.5,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            userSelect: 'none'
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `70px repeat(${dateSpan.length}, minmax(68px, 1fr))`,
              gridTemplateRows: `40px repeat(${Math.max(1, timeSlots.length - 1)}, 28px)`,
              gap: '1px',
              background: '#e2e8f0',
              border: '1px solid #cbd5e1',
              borderRadius: 2,
              position: 'relative',
              minWidth: 'fit-content'
            }}
          >
            {/* Top-Left Axis Label */}
            <Box
              sx={{
                gridColumn: '1',
                gridRow: '1',
                background: '#f8fafc',
                color: '#64748b',
                fontWeight: 800,
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                borderBottom: '1px solid #cbd5e1',
                borderRight: '1px solid #cbd5e1'
              }}
            >
              TIME / DATE
            </Box>

            {/* Horizontal Date Axis Header Row */}
            {dateSpan.map((d, colIdx) => {
              const dateObj = new Date(d + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const dateNum = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const isToday = d === todayStr;

              return (
                <Box
                  key={d}
                  sx={{
                    gridColumn: `${colIdx + 2}`,
                    gridRow: '1',
                    background: isToday ? '#eff6ff' : '#f1f5f9',
                    p: 0.4,
                    textAlign: 'center',
                    borderBottom: '1px solid #cbd5e1',
                    borderRight: '1px solid #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'center'
                  }}
                >
                  <Typography variant="caption" fontWeight={800} color={isToday ? '#2563eb' : '#1e293b'} display="block" sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>
                    {dayName} {isToday ? '(Today)' : ''}
                  </Typography>
                  <Typography variant="caption" color={isToday ? '#3b82f6' : '#64748b'} fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                    {dateNum}
                  </Typography>
                </Box>
              );
            })}

            {/* Vertical Shift Operating Hours Axis Header Column */}
            {timeSlots.slice(0, -1).map((tSlot, rowIdx) => {
              const isFullHour = tSlot.endsWith(':00');
              return (
                <Box
                  key={tSlot}
                  sx={{
                    gridColumn: '1',
                    gridRow: `${rowIdx + 2}`,
                    background: isFullHour ? '#f8fafc' : '#ffffff',
                    color: isFullHour ? '#334155' : '#94a3b8',
                    fontWeight: isFullHour ? 800 : 600,
                    fontSize: isFullHour ? '0.72rem' : '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    borderRight: '1px solid #cbd5e1',
                    borderBottom: isFullHour ? '1px solid #cbd5e1' : '1px dashed #e2e8f0'
                  }}
                >
                  {tSlot}
                </Box>
              );
            })}

            {/* Light Theme Canvas Cell Grid Background */}
            {timeSlots.slice(0, -1).map((tSlot, rIdx) => {
              const isFullHour = tSlot.endsWith(':00');
              return dateSpan.map((_, cIdx) => (
                <Box
                  key={`${rIdx}-${cIdx}`}
                  sx={{
                    gridColumn: `${cIdx + 2}`,
                    gridRow: `${rIdx + 2}`,
                    background: isFullHour ? '#ffffff' : '#fafafa',
                    borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                    borderBottom: isFullHour ? '1px solid rgba(226, 232, 240, 0.9)' : '1px dashed rgba(226, 232, 240, 0.5)'
                  }}
                />
              ));
            })}

            {/* RENDER ALREADY APPROVED BOOKINGS SHIELD (HATCHED PATTERN) */}
            {existingApproved.map((approved) => {
              const startColIdx = dateSpan.indexOf(approved.startDate);
              const endColIdx = dateSpan.indexOf(approved.endDate);
              if (startColIdx < 0 && endColIdx < 0) return null;

              const colStart = (startColIdx >= 0 ? startColIdx : 0) + 2;
              const colEnd = (endColIdx >= 0 ? endColIdx : startColIdx) + 3;

              const startRowIdx = findClosestSlotIndex(approved.startTime);
              const endRowIdx = findClosestSlotIndex(approved.endTime);

              const rowStart = startRowIdx + 2;
              const rowEnd = Math.max(rowStart + 1, endRowIdx + 2);

              return (
                <Box
                  key={approved._id}
                  sx={{
                    gridColumn: `${colStart} / ${colEnd}`,
                    gridRow: `${rowStart} / ${rowEnd}`,
                    zIndex: 5,
                    p: 0.6,
                    m: 0.3,
                    borderRadius: 1.8,
                    background: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 10px, #f1f5f9 10px, #f1f5f9 20px)',
                    color: '#475569',
                    border: '1.5px dashed #94a3b8',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'center'
                  }}
                >
                  <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.68rem', color: '#334155' }} noWrap>
                    🔒 Already Approved: {approved.userLabel}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#64748b' }}>
                    {approved.startTime} - {approved.endTime}
                  </Typography>
                </Box>
              );
            })}

            {/* DRAGGABLE & RESIZABLE 2D GEOMETRY BLOCK CARDS */}
            {drafts.map((draft) => {
              if (draft.action === 'REJECT') return null;

              const isColliding = collisions.has(draft.bookingId);
              const isSelected = draft.bookingId === selectedBookingId;

              const startColIdx = dateSpan.indexOf(draft.startDate);
              const endColIdx = dateSpan.indexOf(draft.endDate);

              const colStart = (startColIdx >= 0 ? startColIdx : 0) + 2;
              const colEnd = (endColIdx >= 0 ? endColIdx : startColIdx) + 3;

              const startRowIdx = findClosestSlotIndex(draft.startTime);
              const endRowIdx = findClosestSlotIndex(draft.endTime);

              const rowStart = startRowIdx + 2;
              const rowEnd = Math.max(rowStart + 1, endRowIdx + 2);

              return (
                <Box
                  key={draft.bookingId}
                  onPointerDown={(e) => handlePointerDown(e, draft.bookingId, 'move')}
                  sx={{
                    gridColumn: `${colStart} / ${colEnd}`,
                    gridRow: `${rowStart} / ${rowEnd}`,
                    zIndex: isSelected ? 20 : 10,
                    p: 0.8,
                    m: 0.3,
                    borderRadius: 2,
                    background: isColliding
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : `linear-gradient(135deg, ${draft.color} 0%, ${draft.color}dd 100%)`,
                    color: '#fff',
                    boxShadow: isColliding
                      ? '0 0 14px rgba(239, 68, 68, 0.7)'
                      : isSelected
                      ? `0 0 14px ${draft.color}`
                      : '0 3px 8px rgba(0,0,0,0.12)',
                    border: isSelected ? '2.5px solid #000000' : '1px solid rgba(255,255,255,0.4)',
                    cursor: 'grab',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    position: 'relative',
                    transition: activeDrag?.bookingId === draft.bookingId ? 'none' : 'all 0.15s ease',
                    touchAction: 'none'
                  }}
                >
                  {/* Top Resize Handle (Time Start) */}
                  <Box
                    onPointerDown={(e) => handlePointerDown(e, draft.bookingId, 'resize-top')}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 7,
                      cursor: 'ns-resize',
                      '&:hover': { background: 'rgba(255,255,255,0.5)' }
                    }}
                  />

                  {/* Left Resize Handle (Date Start) */}
                  <Box
                    onPointerDown={(e) => handlePointerDown(e, draft.bookingId, 'resize-left')}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: 7,
                      cursor: 'ew-resize',
                      '&:hover': { background: 'rgba(255,255,255,0.5)' }
                    }}
                  />

                  {/* Minimal Clean Card Content */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Move size={12} style={{ opacity: 0.8 }} />
                      <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ fontSize: '0.78rem', lineHeight: 1.1 }}>
                        {draft.userLabel}
                      </Typography>
                    </Box>

                    {/* Reject Button */}
                    <Box sx={{ pointerEvents: 'auto' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateDraft(draft.bookingId, { action: 'REJECT' });
                        }}
                        sx={{ color: '#fff', p: 0.2, background: 'rgba(0,0,0,0.25)', '&:hover': { background: '#ef4444' } }}
                      >
                        <Ban size={11} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ pointerEvents: 'none' }}>
                    <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.7rem', opacity: 0.95, display: 'block' }}>
                      {draft.startTime} - {draft.endTime}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.62rem', opacity: 0.85, display: 'block', fontWeight: 600 }}>
                      {draft.startDate} to {draft.endDate}
                    </Typography>
                  </Box>

                  {/* Right Resize Handle (Date End) */}
                  <Box
                    onPointerDown={(e) => handlePointerDown(e, draft.bookingId, 'resize-right')}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      right: 0,
                      width: 7,
                      cursor: 'ew-resize',
                      '&:hover': { background: 'rgba(255,255,255,0.5)' }
                    }}
                  />

                  {/* Bottom Resize Handle (Time End) */}
                  <Box
                    onPointerDown={(e) => handlePointerDown(e, draft.bookingId, 'resize-bottom')}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 7,
                      cursor: 'ns-resize',
                      '&:hover': { background: 'rgba(255,255,255,0.5)' }
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* ALL CONFLICT PARTICIPANTS MANUAL RESOLUTION PANEL */}
        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 2.5,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            maxHeight: '260px',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={16} color="#2563eb" />
              <Typography variant="subtitle2" fontWeight={800} color="#1e293b" sx={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                All Conflict Participants ({drafts.length}) &mdash; Manual Fine-Tune Editor
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Edit dates, times, or decisions manually for any participant
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            {drafts.map((draft) => {
              const isColliding = collisions.has(draft.bookingId);
              const isSelected = draft.bookingId === selectedBookingId;

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
                    borderColor: isColliding ? '#ef4444' : isSelected ? draft.color : '#e2e8f0',
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
                      {isColliding && (
                        <Chip label="Clash!" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
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
                          updateDraft(draft.bookingId, { action: 'APPROVE' });
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
                          updateDraft(draft.bookingId, { action: 'REJECT' });
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
                        onChange={(e) => updateDraft(draft.bookingId, { startDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 135, '& .MuiInputBase-input': { fontSize: '0.78rem', py: 0.4 } }}
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        size="small"
                        value={draft.endDate}
                        onChange={(e) => updateDraft(draft.bookingId, { endDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 135, '& .MuiInputBase-input': { fontSize: '0.78rem', py: 0.4 } }}
                      />
                      <TextField
                        label="Start Time"
                        type="time"
                        size="small"
                        value={draft.startTime}
                        onChange={(e) => updateDraft(draft.bookingId, { startTime: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 115, '& .MuiInputBase-input': { fontSize: '0.78rem', py: 0.4 } }}
                      />
                      <TextField
                        label="End Time"
                        type="time"
                        size="small"
                        value={draft.endTime}
                        onChange={(e) => updateDraft(draft.bookingId, { endTime: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 115, '& .MuiInputBase-input': { fontSize: '0.78rem', py: 0.4 } }}
                      />
                    </Box>
                  ) : (
                    <TextField
                      label="Rejection Reason"
                      size="small"
                      fullWidth
                      placeholder="Reason for rejection..."
                      value={draft.rejectionReason}
                      onChange={(e) => updateDraft(draft.bookingId, { rejectionReason: e.target.value })}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.78rem', py: 0.4 } }}
                    />
                  )}
                </Paper>
              );
            })}
          </Box>
        </Paper>
      </DialogContent>

      {/* System Theme Footer Bar */}
      <DialogActions
        sx={{
          py: 1,
          px: 3,
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          justify: 'space-between',
          flexShrink: 0
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
            {submitting ? 'Saving Resolution...' : 'Confirm & Save Graph Resolution'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  </>
  );
};
