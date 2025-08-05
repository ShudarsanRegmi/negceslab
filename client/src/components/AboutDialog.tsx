import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Info as InfoIcon,
  Computer,
  Security,
  Speed,
  Close,
  School,
  Code,
  Support,
} from '@mui/icons-material';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <Computer />,
      title: "Computer Management",
      description: "Efficiently manage computer inventory and availability"
    },
    {
      icon: <Security />,
      title: "Secure Booking",
      description: "Secure authentication and role-based access control"
    },
    {
      icon: <Speed />,
      title: "Real-time Updates",
      description: "Instant notifications and real-time status updates"
    }
  ];

  const teamMembers = [
    {
      name: "Development Team",
      role: "Software Development",
      description: "Building and maintaining the system"
    },
    {
      name: "IT Support",
      role: "Technical Support",
      description: "Providing technical assistance and maintenance"
    },
    {
      name: "Administration",
      role: "System Administration",
      description: "Managing users and system configuration"
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: isMobile ? '100vh' : '80vh',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon color="primary" />
        About NEGCES Lab Tracking System
        <Button
          onClick={onClose}
          sx={{ ml: 'auto', minWidth: 'auto' }}
          size="small"
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* System Overview */}
          <Box>
            <Typography variant="h5" gutterBottom color="primary">
              NEGCES Lab Computer Booking System
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              A comprehensive computer lab management system designed to streamline the booking process, 
              enhance user experience, and provide efficient resource management for educational institutions.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label="Version 1.0.0" color="primary" />
              <Chip label="React + TypeScript" />
              <Chip label="Material-UI" />
              <Chip label="Firebase Auth" />
              <Chip label="MongoDB" />
            </Box>
          </Box>

          <Divider />

          {/* Key Features */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Key Features
            </Typography>
            <Grid container spacing={2}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ color: 'primary.main', mb: 1 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider />

          {/* Team Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Our Team
            </Typography>
            <Grid container spacing={2}>
              {teamMembers.map((member, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {index === 0 ? <Code /> : index === 1 ? <Support /> : <School />}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {member.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.role}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {member.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider />

          {/* Technical Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Technical Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Frontend Technologies
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">• React 18 with TypeScript</Typography>
                  <Typography variant="body2">• Material-UI (MUI) v5</Typography>
                  <Typography variant="body2">• React Router v6</Typography>
                  <Typography variant="body2">• Axios for API calls</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Backend Technologies
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">• Node.js with Express</Typography>
                  <Typography variant="body2">• MongoDB with Mongoose</Typography>
                  <Typography variant="body2">• Firebase Authentication</Typography>
                  <Typography variant="body2">• JWT for API security</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* System Statistics */}
          <Box>
            <Typography variant="h6" gutterBottom>
              System Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    50+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Computers Managed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    1000+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bookings Processed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    99.9%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    24/7
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Support Available
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Contact & Support */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Contact & Support
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              For technical support, feature requests, or general inquiries, please contact our support team.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Email: k_deepak@ch.amrita.edu" />
              <Chip label="Phone: +9199406 87412" />
              <Chip label="Lab Block, 1st Floor" />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AboutDialog; 