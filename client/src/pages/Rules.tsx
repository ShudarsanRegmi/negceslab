import MainLayout from "../components/MainLayout";
import React from "react";
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VerifiedIcon from "@mui/icons-material/Verified";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { motion } from "framer-motion";

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

export default function Rules() {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [hoveredStep, setHoveredStep] = React.useState<number | null>(null);

  const steps = [
    {
      number: "1",
      title: "Authentication",
      subtitle: "Step 1 of 4",
      description:
        "Login with your institutional credentials to access the lab booking system",
      icon: <LockIcon sx={{ fontSize: 32, color: "#3b82f6" }} />,
    },
    {
      number: "2",
      title: "Select Schedule",
      subtitle: "Step 2 of 4",
      description:
        "Choose your preferred date and time slot from available laboratory sessions",
      icon: <AccessTimeIcon sx={{ fontSize: 32, color: "#9ca3af" }} />,
    },
    {
      number: "3",
      title: "Review Booking",
      subtitle: "Step 3 of 4",
      description:
        "Confirm your booking details and acknowledge laboratory safety protocols",
      icon: <VerifiedIcon sx={{ fontSize: 32, color: "#9ca3af" }} />,
    },
    {
      number: "4",
      title: "Confirmation",
      subtitle: "Step 4 of 4",
      description:
        "Receive booking confirmation and access instructions via email",
      icon: <CelebrationIcon sx={{ fontSize: 32, color: "#9ca3af" }} />,
    },
  ].map((step, idx) => {
    let isCompleted = false;
    let isActive = false;
    let status = "Pending";
    let progress = 0;
    if (hoveredStep === null) {
      if (idx === 0) {
        isActive = true;
        status = "In Progress";
        progress = 25;
      }
    } else {
      if (idx < hoveredStep - 1) {
        isCompleted = true;
        status = "Completed";
        progress = 100;
      } else if (idx === hoveredStep - 1) {
        isActive = true;
        status = "In Progress";
        progress = 25;
      }
    }
    return {
      ...step,
      isCompleted,
      isActive,
      status,
      progress,
    };
  });

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.18 }}
      >
        <Box
          sx={{
            minHeight: "100vh",
            background:
              "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
            py: { xs: 8, md: 12 },
            px: 1,
          }}
        >
          <Container maxWidth="md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, type: 'spring' }}
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
                    "&:hover": {
                      boxShadow:
                        "0 16px 48px rgba(37,99,235,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(229,246,255,0.97) 100%)",
                      border: "1.5px solid #2563eb",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="general-rules-content"
                    id="general-rules-header"
                    sx={{ background: "#f8fafc", fontWeight: 700 }}
                  >
                    <Typography variant="h6" fontWeight={800}>
                      General Rules
                    </Typography>
                  </AccordionSummary>
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
                    "&:hover": {
                      boxShadow:
                        "0 16px 48px rgba(34,197,94,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(209,250,229,0.97) 100%)",
                      border: "1.5px solid #22c55e",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="dos-content"
                    id="dos-header"
                    sx={{ background: "#f8fafc", fontWeight: 700 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
                  </AccordionSummary>
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
                    "&:hover": {
                      boxShadow:
                        "0 16px 48px rgba(239,68,68,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(254,226,226,0.97) 100%)",
                      border: "1.5px solid #ef4444",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="donts-content"
                    id="donts-header"
                    sx={{ background: "#f8fafc", fontWeight: 700 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
                  </AccordionSummary>
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

            {/* Booking Steps Section */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Box
                sx={{
                  mt: 8,
                  p: 5,
                  borderRadius: 4,
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(29, 233, 182, 0.05) 100%)",
                  border: "2px solid rgba(37, 99, 235, 0.1)",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={800}
                  sx={{
                    textAlign: "center",
                    mb: 2,
                    fontSize: { xs: "2rem", md: "2.5rem" },
                    color: "#1e293b",
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  Book Your Laboratory Session
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: "center",
                    mb: 6,
                    color: "#64748b",
                    fontWeight: 400,
                    fontSize: { xs: "1rem", md: "1.1rem" },
                    maxWidth: 700,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  Follow these steps to reserve laboratory equipment and
                  workspace. All bookings require institutional authentication
                  and adherence to safety protocols.
                </Typography>

                {/* Timeline Steps - remove outer Box, add spacing */}
                <Box sx={{ position: "relative", maxWidth: 900, mx: "auto", px: { xs: 0, md: 0 } }}>
                  <Box sx={{ position: "absolute", left: 38, top: 0, bottom: 0, width: 4, bgcolor: "#e5e7eb", zIndex: 0, borderRadius: 2 }} />
                  <Box>
                    {steps.map((step, index) => (
                      <motion.div
                        key={step.number}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 + index * 0.1, type: 'spring' }}
                        style={{ position: "relative", zIndex: 1 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            mb: index !== steps.length - 1 ? 5 : 0, // Add margin between cards
                          }}
                        >
                          {/* Timeline Circle */}
                          <Box
                            className={`step-circle step-circle-${index}`}
                            sx={{
                              position: "relative",
                              zIndex: 2,
                              width: { xs: 60, md: 80 },
                              height: { xs: 60, md: 80 },
                              borderRadius: "50%",
                              background: step.isCompleted
                                ? "linear-gradient(135deg, #28A745 0%, #20C997 100%)"
                                : step.isActive
                                ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                                : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: step.isCompleted
                                ? "0 8px 24px rgba(40, 167, 69, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)"
                                : step.isActive
                                ? "0 8px 24px rgba(59, 130, 246, 0.3), inset 0 2px 4px rgba(255,255,255,0.3)"
                                : "0 4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255,255,255,0.3)",
                              border: step.isCompleted
                                ? "3px solid rgba(40, 167, 69, 0.8)"
                                : step.isActive
                                ? "3px solid rgba(59, 130, 246, 0.8)"
                                : "3px solid rgba(209, 213, 219, 0.8)",
                              mr: { xs: 3, md: 4 },
                              flexShrink: 0,
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          >
                            {step.isCompleted ? (
                              <CheckCircleIcon
                                sx={{
                                  fontSize: { xs: 32, md: 40 },
                                  color: "#fff",
                                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                                }}
                              />
                            ) : (
                              <Typography
                                variant="h4"
                                fontWeight={900}
                                sx={{
                                  color: step.isActive ? "#fff" : "#6b7280",
                                  fontSize: { xs: "1.5rem", md: "2rem" },
                                  textShadow: step.isActive
                                    ? "0 2px 4px rgba(0,0,0,0.3)"
                                    : "none",
                                }}
                              >
                                {step.number}
                              </Typography>
                            )}
                          </Box>

                          {/* Timeline Card */}
                          <Box
                            className={`step-card step-card-${index}`}
                            sx={{
                              height: "100%",
                              p: 4,
                              borderRadius: 3,
                              background: step.isCompleted
                                ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)"
                                : step.isActive
                                ? "linear-gradient(135deg, rgba(239,246,255,0.9) 0%, rgba(219,234,254,0.9) 100%)"
                                : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)",
                              backdropFilter: "blur(12px)",
                              border: step.isCompleted
                                ? "1px solid #E0F2E9"
                                : step.isActive
                                ? "1.5px solid rgba(59,130,246,0.2)"
                                : "1.5px solid rgba(209,213,219,0.2)",
                              boxShadow: step.isCompleted
                                ? "0 4px 12px rgba(40, 167, 69, 0.15)"
                                : "0 8px 32px rgba(0, 0, 0, 0.08)",
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              minWidth: { xs: 0, md: 500 },
                              width: "100%",
                            }}
                          >
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <Box
                                  className="step-icon"
                                  sx={{
                                    mr: 2,
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    backgroundColor: step.isCompleted ? "#E0F2E9" : step.isActive ? "#dbeafe" : "#f3f4f6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  {React.cloneElement(step.icon, {
                                    sx: {
                                      fontSize: 24,
                                      color: step.isCompleted
                                        ? "#28A745"
                                        : step.isActive
                                        ? "#3b82f6"
                                        : "#9ca3af",
                                    },
                                  })}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    className="step-title"
                                    variant="h5"
                                    fontWeight={800}
                                    sx={{
                                      fontSize: { xs: "1.3rem", md: "1.5rem" },
                                      color: "#1e293b",
                                      textShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                    }}
                                  >
                                    {step.title}
                                  </Typography>
                                  <Typography
                                    className="step-subtitle"
                                    variant="body2"
                                    sx={{
                                      color: "#64748b",
                                      fontSize: "0.9rem",
                                      fontWeight: 500,
                                      mt: 0.5,
                                    }}
                                  >
                                    {step.subtitle}
                                  </Typography>
                                </Box>
                                <Box sx={{ ml: 2 }}>
                                  <Typography
                                    className="step-status"
                                    variant="body2"
                                    sx={{
                                      color: step.isCompleted
                                        ? "#28A745"
                                        : step.isActive
                                        ? "#3b82f6"
                                        : "#9ca3af",
                                      fontSize: "0.85rem",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    {step.isCompleted ? "COMPLETED" : step.status}
                                  </Typography>
                                </Box>
                              </Box>

                              <Typography
                                sx={{
                                  color: "#64748b",
                                  fontSize: { xs: "1rem", md: "1.1rem" },
                                  lineHeight: 1.6,
                                  fontWeight: 500,
                                  letterSpacing: 0.01,
                                  mb: 3,
                                }}
                              >
                                {step.description}
                              </Typography>

                              {/* Progress Bar */}
                              <Box sx={{ width: "100%", mb: 2 }}>
                                <Box
                                  sx={{
                                    width: "100%",
                                    height: 6,
                                    backgroundColor: step.isCompleted
                                      ? "#E0F2E9"
                                      : step.isActive
                                      ? "#dbeafe"
                                      : "#f3f4f6",
                                    borderRadius: 3,
                                    overflow: "hidden",
                                  }}
                                >
                                  <Box
                                    className="progress-bar-fill"
                                    sx={{
                                      width: step.isCompleted ? "100%" : `${step.progress}%`,
                                      height: "100%",
                                      background: step.isCompleted
                                        ? "#28A745"
                                        : step.isActive
                                        ? "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)"
                                        : "transparent",
                                      borderRadius: 3,
                                      transition:
                                        "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>

                            {/* Navigation Arrow */}
                            <Box sx={{ textAlign: "right" }}>
                              <Typography
                                sx={{
                                  color: step.isActive ? "#3b82f6" : "#9ca3af",
                                  fontSize: "1.2rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    color: "#3b82f6",
                                    transform: "translateX(3px)",
                                  },
                                }}
                              >
                                ›
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </Container>
        </Box>
      </motion.div>
    </MainLayout>
  );
}
