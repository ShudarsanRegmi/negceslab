import React from 'react';
import styles from './Team.module.css';
import { motion } from 'framer-motion';
import { Avatar } from '@mui/material';
import { Groups as UsersIcon, Science as MicroscopeIcon, Star, Devices, Chair } from '@mui/icons-material';
import indhu from '@images/indhu.jpeg';
import deepak from '@images/deepak.jpeg';

// --- Interfaces ---
interface TeamMember {
  name: string;
  role: string;
  image: string;
  email: string;
  bio?: string;
  contact: string;
}
interface GalleryImage {
  src: string;
  title: string;
  desc: string;
}

// --- Data ---
const teamMembers: TeamMember[] = [
  {
    name: 'Dr. Deepak K',
    role: 'Lab In-Charge',
    image: deepak,
    email: 'k_deepak@ch.amrita.edu',
    bio: 'Assistant Professor at the School of Computing, Amrita Vishwa Vidyapeetham, Chennai. His research interests include Machine Learning, Deep Learning, Computer Vision, Video Anomaly Detection, Human Activity Recognition, and Vision-based Heart Rate Estimation.',
    contact: '+91 99406 87412',
  },
  {
    name: 'Mrs. Indhu S',
    role: 'Lab Technician',
    image: indhu,
    email: 'mark.thompson@lab.com',
    bio: 'Expert in hardware troubleshooting and lab logistics. Passionate about assisting students and maintaining lab operations efficiently.',
    contact: '+91 97919 22510',
  },
];

const galleryImages: GalleryImage[] = [
  {
    src: 'https://images.pexels.com/photos/256559/pexels-photo-256559.jpeg',
    title: 'Bookshelf',
    desc: 'A well-stocked lab library for research and study.'
  },
  {
    src: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg',
    title: 'Code on Screen',
    desc: 'Students working on coding projects.'
  },
  {
    src: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
    title: 'Classroom',
    desc: 'Modern classroom with collaborative environment.'
  },
  {
    src: 'https://images.pexels.com/photos/1181216/pexels-photo-1181216.jpeg',
    title: 'Laptop and Phone',
    desc: 'Flexible workspace for all devices.'
  },
  {
    src: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
    title: 'Workspace',
    desc: 'Comfortable and productive lab setup.'
  },
  {
    src: 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg',
    title: 'Monitors',
    desc: 'High-end equipment for every student.'
  },
];

const Team: React.FC = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 + i * 0.18, duration: 0.7, type: 'spring', bounce: 0.18 }
    }),
  };

  return (
    <div className={styles.teamRoot}>
      {/* Hero */}
      <motion.section className={styles.heroSection} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <div className={styles.heroIconBg}><UsersIcon className={styles.heroIcon} /></div>
        <h1 className={styles.heroTitle}>Meet Our Team</h1>
        <p className={styles.heroSubtitle}>Our dedicated team is here to help you make the most of your lab experience</p>
      </motion.section>

      {/* Team Cards */}
      <section className={styles.teamSection}>
        <div className={styles.teamGrid}>
          {teamMembers.map((member, i) => (
            <motion.div
              className={styles.teamCard}
              key={member.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ scale: 1.03, boxShadow: '0 6px 24px #2563eb22' }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <Avatar
                src={member.image}
                alt={member.name}
                sx={{
                  width: 128,
                  height: 128,
                  margin: '0 auto',
                  marginBottom: '1rem',
                  border: '4px solid #2563eb'
                }}
              />
              <div className={styles.teamCardBody}>
                <h3 className={styles.teamName}>{member.name}</h3>
                <div className={styles.teamRole}>{member.role}</div>
                <p className={styles.teamBio}>{member.bio}</p>
                <p><strong>Email:</strong> <a href={`mailto:${member.email}`}>{member.email}</a></p>
                <p><strong>Phone:</strong> <a href={`tel:${member.contact}`}>{member.contact}</a></p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lab Gallery */}
      {/* <section className={styles.labGallerySection}>
        <div className={styles.labGalleryHeader}>
          <MicroscopeIcon className={styles.labGalleryIcon} />
          <h2 className={styles.labGalleryHeading}>Lab Gallery</h2>
        </div>
        <p className={styles.labGallerySubheading}>Take a look at our modern facilities and see students in action during their lab sessions.</p>
        <div className={styles.labGalleryGrid}>
          {galleryImages.map((img, i) => (
            <motion.div
              className={styles.labGalleryImgWrap}
              key={img.src}
              whileHover={{ scale: 1.045, boxShadow: '0 8px 32px #2563eb22' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <img src={img.src} alt={img.title} className={styles.labGalleryImg} />
              <div className={styles.labGalleryOverlay}>
                <div className={styles.labGalleryOverlayText}>
                  <h4>{img.title}</h4>
                  <p>{img.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section> */}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerFeatures}>
          <div className={styles.footerFeature}><Star className={styles.footerIcon} /> Research Excellence</div>
          <div className={styles.footerFeature}><Devices className={styles.footerIcon} /> Modern Equipment</div>
          <div className={styles.footerFeature}><Chair className={styles.footerIcon} /> Comfortable Environment</div>
        </div>
        <div className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Negces Lab. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Team;
