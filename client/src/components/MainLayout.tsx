import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Computer as ComputerIcon,
  Menu as MenuIcon,
  Person,
  Settings,
  Logout,
  AccountCircle,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Achievements", href: "/achievements"},
  { label: "Rules", href: "/rules" },
  { label: "Booking", href: "/computers" },
  { label: "Team", href: "/team" },
  { label: "Contact", href: "/contact" },
];

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const { currentUser, userRole, logout } = useAuth();

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    return currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  };

  return (
    <Box>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          color: "#1e293b",
          borderRadius: 0,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          zIndex: 1201,
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
          <div>
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
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 4px rgba(37,99,235,0.3)",
                }}
              >
                Negces Lab
              </Typography>
            </Stack>
          </div>
          {/* Desktop Nav */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
            }}
          >
            {navLinks.map((link) => (
              <Button
                key={link.label}
                color="inherit"
                onClick={() => navigate(link.href)}
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
            ))}
            {/* User Profile or Login/Sign Up buttons */}
            {currentUser ? (
              <>
                <Button
                  onClick={handleUserMenuClick}
                  sx={{
                    ml: 2,
                    color: "inherit",
                    textTransform: "none",
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": {
                      background: "linear-gradient(90deg, rgba(37,99,235,0.08) 0%, rgba(29,233,182,0.08) 100%)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                    }}
                  >
                    {currentUser.displayName ? (
                      getUserInitials(currentUser.displayName)
                    ) : (
                      <Person />
                    )}
                  </Avatar>
                  <Box sx={{ textAlign: "left" }}>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="inherit"
                      noWrap
                    >
                      {getUserDisplayName()}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                    >
                      {userRole === "admin" ? "Administrator" : "User"}
                    </Typography>
                  </Box>
                </Button>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      boxShadow:
                        "0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
                      borderRadius: 2,
                      border: "1px solid rgba(0,0,0,0.08)",
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem
                    onClick={() => {
                      handleUserMenuClose();
                      navigate("/profile");
                    }}
                  >
                    <AccountCircle sx={{ mr: 1 }} />
                    Profile
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleUserMenuClose();
                      navigate("/settings");
                    }}
                  >
                    <Settings sx={{ mr: 1 }} />
                    Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      handleUserMenuClose();
                      handleLogout();
                    }}
                  >
                    <Logout sx={{ mr: 1 }} />
                    Sign out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => navigate("/login")}
                  sx={{
                    ml: 2,
                    fontWeight: 600,
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => navigate("/register")}
                  sx={{
                    ml: 1,
                    fontWeight: 600,
                    background: "linear-gradient(90deg, #2563eb 0%, #1de9b6 100%)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #1d4ed8 0%, #15b995 100%)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
          {/* Mobile Nav */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
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
                  zIndex: 1300,
                },
              }}
            >
              <List>
                {navLinks.map((link) => (
                  <ListItem key={link.label} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setDrawerOpen(false);
                        navigate(link.href);
                      }}
                      sx={{
                        fontWeight: 500,
                        fontSize: "1.08rem",
                        borderRadius: 2,
                        color: "#222",
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
                      <ListItemText
                        primary={link.label}
                        primaryTypographyProps={{
                          fontWeight: 500,
                          fontSize: "1.08rem",
                          color: "#222",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                <Divider sx={{ my: 1 }} />
                {currentUser ? (
                  <>
                    <ListItem>
                      <Box sx={{ p: 2, width: "100%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              background: "linear-gradient(135deg, #2563eb 0%, #1de9b6 100%)",
                            }}
                          >
                            {currentUser.displayName ? (
                              getUserInitials(currentUser.displayName)
                            ) : (
                              <Person />
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {getUserDisplayName()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {userRole === "admin" ? "Administrator" : "User"}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            setDrawerOpen(false);
                            navigate("/profile");
                          }}
                          sx={{ mb: 1 }}
                        >
                          Profile
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setDrawerOpen(false);
                            handleLogout();
                          }}
                          sx={{
                            background: "linear-gradient(90deg, #2563eb 0%, #1de9b6 100%)",
                            "&:hover": {
                              background: "linear-gradient(90deg, #1d4ed8 0%, #15b995 100%)",
                            },
                          }}
                        >
                          Sign out
                        </Button>
                      </Box>
                    </ListItem>
                  </>
                ) : (
                  <>
                    <ListItem>
                      <Box sx={{ p: 2, width: "100%" }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            setDrawerOpen(false);
                            navigate("/login");
                          }}
                          sx={{
                            mb: 1,
                            borderWidth: 2,
                            "&:hover": {
                              borderWidth: 2,
                            },
                          }}
                        >
                          Login
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setDrawerOpen(false);
                            navigate("/register");
                          }}
                          sx={{
                            background: "linear-gradient(90deg, #2563eb 0%, #1de9b6 100%)",
                            "&:hover": {
                              background: "linear-gradient(90deg, #1d4ed8 0%, #15b995 100%)",
                            },
                          }}
                        >
                          Sign Up
                        </Button>
                      </Box>
                    </ListItem>
                  </>
                )}
              </List>
            </Drawer>
          </Box>
        </Toolbar>
      </AppBar>
      {/* Add top padding so content is not hidden behind navbar */}
      <Box sx={{ pt: { xs: 4, md: 6 } }}>{children}</Box>
    </Box>
  );
};

export default MainLayout;
