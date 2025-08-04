import React from "react";
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  Button,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { motion } from "framer-motion";
import { styled } from "@mui/material/styles";
import LabBookingTimeline from "../components/LabBookingTimeline";
import RulesBackground from "./RulesBackground";

const accordionMotion = {
  initial: { opacity: 0, y: 40, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.7, type: "spring", bounce: 0.18 },
};

const stepMotion = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.6, type: "spring", bounce: 0.2 },
};

// Custom styled AccordionSummary for foldbar look
const FoldbarSummary = styled(AccordionSummary)(({ theme, color }) => ({
  background: "#f8fafc",
  fontWeight: 700,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(37,99,235,0.06)",
  borderLeft: `6px solid ${color || theme.palette.primary.main}`,
  transition: "box-shadow 0.3s, background 0.3s, border-color 0.3s",
  "&:hover": {
    background: "#e0e7ef",
    boxShadow: "0 4px 16px rgba(37,99,235,0.10)",
    borderLeft: `8px solid ${color || theme.palette.primary.dark}`,
  },
  ".MuiAccordionSummary-content": {
    alignItems: "center",
    gap: theme.spacing(1.5),
  },
}));

export default function Rules() {
  const isMobile = useMediaQuery("(max-width:600px)");

  const handleStartBooking = () => {
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <RulesBackground />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, type: "spring", bounce: 0.18 }}
        style={{ position: "relative", zIndex: 10 }}
      >
        <Box
          sx={{
            minHeight: "100vh",
            py: { xs: 8, md: 12 },
            px: 1,
            zIndex: 10,
          }}
        >
          <Container maxWidth="md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  textAlign: "center",
                  mb: 2,
                  fontSize: { xs: "2.2rem", md: "3rem" },
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 4px rgba(37,99,235,0.13)",
                }}
              >
                Lab Rules & Guidelines
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  mb: 6,
                  color: "#64748b",
                  fontWeight: 400,
                  fontSize: { xs: "1.1rem", md: "1.3rem" },
                  maxWidth: 700,
                  mx: "auto",
                  lineHeight: 1.6,
                }}
              >
                Please familiarize yourself with these important guidelines to
                ensure a productive environment for everyone.
              </Typography>
            </motion.div>

            {/* Accordions */}
            <Box>
              {/* General Rules */}
              <motion.div {...accordionMotion} viewport={{ once: true }}>
                <Accordion
                  sx={{
                    borderRadius: 3,
                    mb: 3,
                    boxShadow:
                      "0 8px 32px rgba(37,99,235,0.08), 0 1.5px 6px rgba(29,233,182,0.07)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(229,246,255,0.85) 100%)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(37,99,235,0.08)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&.Mui-expanded": {
                      boxShadow:
                        "0 16px 48px rgba(37,99,235,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(229,246,255,0.97) 100%)",
                      border: "1.5px solid #2563eb",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <FoldbarSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "#222", fontSize: 32 }} />
                    }
                    aria-controls="general-rules-content"
                    id="general-rules-header"
                    color="#2563eb"
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: "#222",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          color: "#2563eb",
                          fontSize: 28,
                          marginRight: 8,
                        }}
                      >
                        📋
                      </span>{" "}
                      General Rules
                    </Typography>
                  </FoldbarSummary>
                  <AccordionDetails
                    sx={{ background: "#fff", borderRadius: 2 }}
                  >
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: isMobile ? 18 : 24,
                        color: "#334155",
                        fontSize: "1.13rem",
                        lineHeight: 2.1,
                        fontWeight: 500,
                        letterSpacing: 0.01,
                      }}
                    >
                      <li>Present valid student/faculty ID for lab access</li>
                      <li>Sign in and out using the digital logbook</li>
                      <li>Maximum session duration: 3 hours</li>
                      <li>No more than 2 bookings per day per person</li>
                      <li>
                        Cancel booking at least 1 hour in advance if unable to
                        attend
                      </li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>

              {/* Do's */}
              <motion.div
                {...accordionMotion}
                transition={{ ...accordionMotion.transition, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Accordion
                  sx={{
                    borderRadius: 3,
                    mb: 3,
                    boxShadow:
                      "0 8px 32px rgba(34,197,94,0.08), 0 1.5px 6px rgba(29,233,182,0.07)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(209,250,229,0.85) 100%)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(34,197,94,0.08)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&.Mui-expanded": {
                      boxShadow:
                        "0 16px 48px rgba(34,197,94,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(209,250,229,0.97) 100%)",
                      border: "1.5px solid #22c55e",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <FoldbarSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "#222", fontSize: 32 }} />
                    }
                    aria-controls="dos-content"
                    id="dos-header"
                    color="#22c55e"
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: "#222",
                      }}
                    >
                      <CheckCircleIcon
                        sx={{
                          color: "#22c55e",
                          mr: 1,
                          fontSize: 28,
                          filter: "drop-shadow(0 2px 6px #bbf7d0)",
                        }}
                      />{" "}
                      Do's
                    </Typography>
                  </FoldbarSummary>
                  <AccordionDetails
                    sx={{ background: "#fff", borderRadius: 2 }}
                  >
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: isMobile ? 18 : 24,
                        color: "#166534",
                        fontSize: "1.13rem",
                        lineHeight: 2.1,
                        fontWeight: 500,
                        letterSpacing: 0.01,
                      }}
                    >
                      <li>Keep the lab clean and organized</li>
                      <li>Use equipment responsibly and carefully</li>
                      <li>Report any technical issues immediately</li>
                      <li>Save your work regularly</li>
                      <li>
                        Respect other users and maintain quiet environment
                      </li>
                      <li>Follow proper shutdown procedures</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>

              {/* Don'ts */}
              <motion.div
                {...accordionMotion}
                transition={{ ...accordionMotion.transition, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Accordion
                  sx={{
                    borderRadius: 3,
                    mb: 3,
                    boxShadow:
                      "0 8px 32px rgba(239,68,68,0.08), 0 1.5px 6px rgba(29,233,182,0.07)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(254,226,226,0.85) 100%)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(239,68,68,0.08)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&.Mui-expanded": {
                      boxShadow:
                        "0 16px 48px rgba(239,68,68,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(254,226,226,0.97) 100%)",
                      border: "1.5px solid #ef4444",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <FoldbarSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "#222", fontSize: 32 }} />
                    }
                    aria-controls="donts-content"
                    id="donts-header"
                    color="#ef4444"
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: "#222",
                      }}
                    >
                      <CancelIcon
                        sx={{
                          color: "#ef4444",
                          mr: 1,
                          fontSize: 28,
                          filter: "drop-shadow(0 2px 6px #fecaca)",
                        }}
                      />{" "}
                      Don'ts
                    </Typography>
                  </FoldbarSummary>
                  <AccordionDetails
                    sx={{ background: "#fff", borderRadius: 2 }}
                  >
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: isMobile ? 18 : 24,
                        color: "#991b1b",
                        fontSize: "1.13rem",
                        lineHeight: 2.1,
                        fontWeight: 500,
                        letterSpacing: 0.01,
                      }}
                    >
                      <li>No food or drinks near computers</li>
                      <li>Don't install unauthorized software</li>
                      <li>Avoid accessing inappropriate websites</li>
                      <li>Don't move or disconnect equipment</li>
                      <li>No loud conversations or phone calls</li>
                      <li>Don't leave personal belongings unattended</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            </Box>

            {/* How to Book Section */}
            {/* <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              style={{ marginTop: 64 }}
            >
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  textAlign: "center",
                  mb: 2,
                  fontSize: { xs: "2rem", md: "2.5rem" },
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                How to Book
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  textAlign: "center",
                  mb: 6,
                  color: "#64748b",
                  fontWeight: 400,
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  maxWidth: 600,
                  mx: "auto",
                  lineHeight: 1.6,
                }}
              >
                Follow these simple steps to reserve your lab session. Quick,
                easy, and secure booking process.
              </Typography>
              <LabBookingTimeline />
            </motion.div> */}
          </Container>
        </Box>
      </motion.div>
    <Box
      component="footer"
      sx={{
        mt: 8,
        py: 4,
        background: "linear-gradient(90deg, #2563eb 0%, #1de9b6 100%)",
        color: "#fff",
        textAlign: "center",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        &copy; {new Date().getFullYear()} Your Lab Name. All rights reserved.
      </Typography>
      <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
        For support, contact <a href="mailto:k_deepak@amrita.edu" style={{ color: "#fff", textDecoration: "underline" }}>support@yourlab.com</a>
      </Typography>
    </Box>
    </Box>
  );
}
