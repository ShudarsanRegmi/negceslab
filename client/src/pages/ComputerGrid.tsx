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
} from "@mui/material";
import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
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
import { computersAPI, temporaryReleaseAPI } from "../services/api";
import { bookingsAPI } from "../services/api";
import { format, isWithinInterval, parseISO, isSameDay, addDays, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

// Lab policy constants (keeping in sync with shared/policy.js)
const LAB_OPEN_HOUR = 8;
const LAB_OPEN_MINUTE = 30;
const LAB_CLOSE_HOUR = 17;
const LAB_CLOSE_MINUTE = 30;
const CLOSED_DAYS = [0]; // 0 = Sunday
const MAX_BOOKING_AHEAD_DAYS = 30; // Only allow booking up to 1 month ahead

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

  useEffect(() => {
    fetchComputers();
  }, []);

  const fetchComputers = async () => {
    try {
      setLoading(true);
      const usePublic = !currentUser; // Use public API if no user is authenticated
      const [computersRes, bookingsRes] = await Promise.all([
        computersAPI.getComputersWithBookings(usePublic),
        currentUser ? bookingsAPI.getUserBookings() : Promise.resolve({ data: [] }),
      ]);
      setComputers(computersRes.data);
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
    return CLOSED_DAYS.includes(date.getDay());
  };

  // Calculate lab operating hours in minutes
  const labOpenMinutes = LAB_OPEN_HOUR * 60 + LAB_OPEN_MINUTE;
  const labCloseMinutes = LAB_CLOSE_HOUR * 60 + LAB_CLOSE_MINUTE;
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
        availableSlots: [],
        tempReleaseSlots: []
      };
    }

    // Get all bookings for this computer that cover this date (only approved bookings)
    const dayBookings = (computer.bookings || []).filter(booking => {
      if (booking.status !== "approved") return false;
      
      const startDate = parseISO(booking.startDate);
      const endDate = parseISO(booking.endDate);
      return date >= startDate && date <= endDate;
    });

    console.log(`Found ${dayBookings.length} bookings covering this date`);

    const bookedSlots: { startTime: string; endTime: string; booking: Booking }[] = [];
    const tempReleaseSlots: { startTime: string; endTime: string; release: any }[] = [];

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

  const BookingsDialog = () => {
    if (!selectedComputer) return null;

    const activeBookings = (selectedComputer.bookings || []).filter(
      (b) => b.status === "approved"
    );

    // Enrich bookings with temporary release data
    const enrichedBookings = enrichBookingsWithTempReleases(activeBookings, selectedComputer._id);

    return (
      <Dialog
        open={showBookingsDialog}
        onClose={() => setShowBookingsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              Schedule for {selectedComputer.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label={`${enrichedBookings.length} Booking${enrichedBookings.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${enrichedBookings.reduce((acc, booking) => acc + (booking.temporaryReleases?.length || 0), 0)} Temp Release${enrichedBookings.reduce((acc, booking) => acc + (booking.temporaryReleases?.length || 0), 0) !== 1 ? 's' : ''}`}
                color="secondary"
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {enrichedBookings.length > 0 ? (
            <Box>
              {enrichedBookings.map((booking) => (
                <Card key={booking._id} sx={{ mb: 3, border: "1px solid", borderColor: "divider" }}>
                  <CardContent>
                    {/* Booking Header */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {userRole === 'admin' ? (booking.user?.name || "Unknown User") : "Booking"}
                      </Typography>
                      <Chip
                        label={booking.status}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                    </Box>

                    {/* Booking Details */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(booking.startDate), "MMM d, yyyy")} - {format(new Date(booking.endDate), "MMM d, yyyy")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time: {booking.startTime} - {booking.endTime}
                      </Typography>
                    </Box>

                    {/* Temporary Releases for this booking */}
                    {booking.temporaryReleases && booking.temporaryReleases.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: "secondary.main" }}>
                            Released Dates:
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {booking.temporaryReleases
                              ?.flatMap(release => release.releasedDates)
                              .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                              .map((dateStr, index) => {
                                const totalDates = booking.temporaryReleases?.flatMap(release => release.releasedDates) || [];
                                return (
                                  <Typography key={index} variant="body2" color="secondary">
                                    {format(new Date(dateStr), "MMM d")}
                                    {index < totalDates.length - 1 && ", "}
                                  </Typography>
                                );
                              })
                            }
                          </Box>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body1">No active bookings</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowBookingsDialog(false);
              handleCalendarView(selectedComputer);
            }}
            startIcon={<CalendarIcon />}
            variant="outlined"
          >
            Calendar View
          </Button>
          <Button onClick={() => setShowBookingsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Calendar Dialog Component
  const CalendarDialog = () => {
    if (!selectedComputer) return null;

    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedDateAvailability, setSelectedDateAvailability] = useState<DateAvailability | null>(null);
    const [currentViewMonth, setCurrentViewMonth] = useState<Date>(new Date());

    // Initialize with today's date when dialog opens
    useEffect(() => {
      if (selectedComputer && !selectedDate) {
        const today = new Date();
        setSelectedDate(today);
        setCurrentViewMonth(today);
        const availability = calculateDateAvailability(today, selectedComputer);
        setSelectedDateAvailability(availability);
      }
    }, [selectedComputer]);

    // Update availability whenever selected date changes
    useEffect(() => {
      if (selectedDate && selectedComputer) {
        const availability = calculateDateAvailability(selectedDate, selectedComputer);
        setSelectedDateAvailability(availability);
      }
    }, [selectedDate, selectedComputer]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      const availability = calculateDateAvailability(date, selectedComputer);
      setSelectedDateAvailability(availability);
    };

    // Function to check if a date should be disabled
    const shouldDisableDate = (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      // Calculate max booking date
      const maxBookingDate = new Date(today);
      maxBookingDate.setDate(today.getDate() + MAX_BOOKING_AHEAD_DAYS);
      
      // Disable past dates, Sundays, and dates beyond booking limit
      return date < today || 
             CLOSED_DAYS.includes(date.getDay()) || 
             date > maxBookingDate;
    };

    // Style calendar days based on availability
    useEffect(() => {
      const styleCalendarDays = () => {
        const days = document.querySelectorAll('.MuiPickersDay-root');
        days.forEach((dayElement: any) => {
          try {
            const dayText = dayElement.textContent;
            if (dayText && selectedComputer) {
              // Use currentViewMonth to get the correct year and month
              const year = currentViewMonth.getFullYear();
              const month = currentViewMonth.getMonth();
              const day = parseInt(dayText);
              const date = new Date(year, month, day);
              
              // Skip styling for disabled dates
              if (shouldDisableDate(date)) {
                return; // Skip disabled dates
              }
              
              // Calculate availability for this date
              const availability = calculateDateAvailability(date, selectedComputer);
              
              // Remove existing classes
              dayElement.classList.remove('fully-available', 'partially-available', 'fully-booked', 'closed-day');
              
              // Add appropriate class
              switch (availability.status) {
                case 'fully_available':
                  dayElement.classList.add('fully-available');
                  break;
                case 'partially_available':
                  dayElement.classList.add('partially-available');
                  break;
                case 'fully_booked':
                  dayElement.classList.add('fully-booked');
                  break;
                case 'closed':
                  dayElement.classList.add('closed-day');
                  break;
              }
              
              // Add temp release indicator
              if (availability.tempReleaseSlots.length > 0) {
                let indicator = dayElement.querySelector('.temp-release-indicator');
                if (!indicator) {
                  indicator = document.createElement('div');
                  indicator.className = 'temp-release-indicator';
                  indicator.style.cssText = `
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    width: 6px;
                    height: 6px;
                    background-color: #9c27b0;
                    border-radius: 50%;
                    z-index: 1;
                  `;
                  dayElement.appendChild(indicator);
                }
              } else {
                // Remove temp release indicator if it exists but no temp releases
                const existingIndicator = dayElement.querySelector('.temp-release-indicator');
                if (existingIndicator) {
                  existingIndicator.remove();
                }
              }
            }
          } catch (error) {
            // Ignore errors for invalid dates
          }
        });
      };
      
      // Initial styling with a small delay to ensure DOM is ready
      const initialTimeout = setTimeout(styleCalendarDays, 100);
      
      // Create observer for DOM changes - without debouncing for immediate response
      const observer = new MutationObserver(() => {
        setTimeout(styleCalendarDays, 10);
      });
      
      const calendarElement = document.querySelector('.MuiDateCalendar-root');
      if (calendarElement) {
        observer.observe(calendarElement, { 
          childList: true, 
          subtree: true
        });
      }
      
      return () => {
        clearTimeout(initialTimeout);
        observer.disconnect();
      };
    }, [selectedComputer, currentViewMonth]); // Depend on currentViewMonth instead of selectedDate

    return (
      <Dialog
        open={showCalendarDialog}
        onClose={() => setShowCalendarDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarIcon />
            Availability Calendar - {selectedComputer.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
            {/* Calendar */}
            <Box sx={{ flex: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                  value={selectedDate}
                  onChange={(newValue) => {
                    if (newValue) handleDateClick(newValue);
                  }}
                  onMonthChange={(month) => {
                    setCurrentViewMonth(month);
                  }}
                  onYearChange={(year) => {
                    setCurrentViewMonth(year);
                  }}
                  shouldDisableDate={shouldDisableDate}
                  sx={{
                    '& .MuiPickersDay-root': {
                      position: 'relative',
                    },
                    '& .MuiPickersDay-today': {
                      border: '2px solid',
                      borderColor: 'primary.main',
                    },
                    // Custom styles for different availability states
                    '& .fully-available': {
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.25)',
                      }
                    },
                    '& .partially-available': {
                      backgroundColor: 'rgba(255, 193, 7, 0.15)',
                      border: '1px solid rgba(255, 193, 7, 0.3)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 193, 7, 0.25)',
                      }
                    },
                    '& .fully-booked': {
                      backgroundColor: 'rgba(244, 67, 54, 0.15)',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.25)',
                      }
                    },
                    '& .closed-day': {
                      backgroundColor: 'rgba(158, 158, 158, 0.1)',
                      border: '1px solid rgba(158, 158, 158, 0.2)',
                      color: 'text.disabled',
                      '&:hover': {
                        backgroundColor: 'rgba(158, 158, 158, 0.2)',
                      }
                    }
                  }}
                  slotProps={{
                    day: {
                      sx: (theme) => ({
                        '&.Mui-selected': {
                          backgroundColor: `${theme.palette.primary.main} !important`,
                          color: 'white',
                        }
                      })
                    }
                  }}
                />
              </LocalizationProvider>
              
              {/* Legend */}
              <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Legend:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(76, 175, 80, 0.6)', borderRadius: '50%' }} />
                    <Typography variant="caption">Fully Available</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(255, 193, 7, 0.6)', borderRadius: '50%' }} />
                    <Typography variant="caption">Partially Available</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(244, 67, 54, 0.6)', borderRadius: '50%' }} />
                    <Typography variant="caption">Fully Booked</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(158, 158, 158, 0.6)', borderRadius: '50%' }} />
                    <Typography variant="caption">Closed</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(156, 39, 176, 0.6)', borderRadius: '50%' }} />
                    <Typography variant="caption">Temp Release</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Selected Date Details */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              {selectedDate && selectedDateAvailability ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {format(selectedDate, "MMMM d, yyyy")}
                  </Typography>
                  
                  {/* Status Chip */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={selectedDateAvailability.status.replace('_', ' ').toUpperCase()}
                      color={
                        selectedDateAvailability.status === 'fully_available' ? 'success' :
                        selectedDateAvailability.status === 'partially_available' ? 'warning' :
                        selectedDateAvailability.status === 'fully_booked' ? 'error' : 'default'
                      }
                      variant="outlined"
                    />
                  </Box>

                  {selectedDateAvailability.status === 'closed' ? (
                    <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                      <Typography variant="body1">Lab is closed on this day</Typography>
                    </Box>
                  ) : (
                    <Box>
                      {/* Booked Slots */}
                      {selectedDateAvailability.bookedSlots.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom color="error">
                            Booked Slots ({selectedDateAvailability.bookedSlots.length})
                          </Typography>
                          {selectedDateAvailability.bookedSlots.map((slot, index) => (
                            <Card key={index} sx={{ mb: 1, p: 2, backgroundColor: 'rgba(244, 67, 54, 0.05)' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <BookIcon color="error" fontSize="small" />
                                <Typography variant="body2" fontWeight="bold">
                                  {slot.startTime} - {slot.endTime}
                                </Typography>
                              </Box>
                              {userRole === 'admin' && (
                                <Typography variant="body2" color="text.secondary">
                                  User: {slot.booking.user?.name || "Unknown"}
                                </Typography>
                              )}
                            </Card>
                          ))}
                        </Box>
                      )}

                      {/* Temporary Release Slots */}
                      {selectedDateAvailability.tempReleaseSlots.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom color="secondary">
                            Available (Temporary Release) ({selectedDateAvailability.tempReleaseSlots.length})
                          </Typography>
                          {selectedDateAvailability.tempReleaseSlots.map((slot, index) => (
                            <Card key={index} sx={{ mb: 1, p: 2, backgroundColor: 'rgba(156, 39, 176, 0.05)' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TempReleaseIcon color="secondary" fontSize="small" />
                                <Typography variant="body2" fontWeight="bold">
                                  {slot.startTime} - {slot.endTime}
                                </Typography>
                                <Chip
                                  label="Available"
                                  color="secondary"
                                  size="small"
                                />
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
                            onClick={() => navigate("/book")}
                            sx={{ mt: 1 }}
                          >
                            Book This Slot
                          </Button>
                        </Box>
                      )}

                      {/* Fully Available */}
                      {selectedDateAvailability.status === 'fully_available' && (
                        <Box sx={{ py: 4, textAlign: "center" }}>
                          <CheckIcon sx={{ fontSize: 48, mb: 2, color: 'success.main' }} />
                          <Typography variant="body1" gutterBottom>
                            Fully Available
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Lab hours: {LAB_OPEN_HOUR}:{LAB_OPEN_MINUTE.toString().padStart(2, '0')} - {LAB_CLOSE_HOUR}:{LAB_CLOSE_MINUTE.toString().padStart(2, '0')}
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<BookIcon />}
                            onClick={() => navigate("/book")}
                            sx={{ mt: 2 }}
                          >
                            Book Computer
                          </Button>
                        </Box>
                      )}

                      {/* Partially Available */}
                      {selectedDateAvailability.status === 'partially_available' && selectedDateAvailability.tempReleaseSlots.length === 0 && (
                        <Box sx={{ textAlign: "center", py: 2 }}>
                          <Typography variant="body1" gutterBottom>
                            Some slots are still available
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<BookIcon />}
                            onClick={() => navigate("/book")}
                          >
                            Check Available Slots
                          </Button>
                        </Box>
                      )}

                      {/* Fully Booked */}
                      {selectedDateAvailability.status === 'fully_booked' && (
                        <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                          <CancelIcon sx={{ fontSize: 48, mb: 2, color: 'error.main' }} />
                          <Typography variant="body1">
                            Fully Booked
                          </Typography>
                          <Typography variant="body2">
                            No available slots on this date
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                  <Typography variant="body1">
                    Click on a date to view details
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCalendarDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
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
                  {/* Computer Icon */}
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                    <ComputerIcon
                      sx={{
                        color: displayInfo.iconColor,
                        fontSize: { xs: 36, sm: 40, md: 44 },
                      }}
                    />
                  </Box>

                  {/* Computer Name */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "1rem", sm: "1.125rem" },
                      mb: 1.5,
                    }}
                  >
                    {computer.name}
                  </Typography>

                  {/* Status/Booking Information */}
                  <Box>
                    <Chip
                      label={displayInfo.chipLabel}
                      color={displayInfo.chipColor as any}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>

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

      <BookingsDialog />
      <CalendarDialog />

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

export default ComputerGrid;
