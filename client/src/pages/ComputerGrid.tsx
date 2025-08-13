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
  // Add temporary release info to booking
  temporaryReleases?: TemporaryRelease[];
}

interface TemporaryRelease {
  _id: string;
  bookingId: string;
  releasedDates: string[];
  reason: string;
  status: "active" | "cancelled" | "partially_booked";
  originalBooking?: {
    computerId: {
      _id: string;
      name: string;
    };
  };
}

interface CalendarEvent {
  date: string;
  type: "booking" | "temp_release" | "available";
  details: {
    booking?: Booking;
    tempRelease?: TemporaryRelease;
    timeSlot?: string;
  };
}

const ComputerGrid: React.FC = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth(); // Get userRole from auth context
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
      const [computersRes, bookingsRes] = await Promise.all([
        computersAPI.getComputersWithBookings(),
        bookingsAPI.getUserBookings(),
      ]);
      setComputers(computersRes.data);
      setBookings(bookingsRes.data);

      // Fetch temporary releases if user is admin or for all users
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
    const matchesSearch =
      computer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      computer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      computer.specifications.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || computer.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  // Get temporary releases for a specific computer
  const getTemporaryReleasesForComputer = (computerId: string) => {
    return temporaryReleases.filter(release => 
      release.originalBooking?.computerId?._id === computerId && 
      release.status === 'active'
    );
  };

  // Merge temporary releases with their corresponding bookings
  const enrichBookingsWithTempReleases = (bookings: Booking[], computerId: string): Booking[] => {
    const tempReleases = getTemporaryReleasesForComputer(computerId);
    
    return bookings.map(booking => {
      // Find temporary releases for this specific booking
      const bookingTempReleases = tempReleases.filter(release => release.bookingId === booking._id);
      
      return {
        ...booking,
        temporaryReleases: bookingTempReleases
      };
    });
  };

  // Get events for calendar display
  const getCalendarEvents = (computer: Computer): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const now = new Date();
    const monthStart = startOfMonth(calendarValue || now);
    const monthEnd = endOfMonth(calendarValue || now);

    // Enrich bookings with temporary release data
    const enrichedBookings = enrichBookingsWithTempReleases(computer.bookings || [], computer._id);

    // Add booking events
    enrichedBookings.forEach(booking => {
      if (booking.status === "approved" || booking.status === "pending") {
        const startDate = parseISO(booking.startDate);
        const endDate = parseISO(booking.endDate);
        
        // Generate events for each day in the booking period
        let currentDate = startDate;
        while (currentDate <= endDate && currentDate <= monthEnd) {
          if (currentDate >= monthStart) {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            
            // Check if this date has a temporary release
            const hasActiveTempRelease = booking.temporaryReleases?.some(release => 
              release.status === 'active' && release.releasedDates.includes(dateStr)
            );
            
            events.push({
              date: dateStr,
              type: hasActiveTempRelease ? "temp_release" : "booking",
              details: {
                booking,
                timeSlot: `${booking.startTime} - ${booking.endTime}`,
                tempRelease: hasActiveTempRelease ? booking.temporaryReleases?.find(release => 
                  release.status === 'active' && release.releasedDates.includes(dateStr)
                ) : undefined
              }
            });
          }
          currentDate = addDays(currentDate, 1);
        }
      }
    });

    return events;
  };

  // Check if a date has events
  const hasEvents = (date: Date, computer: Computer) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const events = getCalendarEvents(computer);
    return events.some(event => event.date === dateStr);
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date, computer: Computer) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const events = getCalendarEvents(computer);
    return events.filter(event => event.date === dateStr);
  };

  const BookingsDialog = () => {
    if (!selectedComputer) return null;

    const activeBookings = (selectedComputer.bookings || []).filter(
      (b) => b.status !== "rejected" && b.status !== "cancelled"
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
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Purpose:</strong> {booking.reason}
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
                              .flatMap(release => release.releasedDates)
                              .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                              .map((dateStr, index) => (
                                <Typography key={index} variant="body2" color="secondary">
                                  {format(new Date(dateStr), "MMM d")}
                                  {index < booking.temporaryReleases.flatMap(release => release.releasedDates).length - 1 && ", "}
                                </Typography>
                              ))
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

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      const events = getEventsForDate(date, selectedComputer);
      setSelectedDateEvents(events);
    };

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
                  value={calendarValue}
                  onChange={(newValue) => {
                    setCalendarValue(newValue);
                    if (newValue) handleDateClick(newValue);
                  }}
                  sx={{
                    '& .MuiPickersDay-root': {
                      position: 'relative',
                    },
                    '& .booking-day': {
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.2)',
                      }
                    },
                    '& .temp-release-day': {
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                      }
                    },
                    '& .both-day': {
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 152, 0, 0.2)',
                      }
                    }
                  }}
                />
              </LocalizationProvider>
              
              {/* Legend */}
              <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Legend:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: 'primary.main', borderRadius: '50%' }} />
                    <Typography variant="caption">Booking</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: 'secondary.main', borderRadius: '50%' }} />
                    <Typography variant="caption">Temp Release</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: 'orange', borderRadius: '50%' }} />
                    <Typography variant="caption">Both</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Selected Date Details */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              {selectedDate ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {format(selectedDate, "MMMM d, yyyy")}
                  </Typography>
                  
                  {selectedDateEvents.length > 0 ? (
                    <Box>
                      {selectedDateEvents.map((event, index) => (
                        <Card key={index} sx={{ mb: 2, p: 2 }}>
                          {event.type === "booking" && event.details.booking && (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <BookIcon color="primary" fontSize="small" />
                                <Typography variant="subtitle2" color="primary">
                                  Booking
                                </Typography>
                                <Chip
                                  label={event.details.booking.status}
                                  color={getStatusColor(event.details.booking.status)}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="body2">
                                <strong>Time:</strong> {event.details.timeSlot}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Purpose:</strong> {event.details.booking.reason}
                              </Typography>
                              {userRole === 'admin' && (
                                <Typography variant="body2">
                                  <strong>User:</strong> {event.details.booking.user?.name || "Unknown"}
                                </Typography>
                              )}
                            </Box>
                          )}
                          
                          {event.type === "temp_release" && event.details.tempRelease && (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TempReleaseIcon color="secondary" fontSize="small" />
                                <Typography variant="subtitle2" color="secondary">
                                  Temporary Release
                                </Typography>
                                <Chip
                                  label={event.details.tempRelease.status}
                                  color={event.details.tempRelease.status === "active" ? "success" : "default"}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="body2">
                                <strong>Available for booking</strong>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Reason:</strong> {event.details.tempRelease.reason}
                              </Typography>
                            </Box>
                          )}
                        </Card>
                      ))}
                      
                      {/* Available for booking button */}
                      {selectedDateEvents.some(e => e.type === "temp_release") && (
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<BookIcon />}
                          fullWidth
                          onClick={() => navigate("/book")}
                          sx={{ mt: 2 }}
                        >
                          Book This Date
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                      <EventIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1">
                        No events on this date
                      </Typography>
                      <Typography variant="body2">
                        This date is available for booking
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<BookIcon />}
                        onClick={() => navigate("/book")}
                        sx={{ mt: 2 }}
                      >
                        Book Computer
                      </Button>
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

  // Calculate summary statistics
  const totalComputers = computers.length;
  const availableComputers = computers.filter(
    (c) => c.status === "available"
  ).length;
  const occupiedComputers = computers.filter(
    (c) => c.status === "booked"
  ).length;
  const reservedComputers = computers.filter(
    (c) => c.status === "reserved"
  ).length;
  const maintenanceComputers = computers.filter(
    (c) => c.status === "maintenance"
  ).length;
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const approvedBookings = bookings.filter(
    (b) => b.status === "approved"
  ).length;
  const rejectedBookings = bookings.filter(
    (b) => b.status === "rejected"
  ).length;

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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Computer Availability
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Monitor and manage lab computer status in real-time
        </Typography>
        <Button
          variant="contained"
          startIcon={<BookIcon />}
          sx={{ mb: 3 }}
          onClick={() => navigate("/book")}
        >
          + Book Computer
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.01) 100%)",
              border: "1px solid rgba(25, 118, 210, 0.12)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 25px rgba(25, 118, 210, 0.15)",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 48,
                    height: 48,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(25, 118, 210, 0.25)",
                  }}
                >
                  <ComputerIcon
                    sx={{
                      fontSize: 24,
                      color: "white",
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                      mb: 0.5,
                      fontSize: {
                        xs: "1.75rem",
                        sm: "2rem",
                        md: "2.5rem",
                        lg: "3rem",
                      },
                    }}
                  >
                    {totalComputers}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    Total Computers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                "linear-gradient(135deg, rgba(2, 136, 209, 0.05) 0%, rgba(2, 136, 209, 0.01) 100%)",
              border: "1px solid rgba(2, 136, 209, 0.12)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 25px rgba(2, 136, 209, 0.15)",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "info.main",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 48,
                    height: 48,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(2, 136, 209, 0.25)",
                  }}
                >
                  <BookIcon
                    sx={{
                      fontSize: 24,
                      color: "white",
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                      mb: 0.5,
                      fontSize: {
                        xs: "1.75rem",
                        sm: "2rem",
                        md: "2.5rem",
                        lg: "3rem",
                      },
                    }}
                  >
                    {totalBookings}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    Total Bookings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                "linear-gradient(135deg, rgba(245, 124, 0, 0.05) 0%, rgba(245, 124, 0, 0.01) 100%)",
              border: "1px solid rgba(245, 124, 0, 0.12)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 25px rgba(245, 124, 0, 0.15)",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "warning.main",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 48,
                    height: 48,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(245, 124, 0, 0.25)",
                  }}
                >
                  <BuildIcon
                    sx={{
                      fontSize: 24,
                      color: "white",
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                      mb: 0.5,
                      fontSize: {
                        xs: "1.75rem",
                        sm: "2rem",
                        md: "2.5rem",
                        lg: "3rem",
                      },
                    }}
                  >
                    {maintenanceComputers}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    Under Maintenance
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                "linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.01) 100%)",
              border: "1px solid rgba(33, 150, 243, 0.12)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 25px rgba(33, 150, 243, 0.15)",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "info.main",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 48,
                    height: 48,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(33, 150, 243, 0.25)",
                  }}
                >
                  <BookIcon
                    sx={{
                      fontSize: 24,
                      color: "white",
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                      mb: 0.5,
                      fontSize: {
                        xs: "1.75rem",
                        sm: "2rem",
                        md: "2.5rem",
                        lg: "3rem",
                      },
                    }}
                  >
                    {reservedComputers}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    Reserved Systems
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                "linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(251, 146, 60, 0.01) 100%)",
              border: "1px solid rgba(251, 146, 60, 0.12)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 25px rgba(251, 146, 60, 0.15)",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "secondary.main",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 48,
                    height: 48,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(251, 146, 60, 0.25)",
                  }}
                >
                  <NotificationIcon
                    sx={{
                      fontSize: 24,
                      color: "white",
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                      mb: 0.5,
                      fontSize: {
                        xs: "1.75rem",
                        sm: "2rem",
                        md: "2.5rem",
                        lg: "3rem",
                      },
                    }}
                  >
                    {pendingBookings}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    Pending Approvals
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                "linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(46, 125, 50, 0.01) 100%)",
              border: "1px solid rgba(46, 125, 50, 0.12)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 25px rgba(46, 125, 50, 0.15)",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "success.main",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 48,
                    height: 48,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(46, 125, 50, 0.25)",
                  }}
                >
                  <TrendingIcon
                    sx={{
                      fontSize: 24,
                      color: "white",
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                      mb: 0.5,
                      fontSize: {
                        xs: "1.75rem",
                        sm: "2rem",
                        md: "2.5rem",
                        lg: "3rem",
                      },
                    }}
                  >
                    {approvedBookings}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    Approved Bookings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                "linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(211, 47, 47, 0.01) 100%)",
              border: "1px solid rgba(211, 47, 47, 0.12)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 25px rgba(211, 47, 47, 0.15)",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "error.main",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 48,
                    height: 48,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(211, 47, 47, 0.25)",
                  }}
                >
                  <CancelIcon
                    sx={{
                      fontSize: 24,
                      color: "white",
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                      mb: 0.5,
                      fontSize: {
                        xs: "1.75rem",
                        sm: "2rem",
                        md: "2.5rem",
                        lg: "3rem",
                      },
                    }}
                  >
                    {rejectedBookings}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    Rejected Bookings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2, sm: 3 },
          mb: 4,
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <TextField
          label="Search computers..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            flexGrow: 1,
            minWidth: { xs: "100%", sm: 200 },
          }}
          size="small"
        />

        <FormControl sx={{ minWidth: { xs: "100%", sm: 150 } }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="booked">Booked</MenuItem>
            <MenuItem value="reserved">Reserved</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
          </Select>
        </FormControl>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
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

      {/* Results Count */}
      <Typography
        variant="h5"
        sx={{ mb: 3, fontWeight: "bold", color: "#212121" }}
      >
        Lab Computer Status
      </Typography>

      {/* White Box Container */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 3,
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
        }}
      >
        {/* Status Legend - Update to show booking ranges */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 4,
            gap: { xs: 2, sm: 3 },
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Click on available computers to view their bookings
          </Typography>
        </Box>

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
                    const activeBookings = computer.bookings?.filter(b => b.status !== "rejected" && b.status !== "cancelled") || [];
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
