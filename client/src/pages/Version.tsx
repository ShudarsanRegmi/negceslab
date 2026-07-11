import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Divider, 
  Chip, 
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const Version: React.FC = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f8fafc', 
      py: 6,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Container maxWidth="md">
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          href="/"
          sx={{ mb: 4, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Back to Home
        </Button>

        <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            
            {/* ── HEADER ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
                  System Changelog
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  NegcesLab Slot Booking Management System
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Chip 
                  label="Version 4.0.0" 
                  color="primary" 
                  sx={{ fontWeight: 700, fontSize: '0.95rem', px: 1, py: 2, borderRadius: 2 }} 
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                  Released: July 11, 2026
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* ── VERSION 4.0.0 (NEWEST) ── */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Chip label="Current Version" color="success" size="small" sx={{ fontWeight: 700 }} />
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  What's New in Version 4.0.0
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                
                {/* Category 1 */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                    Rich Excel Reports Generation (ExcelJS)
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Upgraded static CSV/XLSX exports to dynamic ExcelJS formatted reports with distinct colored tabs per sheet." />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Integrated KPI dashboard worksheets featuring formatted metrics, colored badges, and custom annotations." />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Enabled frozen headers, alternating row colors, status-based cell highlighting, and heat-map utilization rankings (colored by booking volume and hours)." />
                    </ListItem>
                  </List>
                </Box>

                {/* Category 2 */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                    Advanced Analytics Center & Sub-Tabs
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Introduced User Analytics view with live search filtering, user KPIs, active months history graphs, and preferred systems list." />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Introduced System Analytics view to track computer utilization metrics, unique users count, and top booking users per system." />
                    </ListItem>
                  </List>
                </Box>

                {/* Category 3 */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                    Interactive Notifications Hub
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Completely overhauled Layout popover and Admin Notification Panel with dynamic tab categories (All, Requests, Cancel, Freed, Manual)." />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Added compose title inputs spanning full-width and automated filtering to exclude admin/superadmin roles from target selection lists." />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Built responsive notification click inspect actions that automatically switch active tabs or display the target booking modal directly." />
                    </ListItem>
                  </List>
                </Box>

                {/* Category 4 */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                    Human-Readable Logs & User Mapping
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Updated backend logs to resolve user and computer database references, displaying specific user names and system names on cancellations and early releases instead of raw ObjectIDs." />
                    </ListItem>
                  </List>
                </Box>

                {/* Category 5 */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                    Responsive Zoom Scaling & Visual Adjustments
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Added a layout-recalculating CSS zoom value of 0.75 on body for screens wider than 960px to provide a comfortable default high-density view without extra trailing scroll heights." />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Increased margin below Homepage Hero buttons to prevent cramped illustrations." />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 5 }} />

            {/* ── VERSION 3.1.0 (PREVIOUS) ── */}
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 3 }}>
                Previous Release: Version 3.1.0 (July 5, 2026)
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, opacity: 0.8 }}>
                
                {/* 3.1.0 Category 1 */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                    Booking Conflict Resolver & Overlap Management
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="disabled" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Conflict checks ignore pending applications to allow competing registrations." />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="disabled" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Automatic rejection loop for overlapping slots once a booking is approved." />
                    </ListItem>
                  </List>
                </Box>

                {/* 3.1.0 Category 2 */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                    Interactive User Warners
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="disabled" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Real-time conflict alert banners display under date selectors." />
                    </ListItem>
                  </List>
                </Box>

                {/* 3.1.0 Category 3 */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                    Admin Workspace
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="disabled" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Added chronologically sorted conflict groups with priority order badges." />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="disabled" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Introduced real-time delay markers (e.g. 'Delayed by 2 days') indicating how long an admin has delayed approval past the start date." />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                For security issues or system feedback, please contact the administrator.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Version;
