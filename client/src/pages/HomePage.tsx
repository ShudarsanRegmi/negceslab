import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import MenuIcon from "@mui/icons-material/Menu";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Booking", href: "/dashboard" },
  { label: "Rules", href: "#rules" },
  { label: "Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

const LOTTIE_URL =
  "https://assets2.lottiefiles.com/packages/lf20_1pxqjqps.json";

// Bubble animation component
interface BubbleProps {
  delay: number;
  duration: number;
  size: number;
  x: string;
  y: string;
  opacity: number;
}

const FloatingBubble = ({
  delay,
  duration,
  size,
  x,
  y,
  opacity,
}: BubbleProps) => (
  <motion.div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,${
        opacity * 0.8
      }) 0%, rgba(255,255,255,${opacity * 0.3}) 50%, rgba(255,255,255,${
        opacity * 0.1
      }) 100%)`,
      border: `1px solid rgba(255,255,255,${opacity * 0.2})`,
      left: x,
      top: y,
      zIndex: 1,
    }}
    animate={{
      y: [0, -100, -200, -300],
      x: [0, 20, -10, 30],
      scale: [1, 1.1, 0.9, 1.2],
      opacity: [opacity, opacity * 0.8, opacity * 0.6, 0],
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut",
    }}
  />
);

// Typing effect component
const TypingText = ({
  text,
  speed = 100,
}: {
  text: string;
  speed?: number;
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    // Reset when text changes
    setDisplayText("");
    setCurrentIndex(0);
    setIsTyping(true);
  }, [text]);

  useEffect(() => {
    if (isTyping && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (currentIndex >= text.length) {
      setIsTyping(false);
    }
  }, [currentIndex, text, speed, isTyping]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayText}
      {isTyping && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: "#1de9b6", fontWeight: "bold" }}
        >
          |
        </motion.span>
      )}
    </motion.span>
  );
};

export default function HomePage() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(LOTTIE_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(setAnimationData)
      .catch((err) => {
        console.error("Failed to load Lottie animation:", err);
      });
  }, []);

  const handleBookNow = () => {
    navigate("/dashboard");
  };

  // Generate bubble configurations
  const bubbles = [
    { delay: 0, duration: 8, size: 60, x: "10%", y: "80%", opacity: 0.3 },
    { delay: 2, duration: 10, size: 40, x: "20%", y: "70%", opacity: 0.4 },
    { delay: 4, duration: 12, size: 80, x: "80%", y: "90%", opacity: 0.2 },
    { delay: 1, duration: 9, size: 50, x: "70%", y: "60%", opacity: 0.35 },
    { delay: 3, duration: 11, size: 70, x: "15%", y: "50%", opacity: 0.25 },
    { delay: 5, duration: 7, size: 45, x: "85%", y: "40%", opacity: 0.3 },
    { delay: 0.5, duration: 13, size: 55, x: "50%", y: "85%", opacity: 0.2 },
    { delay: 2.5, duration: 8.5, size: 65, x: "30%", y: "30%", opacity: 0.3 },
    { delay: 4.5, duration: 10.5, size: 35, x: "90%", y: "20%", opacity: 0.4 },
    { delay: 1.5, duration: 9.5, size: 75, x: "5%", y: "10%", opacity: 0.25 },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 80%, rgba(29, 233, 182, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.1) 0%, transparent 50%)",
          zIndex: 0,
        },
      }}
    >
      {/* Floating Bubbles */}
      {bubbles.map((bubble, index) => (
        <FloatingBubble key={index} {...bubble} />
      ))}

      {/* Animated background grid */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          zIndex: 0,
        }}
      />

      {/* Navbar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          color: "#1e293b",
          borderRadius: 0,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          zIndex: 10,
          borderBottom: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            maxWidth: 1400,
            mx: "auto",
            width: "100%",
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 3 },
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <ComputerIcon
                  sx={{
                    fontSize: 32,
                    color: "#2563eb",
                    filter: "drop-shadow(0 2px 4px rgba(37,99,235,0.3))",
                  }}
                />
              </motion.div>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{
                  letterSpacing: 1,
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 4px rgba(37,99,235,0.3)",
                }}
              >
                Negsus Lab
              </Typography>
            </Stack>
          </motion.div>

          {/* Desktop Nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
            {navLinks.map((link, index) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Button
                  color="inherit"
                  href={link.href}
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    px: 2.5,
                    py: 1.2,
                    borderRadius: 3,
                    background: "rgba(37, 99, 235, 0.05)",
                    border: "1px solid rgba(37, 99, 235, 0.1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      color: "#fff",
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                      boxShadow: "0 8px 25px rgba(37,99,235,0.3)",
                      transform: "translateY(-3px) scale(1.05)",
                      border: "1px solid transparent",
                    },
                  }}
                >
                  {link.label}
                </Button>
              </motion.div>
            ))}
          </Box>

          {/* Mobile Nav */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => setDrawerOpen(true)}
                sx={{
                  ml: 1,
                  background: "rgba(37, 99, 235, 0.1)",
                  "&:hover": {
                    background: "rgba(37, 99, 235, 0.2)",
                  },
                }}
              >
                <MenuIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </motion.div>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              PaperProps={{
                sx: {
                  minWidth: 250,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  pt: 2,
                  borderLeft: "1px solid rgba(255,255,255,0.2)",
                },
              }}
            >
              <List>
                {navLinks.map((link, index) => (
                  <ListItem key={link.label} disablePadding>
                    <ListItemButton
                      component="a"
                      href={link.href}
                      sx={{
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        borderRadius: 2,
                        mx: 1,
                        mb: 0.5,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          color: "#fff",
                          background:
                            "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                          boxShadow: "0 4px 15px rgba(37,99,235,0.3)",
                          transform: "translateX(5px)",
                        },
                      }}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <ListItemText
                        primary={link.label}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: "1.1rem",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Drawer>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: { xs: "80vh", md: "90vh" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
              py: { xs: 8, md: 0 },
            }}
          >
            {/* Left: Text */}
            <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Typography
                  variant="h1"
                  fontWeight={900}
                  sx={{
                    color: "#fff",
                    mb: 3,
                    fontSize: { xs: "2.5rem", md: "4rem" },
                    lineHeight: 1.1,
                    textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    background:
                      "linear-gradient(135deg, #fff 0%, #e2e8f0 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Welcome to
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Negsus Lab
                  </span>
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: "#cbd5e1",
                    mb: 5,
                    fontWeight: 400,
                    fontSize: { xs: "1.2rem", md: "1.5rem" },
                    lineHeight: 1.6,
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  <TypingText
                    text="Smart. Secure. Sharable. Book your spot, follow the rules, and explore."
                    speed={80}
                  />
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      borderRadius: 4,
                      px: 5,
                      py: 2,
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                      boxShadow:
                        "0 8px 32px rgba(37,99,235,0.4), 0 4px 16px rgba(29,233,182,0.3)",
                      border: "2px solid rgba(255,255,255,0.2)",
                      backdropFilter: "blur(10px)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)",
                        boxShadow:
                          "0 12px 40px rgba(37,99,235,0.6), 0 6px 20px rgba(29,233,182,0.4)",
                        transform: "translateY(-2px)",
                        border: "2px solid rgba(255,255,255,0.3)",
                      },
                      "&:active": {
                        transform: "translateY(0px)",
                        boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
                      },
                    }}
                    endIcon={
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowForwardIosIcon sx={{ fontSize: 20 }} />
                      </motion.div>
                    }
                    onClick={handleBookNow}
                  >
                    Book Now
                  </Button>
                </motion.div>
              </motion.div>
            </Box>

            {/* Right: Lottie Animated Illustration */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "center", md: "flex-end" },
                mt: { xs: 6, md: 0 },
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                style={{
                  width: "100%",
                  maxWidth: 450,
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))",
                }}
              >
                {animationData ? (
                  <Lottie
                    animationData={animationData}
                    loop
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <motion.div
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontSize: "1.1rem",
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Loading animation...
                  </motion.div>
                )}
              </motion.div>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
