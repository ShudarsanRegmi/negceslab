package ui

import (
	"fmt"

	"negceslab-agent/storage"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/widget"
)

// ShowNativeFynePortal opens a native desktop GUI modal window for user attendance check-in
func (as *AttendanceServer) ShowNativeFynePortal() {
	myApp := app.NewWithID("com.negceslab.attendance")
	myWindow := myApp.NewWindow("NegcesLab - User Attendance Check-In")

	// Title Label
	title := widget.NewLabelWithStyle("NegcesLab Attendance Check-In", fyne.TextAlignCenter, fyne.TextStyle{Bold: true})

	// Form Input Fields
	nameEntry := widget.NewEntry()
	nameEntry.SetPlaceHolder("Enter your full name")

	emailEntry := widget.NewEntry()
	emailEntry.SetPlaceHolder("Enter student email / roll number")

	sessionSelect := widget.NewSelect([]string{"Lab Work", "Research", "Class", "Project"}, nil)
	sessionSelect.SetSelected("Lab Work")

	agendaEntry := widget.NewMultiLineEntry()
	agendaEntry.SetPlaceHolder("Describe your work agenda for this session...")

	statusLabel := widget.NewLabel("")

	var submitBtn *widget.Button
	submitBtn = widget.NewButton("Submit Attendance Check-In", func() {
		name := nameEntry.Text
		email := emailEntry.Text
		sessionType := sessionSelect.Selected
		agenda := agendaEntry.Text

		if name == "" || email == "" || agenda == "" {
			statusLabel.SetText("Error: Please fill in all required fields.")
			return
		}

		statusLabel.SetText("Submitting check-in request...")
		submitBtn.Disable()

		// Perform check-in via client helper (handles REST call & local storage update)
		err := as.client.AttendanceCheckInOut(name, email, agenda, sessionType, true)
		if err != nil {
			// Fallback: update local storage directly if server is offline
			_ = as.store.SaveAttendance(storage.AttendanceState{
				StudentName:  name,
				StudentEmail: email,
				SessionType:  sessionType,
				Agenda:       agenda,
				CheckedIn:    true,
			})
			statusLabel.SetText(fmt.Sprintf("Saved Offline (Server Warning: %v)", err))
		} else {
			statusLabel.SetText("Check-In Successful! Closing window...")
		}

		// Close modal window
		myWindow.Close()
	})

	// Build layout
	form := container.NewVBox(
		title,
		widget.NewLabel("Student Name:"),
		nameEntry,
		widget.NewLabel("Student Email / Roll No:"),
		emailEntry,
		widget.NewLabel("Session Type:"),
		sessionSelect,
		widget.NewLabel("Work Agenda:"),
		agendaEntry,
		statusLabel,
		submitBtn,
	)

	myWindow.SetContent(container.NewPadded(form))
	myWindow.Resize(fyne.NewSize(440, 480))
	myWindow.CenterOnScreen()
	myWindow.ShowAndRun()
}
