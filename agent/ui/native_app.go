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

// ShowUnifiedNegcesLabApp opens the unified native desktop application window
func ShowUnifiedNegcesLabApp(c *client.Client, s *storage.Storage) {
	myApp := app.NewWithID("com.negceslab.desktop")
	myWindow := myApp.NewWindow("NegcesLab Desktop")

	refreshUI := func() {
		creds := s.GetCredentials()
		attendance := s.GetAttendance()

		var mainContainer *fyne.Container

		// ─── STATE 1: Machine Not Registered ─────────────────────────────────
		if creds.AuthToken == "" {
			title := widget.NewLabelWithStyle("Machine Registration Required", fyne.TextAlignCenter, fyne.TextStyle{Bold: true})
			desc := widget.NewLabel("This machine is not registered. Please enter the System ID and Admin Passcode.")

			sysIDEntry := widget.NewEntry()
			sysIDEntry.SetPlaceHolder("MongoDB System ID (from Admin Panel)")

			secretEntry := widget.NewPasswordEntry()
			secretEntry.SetPlaceHolder("Admin Passcode / Registration Secret")

			statusLabel := widget.NewLabel("")

			var regBtn *widget.Button
			regBtn = widget.NewButton("Register Machine", func() {
				if sysIDEntry.Text == "" || secretEntry.Text == "" {
					statusLabel.SetText("Error: Please provide System ID and Passcode.")
					return
				}
				statusLabel.SetText("Collecting hardware specs & registering...")
				regBtn.Disable()

				static, err := sysinfo.CollectStaticInfo()
				if err != nil {
					statusLabel.SetText(fmt.Sprintf("Hardware Spec Error: %v", err))
					regBtn.Enable()
					return
				}

				static.SystemID = sysIDEntry.Text
				c.GetConfig().RegistrationSecret = secretEntry.Text

				err = c.RegisterMachine(static)
				if err != nil {
					statusLabel.SetText(fmt.Sprintf("Registration Failed: %v", err))
					regBtn.Enable()
					return
				}

				statusLabel.SetText("Machine Registered Successfully!")
				time.Sleep(1 * time.Second)
				myWindow.Close()
			})

			regForm := container.NewVBox(
				title,
				desc,
				widget.NewLabel("Target System ID:"),
				sysIDEntry,
				widget.NewLabel("Registration Secret:"),
				secretEntry,
				statusLabel,
				regBtn,
			)
			mainContainer = container.NewPadded(regForm)

		} else {
			// ─── STATE 2 & 3: Machine Registered ───────────────────────────────
			headerTitle := widget.NewLabelWithStyle("NegcesLab System Overview", fyne.TextAlignCenter, fyne.TextStyle{Bold: true})

			systemStatus := widget.NewLabel(fmt.Sprintf("System ID: %s | Status: Registered & Monitoring", creds.MachineID))
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
				// ─── STATE 3: Active Session (Checked In) ──────────────────────
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
					statusLabel.SetText("Session Ended. Thank you!")
					time.Sleep(1 * time.Second)
					myWindow.Close()
				})

				content := container.NewVBox(
					headerTitle,
					systemStatus,
					widget.NewSeparator(),
					widget.NewLabelWithStyle("Active Attendance Session (Inputs Locked)", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
					widget.NewLabel("Student Name:"), nameEntry,
					widget.NewLabel("Email / Roll No:"), emailEntry,
					widget.NewLabel("Session Type:"), sessionSelect,
					widget.NewLabel("Work Agenda:"), agendaEntry,
					layout.NewSpacer(),
					statusLabel,
					checkoutBtn,
				)
				mainContainer = container.NewPadded(content)

			} else {
				// ─── STATE 2: Unchecked Session (Form Enabled) ─────────────────
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
					myWindow.Close()
				})

				content := container.NewVBox(
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
				mainContainer = container.NewPadded(content)
			}
		}

		myWindow.SetContent(mainContainer)
	}

	refreshUI()
	myWindow.Resize(fyne.NewSize(460, 520))
	myWindow.CenterOnScreen()
	myWindow.ShowAndRun()
}
