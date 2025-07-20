import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  TextField,
  InputAdornment,
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
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Computer as ComputerIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  BookOnline as BookIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Cancel as CancelIcon,
  GridView as GridViewIcon,
  List as ListIcon,
  Notifications as NotificationIcon,
} from "@mui/icons-material";
import { computersAPI } from "../services/api";
import { bookingsAPI } from "../services/api";

interface Computer {
  _id: string;
  name: string;
  location: string;
  status: "available" | "maintenance" | "booked";
  specifications: string;
  currentBookings?: any[];
  nextAvailable?: string;
  nextAvailableDate?: string;
}

interface Booking {
  _id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

const ComputerGrid: React.FC = () => {
  const navigate = useNavigate();
  const [computers, setComputers] = useState<Computer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  // Calculate summary statistics
  const totalComputers = computers.length;
  const availableComputers = computers.filter(
    (c) => c.status === "available"
  ).length;
  const occupiedComputers = computers.filter(
    (c) => c.status === "booked"
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
        <Grid xs={12} sm={6} md={4} lg={3}>
          <Card
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "none",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                    bgcolor: "rgba(33, 150, 243, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                    flexShrink: 0,
                  }}
                >
                  <ComputerIcon
                    sx={{
                      color: "#1976d2",
                      fontSize: 22,
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "#212121",
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
                    sx={{
                      color: "#666666",
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
        <Grid xs={12} sm={6} md={4} lg={3}>
          <Card
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "none",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                    bgcolor: "rgba(76, 175, 80, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                    flexShrink: 0,
                  }}
                >
                  <ComputerIcon
                    sx={{
                      color: "#2e7d32",
                      fontSize: 22,
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "#212121",
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
                    {availableComputers}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#666666",
                      fontWeight: 400,
                      fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    Available Computers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={4} lg={3}>
          <Card
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "none",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                    bgcolor: "rgba(33, 150, 243, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                    flexShrink: 0,
                  }}
                >
                  <BookIcon
                    sx={{
                      color: "#1976d2",
                      fontSize: 22,
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "#212121",
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
                    sx={{
                      color: "#666666",
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
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "none",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                    bgcolor: "rgba(255, 152, 0, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                    flexShrink: 0,
                  }}
                >
                  <ComputerIcon
                    sx={{
                      color: "#f57c00",
                      fontSize: 22,
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "#212121",
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
                    sx={{
                      color: "#666666",
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
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "none",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                    bgcolor: "rgba(255, 152, 0, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                    flexShrink: 0,
                  }}
                >
                  <NotificationIcon
                    sx={{
                      color: "#f57c00",
                      fontSize: 22,
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "#212121",
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
                    sx={{
                      color: "#666666",
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
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "none",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                    bgcolor: "rgba(76, 175, 80, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                    flexShrink: 0,
                  }}
                >
                  <TrendingIcon
                    sx={{
                      color: "#2e7d32",
                      fontSize: 22,
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "#212121",
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
                    sx={{
                      color: "#666666",
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
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "none",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                    bgcolor: "rgba(244, 67, 54, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                    flexShrink: 0,
                  }}
                >
                  <CancelIcon
                    sx={{
                      color: "#d32f2f",
                      fontSize: 22,
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "#212121",
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
                    sx={{
                      color: "#666666",
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
              border: viewMode === "grid" ? "2px solid" : "1px solid #e0e0e0",
              borderRadius: 1,
            }}
          >
            <GridViewIcon />
          </IconButton>
          <IconButton
            onClick={() => setViewMode("list")}
            color={viewMode === "list" ? "primary" : "default"}
            sx={{
              border: viewMode === "list" ? "2px solid" : "1px solid #e0e0e0",
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
          bgcolor: "white",
          borderRadius: 3,
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          border: "1px solid #e0e0e0",
        }}
      >
        {/* Status Legend */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 4,
            gap: { xs: 2, sm: 3 },
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#4caf50",
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Available ({availableComputers})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#f44336",
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Occupied ({occupiedComputers})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#ff9800",
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Maintenance ({maintenanceComputers})
            </Typography>
          </Box>
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
          {filteredComputers.map((computer) => (
            <Card
              key={computer._id}
              sx={{
                minHeight: 140,
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                bgcolor:
                  computer.status === "available"
                    ? "#e8f5e8"
                    : computer.status === "maintenance"
                    ? "#fff8e1"
                    : computer.status === "booked"
                    ? "#ffebee"
                    : "#f5f5f5",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
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
                      color:
                        computer.status === "available"
                          ? "#4caf50"
                          : computer.status === "maintenance"
                          ? "#ff9800"
                          : computer.status === "booked"
                          ? "#f44336"
                          : "#9e9e9e",
                      fontSize: { xs: 36, sm: 40, md: 44 },
                    }}
                  />
                </Box>

                {/* Computer ID */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#212121",
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                    mb: 1.5,
                  }}
                >
                  {computer.name}
                </Typography>

                {/* Status */}
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    color: "#212121",
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                >
                  {getStatusLabel(computer.status)}
                </Typography>

                {/* Additional Info for Booked Computers */}
                {computer.status === "booked" && computer.nextAvailable && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      mt: 1,
                    }}
                  >
                    Until {computer.nextAvailable}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

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
