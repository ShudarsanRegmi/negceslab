import React, { useState, useEffect } from "react";
import type { ReactElement } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import {
  format,
  addDays,
  isBefore,
  startOfDay,
  differenceInDays,
  differenceInHours,
  getDay,
  isWithinInterval,
  parseISO,
  set,
} from "date-fns";
import { computersAPI, bookingsAPI, temporaryReleaseAPI } from "../services/api";
import Warning from "@mui/icons-material/Warning";
import Info from "@mui/icons-material/Info";
import { alpha } from "@mui/material/styles";
// Import shared policy constants
import {
  LAB_OPEN_HOUR,
  LAB_OPEN_MINUTE,
  LAB_CLOSE_HOUR,
  LAB_CLOSE_MINUTE,
  MAX_BOOKING_DAYS,
  MIN_BOOKING_HOURS,
  CLOSED_DAYS,
  MAX_BOOKING_AHEAD_DAYS
} from '../../../shared/policy.js';

interface Computer {
  _id: string;
  name: string;
  location: string;
  specifications: string;
  status: "available" | "reserved" | "maintenance";
  bookings?: Booking[];
}

interface Booking {
  _id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
}

interface TemporaryRelease {
  date: string; // Single date for available slot (YYYY-MM-DD format)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  originalBookingId: string;
  computerName: string;
  location: string;
}

const steps = [
  "Select Computer",
  "Choose Dates & Times",
  "Project Details",
  "Review & Confirm",
];

const datasetTypes = [
  "Image",
  "Video",
  "Audio",
  "Satellite",
  "Text",
  "Tabular",
  "Time Series",
  "Other",
];

const datasetSizeUnits = ["MB", "GB", "TB"];

