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

			sessionSelect := widget.NewSelect([]string{"Scheduled Lab Booking", "Non-Booked Walk-In Usage", "Lab Work", "Research", "Class", "Project"}, nil)
			sessionSelect.SetSelected("Non-Booked Walk-In Usage")

			agendaEntry := widget.NewMultiLineEntry()
			agendaEntry.SetPlaceHolder("What are you doing today? (Brief work agenda)")

			statusLabel := widget.NewLabel("")

			if attendance.CheckedIn {
				nameEntry.SetText(attendance.StudentName)
				nameEntry.Disable()

				emailEntry.SetText(attendance.StudentEmail)
				emailEntry.Disable()

				sessionSelect.SetSelected(attendance.SessionType)
				sessionSelect.Disable()

				agendaEntry.SetText(attendance.Agenda)
				agendaEntry.Disable()

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

				tab1Content = container.NewVBox(
					headerTitle,
					systemStatus,
					bookingBanner,
					widget.NewSeparator(),
					widget.NewLabelWithStyle("Active Session (Inputs Locked)", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
					widget.NewLabel("Student Name:"), nameEntry,
					widget.NewLabel("Email / Roll No:"), emailEntry,
					widget.NewLabel("Session Type:"), sessionSelect,
					widget.NewLabel("What you are doing today:"), agendaEntry,
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
								CheckInTime:  s.GetAttendance().CheckInTime,
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
						if bk.Agenda != "" && agendaEntry.Text == "" {
							agendaEntry.SetText(bk.Agenda)
						}
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

		// ─── TAB 2: SYSTEM REGISTRATION ───────────────────────────────────────
		regTitle := widget.NewLabelWithStyle("System Registration & Settings", fyne.TextAlignCenter, fyne.TextStyle{Bold: true})

		urlEntry := widget.NewEntry()
		urlEntry.SetText(c.GetConfig().BackendURL)
		urlEntry.Disable() // Locked per user directive

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

		tab2Content := container.NewVBox(
			regTitle,
			widget.NewLabel("Server API Endpoint (Locked):"),
			urlEntry,
			widget.NewLabel("Select Lab Computer:"),
			sysSelect,
			widget.NewLabel("Registration Secret:"),
			secretEntry,
			regStatusLabel,
			regBtn,
		)

		// Create Tabs
		tab1 := container.NewTabItem("📝 Attendance & Session", tab1Content)
		tab2 := container.NewTabItem("⚙️ System Registration", tab2Content)

		tabs := container.NewAppTabs(tab1, tab2)

		if creds.AuthToken == "" {
			tabs.Select(tab2)
		} else {
			tabs.Select(tab1)
		}

		myWindow.SetContent(container.NewPadded(tabs))
	}

	renderUI()
	myWindow.Resize(fyne.NewSize(480, 580))
	myWindow.CenterOnScreen()

	// Periodic Nag Routine: If user is not checked in, bring window to front every 30 minutes
	go func() {
		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			creds := s.GetCredentials()
			attendance := s.GetAttendance()

			// Only nag if the computer is registered but user has not marked attendance
			if creds.AuthToken != "" && !attendance.CheckedIn {
				fmt.Println("[NAG] User has not marked attendance. Bringing NegcesLab window to front...")
				myWindow.RequestFocus()
				myWindow.Show()
			}
		}
	}()

	myWindow.ShowAndRun()
}
