import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Badge,
  Breadcrumbs,
  Link,
  Menu,
  MenuItem,
  ListItemAvatar,
  useTheme,
  useMediaQuery,
  Divider,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  AdminPanelSettings,
  BookOnline,
  Logout,
  Computer,
  Notifications,
  KeyboardArrowRight,
  Person,
  CheckCircle,
  Info,
  Warning,
  Error,
  Close as CloseIcon,
  Settings,
  AccountCircle,
  KeyboardArrowDown,
  Help,
  Info as InfoIcon,
  LightMode,
  DarkMode,
  BrightnessAuto,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme as useAppTheme } from "../contexts/ThemeContext";
import { format } from "date-fns";
import HelpDialog from "./HelpDialog";
import AboutDialog from "./AboutDialog";

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const { userRole, currentUser, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { mode, toggleTheme, isDark } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleUserMenuAction = (action: string) => {
    handleUserMenuClose();
    switch (action) {
      case "profile":
        navigate("/profile");
        break;
      case "settings":
        navigate("/settings");
        break;
      case "help":
        setHelpDialogOpen(true);
        break;
      case "about":
        setAboutDialogOpen(true);
        break;
      case "logout":
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleNotificationItemClick = (notificationId: string) => {
    markAsRead(notificationId);
    handleNotificationClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle sx={{ color: "success.main" }} />;
      case "warning":
        return <Warning sx={{ color: "warning.main" }} />;
      case "error":
        return <Error sx={{ color: "error.main" }} />;
      default:
        return <Info sx={{ color: "info.main" }} />;
    }
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
      roles: ["user", "admin"],
    },
    {
      text: "Computer Availability",
      icon: <Computer />,
      path: "/computers",
      roles: ["user", "admin"],
    },
    {
      text: "Book Slot",
      icon: <BookOnline />,
      path: "/book",
      roles: ["user"],
    },
    {
      text: "Admin Dashboard",
      icon: <AdminPanelSettings />,
      path: "/admin",
      roles: ["admin"],
    },
  ];

  const getPageTitle = () => {
    const currentItem = menuItems.find(
      (item) => item.path === location.pathname
    );
    return currentItem ? currentItem.text : "Dashboard";
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
    return (
      currentUser?.displayName || currentUser?.email?.split("@")[0] || "User"
    );
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          NEGSUS Lab
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Computer Booking System
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems
          .filter((item) => item.roles.includes(userRole || ""))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === item.path
                        ? "inherit"
                        : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {/* User Profile at Bottom */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            <Person />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="bold" noWrap>
              {getUserDisplayName()}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {userRole === "admin" ? "Admin" : "User"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: muiTheme.zIndex.drawer + 1,
          borderRadius: 0
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between"}}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="h6" noWrap>
                {getPageTitle()}
              </Typography>
              <Breadcrumbs sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                <Link color="inherit" href="#" underline="hover">
                  Home
                </Link>
                <Typography color="inherit">{getPageTitle()}</Typography>
              </Breadcrumbs>
            </Box>
          </Box>

          {/* User Info and Actions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <IconButton color="inherit" onClick={handleNotificationClick}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* Theme Toggle Button */}
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{
                display: { xs: "none", sm: "flex" },
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              {mode === "light" ? (
                <LightMode />
              ) : mode === "dark" ? (
                <DarkMode />
              ) : (
                <BrightnessAuto />
              )}
            </IconButton>

            <Menu
              anchorEl={notificationAnchor}
              open={Boolean(notificationAnchor)}
              onClose={handleNotificationClose}
              PaperProps={{
                sx: {
                  width: { xs: "100vw", sm: 350 },
                  maxHeight: 400,
                  maxWidth: { xs: "calc(100vw - 32px)", sm: 350 },
                },
              }}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="h6">Notifications</Typography>
                {unreadCount > 0 && (
                  <Button size="small" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                )}
              </Box>
              {notifications.length === 0 ? (
                <MenuItem>
                  <Typography variant="body2" color="text.secondary">
                    No notifications
                  </Typography>
                </MenuItem>
              ) : (
                notifications.map((notification) => (
                  <MenuItem
                    key={notification._id}
                    onClick={() =>
                      handleNotificationItemClick(notification._id)
                    }
                    sx={{
                      opacity: notification.isRead ? 0.7 : 1,
                      bgcolor: notification.isRead
                        ? "transparent"
                        : "action.hover",
                    }}
                  >
                    <ListItemAvatar>
                      {getNotificationIcon(notification.type)}
                    </ListItemAvatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={notification.isRead ? "normal" : "bold"}
                        noWrap
                      >
                        {notification.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {format(
                          new Date(notification.createdAt),
                          "MMM d, h:mm a"
                        )}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>

            {/* Professional User Menu */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* Desktop User Menu */}
              <Button
                onClick={handleUserMenuClick}
                sx={{
                  color: "inherit",
                  textTransform: "none",
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  display: { xs: "none", md: "flex" },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
                endIcon={<KeyboardArrowDown />}
              >
                <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                  {currentUser?.displayName ? (
                    getUserInitials(currentUser.displayName)
                  ) : (
                    <Person />
                  )}
                </Avatar>
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>
                    {getUserDisplayName()}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="rgba(255, 255, 255, 0.7)"
                    noWrap
                  >
                    {userRole === "admin" ? "Administrator" : "User"}
                  </Typography>
                </Box>
              </Button>

              {/* Mobile User Menu */}
              <IconButton
                onClick={handleUserMenuClick}
                sx={{
                  color: "inherit",
                  display: { xs: "flex", md: "none" },
                  p: 1,
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                  "&:active": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 36, sm: 32 },
                    height: { xs: 36, sm: 32 },
                    fontSize: { xs: "1.1rem", sm: "1rem" },
                  }}
                >
                  {currentUser?.displayName ? (
                    getUserInitials(currentUser.displayName)
                  ) : (
                    <Person />
                  )}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  sx: {
                    width: { xs: "calc(100vw - 32px)", sm: 280 },
                    maxWidth: { xs: "none", sm: 280 },
                    mt: 1,
                    boxShadow:
                      "0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.08)",
                    "& .MuiMenuItem-root": {
                      borderRadius: 1,
                      mx: { xs: 0, sm: 1 },
                      my: 0.5,
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{
                  horizontal: "right",
                  vertical: "bottom",
                  ...(isMobile && { horizontal: "center", vertical: "bottom" }),
                }}
                transitionDuration={200}
                slotProps={{
                  paper: {
                    sx: {
                      ...(isMobile && {
                        position: "fixed",
                        top: "auto !important",
                        bottom: "16px !important",
                        left: "16px !important",
                        right: "16px !important",
                        width: "calc(100vw - 32px)",
                        maxWidth: "none",
                      }),
                    },
                  },
                }}
              >
                {/* User Info Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ width: 48, height: 48 }}>
                      {currentUser?.displayName ? (
                        getUserInitials(currentUser.displayName)
                      ) : (
                        <Person />
                      )}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight="bold" noWrap>
                        {getUserDisplayName()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {currentUser?.email || "user@example.com"}
                      </Typography>
                      <Chip
                        label={userRole === "admin" ? "Administrator" : "User"}
                        size="small"
                        color={userRole === "admin" ? "primary" : "default"}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Menu Options */}
                <MenuItem
                  onClick={() => handleUserMenuAction("profile")}
                  sx={{ py: { xs: 2, sm: 1.5 } }}
                >
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Profile"
                    secondary="View and edit your profile"
                    primaryTypographyProps={{
                      fontSize: { xs: "1rem", sm: "inherit" },
                    }}
                    secondaryTypographyProps={{
                      fontSize: { xs: "0.875rem", sm: "inherit" },
                    }}
                  />
                </MenuItem>

                <MenuItem
                  onClick={() => handleUserMenuAction("settings")}
                  sx={{ py: { xs: 2, sm: 1.5 } }}
                >
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Settings"
                    secondary="Manage your preferences"
                    primaryTypographyProps={{
                      fontSize: { xs: "1rem", sm: "inherit" },
                    }}
                    secondaryTypographyProps={{
                      fontSize: { xs: "0.875rem", sm: "inherit" },
                    }}
                  />
                </MenuItem>

                <MenuItem
                  onClick={() => handleUserMenuAction("help")}
                  sx={{ py: { xs: 2, sm: 1.5 } }}
                >
                  <ListItemIcon>
                    <Help fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Help"
                    secondary="Get assistance"
                    primaryTypographyProps={{
                      fontSize: { xs: "1rem", sm: "inherit" },
                    }}
                    secondaryTypographyProps={{
                      fontSize: { xs: "0.875rem", sm: "inherit" },
                    }}
                  />
                </MenuItem>

                <MenuItem
                  onClick={() => handleUserMenuAction("about")}
                  sx={{ py: { xs: 2, sm: 1.5 } }}
                >
                  <ListItemIcon>
                    <InfoIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="About"
                    secondary="Learn more about the system"
                    primaryTypographyProps={{
                      fontSize: { xs: "1rem", sm: "inherit" },
                    }}
                    secondaryTypographyProps={{
                      fontSize: { xs: "0.875rem", sm: "inherit" },
                    }}
                  />
                </MenuItem>

                <Divider />

                <MenuItem
                  onClick={() => handleUserMenuAction("logout")}
                  sx={{ py: { xs: 2, sm: 1.5 } }}
                >
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Sign out"
                    secondary="Sign out of your account"
                    primaryTypographyProps={{
                      fontSize: { xs: "1rem", sm: "inherit" },
                    }}
                    secondaryTypographyProps={{
                      fontSize: { xs: "0.875rem", sm: "inherit" },
                    }}
                  />
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              maxWidth: "85vw",
              borderRadius: 0,
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRadius: 0,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, md: 8 },
        }}
      >
        {children}
      </Box>

      {/* Help Dialog */}
      <HelpDialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
      />

      {/* About Dialog */}
      <AboutDialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
      />
    </Box>
  );
};

export default Layout;
