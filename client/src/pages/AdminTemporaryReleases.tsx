import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { format } from "date-fns";
import { temporaryReleaseAPI } from "../services/api";

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

const AdminTemporaryReleases: React.FC = () => {
  const [releases, setReleases] = useState<TemporaryRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetchTemporaryReleases();
  }, []);

  const fetchTemporaryReleases = async () => {
    try {
      setLoading(true);
      const response = await temporaryReleaseAPI.getAllTemporaryReleases();
      
      // The backend now returns an array directly
      const releasesList = Array.isArray(response.data) ? response.data : [];
      setReleases(releasesList);
    } catch (error: any) {
      console.error("Error fetching temporary releases:", error);
      setError("Failed to load temporary releases");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Temporary Releases Management
        </Typography>
        <Box sx={{ mt: 3 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Temporary Releases Management
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Temporary Releases Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and manage all temporary release requests from users.
      </Typography>

      {/* Releases Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Temporary Release Dates ({releases.length})
          </Typography>
          
          {releases.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No temporary releases found
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Computer</TableCell>
                    <TableCell>Original Booking</TableCell>
                    <TableCell>Released Dates</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {releases.map((release) => (
                    <TableRow key={release._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {release.userInfo?.displayName || release.userInfo?.email || 'Unknown User'}
                          </Typography>
                          {release.userInfo?.email && release.userInfo?.displayName && (
                            <Typography variant="caption" color="text.secondary">
                              {release.userInfo.email}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {release.originalBooking?.computerId.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {release.originalBooking?.computerId.location || ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {release.originalBooking ? (
                          <Box>
                            <Typography variant="body2">
                              {format(new Date(release.originalBooking.startDate), "MMM d")} - {format(new Date(release.originalBooking.endDate), "MMM d, yyyy")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {release.originalBooking.startTime} - {release.originalBooking.endTime}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                          {release.releasedDates
                            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                            .map((dateStr, index) => (
                              <Typography 
                                key={index} 
                                variant="caption" 
                                sx={{ 
                                  backgroundColor: 'primary.light',
                                  color: 'primary.contrastText',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontSize: '0.75rem'
                                }}
                              >
                                {format(new Date(dateStr), "MMM d")}
                              </Typography>
                            ))
                          }
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150 }}>
                          {release.reason || 'No reason provided'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="caption">
                          {format(new Date(release.createdAt), "MMM d, yyyy")}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminTemporaryReleases;
