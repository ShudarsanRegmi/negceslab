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

	var buildTabContainer func() *container.AppTabs

	buildTabContainer = func() *container.AppTabs {
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
			systemStatus := widget.NewLabel(fmt.Sprintf("Registered System ID: %s | Telemetry: Streaming", creds.MachineID))
			systemStatus.TextStyle = fyne.TextStyle{Italic: true}

			nameEntry := widget.NewEntry()
			nameEntry.SetPlaceHolder("Full Name")

			emailEntry := widget.NewEntry()
			emailEntry.SetPlaceHolder("Email or Roll Number")

			sessionSelect := widget.NewSelect([]string{"Non-Booked Walk-In Usage", "Lab Work", "Research", "Class", "Project"}, nil)
			sessionSelect.SetSelected("Non-Booked Walk-In Usage")

			agendaEntry := widget.NewMultiLineEntry()
			agendaEntry.SetPlaceHolder("Briefly describe your work agenda...")

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

				statusLabel.SetText(fmt.Sprintf("Active Session (Checked in at %s)", attendance.CheckInTime.Format("15:04:05")))

				checkoutBtn := widget.NewButton("End Session & Checkout", func() {
					statusLabel.SetText("Processing checkout...")
					err := c.AttendanceCheckInOut(attendance.StudentName, attendance.StudentEmail, attendance.Agenda, attendance.SessionType, false)
					if err != nil {
						_ = s.SaveAttendance(storage.AttendanceState{CheckedIn: false})
					}
					statusLabel.SetText("Session Ended.")
					time.Sleep(1 * time.Second)
					myWindow.SetContent(container.NewPadded(buildTabContainer()))
				})

				tab1Content = container.NewVBox(
					headerTitle,
					systemStatus,
					widget.NewSeparator(),
					widget.NewLabelWithStyle("Active Session (Inputs Locked)", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
					widget.NewLabel("Student Name:"), nameEntry,
					widget.NewLabel("Email / Roll No:"), emailEntry,
					widget.NewLabel("Session Type:"), sessionSelect,
					widget.NewLabel("Work Agenda:"), agendaEntry,
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
						statusLabel.SetText("Error: All fields are required.")
						return
					}

					statusLabel.SetText("Submitting check-in...")
					submitBtn.Disable()

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
						statusLabel.SetText(fmt.Sprintf("Saved Offline: %v", err))
					} else {
						statusLabel.SetText("Check-In Successful!")
					}

					time.Sleep(1 * time.Second)
					myWindow.SetContent(container.NewPadded(buildTabContainer()))
				})

				tab1Content = container.NewVBox(
					headerTitle,
					systemStatus,
					widget.NewSeparator(),
					widget.NewLabelWithStyle("User Attendance & Session Form", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
					widget.NewLabel("Student Name:"), nameEntry,
					widget.NewLabel("Email / Roll No:"), emailEntry,
					widget.NewLabel("Session Type:"), sessionSelect,
					widget.NewLabel("Work Agenda:"), agendaEntry,
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

		sysIDEntry := widget.NewEntry()
		if creds.MachineID != "" {
			sysIDEntry.SetText(creds.MachineID)
		}
		sysIDEntry.SetPlaceHolder("MongoDB System ID (from Admin Panel)")

		secretEntry := widget.NewPasswordEntry()
		secretEntry.SetPlaceHolder("Admin Passcode / Registration Secret")

		regStatusLabel := widget.NewLabel("")

		var regBtn *widget.Button
		regBtn = widget.NewButton("Save & Register Machine", func() {
			if sysIDEntry.Text == "" || secretEntry.Text == "" {
				regStatusLabel.SetText("Error: System ID and Passcode are required.")
				return
			}

			if urlEntry.Text != "" {
				c.GetConfig().BackendURL = urlEntry.Text
			}

			regStatusLabel.SetText("Collecting hardware specs & registering...")
			regBtn.Disable()

			static, err := sysinfo.CollectStaticInfo()
			if err != nil {
				regStatusLabel.SetText(fmt.Sprintf("Hardware Spec Error: %v", err))
				regBtn.Enable()
				return
			}

			static.SystemID = sysIDEntry.Text
			c.GetConfig().RegistrationSecret = secretEntry.Text

			err = c.RegisterMachine(static)
			if err != nil {
				regStatusLabel.SetText(fmt.Sprintf("Registration Failed: %v", err))
				regBtn.Enable()
				return
			}

			regStatusLabel.SetText("Machine Registered Successfully!")
			time.Sleep(1 * time.Second)
			myWindow.SetContent(container.NewPadded(buildTabContainer()))
		})

		tab2Content := container.NewVBox(
			regTitle,
			widget.NewLabel("Server API Endpoint URL:"),
			urlEntry,
			widget.NewLabel("Target System ID:"),
			sysIDEntry,
			widget.NewLabel("Registration Secret:"),
			secretEntry,
			regStatusLabel,
			regBtn,
		)

		// Create Tabs
		tab1 := container.NewTabItem("📝 Attendance & Session", tab1Content)
		tab2 := container.NewTabItem("⚙️ System Registration", tab2Content)

		tabs := container.NewAppTabs(tab1, tab2)

		// Select Tab 2 if unregistered, otherwise Tab 1
		if creds.AuthToken == "" {
			tabs.Select(tab2)
		} else {
			tabs.Select(tab1)
		}

		return tabs
	}

	myWindow.SetContent(container.NewPadded(buildTabContainer()))
	myWindow.Resize(fyne.NewSize(480, 580))
	myWindow.CenterOnScreen()
	myWindow.ShowAndRun()
}
