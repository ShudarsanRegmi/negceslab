import React from 'react';
import styles from './Contact.module.css';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import { motion } from 'framer-motion';

const Contact: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
      className={styles.contactPage}
    >
      <h2 className={styles.heading}>Contact & Feedback</h2>
      <p className={styles.subheading}>
        Get in touch with us for any questions, support, or feedback about your lab experience.
      </p>
      <div className={styles.contentRow}>
        {/* Left: Contact Info */}
        <div className={styles.infoCol}>
          <div className={styles.infoSection}>
            <div className={styles.infoTitle}>Get in Touch</div>
            <div className={styles.infoItem}>
              <PersonIcon className={styles.infoIcon} color="primary" />
              <div>
                <div className={styles.infoLabel}>Lab In-Charge</div>
                <div className={styles.infoValue}>Dr. Sarah Johnson</div>
              </div>
            </div>
            <div className={styles.infoItem}>
              <EmailIcon className={styles.infoIcon} color="primary" />
              <div>
                <div className={styles.infoLabel}>Email</div>
                <div className={styles.infoValue}>lab.support@university.edu</div>
              </div>
            </div>
            <div className={styles.infoItem}>
              <PhoneIcon className={styles.infoIcon} color="primary" />
              <div>
                <div className={styles.infoLabel}>Phone</div>
                <div className={styles.infoValue}>+1 (555) 123-4567</div>
              </div>
            </div>
            <div className={styles.infoItem}>
              <LocationOnIcon className={styles.infoIcon} color="primary" />
              <div>
                <div className={styles.infoLabel}>Location</div>
                <div className={styles.infoValue}>Block C, 3rd Floor, Room 301<br />University Campus</div>
              </div>
            </div>
          </div>
          <div className={styles.officeHoursBox}>
            <div className={styles.officeTitle}>Office Hours</div>
            <div className={styles.officeHours}>Monday - Friday: 9:00 AM - 5:00 PM<br />Saturday: 10:00 AM - 2:00 PM<br />Sunday: Closed</div>
          </div>
        </div>
        {/* Right: Feedback Form */}
        <div className={styles.formCol}>
          <div className={styles.formBox}>
            <div className={styles.formTitle}>Send Feedback</div>
            <form className={styles.form}>
              <label className={styles.label} htmlFor="name">Full Name</label>
              <input className={styles.input} id="name" type="text" placeholder="Enter your full name" />
              <label className={styles.label} htmlFor="email">Email Address</label>
              <input className={styles.input} id="email" type="email" placeholder="Enter your email address" />
              <label className={styles.label} htmlFor="subject">Subject</label>
              <select className={styles.input} id="subject">
                <option>General Feedback</option>
                <option>Support Request</option>
                <option>Booking Issue</option>
                <option>Other</option>
              </select>
              <label className={styles.label} htmlFor="message">Message</label>
              <textarea className={styles.textarea} id="message" placeholder="Enter your message or feedback..." rows={4} />
              <button className={styles.button} type="submit">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact; 