const BookingForm: React.FC = (): ReactElement => {
  const [activeStep, setActiveStep] = useState(0);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [selectedComputer, setSelectedComputer] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasGPU, setHasGPU] = useState(false);
  const [currentGPUMemory, setCurrentGPUMemory] = useState<number>(0);
  const [bottleneckExplanation, setBottleneckExplanation] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [datasetType, setDatasetType] = useState("");
  const [datasetLink, setDatasetLink] = useState("");
  const [datasetSize, setDatasetSize] = useState<number>(0);
  const [datasetSizeError, setDatasetSizeError] = useState<string | null>(null);
  const [datasetSizeUnit, setDatasetSizeUnit] = useState<string>("GB");
  const [timeSlotError, setTimeSlotError] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState<Booking[]>([]);
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);
  const [fullDay, setFullDay] = useState(false);
  const [mentor, setMentor] = useState("");
  const [availableTemporarySlots, setAvailableTemporarySlots] = useState<TemporaryRelease[]>([]);
  const [showTemporarySlots, setShowTemporarySlots] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Function to disable Sundays
  const shouldDisableDate = (date: Date) => {
    return getDay(date) === 0; // 0 = Sunday
  };

  // Helper: check if time is within lab hours
  const isWithinLabHours = (time: Date | null, isStart: boolean) => {
    if (!time) return false;
    const minutes = time.getHours() * 60 + time.getMinutes();
    const min = LAB_OPEN_HOUR * 60 + LAB_OPEN_MINUTE;
    const max = LAB_CLOSE_HOUR * 60 + LAB_CLOSE_MINUTE;
    if (isStart) return minutes >= min && minutes < max;
    return minutes > min && minutes <= max;
  };

  // Helper: check if date range includes a closed day
  const rangeIncludesClosedDay = (start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    let d = new Date(start);
    d.setHours(0,0,0,0);
    const endD = new Date(end);
    endD.setHours(0,0,0,0);
    while (d <= endD) {
      if (CLOSED_DAYS.includes(d.getDay())) return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  };

  // Real-time validation for time pickers
  useEffect(() => {
    if (!startTime || !endTime || !startDate) {
      setTimeValidationError(null);
      return;
    }
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const min = LAB_OPEN_HOUR * 60 + LAB_OPEN_MINUTE;
    const max = LAB_CLOSE_HOUR * 60 + LAB_CLOSE_MINUTE;
    const today = new Date();
    const isToday = startDate &&
      startDate.getFullYear() === today.getFullYear() &&
      startDate.getMonth() === today.getMonth() &&
      startDate.getDate() === today.getDate();
    if (isToday) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      if (startMinutes < nowMinutes) {
        setTimeValidationError('Start time must not be in the past.');
        return;
      }
    }
    if (startMinutes < min) {
      setTimeValidationError(`Start time must be at or after ${LAB_OPEN_HOUR}:${LAB_OPEN_MINUTE.toString().padStart(2, '0')}.`);
      return;
    }
    if (endMinutes > max) {
      setTimeValidationError(`End time must be at or before ${LAB_CLOSE_HOUR}:${LAB_CLOSE_MINUTE.toString().padStart(2, '0')}.`);
      return;
    }
    if (endMinutes <= startMinutes) {
      setTimeValidationError('End time must be after start time.');
      return;
    }
    // Minimum booking duration for same-day bookings
    if (startDate && endDate && startDate.getTime() === endDate.getTime()) {
      if (endMinutes - startMinutes < MIN_BOOKING_HOURS * 60) {
        setTimeValidationError(`Minimum booking duration is ${MIN_BOOKING_HOURS} hour(s) for same-day bookings.`);
        return;
      }
    }
    setTimeValidationError(null);
  }, [startTime, endTime, startDate, endDate]);

  // Prevent negative dataset size
  useEffect(() => {
    if (datasetSize < 0) {
      setDatasetSizeError('Dataset size cannot be negative');
    } else {
      setDatasetSizeError(null);
    }
  }, [datasetSize]);

  useEffect(() => {
    fetchComputers();
  }, []);

  useEffect(() => {
    // If full day is checked, set times automatically
    if (fullDay) {
      const start = new Date();
      start.setHours(LAB_OPEN_HOUR, LAB_OPEN_MINUTE, 0, 0);
      const end = new Date();
      end.setHours(LAB_CLOSE_HOUR, LAB_CLOSE_MINUTE, 0, 0);
      setStartTime(start);
      setEndTime(end);
    }
  }, [fullDay, startDate, endDate]);

  // Fetch temporary slots when dates or computer changes
  useEffect(() => {
    if (selectedComputer && startDate && endDate) {
      fetchAvailableTemporarySlots(selectedComputer);
    }
  }, [selectedComputer, startDate, endDate]);

  const fetchComputers = async () => {
    try {
      const response = await computersAPI.getAllComputers();
      setComputers(response.data);
    } catch (error) {
      console.error("Error fetching computers:", error);
      setError("Failed to load computers");
    }
  };

  const fetchAvailableTemporarySlots = async (computerId: string) => {
    if (!startDate || !endDate) return;
    
    console.log('=== FETCHING TEMPORARY SLOTS DEBUG ===');
    console.log('Computer ID:', computerId);
    console.log('Start Date:', format(startDate, "yyyy-MM-dd"));
    console.log('End Date:', format(endDate, "yyyy-MM-dd"));
    
    try {
      const response = await temporaryReleaseAPI.getAvailableSlots(
        computerId,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      console.log('Full API Response:', response);
      console.log('Response Data:', response.data);
      console.log('Response Status:', response.status);
      
      // The new API returns { data: [...] } format
      const slots = Array.isArray(response.data?.data) ? response.data.data : [];
      console.log('Extracted slots:', slots);
      console.log('Number of slots found:', slots.length);
      
      if (slots.length > 0) {
        console.log('Sample slot structure:', slots[0]);
        slots.forEach((slot, index) => {
          console.log(`Slot ${index + 1}:`, {
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            location: slot.location,
            originalBookingId: slot.originalBookingId
          });
        });
      } else {
        console.log('❌ No temporary release slots found for this computer and date range');
      }
      
      setAvailableTemporarySlots(slots);
    } catch (error: any) {
      console.error("❌ Error fetching temporary slots:", error);
      console.error("Error details:", error.response?.data || error.message);
      console.error("Error status:", error.response?.status);
      setAvailableTemporarySlots([]);
    }
    console.log('=== END FETCHING TEMPORARY SLOTS DEBUG ===\n');
  };

  // Helper function to check if the entire proposed booking can be resolved with temporary releases
  const canBookingBeResolvedWithTempReleases = (): boolean => {
    if (!startDate || !endDate || !startTime || !endTime || !Array.isArray(availableTemporarySlots) || !selectedComputer) {
      return false;
    }

    console.log('=== CHECKING IF BOOKING CAN BE RESOLVED ===');
    console.log('Available temporary slots:', availableTemporarySlots);

    // Get the actual conflicts first
    const selectedComp = computers.find(c => c._id === selectedComputer);
    if (!selectedComp) return false;

    const conflicts = checkTimeSlotConflicts(selectedComp);
    console.log('Current conflicts:', conflicts);

    if (conflicts.length === 0) {
      console.log('No conflicts, so can proceed normally');
      return false; // No conflicts, so no need for temporary releases
    }

    // Generate all dates in the proposed booking range
    const proposedDates = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDateNormalized = new Date(endDate);
    endDateNormalized.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDateNormalized) {
      proposedDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Proposed dates:', proposedDates);

    const proposedStartTime = format(startTime, 'HH:mm');
    const proposedEndTime = format(endTime, 'HH:mm');

    console.log('Proposed time range:', proposedStartTime, '-', proposedEndTime);

    // Check if ALL proposed dates that have conflicts can be covered by temporary releases
    const canResolve = proposedDates.every(proposedDate => {
      console.log(`Checking proposed date ${proposedDate}:`);
      
      // Check if this proposed date overlaps with any conflict booking
      const hasConflictOnThisDate = conflicts.some(conflict => {
        const conflictStartDate = conflict.startDate;
        const conflictEndDate = conflict.endDate;
        
        const proposedDateObj = new Date(proposedDate);
        const conflictStart = new Date(conflictStartDate);
        const conflictEnd = new Date(conflictEndDate);
        
        // Normalize all dates to compare just the date part
        proposedDateObj.setHours(0, 0, 0, 0);
        conflictStart.setHours(0, 0, 0, 0);
        conflictEnd.setHours(0, 0, 0, 0);
        
        const isInConflictRange = proposedDateObj >= conflictStart && proposedDateObj <= conflictEnd;
        console.log(`  - Conflict ${conflict._id}: ${conflictStartDate} to ${conflictEndDate}, proposed date in range: ${isInConflictRange}`);
        return isInConflictRange;
      });

      if (!hasConflictOnThisDate) {
        console.log(`  - No conflict on proposed date ${proposedDate}, so no temp release needed`);
        return true; // No conflict on this date, so it's fine
      }

      // This proposed date has a conflict, check if there's a matching temporary release for THIS specific date
      const matchingSlot = availableTemporarySlots.find(slot => {
        const dateMatches = slot.date === proposedDate;
        const timeMatches = proposedStartTime >= slot.startTime && proposedEndTime <= slot.endTime;
        console.log(`  - Checking slot ${slot.date}: date match = ${dateMatches}, time match = ${timeMatches}`);
        return dateMatches && timeMatches;
      });
      
      const hasMatchingSlot = !!matchingSlot;
      console.log(`  - Proposed date ${proposedDate} has conflict, temp slot available: ${hasMatchingSlot}`);
      
      return hasMatchingSlot;
    });

    console.log('Final result - can be resolved:', canResolve);
    console.log('=== END CHECKING IF BOOKING CAN BE RESOLVED ===');
    
    return canResolve;
  };

  const checkTimeSlotConflicts = (selectedComputer: any) => {
    if (!startDate || !endDate || !startTime || !endTime) return [];

    console.log('=== CONFLICT CHECK DEBUG ===');
    console.log('Available temporary slots:', availableTemporarySlots);
    console.log('Selected computer bookings:', selectedComputer.bookings);

    const proposedStart = set(startDate, {
      hours: startTime.getHours(),
      minutes: startTime.getMinutes(),
    });
    const proposedEnd = set(endDate, {
      hours: endTime.getHours(),
      minutes: endTime.getMinutes(),
    });

    console.log('Proposed booking:', {
      start: proposedStart.toISOString(),
      end: proposedEnd.toISOString(),
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });

    // Generate all dates in the proposed booking range
    const proposedDates = [];
    
    // Use format() to get consistent date strings regardless of timezone
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    // Create dates in local timezone for iteration
    const currentDate = new Date(startDateStr + 'T00:00:00');
    const endDateNormalized = new Date(endDateStr + 'T00:00:00');
    
    while (currentDate <= endDateNormalized) {
      proposedDates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Proposed booking dates:', proposedDates);

    // Create a map of available temporary release dates for fast lookup
    const availableReleaseDatesMap = new Map();
    if (Array.isArray(availableTemporarySlots)) {
      availableTemporarySlots.forEach(slot => {
        availableReleaseDatesMap.set(slot.date, {
          originalBookingId: slot.originalBookingId,
          startTime: slot.startTime,
          endTime: slot.endTime
        });
      });
    }

    console.log('Available release dates map:', availableReleaseDatesMap);

    const conflicts = selectedComputer.bookings?.filter((booking) => {
      if (booking.status === "rejected" || booking.status === "cancelled" || booking.status === "completed") return false;

      console.log(`\nChecking booking ${booking._id}:`, {
        booking: {
          startDate: booking.startDate,
          endDate: booking.endDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status
        }
      });

      // Get booking date range
      const bookingDates = [];
      const bookingDateStart = new Date(booking.startDate);
      bookingDateStart.setHours(0, 0, 0, 0);
      const bookingDateEnd = new Date(booking.endDate);
      bookingDateEnd.setHours(0, 0, 0, 0);
      
      const tempDate = new Date(bookingDateStart);
      while (tempDate <= bookingDateEnd) {
        bookingDates.push(tempDate.toISOString().split('T')[0]);
        tempDate.setDate(tempDate.getDate() + 1);
      }

      console.log('Booking dates:', bookingDates);

      // Find overlapping dates between proposed booking and existing booking
      const overlappingDates = proposedDates.filter(date => bookingDates.includes(date));
      console.log('Overlapping dates:', overlappingDates);

      if (overlappingDates.length === 0) {
        console.log('✅ No overlapping dates - no conflict');
        return false;
      }

      // For each overlapping date, check if there's a time conflict
      const hasTimeConflictOnAnyDate = overlappingDates.some(date => {
        // Convert times to minutes for easier comparison
        const proposedStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const proposedEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        
        const bookingStartMinutes = parseInt(booking.startTime.split(":")[0]) * 60 + parseInt(booking.startTime.split(":")[1]);
        const bookingEndMinutes = parseInt(booking.endTime.split(":")[0]) * 60 + parseInt(booking.endTime.split(":")[1]);
        
        console.log(`Checking time conflict for date ${date}:`, {
          proposedTime: `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')} (${proposedStartMinutes}-${proposedEndMinutes} minutes)`,
          bookingTime: `${booking.startTime} - ${booking.endTime} (${bookingStartMinutes}-${bookingEndMinutes} minutes)`
        });

        // Check if time ranges overlap on this date
        const timeOverlap = !(proposedEndMinutes <= bookingStartMinutes || proposedStartMinutes >= bookingEndMinutes);
        
        console.log(`Time overlap on ${date}:`, timeOverlap);
        
        if (!timeOverlap) {
          console.log(`✅ No time overlap on ${date} - no conflict on this date`);
          return false; // No time conflict on this date
        }

        // There's a time overlap on this date, check if it's covered by temporary release
        const isDateCovered = availableReleaseDatesMap.has(date);
        console.log(`Date ${date} covered by temp release:`, isDateCovered);
        
        if (isDateCovered) {
          const releaseInfo = availableReleaseDatesMap.get(date);
          const releaseStartTime = releaseInfo.startTime;
          const releaseEndTime = releaseInfo.endTime;
          const proposedStartTime = format(startTime, 'HH:mm');
          const proposedEndTime = format(endTime, 'HH:mm');
          
          console.log(`Checking time compatibility for ${date}:`, {
            releaseTime: `${releaseStartTime} - ${releaseEndTime}`,
            proposedTime: `${proposedStartTime} - ${proposedEndTime}`
          });
          
          // Check if proposed times are within the released time slot
          const timesMatch = (
            proposedStartTime >= releaseStartTime && 
            proposedEndTime <= releaseEndTime
          );
          
          console.log(`Times match for ${date}:`, timesMatch);
          
          if (timesMatch) {
            console.log(`✅ Time conflict on ${date} resolved by temporary release`);
            return false; // Conflict resolved by temp release
          }
        }
        
        console.log(`❌ Time conflict on ${date} - not resolved by temp release`);
        return true; // There's a time conflict on this date
      });

      if (hasTimeConflictOnAnyDate) {
        console.log('❌ Conflict remains - time conflicts found on some dates');
        return true; // There's a conflict
      } else {
        console.log('✅ No time conflicts - booking is allowed');
        return false; // No conflict
      }
    }) || [];

    console.log('Final conflicts:', conflicts);
    console.log('=== END CONFLICT CHECK DEBUG ===\n');
    return conflicts;
  };

  const handleNext = () => {
    // Check if selected computer is available (for step 0)
    if (activeStep === 0) {
      const selectedComp = computers.find(c => c._id === selectedComputer);
      if (!selectedComp || selectedComp.status !== "available") {
        setError("Please select an available computer to proceed.");
        return;
      }
    }
    
    if (activeStep === 1) { // Time slot selection step
      if (timeValidationError) {
        setError(timeValidationError);
        return;
      }
      const selectedComp = computers.find(c => c._id === selectedComputer);
      if (selectedComp) {
        const conflicts = checkTimeSlotConflicts(selectedComp);
        if (conflicts.length > 0) {
          setConflictingBookings(conflicts);
          setShowConflictDialog(true);
          return;
        }
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (
      !selectedComputer ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !reason.trim() ||
      !problemStatement.trim() ||
      !datasetType ||
      !datasetLink.trim() ||
      !bottleneckExplanation.trim() ||
      !datasetSize ||
      datasetSize < 0
    ) {
      setError("Please fill in all required fields and ensure dataset size is not negative");
      return;
    }

    // Check if selected computer is still available
    const selectedComp = computers.find(c => c._id === selectedComputer);
    if (!selectedComp || selectedComp.status !== "available") {
      setError("The selected computer is no longer available. Please select a different computer.");
      return;
    }

    // Check if start date is Sunday
    if (getDay(startDate) === 0) {
      setError(
        "Lab is closed on Sundays. Please select a different start date."
      );
      return;
    }

    // Check if end date is Sunday
    if (getDay(endDate) === 0) {
      setError("Lab is closed on Sundays. Please select a different end date.");
      return;
    }

    if (isBefore(endDate, startDate)) {
      setError("End date must be after or equal to start date");
      return;
    }

    // Check if duration exceeds 7 days
    const durationInDays = differenceInDays(endDate, startDate) + 1; // +1 to include both start and end dates
    if (durationInDays > MAX_BOOKING_DAYS) {
      setError(`Booking duration cannot exceed ${MAX_BOOKING_DAYS} days`);
      return;
    }

    // Check if start date is more than MAX_BOOKING_AHEAD_DAYS ahead
    const maxBookingDate = addDays(startOfDay(new Date()), MAX_BOOKING_AHEAD_DAYS);
    if (startDate > maxBookingDate) {
      setError(`Bookings can only be made up to ${MAX_BOOKING_AHEAD_DAYS} days in advance.`);
      return;
    }

    // Combine date and time for accurate comparison
    const getDateTime = (date: Date, time: Date) => {
      const d = new Date(date);
      d.setHours(time.getHours(), time.getMinutes(), 0, 0);
      return d;
    };

    const startDateTime =
      startDate && startTime ? getDateTime(startDate, startTime) : null;
    const endDateTime =
      endDate && endTime ? getDateTime(endDate, endTime) : null;

    if (startDateTime && endDateTime && isBefore(endDateTime, startDateTime)) {
      setError("End time must be after start time");
      return;
    }

    // Check minimum booking duration (1 hour) - only for same-day bookings
    if (
      startDateTime &&
      endDateTime &&
      differenceInDays(endDate, startDate) === 0
    ) {
      const durationInHours = differenceInHours(endDateTime, startDateTime);
      if (durationInHours < MIN_BOOKING_HOURS) {
        setError(`Minimum booking duration is ${MIN_BOOKING_HOURS} hour(s) for same-day bookings`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const bookingData = {
        computerId: selectedComputer,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        startTime: format(startTime, "HH:mm"),
        endTime: format(endTime, "HH:mm"),
        reason: reason.trim(),
        requiresGPU: hasGPU,
        gpuMemoryRequired: currentGPUMemory,
        problemStatement: problemStatement.trim(),
        datasetType,
        datasetSize: {
          value: datasetSize,
          unit: datasetSizeUnit,
        },
        datasetLink: datasetLink.trim(),
        bottleneckExplanation: bottleneckExplanation.trim(),
        mentor: mentor.trim(),
      };

      await bookingsAPI.createBooking(bookingData);
      setSuccess("Booking request submitted successfully!");

      // Reset form
      setSelectedComputer("");
      setStartDate(null);
      setEndDate(null);
      setStartTime(null);
      setEndTime(null);
      setReason("");
      setHasGPU(false);
      setCurrentGPUMemory(0);
      setProblemStatement("");
      setDatasetType("");
      setDatasetSize(0);
      setDatasetSizeUnit("GB");
      setDatasetLink("");
      setBottleneckExplanation("");
      setMentor("");
      setActiveStep(0);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      setError(error.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const ConflictDialog: React.FC = () => {
    const theme = useTheme();
    
    return (
      <Dialog 
        open={showConflictDialog} 
        onClose={() => setShowConflictDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: '#fff',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          background: canBookingBeResolvedWithTempReleases() ? theme.palette.warning.light : theme.palette.error.light,
          color: canBookingBeResolvedWithTempReleases() ? theme.palette.warning.dark : theme.palette.error.dark,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 2,
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
          }}>
            <Warning sx={{ color: canBookingBeResolvedWithTempReleases() ? theme.palette.warning.main : theme.palette.error.main }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              {canBookingBeResolvedWithTempReleases() ? 'Booking Conflict - Can be Resolved' : 'Time Slot Unavailable'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
            Your requested booking period ({startDate ? format(startDate, 'MMM d, yyyy') : 'N/A'} to {endDate ? format(endDate, 'MMM d, yyyy') : 'N/A'}, {startTime ? format(startTime, 'HH:mm') : 'N/A'} - {endTime ? format(endTime, 'HH:mm') : 'N/A'}) conflicts with existing bookings:
          </Typography>
          
          <List sx={{ 
            bgcolor: '#fff',
            borderRadius: 1,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            mb: 3,
          }}>
            {conflictingBookings.map((booking, index) => (
              <ListItem 
                key={index}
                sx={{
                  borderBottom: index < conflictingBookings.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                  py: 2,
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {format(parseISO(booking.startDate), 'MMM d, yyyy')} - {format(parseISO(booking.endDate), 'MMM d, yyyy')}
                    </Typography>
                    <Chip
                      label={booking.status}
                      size="small"
                      color={booking.status === 'approved' ? 'success' : 'warning'}
                      sx={{ 
                        textTransform: 'capitalize',
                        minWidth: 80,
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Time: {booking.startTime} - {booking.endTime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {differenceInDays(parseISO(booking.endDate), parseISO(booking.startDate)) + 1} day(s)
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
          
          {/* Show resolution options */}
          {canBookingBeResolvedWithTempReleases() ? (
            <Box sx={{ 
              p: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.success.light, 0.1),
              border: `2px solid ${theme.palette.success.light}`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Info sx={{ color: theme.palette.success.main }} />
                <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                  Good News! This conflict can be resolved
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                All conflicting dates are available through temporary releases from other users. You can proceed with your booking using these available slots:
              </Typography>
              
              <Box sx={{ 
                pl: 2,
                borderLeft: `3px solid ${theme.palette.success.main}`,
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 1,
                p: 2,
              }}>
                {availableTemporarySlots.slice(0, 5).map((slot, index) => (
                  <Typography key={index} variant="body2" color="success.dark" sx={{ mb: 0.5, fontWeight: 500 }}>
                    ✓ {format(new Date(slot.date), "MMM d, yyyy")} ({slot.startTime} - {slot.endTime}) at {slot.location}
                  </Typography>
                ))}
                {availableTemporarySlots.length > 5 && (
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                    ... and {availableTemporarySlots.length - 5} more dates
                  </Typography>
                )}
              </Box>
              
              <Typography variant="body2" color="success.dark" sx={{ mt: 2, fontStyle: 'italic', fontWeight: 500 }}>
                💡 Your booking will be automatically approved for these dates since the original users have temporarily released them.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              p: 2,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.error.light, 0.1),
              border: `1px solid ${theme.palette.error.light}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
            }}>
              <Info fontSize="small" color="error" sx={{ mt: 0.5 }} />
              <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                No temporary release slots are available for your requested time period. Please select a different time slot or adjust your booking dates.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          bgcolor: 'rgba(0, 0, 0, 0.02)',
          justifyContent: 'flex-end',
          gap: 1,
        }}>
          {/* Show "Book with Temporary Slots" button if conflicts can be resolved */}
          {canBookingBeResolvedWithTempReleases() && (
            <Button 
              onClick={() => {
                console.log('User chose to book with temporary slots');
                setShowConflictDialog(false);
                // Proceed to next step since conflicts can be resolved
                setActiveStep(activeStep + 1);
              }}
              variant="contained"
              color="success"
              sx={{
                px: 3,
                py: 1,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'success.dark',
                },
              }}
            >
              Proceed with Booking
            </Button>
          )}
          <Button 
            onClick={() => setShowConflictDialog(false)}
            variant={canBookingBeResolvedWithTempReleases() ? "outlined" : "contained"}
            color={canBookingBeResolvedWithTempReleases() ? "primary" : "error"}
            sx={{
              px: 3,
              py: 1,
              fontWeight: 600,
            }}
          >
            {canBookingBeResolvedWithTempReleases() ? "Choose Different Time" : "Cancel"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Computer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose from the available computers in the lab
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Computer</InputLabel>
              <Select
                value={selectedComputer}
                onChange={(e) => setSelectedComputer(e.target.value)}
                label="Computer"
              >
                {computers
                  .sort((a, b) => {
                    // Sort by status: available first, then reserved, then maintenance
                    const statusOrder = { available: 0, reserved: 1, maintenance: 2 };
                    return statusOrder[a.status] - statusOrder[b.status];
                  })
                  .map((computer) => (
                  <MenuItem 
                    key={computer._id} 
                    value={computer._id}
                    disabled={computer.status === "reserved" || computer.status === "maintenance"}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body1" fontWeight="bold">
                          {computer.name}
                        </Typography>
                        {(computer.status === "reserved" || computer.status === "maintenance") && (
                          <Chip 
                            label={computer.status === "reserved" ? "Reserved" : "Maintenance"} 
                            color={computer.status === "reserved" ? "warning" : "error"}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {computer.location} • {computer.specifications}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {computer.bookings?.filter(b => b.status === "approved").length || 0} active bookings
                      </Typography>
                      {(computer.status === "reserved" || computer.status === "maintenance") && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                          This computer is currently unavailable for booking
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Show available vs unavailable computers info */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Available:</strong> {computers.filter(c => c.status === "available").length} computers • 
                <strong> Reserved:</strong> {computers.filter(c => c.status === "reserved").length} computers • 
                <strong> Maintenance:</strong> {computers.filter(c => c.status === "maintenance").length} computers
              </Typography>
              {computers.filter(c => c.status === "available").length === 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  No computers are currently available for booking. Please check back later.
                </Alert>
              )}
            </Box>

            {selectedComputer && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Computer Details:
                </Typography>
                {computers.find((c) => c._id === selectedComputer) && (
                  <Box>
                    <Typography variant="body2">
                      <strong>Name:</strong>{" "}
                      {computers.find((c) => c._id === selectedComputer)?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Location:</strong>{" "}
                      {computers.find((c) => c._id === selectedComputer)?.location}
                    </Typography>
                    <Typography variant="body2" component="div">
                      <strong>Status:</strong>{" "}
                      <Chip 
                        label={computers.find((c) => c._id === selectedComputer)?.status || "unknown"}
                        color={
                          computers.find((c) => c._id === selectedComputer)?.status === "available" 
                            ? "success" 
                            : computers.find((c) => c._id === selectedComputer)?.status === "reserved"
                            ? "warning"
                            : "error"
                        }
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Typography>
                    <Typography variant="body2">
                      <strong>Specifications:</strong>{" "}
                      {computers.find((c) => c._id === selectedComputer)?.specifications}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Active Bookings:</strong>{" "}
                      {computers.find((c) => c._id === selectedComputer)?.bookings?.filter(b => b.status === "approved").length || 0}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Dates & Times
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select when you want to use the computer
            </Typography>

            {/* Booking Guidelines */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Lab bookings are allowed only between {LAB_OPEN_HOUR}:{LAB_OPEN_MINUTE.toString().padStart(2, '0')} and {LAB_CLOSE_HOUR}:{LAB_CLOSE_MINUTE.toString().padStart(2, '0')}.</strong> Please select your desired time range within these hours.
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Booking Guidelines:</strong>
              </Typography>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                • Lab is closed on Sundays • Maximum booking duration: {MAX_BOOKING_DAYS} days •
                Minimum booking duration: {MIN_BOOKING_HOURS} hour • Bookings are subject to admin
                approval
              </Typography>
            </Alert>

            {rangeIncludesClosedDay(startDate, endDate) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Remember: Lab will be closed on Sundays within your selected range.
              </Alert>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                minDate={startOfDay(new Date())}
                maxDate={addDays(new Date(), MAX_BOOKING_AHEAD_DAYS)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: isMobile ? "small" : "medium",
                  },
                }}
                shouldDisableDate={shouldDisableDate}
              />

              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || startOfDay(new Date())}
                maxDate={startDate ? addDays(startDate, MAX_BOOKING_DAYS - 1) : addDays(new Date(), MAX_BOOKING_AHEAD_DAYS)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: isMobile ? "small" : "medium",
                  },
                }}
                shouldDisableDate={shouldDisableDate}
              />


<Box sx={{ mb: 2 }}>
              <FormControl>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={fullDay}
                    onChange={e => setFullDay(e.target.checked)}
                    style={{ accentColor: '#1976d2', width: 18, height: 18 }}
                  />
                  Book full lab day (8:30 AM to 5:30 PM)
                </label>
              </FormControl>
            </Box>

            <br/>

              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                disabled={fullDay}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: isMobile ? "small" : "medium",
                  },
                }}
              />

              <TimePicker
                label="End Time"
                value={endTime}
                onChange={(newValue) => setEndTime(newValue)}
                disabled={fullDay}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: isMobile ? "small" : "medium",
                  },
                }}
              />
            </Box>

            {timeValidationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {timeValidationError}
              </Alert>
            )}

            {/* Duration Display */}
            {startDate && endDate && startTime && endTime && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: "#f8f9fa" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Booking Duration:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {
                    (() => {
                      // Combine date and time for accurate calculation
                      const getDateTime = (date: Date, time: Date) => {
                        const d = new Date(date);
                        d.setHours(time.getHours(), time.getMinutes(), 0, 0);
                        return d;
                      };
                      const startDateTime = getDateTime(startDate, startTime);
                      const endDateTime = getDateTime(endDate, endTime);
                      const totalMinutes = Math.max(0, Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 60000));
                      const days = Math.floor(totalMinutes / (60 * 24));
                      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
                      const minutes = totalMinutes % 60;
                      let result = '';
                      if (days > 0) result += `${days} day(s) `;
                      if (hours > 0) result += `${hours} hour(s) `;
                      if (minutes > 0) result += `${minutes} minute(s)`;
                      if (!result) result = '0 minutes';
                      return result.trim();
                    })()
                  }
                </Typography>
                {differenceInDays(endDate, startDate) + 1 > MAX_BOOKING_DAYS && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    ⚠️ Duration exceeds 7-day limit
                  </Typography>
                )}
                {differenceInDays(endDate, startDate) === 0 &&
                  differenceInHours(endTime, startTime) < MIN_BOOKING_HOURS && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      ⚠️ Duration is less than 1 hour
                    </Typography>
                  )}
              </Paper>
            )}

            {/* Available Temporary Slots */}
            {Array.isArray(availableTemporarySlots) && availableTemporarySlots.length > 0 && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: "#e8f5e8" }}>
                <Typography variant="subtitle2" gutterBottom color="success.main">
                  ✨ Available Temporary Release Slots
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  These dates are temporarily available from other users who have released their bookings:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {availableTemporarySlots.map((slot) => (
                    <Box 
                      key={`${slot.temporaryReleaseId}-${slot.date}`}
                      sx={{ 
                        p: 1.5, 
                        border: '1px solid', 
                        borderColor: 'success.light',
                        borderRadius: 1,
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {format(new Date(slot.date), "MMM d, yyyy")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {slot.startTime} - {slot.endTime} • {slot.computerName}
                      </Typography>
                      <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                        📍 {slot.location} • Temporarily available
                        {slot.hasExistingBookings && " (Some bookings exist)"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  * You can book during these periods as they are temporarily released by other users
                </Typography>
              </Paper>
            )}

            <TextField
              fullWidth
              label="Reason for Booking"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              rows={3}
              sx={{ mt: 3 }}
              size={isMobile ? "small" : "medium"}
              placeholder="Please describe why you need to book this computer..."
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Project Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please provide details about your project and computational
              requirements
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Problem Statement"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  multiline
                  rows={3}
                  required
                  placeholder="Describe your research problem or project objective..."
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <FormControl fullWidth required>
                  <InputLabel>Dataset Type</InputLabel>
                  <Select
                    value={datasetType}
                    onChange={(e) => setDatasetType(e.target.value)}
                    label="Dataset Type"
                  >
                    {datasetTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    sx={{ flex: 1 }}
                    type="number"
                    label="Dataset Size"
                    value={datasetSize}
                    onChange={(e) => setDatasetSize(Number(e.target.value))}
                    required
                    inputProps={{ min: 0 }}
                    error={!!datasetSizeError}
                    helperText={datasetSizeError}
                  />
                  <FormControl sx={{ minWidth: 100 }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={datasetSizeUnit}
                      onChange={(e) => setDatasetSizeUnit(e.target.value)}
                      label="Unit"
                    >
                      {datasetSizeUnits.map((unit) => (
                        <MenuItem key={unit} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Dataset Link"
                value={datasetLink}
                onChange={(e) => setDatasetLink(e.target.value)}
                required
                placeholder="Provide a link to your dataset or its location..."
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Current Hardware Configuration
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FormControl component="fieldset">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Do you have a GPU in your current setup?
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Button
                        variant={hasGPU ? "contained" : "outlined"}
                        onClick={() => setHasGPU(true)}
                        color={hasGPU ? "primary" : "inherit"}
                      >
                        Yes, I have a GPU
                      </Button>
                      <Button
                        variant={!hasGPU ? "contained" : "outlined"}
                        onClick={() => setHasGPU(false)}
                        color={!hasGPU ? "primary" : "inherit"}
                      >
                        No GPU
                      </Button>
                    </Box>
                  </FormControl>

                  {hasGPU && (
                    <TextField
                      fullWidth
                      type="number"
                      label="What is your current GPU Memory (GB)?"
                      value={currentGPUMemory}
                      onChange={(e) =>
                        setCurrentGPUMemory(Number(e.target.value))
                      }
                      required
                      inputProps={{ min: 0, max: 48 }}
                      helperText="Enter the memory capacity of your current GPU in gigabytes"
                    />
                  )}

                  <TextField
                    fullWidth
                    label="Explain your computational bottleneck"
                    value={bottleneckExplanation}
                    onChange={(e) => setBottleneckExplanation(e.target.value)}
                    multiline
                    rows={4}
                    required
                    placeholder="Describe why your current setup is insufficient. For example:
- What are the limitations you're facing?
- How long does your current computation take?
- What performance improvements do you need?
- Why do you need the lab's computational resources?"
                  />
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Mentor"
                value={mentor}
                onChange={e => setMentor(e.target.value)}
                placeholder="Type Self if not mentored by anyone."
                helperText="Type Self if not mentored by anyone."
                sx={{ mt: 2 }}
              />
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Confirm
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review your booking details before confirming
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Computer
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {computers.find((c) => c._id === selectedComputer)?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {
                      computers.find((c) => c._id === selectedComputer)
                        ?.location
                    }
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1">
                    {startDate &&
                      endDate &&
                      `${format(startDate, "MMM d, yyyy")} - ${format(
                        endDate,
                        "MMM d, yyyy"
                      )}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {startTime &&
                      endTime &&
                      `${format(startTime, "h:mm a")} - ${format(
                        endTime,
                        "h:mm a"
                      )}`}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reason
                  </Typography>
                  <Typography variant="body1">{reason}</Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Project Details
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Problem Statement
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {problemStatement}
                  </Typography>

                  <Typography variant="body1" fontWeight="bold">
                    Dataset Information
                  </Typography>
                  <Typography variant="body2">Type: {datasetType}</Typography>
                  <Typography variant="body2">
                    Size: {datasetSize} {datasetSizeUnit}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Link: {datasetLink}
                  </Typography>

                  <Typography variant="body1" fontWeight="bold">
                    Current Hardware Configuration
                  </Typography>
                  <Typography variant="body2">
                    Has GPU: {hasGPU ? "Yes" : "No"}
                  </Typography>
                  {hasGPU && (
                    <Typography variant="body2">
                      Current GPU Memory: {currentGPUMemory} GB
                    </Typography>
                  )}
                  <Typography variant="body2" paragraph>
                    Bottleneck Explanation: {bottleneckExplanation}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">Mentor</Typography>
                  <Typography variant="body2" paragraph>{mentor || 'Self'}</Typography>
                </Box>
              </Box>
            </Paper>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Booking Guidelines:</strong>
              </Typography>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                • Bookings are subject to admin approval • Maximum booking
                duration is 7 days • Resource allocation will be based on your
                computational needs • Please arrive on time for your scheduled
                slot
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return "Unknown step";
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Book a Computer
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {timeSlotError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setTimeSlotError(null)}>
          {timeSlotError}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Stepper */}
          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 4,
              display: { xs: "none", md: "flex" },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Mobile Step Indicator */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Chip
              label={`Step ${activeStep + 1} of ${steps.length}: ${
                steps[activeStep]
              }`}
              color="primary"
              variant="outlined"
            />
          </Box>

          {/* Step Content */}
          <Box sx={{ mt: 2, mb: 4 }}>{getStepContent(activeStep)}</Box>

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              fullWidth={isMobile}
            >
              Back
            </Button>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  fullWidth={isMobile}
                >
                  {loading ? "Submitting..." : "Submit Booking"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && (!selectedComputer || 
                      computers.find(c => c._id === selectedComputer)?.status !== "available")) ||
                    (activeStep === 1 &&
                      (!startDate ||
                        !endDate ||
                        !startTime ||
                        !endTime ||
                        !reason.trim()))
                  }
                  fullWidth={isMobile}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ConflictDialog />
    </Box>
  );
};

export default BookingForm;
