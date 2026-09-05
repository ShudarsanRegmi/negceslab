import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Paper,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Badge,
  Divider,
  LinearProgress,
  Stack,
} from "@mui/material";
import { DateCalendar, LocalizationProvider, PickersDay } from "@mui/x-date-pickers";
import type { PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Computer as ComputerIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  BookOnline as BookIcon,
  TrendingUp as TrendingIcon,
  Cancel as CancelIcon,
  GridView as GridViewIcon,
  List as ListIcon,
  Notifications as NotificationIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  ExitToApp as TempReleaseIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import { computersAPI, temporaryReleaseAPI, bookingsAPI, policyAPI } from "../services/api";
import { format, isWithinInterval, parseISO, isSameDay, addDays, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

// Lab policy constants (keeping in sync with shared/policy.js)
const LAB_OPEN_HOUR = 8;
const LAB_OPEN_MINUTE = 30;
const LAB_CLOSE_HOUR = 17;
const LAB_CLOSE_MINUTE = 30;
const CLOSED_DAYS = [0]; // 0 = Sunday
const MAX_BOOKING_AHEAD_DAYS = 30; // Only allow booking up to 1 month ahead

const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

interface Computer {
  _id: string;
  name: string;
  location: string;
  status: "available" | "maintenance" | "booked" | "reserved";
  specifications: string;
  currentBookings?: any[];
  nextAvailable?: string;
  nextAvailableDate?: string;
  bookings: Booking[];
  isOnline?: boolean;
  lastSeen?: string;
  agentActiveSession?: {
    currentUser: string;
    email: string;
    agenda: string;
    sessionType: string;
    checkedIn: boolean;
  };
  systemDetails?: {
    operatingSystem: string;
    osVersion?: string;
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

interface Booking {
  _id: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  startDate: string;
  endDate: string;
  userId: {
    name: string;
    email: string;
  };
  user: {
    name: string;
  };
  // Add temporary release info to booking (new structure from server)
  temporaryRelease?: {
    hasActiveReleases: boolean;
    totalReleasedDays: number;
    releasedDates: Array<{
      date: string;
      isBooked: boolean;
      tempBookingId?: string;
    }>;
    lastUpdated: string;
  };
  // Keep the old structure for backward compatibility
  temporaryReleases?: TemporaryRelease[];
  attendanceActive?: {
    name: string;
    agentActiveSession?: {
      currentUser: string;
      email: string;
      agenda: string;
      sessionType: string;
      checkInTime: string;
      checkedIn: boolean;
    };
  };
}

interface CalendarEvent {
  date: string;
  type: "booking" | "temp_release" | "both";
  details: {
    booking?: Booking;
    timeSlot?: string;
    tempRelease?: TemporaryRelease;
  };
}

interface DateAvailability {
  date: string;
  status: "fully_available" | "partially_available" | "fully_booked" | "closed";
  bookedSlots: { startTime: string; endTime: string; booking: Booking }[];
  pendingSlots: { startTime: string; endTime: string; booking: Booking }[];
  availableSlots: { startTime: string; endTime: string }[];
  tempReleaseSlots: { startTime: string; endTime: string; release: TemporaryRelease }[];
}

interface TemporaryRelease {
  _id: string;
  bookingId: string;
  userId: string;
  releasedDates: string[];
  reason: string;
  status: "active" | "cancelled" | "partially_booked";
  createdAt: string;
  originalBooking?: {
    _id: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    reason: string;
    computerId: {
      _id: string;
      name: string;
      location: string;
    };
  };
  userInfo?: {
    uid: string;
    email: string;
    displayName?: string;
  };
}

const ComputerGrid: React.FC = () => {
  const navigate = useNavigate();
  const { userRole, currentUser } = useAuth(); // Get userRole from auth context
  const [computers, setComputers] = useState<Computer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [temporaryReleases, setTemporaryReleases] = useState<TemporaryRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [showBookingsDialog, setShowBookingsDialog] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [calendarValue, setCalendarValue] = useState<Date | null>(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [policy, setPolicy] = useState({
    labOpenHour: 8,
    labOpenMinute: 30,
    labCloseHour: 17,
    labCloseMinute: 30,
    closedDays: [0],
    maxBookingAheadDays: 30,
  });

  useEffect(() => {
    policyAPI.getPolicy().then((res) => {
      if (res.data) {
        setPolicy({
          labOpenHour: res.data.labOpenHour ?? res.data.LAB_OPEN_HOUR ?? 8,
          labOpenMinute: res.data.labOpenMinute ?? res.data.LAB_OPEN_MINUTE ?? 30,
          labCloseHour: res.data.labCloseHour ?? res.data.LAB_CLOSE_HOUR ?? 17,
          labCloseMinute: res.data.labCloseMinute ?? res.data.LAB_CLOSE_MINUTE ?? 30,
          closedDays: Array.isArray(res.data.closedDays ?? res.data.CLOSED_DAYS) ? (res.data.closedDays ?? res.data.CLOSED_DAYS) : [0],
          maxBookingAheadDays: res.data.maxBookingAheadDays ?? res.data.MAX_BOOKING_AHEAD_DAYS ?? 30,
        });
      }
    }).catch(err => console.error("Failed to load policy in ComputerGrid:", err));
  }, []);

  useEffect(() => {
    fetchComputers(true);

    const interval = setInterval(() => {
      fetchComputers(false);
    }, 10000); // Poll every 10s for live metrics

    return () => clearInterval(interval);
  }, []);

  const fetchComputers = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const usePublic = !currentUser; // Use public API if no user is authenticated
      const [computersRes, bookingsRes] = await Promise.all([
        computersAPI.getComputersWithBookings(usePublic),
        currentUser ? bookingsAPI.getUserBookings() : Promise.resolve({ data: [] }),
      ]);
      
      // Sort computers with natural/numeric sorting
      const sortedComputers = computersRes.data.sort((a: Computer, b: Computer) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      
      setComputers(sortedComputers);
      setSelectedComputer((prev) => {
        if (!prev) return null;
        const found = sortedComputers.find((c: Computer) => c._id === prev._id);
        if (!found) return null;
        // Avoid mutating reference if serialized structure is unchanged to prevent dialog re-render flicker
        if (JSON.stringify(found) === JSON.stringify(prev)) {
          return prev;
        }
        return found;
      });
      setBookings(bookingsRes.data);

      console.log('=== COMPUTERS WITH BOOKINGS DEBUG ===');
      console.log('Computers data:', computersRes.data);
      if (computersRes.data.length > 0) {
        const firstComputer = computersRes.data[0];
        console.log('First computer:', firstComputer.name);
        console.log('Number of bookings:', firstComputer.bookings?.length || 0);
        
        if (firstComputer.bookings?.length > 0) {
          firstComputer.bookings.forEach((booking, index) => {
            console.log(`Booking ${index + 1}:`, {
              id: booking._id,
              startDate: booking.startDate,
              endDate: booking.endDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              status: booking.status,
              temporaryRelease: booking.temporaryRelease,
              hasTemporaryRelease: !!booking.temporaryRelease,
              hasActiveReleases: booking.temporaryRelease?.hasActiveReleases,
              releasedDates: booking.temporaryRelease?.releasedDates
            });
          });
        }
      }
      console.log('=== END COMPUTERS DEBUG ===');

      // For now, keep the temporary releases fetch for potential admin functions
      try {
        const tempReleasesRes = userRole === 'admin' 
          ? await temporaryReleaseAPI.getAllTemporaryReleases()
          : await temporaryReleaseAPI.getUserTemporaryReleases();
        
        const releaseData = tempReleasesRes.data;
        const releases = Array.isArray(releaseData) 
          ? releaseData 
          : (releaseData?.releaseDetails || []);
        setTemporaryReleases(releases);
      } catch (tempError) {
        console.warn("Error fetching temporary releases:", tempError);
        setTemporaryReleases([]);
      }
    } catch (error) {
      console.error("Error fetching computers:", error);
      setError("Failed to load computers");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "success";
      case "maintenance":
        return "warning";
      case "booked":
        return "error";
      case "reserved":
        return "info";
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "info";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckIcon />;
      case "maintenance":
        return <BuildIcon />;
      case "booked":
        return <PersonIcon />;
      case "reserved":
        return <BookIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "maintenance":
        return "Maintenance";
      case "booked":
        return "Occupied";
      case "reserved":
        return "Reserved";
      default:
        return status;
    }
  };

  const filteredComputers = computers.filter((computer) => {
    const matchesStatus =
      statusFilter === "all" || computer.status === statusFilter;
    return matchesStatus;
  });

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: "grid" | "list" | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleComputerClick = (computer: Computer) => {
    setSelectedComputer(computer);
    setShowBookingsDialog(true);
  };

  const handleCalendarView = (computer: Computer) => {
    setSelectedComputer(computer);
    setShowCalendarDialog(true);
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if date is a closed day
  const isClosedDay = (date: Date): boolean => {
    return policy.closedDays.includes(date.getDay());
  };

  // Calculate lab operating hours in minutes
  const labOpenMinutes = policy.labOpenHour * 60 + policy.labOpenMinute;
  const labCloseMinutes = policy.labCloseHour * 60 + policy.labCloseMinute;
  const totalLabMinutes = labCloseMinutes - labOpenMinutes;

  // Calculate availability status for a specific date
  const calculateDateAvailability = (date: Date, computer: Computer): DateAvailability => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    console.log(`=== Calculating availability for ${computer.name} on ${dateStr} ===`);
    
    if (isClosedDay(date)) {
      return {
        date: dateStr,
        status: "closed",
        bookedSlots: [],
        pendingSlots: [],
        availableSlots: [],
        tempReleaseSlots: []
      };
    }

    // Get all approved bookings for this computer that cover this date
    const dayBookings = (computer.bookings || []).filter(booking => {
      if (booking.status !== "approved") return false;
      
      const startDate = parseISO(booking.startDate);
      const endDate = parseISO(booking.endDate);
      return date >= startDate && date <= endDate;
    });

    // Get pending bookings for this computer covering this date
    const dayPendingBookings = (computer.bookings || []).filter(booking => {
      if (booking.status !== "pending") return false;

      const startDate = parseISO(booking.startDate);
      const endDate = parseISO(booking.endDate);
      return date >= startDate && date <= endDate;
    });

    const bookedSlots: { startTime: string; endTime: string; booking: Booking }[] = [];
    const pendingSlots: { startTime: string; endTime: string; booking: Booking }[] = [];
    const tempReleaseSlots: { startTime: string; endTime: string; release: any }[] = [];

    dayPendingBookings.forEach((booking) => {
      pendingSlots.push({
        startTime: booking.startTime,
        endTime: booking.endTime,
        booking,
      });
    });

    // Process each booking to determine if it's booked or temporarily released
    dayBookings.forEach((booking, index) => {
      console.log(`Processing booking ${index + 1}:`, {
        id: booking._id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        hasTemporaryRelease: !!booking.temporaryRelease,
        hasActiveReleases: booking.temporaryRelease?.hasActiveReleases,
        releasedDates: booking.temporaryRelease?.releasedDates
      });

      // Check if this booking has been temporarily released for this specific date
      const isReleasedForThisDate = booking.temporaryRelease?.hasActiveReleases && 
        booking.temporaryRelease?.releasedDates?.some(releaseDate => 
          releaseDate.date === dateStr && !releaseDate.isBooked
        );

      if (isReleasedForThisDate) {
        console.log(`Booking is RELEASED for date ${dateStr}`);
        // This booking is temporarily released for this date - add to temp release slots
        const releaseInfo = booking.temporaryRelease?.releasedDates?.find(rd => rd.date === dateStr);
        tempReleaseSlots.push({
          startTime: booking.startTime,
          endTime: booking.endTime,
          release: {
            _id: `${booking._id}_${dateStr}`,
            bookingId: booking._id,
            releasedDates: [dateStr],
            reason: `Temporary release for ${dateStr}`,
            status: 'active'
          }
        });
      } else {
        console.log(`Booking is ACTIVE (not released) for date ${dateStr}`);
        // This booking is active (not released) for this date - add to booked slots
        bookedSlots.push({
          startTime: booking.startTime,
          endTime: booking.endTime,
          booking
        });
      }
    });

    console.log(`Result: ${bookedSlots.length} booked slots, ${tempReleaseSlots.length} temp release slots`);

    // Calculate total booked minutes (excluding temporarily released slots)
    const totalBookedMinutes = bookedSlots.reduce((total, slot) => {
      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = timeToMinutes(slot.endTime);
      return total + (endMinutes - startMinutes);
    }, 0);

    // Calculate total released minutes (these are available now)
    const totalReleasedMinutes = tempReleaseSlots.reduce((total, slot) => {
      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = timeToMinutes(slot.endTime);
      return total + (endMinutes - startMinutes);
    }, 0);

    // Calculate available slots
    const availableSlots: { startTime: string; endTime: string }[] = [];
    const totalAvailableMinutes = totalLabMinutes - totalBookedMinutes; // Released slots are now available
    
    if (totalAvailableMinutes > 0) {
      availableSlots.push({
        startTime: `${LAB_OPEN_HOUR}:${LAB_OPEN_MINUTE.toString().padStart(2, '0')}`,
        endTime: `${LAB_CLOSE_HOUR}:${LAB_CLOSE_MINUTE.toString().padStart(2, '0')}`
      });
    }

    // Determine status based on actual booked slots (not including released slots)
    let status: DateAvailability['status'];
    
    if (totalBookedMinutes === 0) {
      // No bookings or all bookings are released
      status = "fully_available";
    } else if (totalBookedMinutes >= totalLabMinutes) {
      // All lab time is booked (no releases)
      status = "fully_booked";
    } else {
      // Some slots are booked, some are available (including releases)
      status = "partially_available";
    }

    // Special case: If we have temporary releases and no regular bookings, show as available
    if (tempReleaseSlots.length > 0 && bookedSlots.length === 0) {
      status = "fully_available";
    }

    console.log(`Final status: ${status}`);
    console.log(`=== End calculation for ${dateStr} ===`);

    return {
      date: dateStr,
      status,
      bookedSlots,
      pendingSlots,
      availableSlots,
      tempReleaseSlots
    };
  };

  // Helper function to enrich bookings with temporary release display data
  const enrichBookingsWithTempReleases = (bookings: Booking[], computerId: string): Booking[] => {
    // For backward compatibility, convert temporaryRelease field to temporaryReleases array
    return bookings.map(booking => {
      const temporaryReleases: TemporaryRelease[] = [];
      
      // If booking has temporaryRelease field with active releases, convert it
      if (booking.temporaryRelease?.hasActiveReleases && booking.temporaryRelease.releasedDates?.length > 0) {
        temporaryReleases.push({
          _id: `${booking._id}_release`,
          bookingId: booking._id,
          userId: '', // Not needed for display
          releasedDates: booking.temporaryRelease.releasedDates.map(rd => rd.date),
          reason: 'Temporary release',
          status: 'active',
          createdAt: booking.temporaryRelease.lastUpdated
        });
      }
      
      return {
        ...booking,
        temporaryReleases: temporaryReleases.length > 0 ? temporaryReleases : booking.temporaryReleases
      };
    });
  };



  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Computer Availability
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rectangular" width={300} height={200} />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Login Prompt for non-authenticated users */}
      {!currentUser && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              variant="outlined"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          }
        >
          <Typography variant="body1" fontWeight="bold">
            To make a booking, please sign in to your account
          </Typography>
          <Typography variant="body2">
            You can browse available computers, but booking requires authentication.
          </Typography>
        </Alert>
      )}

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Computers</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="booked">Booked</MenuItem>
            <MenuItem value="reserved">Reserved</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
          </Select>
        </FormControl>

        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ display: { xs: "none", md: "block" } }}
        >
          Click on available computers to view their bookings
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={() => setViewMode("grid")}
            color={viewMode === "grid" ? "primary" : "default"}
            sx={{
              border: viewMode === "grid" ? "2px solid" : "1px solid",
              borderColor: viewMode === "grid" ? "primary.main" : "divider",
              borderRadius: 1,
            }}
          >
            <GridViewIcon />
          </IconButton>
          <IconButton
            onClick={() => setViewMode("list")}
            color={viewMode === "list" ? "primary" : "default"}
            sx={{
              border: viewMode === "list" ? "2px solid" : "1px solid",
              borderColor: viewMode === "list" ? "primary.main" : "divider",
              borderRadius: 1,
            }}
          >
            <ListIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Mobile instruction text */}
      <Box sx={{ display: { xs: "block", md: "none" }, mb: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Click on available computers to view their bookings
        </Typography>
      </Box>



      {/* White Box Container */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 3,
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
        }}
      >


        {/* Computer Status Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(auto-fit, minmax(180px, 1fr))",
              md: "repeat(auto-fit, minmax(200px, 1fr))",
              lg: "repeat(auto-fit, minmax(220px, 1fr))",
            },
            gap: { xs: 2, sm: 3 },
            justifyContent: "center",
          }}
        >
          {filteredComputers.map((computer) => {
            const activeBookings = (computer.bookings || []).filter(
              (b) => b.status === "approved"
            ).length || 0;
            const pendingBookings = (computer.bookings || []).filter(
              (b) => b.status === "pending"
            ).length || 0;

            // Determine the display status and color
            const getDisplayInfo = () => {
              switch (computer.status) {
                case "available":
                  return {
                    iconColor: "success.main",
                    chipLabel: activeBookings > 0 ? `${activeBookings} Active Booking${activeBookings !== 1 ? "s" : ""}` : "Available",
                    chipColor: activeBookings > 0 ? "warning" : "success"
                  };
                case "reserved":
                  return {
                    iconColor: "info.main",
                    chipLabel: "Reserved",
                    chipColor: "info"
                  };
                case "maintenance":
                  return {
                    iconColor: "warning.main",
                    chipLabel: "Under Maintenance",
                    chipColor: "warning"
                  };
                case "booked":
                  return {
                    iconColor: "error.main",
                    chipLabel: "Occupied",
                    chipColor: "error"
                  };
                default:
                  return {
                    iconColor: "grey.500",
                    chipLabel: "Unknown",
                    chipColor: "default"
                  };
              }
            };

            const displayInfo = getDisplayInfo();

            return (
              <Card
                key={computer._id}
                sx={{
                  minHeight: 140,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: computer.status === "available" ? "pointer" : "default",
                  opacity: computer.status === "available" ? 1 : 0.7,
                  "&:hover": computer.status === "available" ? {
                    transform: "translateY(-2px)",
                    boxShadow: (theme) =>
                      `0 8px 24px ${
                        theme.palette.mode === "dark"
                          ? "rgba(0,0,0,0.3)"
                          : "rgba(0,0,0,0.1)"
                      }`,
                  } : {},
                }}
                onClick={(e) => {
                  // Only handle click if not clicking on action buttons
                  if (computer.status === "available" && !e.defaultPrevented) {
                    handleComputerClick(computer);
                  }
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: { xs: 2.5, sm: 3 },
                    textAlign: "center",
                  }}
                >
                  {/* Computer Icon & Online Badge */}
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 2, position: "relative" }}>
                    <ComputerIcon
                      sx={{
                        color: displayInfo.iconColor,
                        fontSize: { xs: 36, sm: 40, md: 44 },
                      }}
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: computer.isOnline ? "#4caf50" : "#9e9e9e",
                        border: "2px solid #fff",
                        position: "absolute",
                        bottom: 0,
                        right: "calc(50% - 22px)",
                        boxShadow: computer.isOnline ? "0 0 8px #4caf50" : "none",
                        animation: computer.isOnline ? "pulse 2s infinite" : "none",
                        "@keyframes pulse": {
                          "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(76, 175, 80, 0.7)" },
                          "70%": { transform: "scale(1)", boxShadow: "0 0 0 6px rgba(76, 175, 80, 0)" },
                          "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(76, 175, 80, 0)" }
                        }
                      }}
                    />
                  </Box>

                  {/* Computer Name & OS Info */}
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 1.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "1rem", sm: "1.125rem" },
                        mb: 0.5
                      }}
                    >
                      {computer.name}
                    </Typography>
                    {computer.isOnline && computer.systemDetails?.operatingSystem && (
                      <Chip
                        label={
                          computer.systemDetails.operatingSystem === "Windows" ? "🪟 Windows" : 
                          computer.systemDetails.operatingSystem === "Linux" ? "🐧 Linux" : 
                          `💻 ${computer.systemDetails.operatingSystem}`
                        }
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          backgroundColor: computer.systemDetails.operatingSystem === "Windows" ? "rgba(25, 118, 210, 0.08)" : "rgba(76, 175, 80, 0.08)",
                          color: computer.systemDetails.operatingSystem === "Windows" ? "#1976d2" : "#2e7d32",
                          border: "1px solid",
                          borderColor: computer.systemDetails.operatingSystem === "Windows" ? "rgba(25, 118, 210, 0.2)" : "rgba(76, 175, 80, 0.2)"
                        }}
                      />
                    )}
                  </Box>

                  {/* Status/Booking Information */}
                  <Stack spacing={0.75} alignItems="center">
                    <Chip
                      label={displayInfo.chipLabel}
                      color={displayInfo.chipColor as any}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    {pendingBookings > 0 && (
                      <Chip
                        label={`${pendingBookings} Pending Booking${pendingBookings !== 1 ? "s" : ""}`}
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                      />
                    )}
                  </Stack>

                  {/* Location */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      mt: 1,
                    }}
                  >
                    {computer.location}
                  </Typography>

                  {/* Agent Live Telemetry (if online) */}
                  {computer.isOnline && computer.liveMetrics && (
                    <Box sx={{ mt: 2, mb: 1, width: "100%", textAlign: "left" }}>
                      <Divider sx={{ my: 1.5 }} />
                      
                      {/* Metric Utilization Grid */}
                      <Grid container spacing={1} sx={{ mb: 1.5 }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.68rem" }}>CPU</Typography>
                          <Typography variant="body2" fontWeight={700} color="text.primary">{Math.round(computer.liveMetrics.cpuUtil)}%</Typography>
                          <LinearProgress variant="determinate" value={computer.liveMetrics.cpuUtil} color="primary" sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.68rem" }}>RAM</Typography>
                          <Typography variant="body2" fontWeight={700} color="text.primary">{Math.round(computer.liveMetrics.ramUtil)}%</Typography>
                          <LinearProgress variant="determinate" value={computer.liveMetrics.ramUtil} color="info" sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.68rem" }}>GPU</Typography>
                          <Typography variant="body2" fontWeight={700} color="text.primary">{Math.round(computer.liveMetrics.gpuUtil)}%</Typography>
                          <LinearProgress variant="determinate" value={computer.liveMetrics.gpuUtil} color="secondary" sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />
                        </Grid>
                      </Grid>

                      {/* Network & Temps Info */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "flex", gap: 0.5, fontSize: "0.65rem" }}>
                          Net: ↑ {formatBytes(computer.liveMetrics.netSentSpeed)}/s ↓ {formatBytes(computer.liveMetrics.netRecvSpeed)}/s
                        </Typography>
                        {computer.liveMetrics.cpuTemp > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                            Temp: {Math.round(computer.liveMetrics.cpuTemp)}°C
                          </Typography>
                        )}
                      </Box>

                      {/* Active Attendance Info */}
                      {computer.agentActiveSession && computer.agentActiveSession.checkedIn ? (
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                            <Typography variant="caption" fontWeight={700} color="primary">
                              👤 {computer.agentActiveSession.currentUser}
                            </Typography>
                            <Chip 
                              label={computer.agentActiveSession.sessionType} 
                              size="small" 
                              sx={{ height: 16, fontSize: "0.58rem", textTransform: "uppercase" }} 
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.68rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            <strong>Agenda:</strong> {computer.agentActiveSession.agenda}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: "action.hover", border: "1px dashed", borderColor: "divider", textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", fontSize: "0.65rem" }}>
                            No active attendance check-in
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Last Seen timestamp */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.6rem", textAlign: "right", mt: 1 }}>
                        Last seen: {computer.lastSeen ? new Date(computer.lastSeen).toLocaleTimeString() : "N/A"}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ mt: 2, display: "flex", gap: 1, justifyContent: "center" }}>
                    <Tooltip title="View Schedule">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleComputerClick(computer);
                        }}
                        sx={{ 
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.2)' }
                        }}
                      >
                        <ScheduleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Calendar View">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCalendarView(computer);
                        }}
                        sx={{ 
                          backgroundColor: 'rgba(156, 39, 176, 0.1)',
                          '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.2)' }
                        }}
                      >
                        <CalendarIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Temporary Release Indicator */}
                  {(() => {
                    const activeBookings = computer.bookings?.filter(b => b.status === "approved") || [];
                    const enrichedBookings = enrichBookingsWithTempReleases(activeBookings, computer._id);
                    const totalTempReleases = enrichedBookings.reduce((acc, booking) => acc + (booking.temporaryReleases?.length || 0), 0);
                    const totalAvailableDays = enrichedBookings.reduce((acc, booking) => acc + (booking.temporaryReleases?.reduce((sum, release) => sum + release.releasedDates.length, 0) || 0), 0);
                    
                    if (totalTempReleases > 0) {
                      return (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`${totalAvailableDays} days available (${totalTempReleases} release${totalTempReleases !== 1 ? 's' : ''})`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Paper>

      <BookingsDialogComponent
        open={showBookingsDialog}
        selectedComputer={selectedComputer}
        userRole={userRole}
        onClose={() => setShowBookingsDialog(false)}
        onSwitchToCalendar={(computer) => {
          setShowBookingsDialog(false);
          handleCalendarView(computer);
        }}
        enrichBookingsWithTempReleases={enrichBookingsWithTempReleases}
        getStatusColor={getStatusColor}
      />
      <CalendarDialogComponent
        open={showCalendarDialog}
        selectedComputer={selectedComputer}
        userRole={userRole}
        policy={policy}
        onClose={() => setShowCalendarDialog(false)}
        onNavigateBook={(computerId, date) => navigate("/book", { state: { computerId, date: date ? date.toISOString() : undefined } })}
        calculateDateAvailability={calculateDateAvailability}
      />

      {filteredComputers.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No computers found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/* ── Standalone Dialog Components (Prevents unmounting/flicker on parent re-renders) ── */

interface BookingsDialogProps {
  open: boolean;
  selectedComputer: Computer | null;
  userRole: string;
  onClose: () => void;
  onSwitchToCalendar: (computer: Computer) => void;
  enrichBookingsWithTempReleases: (bookings: Booking[], computerId: string) => Booking[];
  getStatusColor: (status: string) => any;
}

const BookingsDialogComponent: React.FC<BookingsDialogProps> = React.memo(({
  open,
  selectedComputer,
  userRole,
  onClose,
  onSwitchToCalendar,
  enrichBookingsWithTempReleases,
  getStatusColor,
}) => {
  if (!selectedComputer) return null;

  const visibleBookings = (selectedComputer.bookings || []).filter(
    (b) => b.status === "approved" || b.status === "pending"
  );

  const enrichedBookings = enrichBookingsWithTempReleases(visibleBookings, selectedComputer._id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">
            Schedule for {selectedComputer.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={`${enrichedBookings.filter((b) => b.status === "approved").length} Approved`}
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`${enrichedBookings.filter((b) => b.status === "pending").length} Pending`}
              color="warning"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`${enrichedBookings.reduce((acc, booking) => acc + (booking.temporaryReleases?.length || 0), 0)} Temp Release${enrichedBookings.reduce((acc, booking) => acc + (booking.temporaryReleases?.length || 0), 0) !== 1 ? "s" : ""}`}
              color="secondary"
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {enrichedBookings.length > 0 ? (
          <Box sx={{ mt: 1 }}>
            {enrichedBookings.map((booking) => {
              const displayName =
                userRole === "admin"
                  ? booking.user?.name || booking.userId?.name || "Unknown User"
                  : "Anonymous";

              return (
                <Card key={booking._id} sx={{ mb: 2, border: "1px solid", borderColor: booking.status === "pending" ? "warning.main" : "divider" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {displayName}
                        </Typography>
                        {booking.status === "pending" && (
                          <Chip label="Pending Approval" color="warning" size="small" variant="filled" sx={{ fontWeight: 600 }} />
                        )}
                      </Box>
                      <Chip
                        label={booking.status.toUpperCase()}
                        color={getStatusColor(booking.status)}
                        size="small"
                        variant={booking.status === "approved" ? "filled" : "outlined"}
                      />
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.primary" fontWeight={600}>
                        Dates: {format(new Date(booking.startDate), "MMM d, yyyy")} – {format(new Date(booking.endDate), "MMM d, yyyy")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time Slot: {booking.startTime} – {booking.endTime}
                      </Typography>
                    </Box>

                    {booking.temporaryReleases && booking.temporaryReleases.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: "secondary.main" }}>
                            Released Dates:
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {booking.temporaryReleases
                              ?.flatMap((release) => release.releasedDates)
                              .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                              .map((dateStr, index) => {
                                const totalDates = booking.temporaryReleases?.flatMap((release) => release.releasedDates) || [];
                                return (
                                  <Typography key={index} variant="body2" color="secondary">
                                    {format(new Date(dateStr), "MMM d")}
                                    {index < totalDates.length - 1 && ", "}
                                  </Typography>
                                );
                              })}
                          </Box>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body1">No active bookings</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => onSwitchToCalendar(selectedComputer)}
          startIcon={<CalendarIcon />}
          variant="outlined"
        >
          Calendar View
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
});

interface CalendarDialogProps {
  open: boolean;
  selectedComputer: Computer | null;
  userRole: string;
  policy: any;
  onClose: () => void;
  onNavigateBook: (computerId?: string, date?: Date | null) => void;
  calculateDateAvailability: (date: Date, computer: Computer) => DateAvailability;
}

const CalendarDialogComponent: React.FC<CalendarDialogProps> = React.memo(({
  open,
  selectedComputer,
  userRole,
  policy,
  onClose,
  onNavigateBook,
  calculateDateAvailability,
}) => {
  if (!selectedComputer) return null;

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedDateAvailability, setSelectedDateAvailability] = useState<DateAvailability | null>(null);

  useEffect(() => {
    if (open && selectedComputer) {
      const targetDate = selectedDate || new Date();
      setSelectedDate(targetDate);
      const availability = calculateDateAvailability(targetDate, selectedComputer);
      setSelectedDateAvailability(availability);
    }
  }, [open, selectedComputer]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const availability = calculateDateAvailability(date, selectedComputer);
    setSelectedDateAvailability(availability);
  };

  const shouldDisableDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateCheck = new Date(date);
    dateCheck.setHours(0, 0, 0, 0);

    const maxBookingDate = new Date(today);
    maxBookingDate.setDate(today.getDate() + MAX_BOOKING_AHEAD_DAYS);

    return dateCheck < today || CLOSED_DAYS.includes(dateCheck.getDay()) || dateCheck > maxBookingDate;
  };

  const ServerDay = (props: PickersDayProps<Date> & { selectedComputer?: Computer | null }) => {
    const { day, selectedComputer: comp, ...other } = props;

    let statusBg = undefined;
    let statusBorder = undefined;
    let hasTempRelease = false;

    const targetComp = comp || selectedComputer;

    if (targetComp && day) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateCheck = new Date(day);
      dateCheck.setHours(0, 0, 0, 0);

      const maxBookingDate = new Date(today);
      maxBookingDate.setDate(today.getDate() + MAX_BOOKING_AHEAD_DAYS);

      const isPast = dateCheck < today;
      const isClosed = CLOSED_DAYS.includes(dateCheck.getDay());
      const isBeyond = dateCheck > maxBookingDate;

      if (!isPast && !isClosed && !isBeyond) {
        const availability = calculateDateAvailability(day, targetComp);
        switch (availability.status) {
          case "fully_available":
            statusBg = "rgba(76, 175, 80, 0.18)";
            statusBorder = "1px solid rgba(76, 175, 80, 0.4)";
            break;
          case "partially_available":
            statusBg = "rgba(255, 193, 7, 0.18)";
            statusBorder = "1px solid rgba(255, 193, 7, 0.4)";
            break;
          case "fully_booked":
            statusBg = "rgba(244, 67, 54, 0.18)";
            statusBorder = "1px solid rgba(244, 67, 54, 0.4)";
            break;
          case "closed":
            statusBg = "rgba(158, 158, 158, 0.1)";
            statusBorder = "1px solid rgba(158, 158, 158, 0.2)";
            break;
        }
        hasTempRelease = availability.tempReleaseSlots.length > 0;
      }
    }

    return (
      <Box sx={{ position: "relative" }}>
        <PickersDay
          {...other}
          day={day}
          sx={{
            backgroundColor: statusBg,
            border: statusBorder,
            "&:hover": {
              backgroundColor: statusBg,
              filter: "brightness(0.9)",
            },
          }}
        />
        {hasTempRelease && (
          <Box
            sx={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              backgroundColor: "#9c27b0",
              borderRadius: "50%",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarIcon />
          Availability Calendar - {selectedComputer.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
          <Box sx={{ flex: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={selectedDate}
                onChange={(newValue) => {
                  if (newValue) handleDateClick(newValue);
                }}
                shouldDisableDate={shouldDisableDate}
                slots={{
                  day: ServerDay,
                }}
                slotProps={{
                  day: {
                    selectedComputer,
                  } as any,
                }}
              />
            </LocalizationProvider>

            <Box sx={{ mt: 2, p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Legend:</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: "rgba(76, 175, 80, 0.6)", borderRadius: "50%" }} />
                  <Typography variant="caption">Fully Available</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: "rgba(255, 193, 7, 0.6)", borderRadius: "50%" }} />
                  <Typography variant="caption">Partially Available</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: "rgba(244, 67, 54, 0.6)", borderRadius: "50%" }} />
                  <Typography variant="caption">Fully Booked</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: "rgba(158, 158, 158, 0.6)", borderRadius: "50%" }} />
                  <Typography variant="caption">Closed</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: "rgba(156, 39, 176, 0.6)", borderRadius: "50%" }} />
                  <Typography variant="caption">Temp Release</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 300 }}>
            {selectedDate && selectedDateAvailability ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {format(selectedDate, "MMMM d, yyyy")}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={selectedDateAvailability.status.replace("_", " ").toUpperCase()}
                    color={
                      selectedDateAvailability.status === "fully_available"
                        ? "success"
                        : selectedDateAvailability.status === "partially_available"
                        ? "warning"
                        : selectedDateAvailability.status === "fully_booked"
                        ? "error"
                        : "default"
                    }
                    variant="outlined"
                  />
                </Box>

                {selectedDateAvailability.status === "closed" ? (
                  <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    <Typography variant="body1">Lab is closed on this day</Typography>
                  </Box>
                ) : (
                  <Box>
                    {selectedDateAvailability.bookedSlots.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom color="error">
                          Approved Booked Slots ({selectedDateAvailability.bookedSlots.length})
                        </Typography>
                        {selectedDateAvailability.bookedSlots.map((slot, index) => (
                          <Card key={index} sx={{ mb: 1, p: 2, backgroundColor: "rgba(244, 67, 54, 0.05)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                              <BookIcon color="error" fontSize="small" />
                              <Typography variant="body2" fontWeight="bold">
                                {slot.startTime} - {slot.endTime}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              User: {userRole === "admin" ? slot.booking.user?.name || slot.booking.userId?.name || "Unknown" : "Anonymous"}
                            </Typography>
                          </Card>
                        ))}
                      </Box>
                    )}

                    {selectedDateAvailability.pendingSlots.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom color="warning.main" fontWeight={700}>
                          Pending Requests ({selectedDateAvailability.pendingSlots.length})
                        </Typography>
                        {selectedDateAvailability.pendingSlots.map((slot, index) => (
                          <Card key={index} sx={{ mb: 1, p: 2, backgroundColor: "rgba(255, 152, 0, 0.08)", border: "1px dashed #ffa726" }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <BookIcon color="warning" fontSize="small" />
                                <Typography variant="body2" fontWeight="bold">
                                  {slot.startTime} - {slot.endTime}
                                </Typography>
                              </Box>
                              <Chip label="Pending Approval" color="warning" size="small" variant="outlined" />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              User: {userRole === "admin" ? slot.booking.user?.name || slot.booking.userId?.name || "Unknown" : "Anonymous"}
                            </Typography>
                          </Card>
                        ))}
                      </Box>
                    )}

                    {selectedDateAvailability.tempReleaseSlots.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom color="secondary">
                          Available (Temporary Release) ({selectedDateAvailability.tempReleaseSlots.length})
                        </Typography>
                        {selectedDateAvailability.tempReleaseSlots.map((slot, index) => (
                          <Card key={index} sx={{ mb: 1, p: 2, backgroundColor: "rgba(156, 39, 176, 0.05)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                              <TempReleaseIcon color="secondary" fontSize="small" />
                              <Typography variant="body2" fontWeight="bold">
                                {slot.startTime} - {slot.endTime}
                              </Typography>
                              <Chip label="Available" color="secondary" size="small" />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Released: {slot.release.reason}
                            </Typography>
                          </Card>
                        ))}
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<BookIcon />}
                          fullWidth
                          onClick={() => onNavigateBook(selectedComputer._id, selectedDate)}
                          sx={{ mt: 1 }}
                        >
                          Book This Slot
                        </Button>
                      </Box>
                    )}

                    {selectedDateAvailability.status === "fully_available" && (
                      <Box sx={{ py: 4, textAlign: "center" }}>
                        <CheckIcon sx={{ fontSize: 48, mb: 2, color: "success.main" }} />
                        <Typography variant="body1" gutterBottom>
                          Fully Available
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Lab hours: {policy.labOpenHour}:{policy.labOpenMinute.toString().padStart(2, "0")} - {policy.labCloseHour}:{policy.labCloseMinute.toString().padStart(2, "0")}
                        </Typography>
                        <Button variant="contained" startIcon={<BookIcon />} onClick={() => onNavigateBook(selectedComputer._id, selectedDate)} sx={{ mt: 2 }}>
                          Book Computer
                        </Button>
                      </Box>
                    )}

                    {selectedDateAvailability.status === "partially_available" && selectedDateAvailability.tempReleaseSlots.length === 0 && (
                      <Box sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="body1" gutterBottom>
                          Some slots are still available
                        </Typography>
                        <Button variant="outlined" startIcon={<BookIcon />} onClick={() => onNavigateBook(selectedComputer._id, selectedDate)}>
                          Check Available Slots
                        </Button>
                      </Box>
                    )}

                    {selectedDateAvailability.status === "fully_booked" && (
                      <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                        <CancelIcon sx={{ fontSize: 48, mb: 2, color: "error.main" }} />
                        <Typography variant="body1">Fully Booked</Typography>
                        <Typography variant="body2">No available slots on this date</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body1">Click on a date to view details</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
});

export default ComputerGrid;

