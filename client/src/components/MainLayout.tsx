import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Stack, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Booking", href: "/dashboard" },
  { label: "Rules", href: "/rules" },
  { label: "Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            color: "#1e293b",
            borderRadius: 0,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            zIndex: 10,
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            top: 0,
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
                  <ComputerIcon color="primary" sx={{ fontSize: 32 }} />
                </motion.div>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    letterSpacing: 1,
                    background: "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
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
                      fontWeight: 500,
                      fontSize: "1.08rem",
                      px: 2.2,
                      py: 1.1,
                      borderRadius: 2,
                      transition:
                        "color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.18s",
                      "&:hover": {
                        color: "#fff",
                        background:
                          "linear-gradient(90deg, #2563eb 0%, #1de9b6 100%)",
                        boxShadow: "0 4px 16px 0 rgba(37,99,235,0.13)",
                        transform: "translateY(-2px) scale(1.04)",
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
                  sx={{ ml: 1 }}
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
                    minWidth: 200,
                    bgcolor: "#fff",
                    pt: 2,
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
                          fontWeight: 500,
                          fontSize: "1.08rem",
                          borderRadius: 2,
                          transition:
                            "color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.18s",
                          "&:hover": {
                            color: "#fff",
                            background:
                              "linear-gradient(90deg, #2563eb 0%, #1de9b6 100%)",
                            boxShadow: "0 4px 16px 0 rgba(37,99,235,0.13)",
                            transform: "translateY(-2px) scale(1.04)",
                          },
                        }}
                        onClick={() => setDrawerOpen(false)}
                      >
                        <ListItemText
                          primary={link.label}
                          primaryTypographyProps={{
                            fontWeight: 500,
                            fontSize: "1.08rem",
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
      </motion.div>
      {/* Add top padding so content is not hidden behind navbar */}
      <Box sx={{ pt: { xs: 4, md: 6 } }}>{children}</Box>
    </Box>
  );
};

export default MainLayout; 