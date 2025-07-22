import React, { useState } from 'react';
import styles from './Contact.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, LocationOn, AccessTime, Person, Send, CheckCircle, Message, Apartment, Error, SupportAgent, Schedule, DoneAll } from '@mui/icons-material';

interface ContactInfo {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  link?: string;
  color?: string;
}
interface FormData {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

const contactDetails: ContactInfo[] = [
  { icon: <Person color="primary" />, label: 'Lab In-Charge', value: 'Dr. Sarah Johnson' },
  { icon: <Mail color="primary" />, label: 'Email', value: 'lab.support@university.edu', link: 'mailto:lab.support@university.edu' },
  { icon: <Phone color="primary" />, label: 'Phone', value: '+1 (555) 123-4567', link: 'tel:+15551234567' },
  { icon: <LocationOn color="primary" />, label: 'Location', value: 'Block C, 3rd Floor, Room 301, University Campus' },
];
const officeHours = [
  { day: 'Monday - Friday', hours: '9:00 AM - 5:00 PM', color: '#22c55e' },
  { day: 'Saturday', hours: '10:00 AM - 2:00 PM', color: '#22c55e' },
  { day: 'Sunday', hours: 'Closed', color: '#ef4444' },
];
const subjectOptions = [
  'General Feedback',
  'Technical Support',
  'Equipment Issue',
  'Booking Inquiry',
  'Suggestion',
  'Complaint',
  'Other',
];

const emergencyCards = [
  { icon: <SupportAgent style={{ color: '#ef4444' }} />, title: 'Emergency Support', desc: '24/7 phone support for urgent lab issues.', color: '#fee2e2' },
  { icon: <Mail style={{ color: '#2563eb' }} />, title: 'Quick Response', desc: 'Email us for a reply within 2 hours.', color: '#dbeafe' },
  { icon: <Apartment style={{ color: '#22c55e' }} />, title: 'Visit Us', desc: 'See us in person at our campus office.', color: '#dcfce7' },
];

const footerFeatures = [
  { icon: <Message />, label: 'Always Here to Help' },
  { icon: <Schedule />, label: 'Quick Response' },
  { icon: <CheckCircle />, label: 'Professional Support' },
];

const Contact: React.FC = () => {
  const [form, setForm] = useState<FormData>({ fullName: '', email: '', subject: subjectOptions[0], message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm({ fullName: '', email: '', subject: subjectOptions[0], message: '' });
      setTimeout(() => setSuccess(false), 3000);
    }, 1800);
  };

  return (
    <div className={styles.contactRoot}>
      {/* Hero Section */}
      <motion.section className={styles.heroSection} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <div className={styles.heroIconBg}><Message className={styles.heroIcon} /></div>
        <h1 className={styles.heroTitle}>Contact & Feedback</h1>
        <p className={styles.heroSubtitle}>Get in touch for questions, support, or feedback. We're here to help you make the most of your lab experience.</p>
      </motion.section>

      {/* Main Content Grid */}
      <section className={styles.mainGridSection}>
        <div className={styles.mainGrid}>
          {/* Left Column */}
          <div className={styles.leftCol}>
            {/* Contact Info Card */}
            <motion.div className={styles.infoCard} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className={styles.infoCardHeader}><Mail className={styles.infoCardIcon} /> <span>Get in Touch</span></div>
              <ul className={styles.infoList}>
                {contactDetails.map((item, i) => (
                  <li key={item.label} className={styles.infoListItem}>
                    <span className={styles.infoListIcon}>{item.icon}</span>
                    {item.link ? (
                      <a href={item.link} className={styles.infoListLink} target="_blank" rel="noopener noreferrer">{item.value}</a>
                    ) : (
                      <span>{item.value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          {/* Right Column: Feedback Form */}
          <motion.div className={styles.formCard} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}>
            <div className={styles.formCardHeader}><Send className={styles.formCardIcon} /> <span>Send Feedback</span></div>
            <form className={styles.feedbackForm} onSubmit={handleSubmit} autoComplete="off">
              <label className={styles.formLabel} htmlFor="fullName">Full Name *</label>
              <input className={styles.formInput} id="fullName" name="fullName" type="text" required value={form.fullName} onChange={handleChange} />
              <label className={styles.formLabel} htmlFor="email">Email Address *</label>
              <input className={styles.formInput} id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
              <label className={styles.formLabel} htmlFor="subject">Subject</label>
              <select className={styles.formInput} id="subject" name="subject" value={form.subject} onChange={handleChange}>
                {subjectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <label className={styles.formLabel} htmlFor="message">Message *</label>
              <textarea className={styles.formInput} id="message" name="message" required rows={5} value={form.message} onChange={handleChange} />
              <button className={styles.formButton} type="submit" disabled={loading || success}>
                {loading ? <span className={styles.loadingSpinner}></span> : <Send style={{ marginRight: 8 }} />}
                {loading ? 'Sending...' : 'Send'}
              </button>
              <AnimatePresence>
                {success && (
                  <motion.div className={styles.successMsg} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.5 }}>
                    <CheckCircle style={{ color: '#22c55e', marginRight: 6, verticalAlign: 'middle' }} />
                    Thank you! Your feedback has been sent.
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerFeatures}>
          {footerFeatures.map(f => (
            <div className={styles.footerFeature} key={f.label}>{f.icon} {f.label}</div>
          ))}
        </div>
        <div className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Negsus Lab. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Contact; 