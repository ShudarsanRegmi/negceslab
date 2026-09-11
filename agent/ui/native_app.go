package ui

import (
	"fmt"
	"time"

	"negceslab-agent/client"
	"negceslab-agent/storage"
	"negceslab-agent/sysinfo"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/layout"
	"fyne.io/fyne/v2/widget"
)

// RunUnifiedGUIApp launches the single native desktop app with tabbed interface & background telemetry
func RunUnifiedGUIApp(c *client.Client, s *storage.Storage) {
	myApp := app.New()
	myWindow := myApp.NewWindow("NegcesLab Desktop Agent")

	var renderUI func()

	renderUI = func() {
		creds := s.GetCredentials()
		attendance := s.GetAttendance()

		// ─── TAB 1: ATTENDANCE & SESSION CHECK-IN ─────────────────────────────
		var tab1Content fyne.CanvasObject

		if creds.AuthToken == "" {
			tab1Content = container.NewVBox(
				widget.NewLabelWithStyle("Machine Unregistered", fyne.TextAlignCenter, fyne.TextStyle{Bold: true}),
				widget.NewLabel("Please select the '⚙️ System Registration' tab to register this computer with the NegcesLab server."),
			)
		} else {
			headerTitle := widget.NewLabelWithStyle("NegcesLab Attendance Check-In", fyne.TextAlignCenter, fyne.TextStyle{Bold: true})
			systemStatus := widget.NewLabel(fmt.Sprintf("Registered System ID: %s | Status: ONLINE", creds.MachineID))
			systemStatus.TextStyle = fyne.TextStyle{Italic: true}

			bookingBanner := widget.NewLabel("Checking active reservations...")
			bookingBanner.TextStyle = fyne.TextStyle{Bold: true}

			nameEntry := widget.NewEntry()
			nameEntry.SetPlaceHolder("Full Name")

			emailEntry := widget.NewEntry()
			emailEntry.SetPlaceHolder("Email or Roll Number")

			sessionSelect := widget.NewSelect([]string{"Scheduled Lab Booking", "Non-Booked Walk-In Usage"}, nil)
			sessionSelect.SetSelected("Non-Booked Walk-In Usage")

			agendaEntry := widget.NewMultiLineEntry()
			agendaEntry.SetPlaceHolder("What are you doing today? (Brief work agenda)")

			statusLabel := widget.NewLabel("")

			if attendance.CheckedIn {
				bookingBanner.SetText("🟢 Active Checked-In Session")
				checkTimeStr := "Just Now"
				if !attendance.CheckInTime.IsZero() {
					checkTimeStr = attendance.CheckInTime.Format("15:04:05")
				}
				statusLabel.SetText(fmt.Sprintf("Checked in at %s", checkTimeStr))

				var checkoutBtn *widget.Button
				checkoutBtn = widget.NewButton("End Session & Checkout", func() {
					statusLabel.SetText("Processing checkout...")
					checkoutBtn.Disable()
					go func() {
						err := c.AttendanceCheckInOut(attendance.StudentName, attendance.StudentEmail, attendance.Agenda, attendance.SessionType, false)
						if err != nil {
							_ = s.SaveAttendance(storage.AttendanceState{CheckedIn: false})
						}
						renderUI()
					}()
				})

				nameLabel := widget.NewLabelWithStyle(attendance.StudentName, fyne.TextAlignLeading, fyne.TextStyle{Bold: true})
				emailLabel := widget.NewLabelWithStyle(attendance.StudentEmail, fyne.TextAlignLeading, fyne.TextStyle{Bold: true})
				sessionLabel := widget.NewLabelWithStyle(attendance.SessionType, fyne.TextAlignLeading, fyne.TextStyle{Bold: true})
				agendaLabel := widget.NewLabelWithStyle(attendance.Agenda, fyne.TextAlignLeading, fyne.TextStyle{Italic: true})

				tab1Content = container.NewVBox(
					headerTitle,
					systemStatus,
					bookingBanner,
					widget.NewSeparator(),
					widget.NewLabelWithStyle("Active Session (Inputs Locked)", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
					widget.NewLabel("Student Name:"), nameLabel,
					widget.NewLabel("Email / Roll No:"), emailLabel,
					widget.NewLabel("Session Type:"), sessionLabel,
					widget.NewLabel("What you are doing today:"), agendaLabel,
					layout.NewSpacer(),
					statusLabel,
					checkoutBtn,
				)

			} else {
				var submitBtn *widget.Button
				submitBtn = widget.NewButton("Submit Attendance Check-In", func() {
					name := nameEntry.Text
					email := emailEntry.Text
					sessionType := sessionSelect.Selected
					agenda := agendaEntry.Text

					if name == "" || email == "" || agenda == "" {
						statusLabel.SetText("Error: All fields (Name, Email, Agenda) are required.")
						return
					}

					statusLabel.SetText("Submitting check-in...")
					submitBtn.Disable()

					go func() {
						err := c.AttendanceCheckInOut(name, email, agenda, sessionType, true)
						if err != nil {
							_ = s.SaveAttendance(storage.AttendanceState{
								StudentName:  name,
								StudentEmail: email,
								SessionType:  sessionType,
								Agenda:       agenda,
								CheckedIn:    true,
								CheckInTime:  time.Now(),
							})
						}
						renderUI()
					}()
				})

				// Asynchronously fetch current active booking from backend
				go func() {
					bk, err := c.FetchCurrentBooking()
					if err == nil && bk != nil && bk.BookingFound {
						bookingBanner.SetText(fmt.Sprintf("🟢 Active Reservation Found (%s - %s)", bk.StartTime, bk.EndTime))
						
						if bk.StudentName != "" {
							nameEntry.SetText(bk.StudentName)
							nameEntry.Disable()
						}
						if bk.StudentEmail != "" {
							emailEntry.SetText(bk.StudentEmail)
							emailEntry.Disable()
						}
						// Keep "What are you doing today?" (Agenda) EMPTY as requested
						agendaEntry.SetText("")
						sessionSelect.SetSelected("Scheduled Lab Booking")
						statusLabel.SetText("Booking auto-detected! Enter what you are doing today and submit.")
					} else {
						bookingBanner.SetText("ℹ️ No Active Booking Found (Walk-In Mode)")
						sessionSelect.SetSelected("Non-Booked Walk-In Usage")
						statusLabel.SetText("Fill in your details and work agenda to check in.")
					}
					bookingBanner.Refresh()
					nameEntry.Refresh()
					emailEntry.Refresh()
					agendaEntry.Refresh()
					sessionSelect.Refresh()
					statusLabel.Refresh()
				}()

				tab1Content = container.NewVBox(
					headerTitle,
					systemStatus,
					bookingBanner,
					widget.NewSeparator(),
					widget.NewLabelWithStyle("User Attendance & Session Form", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
					widget.NewLabel("Student Name:"), nameEntry,
					widget.NewLabel("Email / Roll No:"), emailEntry,
					widget.NewLabel("Session Type:"), sessionSelect,
					widget.NewLabel("What are you doing today?"), agendaEntry,
					layout.NewSpacer(),
					statusLabel,
					submitBtn,
				)
			}
		}

		// ─── TAB 2: LOCAL ATTENDANCE LOGS (METADATA ONLY) ───────────────────
		logsTitle := widget.NewLabelWithStyle("Local Computer Attendance Logs", fyne.TextAlignCenter, fyne.TextStyle{Bold: true})
		logsSub := widget.NewLabelWithStyle("Local metadata confirmation log trail (excluding work agenda)", fyne.TextAlignCenter, fyne.TextStyle{Italic: true})
		logsContainer := container.NewVBox(widget.NewLabel("Loading local attendance logs..."))
		logsScroll := container.NewVScroll(logsContainer)

		loadLogs := func() {
			logs := s.GetLocalAttendanceLogs()
			if len(logs) == 0 {
				logsContainer.Objects = []fyne.CanvasObject{
					widget.NewLabelWithStyle("No local attendance logs recorded yet for this machine.", fyne.TextAlignCenter, fyne.TextStyle{Italic: true}),
				}
				logsContainer.Refresh()
				return
			}

			var logItems []fyne.CanvasObject
			for idx, l := range logs {
				checkInStr := l.CheckInTime.Format("02/01/2006 15:04:05")
				checkOutStr := "No Check-out (ACTIVE)"
				if l.Status == "COMPLETED" && !l.CheckOutTime.IsZero() {
					checkOutStr = l.CheckOutTime.Format("02/01/2006 15:04:05")
				}

				header := widget.NewLabelWithStyle(fmt.Sprintf("#%d %s (%s)", idx+1, l.StudentName, l.StudentEmail), fyne.TextAlignLeading, fyne.TextStyle{Bold: true})
				meta1 := widget.NewLabel(fmt.Sprintf("Type: %s | OS: %s | Status: %s", l.SessionType, l.OSType, l.Status))
				meta2 := widget.NewLabel(fmt.Sprintf("Check-in: %s | Check-out: %s", checkInStr, checkOutStr))
				meta2.TextStyle = fyne.TextStyle{Italic: true}

				cardContent := container.NewVBox(header, meta1, meta2, widget.NewSeparator())
				logItems = append(logItems, cardContent)
			}
			logsContainer.Objects = logItems
			logsContainer.Refresh()
		}

		refreshLogsBtn := widget.NewButton("🔄 Refresh Local Logs", loadLogs)
		loadLogs()

		tab2Content := container.NewVBox(
			logsTitle,
			logsSub,
			refreshLogsBtn,
			widget.NewSeparator(),
			logsScroll,
		)

		// ─── TAB 3: SYSTEM REGISTRATION ───────────────────────────────────────
		regTitle := widget.NewLabelWithStyle("System Registration & Settings", fyne.TextAlignCenter, fyne.TextStyle{Bold: true})

		urlLabel := widget.NewLabelWithStyle(c.GetConfig().BackendURL, fyne.TextAlignLeading, fyne.TextStyle{Bold: true})

		sysSelect := widget.NewSelect([]string{"Fetching lab systems..."}, nil)
		sysMap := make(map[string]string)

		secretEntry := widget.NewPasswordEntry()
		secretEntry.SetPlaceHolder("Admin Passcode / Registration Secret")

		regStatusLabel := widget.NewLabel("Loading lab systems list...")

		var regBtn *widget.Button
		regBtn = widget.NewButton("Save & Register Machine", func() {
			selectedLabel := sysSelect.Selected
			selectedID := sysMap[selectedLabel]

			if selectedID == "" || secretEntry.Text == "" {
				regStatusLabel.SetText("Error: System Selection and Passcode are required.")
				return
			}

			regStatusLabel.SetText("Collecting hardware specs & registering...")
			regBtn.Disable()

			go func() {
				static, err := sysinfo.CollectStaticInfo()
				if err != nil {
					regStatusLabel.SetText(fmt.Sprintf("Hardware Spec Error: %v", err))
					regBtn.Enable()
					return
				}

				static.SystemID = selectedID
				c.GetConfig().RegistrationSecret = secretEntry.Text

				err = c.RegisterMachine(static)
				if err != nil {
					regStatusLabel.SetText(fmt.Sprintf("Registration Failed: %v", err))
					regBtn.Enable()
					return
				}

				renderUI()
			}()
		})
		regBtn.Disable()

		go func() {
			systems, err := c.FetchAvailableSystems()
			if err != nil {
				regStatusLabel.SetText(fmt.Sprintf("Error fetching systems: %v", err))
				sysSelect.Options = []string{"Failed to load systems"}
				sysSelect.Refresh()
				return
			}

			if len(systems) == 0 {
				regStatusLabel.SetText("No pre-configured computers found in database.")
				sysSelect.Options = []string{"No systems available"}
				sysSelect.Refresh()
				return
			}

			var options []string
			for _, sys := range systems {
				label := fmt.Sprintf("%s (ID: %s)", sys.Name, sys.ID)
				options = append(options, label)
				sysMap[label] = sys.ID
			}

			sysSelect.Options = options
			sysSelect.SetSelected(options[0])
			sysSelect.Refresh()
			regStatusLabel.SetText("Select target system and enter Registration Secret.")
			regBtn.Enable()
		}()

		tab3Content := container.NewVBox(
			regTitle,
			widget.NewLabel("Server API Endpoint (Locked):"),
			urlLabel,
			widget.NewLabel("Select Lab Computer:"),
			sysSelect,
			widget.NewLabel("Registration Secret:"),
			secretEntry,
			regStatusLabel,
			regBtn,
		)

		// Create Tabs
		tab1 := container.NewTabItem("📝 Attendance & Session", tab1Content)
		tab2 := container.NewTabItem("📋 Attendance Logs", tab2Content)
		tab3 := container.NewTabItem("⚙️ System Registration", tab3Content)

		tabs := container.NewAppTabs(tab1, tab2, tab3)

		if creds.AuthToken == "" {
			tabs.Select(tab3)
		} else {
			tabs.Select(tab1)
		}

		myWindow.SetContent(container.NewPadded(tabs))
	}

	renderUI()
	myWindow.Resize(fyne.NewSize(480, 580))
	myWindow.CenterOnScreen()

	// 1. Window Close Intercept: Prevent quitting app on window close (X). Minimize window to OS taskbar instead.
	myWindow.SetCloseIntercept(func() {
		attendance := s.GetAttendance()
		if !attendance.CheckedIn {
			fmt.Println("[WINDOW] Close attempt intercepted. Attendance check-in is pending; minimizing to taskbar until nag trigger...")
		} else {
			fmt.Println("[WINDOW] Close attempt intercepted. Minimizing window to taskbar (background telemetry service active).")
		}
		myWindow.Hide()
	})

	// 2. Periodic Attendance Nag Routine: If user is active but has not checked in, pop window to front every 2 minutes.
	go func() {
		nagTicker := time.NewTicker(2 * time.Minute)
		defer nagTicker.Stop()

		for range nagTicker.C {
			creds := s.GetCredentials()
			attendance := s.GetAttendance()

			// Nag user if system is registered and attendance is not checked in
			if creds.AuthToken != "" && !attendance.CheckedIn {
				fmt.Println("[NAG] Active user session without check-in. Popping NegcesLab agent window to front...")
				myWindow.Show()
				myWindow.RequestFocus()
			}
		}
	}()

	myWindow.ShowAndRun()
}
