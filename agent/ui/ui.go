package ui

import (
	"bufio"
	"context"
	"fmt"
	"html/template"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"negceslab-agent/client"
	"negceslab-agent/storage"

	"github.com/pkg/browser"
)

type AttendanceServer struct {
	client *client.Client
	store  *storage.Storage
	srv    *http.Server
	port   int
	done   chan bool
}

func NewAttendanceServer(c *client.Client, s *storage.Storage) *AttendanceServer {
	return &AttendanceServer{
		client: c,
		store:  s,
		done:   make(chan bool, 1),
		port:   9099,
	}
}

// Spawns local HTTP server and opens user check-in browser window
func (as *AttendanceServer) StartGUIPortal() {
	// Find an open port
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		listener, err = net.Listen("tcp", ":9099")
	}
	if err != nil {
		fmt.Printf("Failed to bind GUI server port: %v. Spawining CLI fallback.\n", err)
		as.StartCLIPrompt()
		return
	}
	
	as.port = listener.Addr().(*net.TCPAddr).Port
	mux := http.NewServeMux()
	mux.HandleFunc("/", as.handleIndex)
	mux.HandleFunc("/checkin", as.handleCheckIn)

	as.srv = &http.Server{
		Handler: mux,
	}

	go func() {
		if err := as.srv.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("GUI Server Error: %v\n", err)
		}
	}()

	url := fmt.Sprintf("http://localhost:%d", as.port)
	fmt.Printf("Spawning local attendance GUI portal at: %s\n", url)
	
	// Launch default web browser
	time.Sleep(300 * time.Millisecond)
	_ = browser.OpenURL(url)

	// Keep server alive until checked-in
	<-as.done
	
	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_ = as.srv.Shutdown(ctx)
	fmt.Println("Local GUI portal shutdown.")
}

