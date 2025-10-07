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
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BalanceIcon from "@mui/icons-material/Balance";
import SecurityIcon from "@mui/icons-material/Security";
import BarChartIcon from "@mui/icons-material/BarChart";
import EditIcon from "@mui/icons-material/Edit";
import AssignmentIcon from "@mui/icons-material/Assignment";
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
                NEGCES Laboratory – Terms and Conditions
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  mb: 6,
                  color: "#64748b",
                  fontWeight: 400,
                  fontSize: { xs: "1.1rem", md: "1.3rem" },
                  maxWidth: 900,
                  mx: "auto",
                  lineHeight: 1.6,
                }}
              >
                The NEGCES Laboratory provides high-performance computational and research resources to support students, faculty, and researchers across all departments of the University. To ensure fair access and responsible usage, the following terms and conditions must be observed by all users.
              </Typography>
            </motion.div>

            {/* Policy Sections */}
            <Box>
              {/* Acknowledgement of Resources */}
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
                    aria-controls="acknowledgement-content"
                    id="acknowledgement-header"
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
                      <EmojiEventsIcon
                        sx={{
                          color: "#2563eb",
                          mr: 1,
                          fontSize: 28,
                          filter: "drop-shadow(0 2px 6px #bfdbfe)",
                        }}
                      />{" "}
                      1. Acknowledgement of Resources
                    </Typography>
                  </FoldbarSummary>
                  <AccordionDetails
                    sx={{ background: "#fff", borderRadius: 2 }}
                  >
                    <Box
                      sx={{
                        color: "#334155",
                        fontSize: "1.13rem",
                        lineHeight: 2.1,
                        fontWeight: 500,
                        letterSpacing: 0.01,
                      }}
                    >
                      <ul style={{ margin: 0, paddingLeft: isMobile ? 18 : 24 }}>
                        <li>All outcomes, including <strong>publications, reports, theses, dissertations, or presentations</strong> that utilize NEGCES Lab resources, must include a clear acknowledgement of the lab's support.</li>
                      </ul>
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          background: "#f8fafc",
                          borderRadius: 2,
                          borderLeft: "4px solid #2563eb",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontStyle: "italic", fontWeight: 600 }}>
                          Standard acknowledgement statement:
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: "#475569" }}>
                          "This work was carried out using the resources of the NEGCES Laboratory, Amrita Vishwa Vidyapeetham Chennai Campus."
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </motion.div>

              {/* Resource Usage Policy */}
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
                      "0 8px 32px rgba(168,85,247,0.08), 0 1.5px 6px rgba(29,233,182,0.07)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(243,232,255,0.85) 100%)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(168,85,247,0.08)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&.Mui-expanded": {
                      boxShadow:
                        "0 16px 48px rgba(168,85,247,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(243,232,255,0.97) 100%)",
                      border: "1.5px solid #a855f7",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <FoldbarSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "#222", fontSize: 32 }} />
                    }
                    aria-controls="usage-content"
                    id="usage-header"
                    color="#a855f7"
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
                      <CalendarTodayIcon
                        sx={{
                          color: "#a855f7",
                          mr: 1,
                          fontSize: 28,
                          filter: "drop-shadow(0 2px 6px #ddd6fe)",
                        }}
                      />{" "}
                      2. Resource Usage Policy
                    </Typography>
                  </FoldbarSummary>
                  <AccordionDetails
                    sx={{ background: "#fff", borderRadius: 2 }}
                  >
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: isMobile ? 18 : 24,
                        color: "#581c87",
                        fontSize: "1.13rem",
                        lineHeight: 2.1,
                        fontWeight: 500,
                        letterSpacing: 0.01,
                      }}
                    >
                      <li>Each student or team is allocated a <strong>maximum usage period of 15 days</strong> per request.</li>
                      <li>In exceptional cases, an <strong>extension of 10 additional days</strong> may be granted upon approval.</li>
                      <li>After the completion of the maximum allowable usage (15 + 10 days), the user(s) must take a <strong>mandatory break of at least 15 days</strong> before applying for access again.</li>
                      <li>This policy ensures <strong>rotation of resources</strong> and promotes <strong>democratized access</strong> for all researchers across the University.</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>

              {/* Eligibility and Access */}
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
                    aria-controls="eligibility-content"
                    id="eligibility-header"
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
                      3. Eligibility and Access
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
                      <li>Access to NEGCES resources is granted only to <strong>registered students, faculty, or recognized research teams</strong> of the University.</li>
                      <li>Users must submit a <strong>request form</strong> specifying the purpose, duration, and expected outcomes of resource usage.</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>

              {/* Fair Usage and Responsibilities */}
              <motion.div
                {...accordionMotion}
                transition={{ ...accordionMotion.transition, delay: 0.3 }}
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
                    aria-controls="fair-usage-content"
                    id="fair-usage-header"
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
                      <BalanceIcon
                        sx={{
                          color: "#ef4444",
                          mr: 1,
                          fontSize: 28,
                          filter: "drop-shadow(0 2px 6px #fecaca)",
                        }}
                      />{" "}
                      4. Fair Usage and Responsibilities
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
                      <li>Users must utilize the lab resources strictly for <strong>academic and research purposes</strong>.</li>
                      <li><strong>Commercial use, unauthorized data sharing, or misuse</strong> of resources is strictly prohibited.</li>
                      <li>Users are responsible for maintaining the <strong>integrity of data and software</strong> during usage.</li>
                      <li>Any violation of fair usage policies may result in <strong>suspension or permanent revocation</strong> of access privileges.</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>

              {/* Data Management and Confidentiality */}
              <motion.div
                {...accordionMotion}
                transition={{ ...accordionMotion.transition, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Accordion
                  sx={{
                    borderRadius: 3,
                    mb: 3,
                    boxShadow:
                      "0 8px 32px rgba(59,130,246,0.08), 0 1.5px 6px rgba(29,233,182,0.07)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(219,234,254,0.85) 100%)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(59,130,246,0.08)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&.Mui-expanded": {
                      boxShadow:
                        "0 16px 48px rgba(59,130,246,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(219,234,254,0.97) 100%)",
                      border: "1.5px solid #3b82f6",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <FoldbarSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "#222", fontSize: 32 }} />
                    }
                    aria-controls="data-management-content"
                    id="data-management-header"
                    color="#3b82f6"
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
                      <SecurityIcon
                        sx={{
                          color: "#3b82f6",
                          mr: 1,
                          fontSize: 28,
                          filter: "drop-shadow(0 2px 6px #dbeafe)",
                        }}
                      />{" "}
                      5. Data Management and Confidentiality
                    </Typography>
                  </FoldbarSummary>
                  <AccordionDetails
                    sx={{ background: "#fff", borderRadius: 2 }}
                  >
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: isMobile ? 18 : 24,
                        color: "#1e40af",
                        fontSize: "1.13rem",
                        lineHeight: 2.1,
                        fontWeight: 500,
                        letterSpacing: 0.01,
                      }}
                    >
                      <li>Users must ensure proper <strong>backup and security</strong> of their data.</li>
                      <li>NEGCES Lab will not be responsible for <strong>data loss, corruption, or unauthorized access</strong> due to user negligence.</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>

              {/* Monitoring and Compliance */}
              <motion.div
                {...accordionMotion}
                transition={{ ...accordionMotion.transition, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <Accordion
                  sx={{
                    borderRadius: 3,
                    mb: 3,
                    boxShadow:
                      "0 8px 32px rgba(251,146,60,0.08), 0 1.5px 6px rgba(29,233,182,0.07)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(254,243,199,0.85) 100%)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(251,146,60,0.08)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&.Mui-expanded": {
                      boxShadow:
                        "0 16px 48px rgba(251,146,60,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(254,243,199,0.97) 100%)",
                      border: "1.5px solid #fb923c",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <FoldbarSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "#222", fontSize: 32 }} />
                    }
                    aria-controls="monitoring-content"
                    id="monitoring-header"
                    color="#fb923c"
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
                      <BarChartIcon
                        sx={{
                          color: "#fb923c",
                          mr: 1,
                          fontSize: 28,
                          filter: "drop-shadow(0 2px 6px #fed7aa)",
                        }}
                      />{" "}
                      6. Monitoring and Compliance
                    </Typography>
                  </FoldbarSummary>
                  <AccordionDetails
                    sx={{ background: "#fff", borderRadius: 2 }}
                  >
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: isMobile ? 18 : 24,
                        color: "#c2410c",
                        fontSize: "1.13rem",
                        lineHeight: 2.1,
                        fontWeight: 500,
                        letterSpacing: 0.01,
                      }}
                    >
                      <li>Resource usage is <strong>monitored and logged</strong> for compliance and optimization purposes.</li>
                      <li>The NEGCES Lab Committee reserves the right to <strong>review, modify, or terminate</strong> user access in case of non-compliance.</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>

              {/* Policy Revisions */}
              <motion.div
                {...accordionMotion}
                transition={{ ...accordionMotion.transition, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Accordion
                  sx={{
                    borderRadius: 3,
                    mb: 3,
                    boxShadow:
                      "0 8px 32px rgba(107,114,128,0.08), 0 1.5px 6px rgba(29,233,182,0.07)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(243,244,246,0.85) 100%)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(107,114,128,0.08)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&.Mui-expanded": {
                      boxShadow:
                        "0 16px 48px rgba(107,114,128,0.13), 0 3px 12px rgba(29,233,182,0.10)",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(243,244,246,0.97) 100%)",
                      border: "1.5px solid #6b7280",
                      transform: "translateY(-3px) scale(1.01)",
                    },
                  }}
                >
                  <FoldbarSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "#222", fontSize: 32 }} />
                    }
                    aria-controls="policy-revisions-content"
                    id="policy-revisions-header"
                    color="#6b7280"
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
                      <EditIcon
                        sx={{
                          color: "#6b7280",
                          mr: 1,
                          fontSize: 28,
                          filter: "drop-shadow(0 2px 6px #e5e7eb)",
                        }}
                      />{" "}
                      7. Policy Revisions
                    </Typography>
                  </FoldbarSummary>
                  <AccordionDetails
                    sx={{ background: "#fff", borderRadius: 2 }}
                  >
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: isMobile ? 18 : 24,
                        color: "#374151",
                        fontSize: "1.13rem",
                        lineHeight: 2.1,
                        fontWeight: 500,
                        letterSpacing: 0.01,
                      }}
                    >
                      <li>The NEGCES Lab Committee may periodically <strong>update or amend</strong> these terms and conditions to align with institutional policies and research priorities.</li>
                      <li>Users will be notified of changes via the University's official communication channels.</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            </Box>

            {/* Agreement Notice */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              viewport={{ once: true }}
            >
              <Box
                sx={{
                  mt: 6,
                  p: 4,
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  borderRadius: 3,
                  textAlign: "center",
                  boxShadow: "0 8px 32px rgba(34,197,94,0.25)",
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{
                    color: "#fff",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 32 }} />
                  Agreement Confirmation
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#dcfce7",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                  }}
                >
                  By using NEGCES Lab resources, all users <strong>agree to abide by these terms and conditions</strong>.
                </Typography>
              </Box>
            </motion.div>

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
        &copy; {new Date().getFullYear()} NEGCES Lab. All rights reserved.
      </Typography>
      <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
        For support, contact <a href="mailto:k_deepak@amrita.edu" style={{ color: "#fff", textDecoration: "underline" }}>k_deepak@ch.amrita.edu</a>
      </Typography>
    </Box>
    </Box>
  );
}
