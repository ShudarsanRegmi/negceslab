import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import {
  ExpandMore,
  Help,
  Email,
  Phone,
  LocationOn,
  BookOnline,
  Computer,
  Notifications,
  AdminPanelSettings,
  Close,
} from '@mui/icons-material';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
  const [expanded, setExpanded] = useState<string | false>('panel1');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqData = [
    {
      question: "How do I book a computer?",
      answer: "Navigate to 'Computer Availability' to see available computers, then click 'Book Slot' to make a reservation. Fill in the required details and submit your booking request."
    },
    {
      question: "How long can I book a computer for?",
      answer: "You can book a computer for up to 4 hours per session. Multiple bookings can be made for different time slots on the same day."
    },
    {
      question: "Can I cancel my booking?",
      answer: "Yes, you can cancel your booking from your Dashboard. Go to 'My Bookings' and click the cancel button next to your active booking."
    },
    {
      question: "What happens if a computer is under maintenance?",
      answer: "Computers under maintenance will be marked as unavailable. You'll receive notifications when maintenance is completed and the computer becomes available again."
    },
    {
      question: "How do I know if my booking is approved?",
      answer: "You'll receive a notification when your booking status changes. Check the notification bell in the top-right corner of the screen."
    },
    {
      question: "What should I do if I have technical issues?",
      answer: "Contact the IT support team using the contact information below. Include your booking details and a description of the issue."
    }
  ];

  const quickGuides = [
    {
      title: "Making a Booking",
      icon: <BookOnline />,
      steps: [
        "Go to Computer Availability page",
        "Select an available computer",
        "Choose your date and time",
        "Provide a reason for booking",
        "Submit your request"
      ]
    },
    {
      title: "Managing Notifications",
      icon: <Notifications />,
      steps: [
        "Click the notification bell in the header",
        "View your notifications",
        "Mark notifications as read",
        "Configure notification settings in Settings"
      ]
    },
    {
      title: "Admin Functions",
      icon: <AdminPanelSettings />,
      steps: [
        "Access Admin Dashboard",
        "Manage computer inventory",
        "Approve/reject booking requests",
        "Send notifications to users",
        "Monitor system usage"
      ]
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
        <Help color="primary" />
        Help & Support
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
          {/* Quick Start Guide */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Quick Start Guide
            </Typography>
            <Grid container spacing={2}>
              {quickGuides.map((guide, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {guide.icon}
                      <Typography variant="subtitle1" fontWeight="bold">
                        {guide.title}
                      </Typography>
                    </Box>
                    <List dense>
                      {guide.steps.map((step, stepIndex) => (
                        <ListItem key={stepIndex} sx={{ py: 0.5 }}>
                          <ListItemText 
                            primary={`${stepIndex + 1}. ${step}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider />

          {/* FAQ Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Frequently Asked Questions
            </Typography>
            {faqData.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === `panel${index + 1}`}
                onChange={handleAccordionChange(`panel${index + 1}`)}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Divider />

          {/* Contact Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Contact Support
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Email color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Email Support
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  support@negsus.com
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Response within 24 hours
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Phone color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Phone Support
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  +1 (555) 123-4567
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mon-Fri, 9AM-5PM EST
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    IT Office
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Building A, Room 101
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Walk-in support available
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* System Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Version 1.0.0" size="small" />
              <Chip label="Last Updated: Dec 2024" size="small" />
              <Chip label="Browser: Chrome, Firefox, Safari" size="small" />
              <Chip label="Mobile: iOS, Android" size="small" />
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

export default HelpDialog; 