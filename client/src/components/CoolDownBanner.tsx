import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import TimerIcon from "@mui/icons-material/Timer";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import VerifiedIcon from "@mui/icons-material/Verified";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export interface CoolDownStatus {
  active: boolean;
  isWaived?: boolean;
  coolDownDays: number;
  tierName?: string;
  lastBookingEndDate?: string;
  lastBookingDurationDays?: number;
  coolDownExpiryDate?: string;
  eligibleDate?: string | null;
  message?: string | null;
  waivedInfo?: {
    waivedByAdminEmail: string;
    waivedByAdminName?: string;
    reason: string;
    waivedAt: string;
  } | null;
}

interface CoolDownBannerProps {
  status: CoolDownStatus;
  title?: string;
}

export const CoolDownBanner: React.FC<CoolDownBannerProps> = ({ status, title }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!status.active || !status.eligibleDate) return;

    const targetDate = new Date(`${status.eligibleDate}T08:00:00`).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status.active, status.eligibleDate]);

  // Handle Waived / Exempted Cool-Down Display
  if (status.isWaived) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "success.main",
          background: "linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(232,245,233,0.4) 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: "50%",
                bgcolor: "success.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <VerifiedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="success.dark">
                Cool-Down Exemption Granted (Waived)
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Exempted by Admin ({status.waivedInfo?.waivedByAdminEmail || "Admin"})
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<LockOpenIcon fontSize="small" />}
              label="Booking Requests Unlocked"
              color="success"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Typography variant="body2" color="text.primary" fontWeight={600}>
            <strong>Exemption Reason:</strong> {status.waivedInfo?.reason || "Approved administrative override."}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            You may proceed to reserve lab computers without waiting for cool-down expiry.
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!status.active || timeLeft.expired) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "warning.main",
        background: "linear-gradient(135deg, rgba(255,152,0,0.08) 0%, rgba(255,243,224,0.4) 100%)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: "50%",
              bgcolor: "warning.main",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TimerIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="warning.dark">
              {title || "Cool-Down Period Active"}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {status.tierName || "Mandatory Booking Cooldown"} &bull; Last reservation ended on {status.lastBookingEndDate}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<LockIcon fontSize="small" />}
            label="System Reservations Locked"
            color="warning"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            icon={<CalendarMonthIcon fontSize="small" />}
            label={`Eligible: ${status.eligibleDate}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {status.message || `You must wait ${status.coolDownDays} day(s) before making new booking requests.`}
        </Typography>

        {/* Live Remaining Timer Counter */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
            Unlocks In:
          </Typography>
          <TimerBadge value={timeLeft.days} unit="Days" />
          <TimerBadge value={timeLeft.hours} unit="Hrs" />
          <TimerBadge value={timeLeft.minutes} unit="Min" />
          <TimerBadge value={timeLeft.seconds} unit="Sec" />
        </Stack>
      </Box>
    </Paper>
  );
};

const TimerBadge: React.FC<{ value: number; unit: string }> = ({ value, unit }) => (
  <Paper
    elevation={1}
    sx={{
      px: 1.5,
      py: 0.5,
      borderRadius: 2,
      bgcolor: "warning.dark",
      color: "common.white",
      textAlign: "center",
      minWidth: 48,
    }}
  >
    <Typography variant="subtitle1" fontWeight={800} leading={1.1}>
      {String(value).padStart(2, "0")}
    </Typography>
    <Typography variant="caption" sx={{ fontSize: "0.65rem", opacity: 0.8, textTransform: "uppercase" }}>
      {unit}
    </Typography>
  </Paper>
);

export default CoolDownBanner;