func (as *AttendanceServer) handleIndex(w http.ResponseWriter, r *http.Request) {
	// Prevent browser caching
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	tmpl, err := template.New("index").Parse(htmlTemplate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	currentAttendance := as.store.GetAttendance()
	
	studentName := currentAttendance.StudentName
	email := currentAttendance.StudentEmail
	agenda := currentAttendance.Agenda
	sessionType := currentAttendance.SessionType
	bookingFound := false

	// If not currently checked in, attempt to auto-detect booking details from backend
	if !currentAttendance.CheckedIn {
		booking, err := as.client.GetCurrentBooking()
		if err == nil && booking.BookingFound {
			studentName = booking.StudentName
			email = booking.StudentEmail
			agenda = booking.Agenda
			bookingFound = true
		}
	}

	data := map[string]interface{}{
		"Port":         as.port,
		"CheckedIn":    currentAttendance.CheckedIn,
		"StudentName":  studentName,
		"Email":        email,
		"Agenda":       agenda,
		"SessionType":  sessionType,
		"BookingFound": bookingFound,
	}

	_ = tmpl.Execute(w, data)
}

func (as *AttendanceServer) handleCheckIn(w http.ResponseWriter, r *http.Request) {
	// Prevent browser caching
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	if r.Method != http.MethodPost {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	studentName := r.FormValue("studentName")
	studentEmail := r.FormValue("studentEmail")
	agenda := r.FormValue("agenda")
	sessionType := r.FormValue("sessionType")
	action := r.FormValue("action") // "checkin" or "checkout"

	isCheckIn := action == "checkin"
	
	// Perform backend call via agent client
	err := as.client.AttendanceCheckInOut(studentName, studentEmail, agenda, sessionType, isCheckIn)
	
	tmpl, parseErr := template.New("result").Parse(resultTemplate)
	if parseErr != nil {
		http.Error(w, parseErr.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Success":     err == nil,
		"Error":       "",
		"Action":      action,
		"StudentName": studentName,
	}
	if err != nil {
		data["Error"] = err.Error()
	}

	_ = tmpl.Execute(w, data)

	if err == nil {
		// Complete flow and close local web server after 2 seconds
		go func() {
			time.Sleep(2 * time.Second)
			as.done <- true
		}()
	}
}

// StartCLIPrompt fallback CLI interface
func (as *AttendanceServer) StartCLIPrompt() {
	reader := bufio.NewReader(os.Stdin)
	fmt.Println("\n==============================================")
	fmt.Println("       NegcesLab Machine Attendance           ")
	fmt.Println("==============================================")

	current := as.store.GetAttendance()
	if current.CheckedIn {
		fmt.Printf("Current session: %s (%s) checked in.\n", current.StudentName, current.StudentEmail)
		fmt.Print("Do you want to check out? (y/n): ")
		ans, _ := reader.ReadString('\n')
		ans = strings.TrimSpace(strings.ToLower(ans))
		if ans == "y" || ans == "yes" {
			err := as.client.AttendanceCheckInOut("", "", "", "", false)
			if err != nil {
				fmt.Printf("Check-out failed: %v\n", err)
			} else {
				fmt.Println("Successfully checked out!")
			}
			return
		}
	}

	// Auto-detect active booking details from server
	name := ""
	email := ""
	agenda := ""
	
	booking, err := as.client.GetCurrentBooking()
	if err == nil && booking.BookingFound {
		fmt.Printf("\n[INFO] Auto-detected active slot booking on this system:\n")
		fmt.Printf(" - Name:  %s\n", booking.StudentName)
		fmt.Printf(" - Email: %s\n", booking.StudentEmail)
		fmt.Printf(" - Slot Agenda: %s\n\n", booking.Agenda)
		
		name = booking.StudentName
		email = booking.StudentEmail
		agenda = booking.Agenda
	}

	if name == "" {
		fmt.Print("Enter your Full Name: ")
		name, _ = reader.ReadString('\n')
		name = strings.TrimSpace(name)
	} else {
		fmt.Printf("Using auto-detected Name: %s (Press Enter to keep, or type new name to override): ", name)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input != "" {
			name = input
		}
	}

	if email == "" {
		fmt.Print("Enter your Registered Email: ")
		email, _ = reader.ReadString('\n')
		email = strings.TrimSpace(email)
	} else {
		fmt.Printf("Using auto-detected Email: %s (Press Enter to keep, or type new email to override): ", email)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input != "" {
			email = input
		}
	}

	if agenda == "" {
		fmt.Print("Enter today's work agenda (e.g. experiment setup, model training): ")
		agenda, _ = reader.ReadString('\n')
		agenda = strings.TrimSpace(agenda)
	} else {
		fmt.Printf("Using default agenda: %s (Press Enter to keep, or type new agenda): ", agenda)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input != "" {
			agenda = input
		}
	}

	fmt.Println("\nSelect Session Connectivity Type:")
	fmt.Println("1) Physical Desktop GUI")
	fmt.Println("2) Physical Console CLI")
	fmt.Println("3) Remote GUI (RDP/AnyDesk)")
	fmt.Println("4) Remote CLI (SSH)")
	fmt.Print("Enter option (1-4, default: 1): ")
	sessOpt, _ := reader.ReadString('\n')
	sessOpt = strings.TrimSpace(sessOpt)
	
	sessType := "Physical GUI"
	switch sessOpt {
	case "2":
		sessType = "Physical CLI"
	case "3":
		sessType = "Remote GUI (RDP/AnyDesk)"
	case "4":
		sessType = "Remote CLI (SSH)"
	}

	fmt.Println("\nSubmitting check-in request to backend...")
	err = as.client.AttendanceCheckInOut(name, email, agenda, sessType, true)
	if err != nil {
		fmt.Printf("Check-in failed: %v\n", err)
	} else {
		fmt.Printf("Welcome %s! You are checked in successfully.\n", name)
	}
}

// Gorgeous responsive Glassmorphism Web template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NegcesLab Check-In</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-grad: linear-gradient(135deg, #0f172a 0%, #115e59 100%);
            --card-bg: rgba(255, 255, 255, 0.08);
            --card-border: rgba(255, 255, 255, 0.12);
            --primary: #2dd4bf;
            --primary-hover: #5eead4;
            --text-main: #f8fafc;
            --text-secondary: #94a3b8;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        body {
            background: var(--bg-grad);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: var(--text-main);
        }
        .container {
            width: 100%;
            max-width: 480px;
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 24px;
            padding: 40px 30px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }
        h2 {
            font-size: 26px;
            font-weight: 800;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #fff 0%, var(--primary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
        }
        .subtitle {
            font-size: 14px;
            color: var(--text-secondary);
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 22px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        label {
            font-size: 13px;
            font-weight: 600;
            color: var(--primary);
        }
        input, select {
            width: 100%;
            padding: 14px 16px;
            border-radius: 12px;
            border: 1px solid var(--card-border);
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
            font-size: 14px;
            outline: none;
            transition: all 0.3s;
        }
        input:focus, select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 10px rgba(45, 212, 191, 0.2);
            background: rgba(255, 255, 255, 0.08);
        }
        select option {
            background: #0f172a;
            color: #fff;
        }
        .btn {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .btn-primary {
            background: var(--primary);
            color: #0f172a;
        }
        .btn-primary:hover {
            background: var(--primary-hover);
            box-shadow: 0 8px 24px rgba(45, 212, 191, 0.4);
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #f87171;
            margin-top: 10px;
        }
        .btn-secondary:hover {
            background: rgba(239, 68, 68, 0.25);
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 20px;
            text-align: center;
        }
        .badge-checked {
            background: rgba(45, 212, 191, 0.15);
            color: var(--primary);
            border: 1px solid rgba(45, 212, 191, 0.3);
        }
        .badge-unchecked {
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .header-box {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-box">
            <h2>NEGCESLAB LAB</h2>
            <div class="subtitle">Secure Attendance & Workspace Session Register</div>
            {{if .CheckedIn}}
                <div class="badge badge-checked">Active Session: checked in</div>
            {{else}}
                <div class="badge badge-unchecked">Status: Checked Out / Idle</div>
            {{end}}
        </div>

        <form action="/checkin" method="POST">
            {{if .BookingFound}}
                <div style="font-size: 14px; background: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.25); border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: left; line-height: 1.5;">
                    <div style="font-weight: 700; color: var(--primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        <span>✓</span> Active Slot Booking Detected
                    </div>
                    <div style="font-size: 13px; color: var(--text-main);"><strong>Name:</strong> {{.StudentName}}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);"><strong>Email:</strong> {{.Email}}</div>
                </div>
                <input type="hidden" name="studentName" value="{{.StudentName}}">
                <input type="hidden" name="studentEmail" value="{{.Email}}">
            {{else}}
                <div class="form-group">
                    <label for="studentName">FULL NAME</label>
                    <input type="text" id="studentName" name="studentName" required placeholder="e.g. John Doe" value="{{.StudentName}}">
                </div>

                <div class="form-group">
                    <label for="studentEmail">STUDENT EMAIL</label>
                    <input type="email" id="studentEmail" name="studentEmail" required placeholder="username@students.amrita.edu" value="{{.Email}}">
                </div>
            {{end}}

            <div class="form-group">
                <label for="agenda">TODAY'S WORK AGENDA</label>
                <input type="text" id="agenda" name="agenda" required placeholder="e.g. doing experiment setup, training models" value="{{.Agenda}}">
            </div>

            <div class="form-group">
                <label for="sessionType">SESSION CONNECTIVITY TYPE</label>
                <select id="sessionType" name="sessionType" required>
                    <option value="Physical GUI" {{if eq .SessionType "Physical GUI"}}selected{{end}}>Physical Desktop GUI</option>
                    <option value="Physical CLI" {{if eq .SessionType "Physical CLI"}}selected{{end}}>Physical Console CLI</option>
                    <option value="Remote GUI (RDP/AnyDesk)" {{if eq .SessionType "Remote GUI (RDP/AnyDesk)"}}selected{{end}}>Remote GUI (RDP / TeamViewer / AnyDesk / VNC)</option>
                    <option value="Remote CLI (SSH)" {{if eq .SessionType "Remote CLI (SSH)"}}selected{{end}}>Remote CLI (Secure Shell SSH)</option>
                </select>
            </div>

            <button type="submit" name="action" value="checkin" class="btn btn-primary">Check In</button>
            {{if .CheckedIn}}
                <button type="submit" name="action" value="checkout" class="btn btn-secondary">Release / Check Out</button>
            {{end}}
        </form>
    </div>
</body>
</html>
`

const resultTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NegcesLab Check-In Success</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-grad: linear-gradient(135deg, #0f172a 0%, #115e59 100%);
            --card-bg: rgba(255, 255, 255, 0.08);
            --card-border: rgba(255, 255, 255, 0.12);
            --primary: #2dd4bf;
            --text-main: #f8fafc;
            --text-secondary: #94a3b8;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        body {
            background: var(--bg-grad);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: var(--text-main);
        }
        .container {
            width: 100%;
            max-width: 440px;
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            backdrop-filter: blur(16px);
            border-radius: 24px;
            padding: 50px 30px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .icon {
            font-size: 64px;
            line-height: 1;
        }
        h2 {
            font-size: 24px;
            font-weight: 800;
        }
        .success-text {
            color: var(--primary);
        }
        .error-text {
            color: #f87171;
        }
        p {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        {{if .Success}}
            <div class="icon">✅</div>
            <h2 class="success-text">Success!</h2>
            {{if eq .Action "checkin"}}
                <p>Welcome, <strong>{{.StudentName}}</strong>! You have successfully checked in. Have a great productive session.</p>
            {{else}}
                <p>You have successfully released/checked out of this machine. Thank you!</p>
            {{end}}
            <p style="font-size: 12px; margin-top: 10px;">This window can be closed now.</p>
        {{else}}
            <div class="icon">❌</div>
            <h2 class="error-text">Request Failed</h2>
            <p>{{.Error}}</p>
            <p style="font-size: 12px; margin-top: 10px;"><a href="/" style="color: var(--primary); text-decoration: none;">Try Again</a></p>
        {{end}}
    </div>
</body>
</html>
`
