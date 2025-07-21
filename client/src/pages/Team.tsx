import React, { useState } from 'react';
import styles from './Team.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, IconButton } from '@mui/material';
import { Close as CloseIcon, Groups as UsersIcon, Science as MicroscopeIcon, Star, Devices, Chair } from '@mui/icons-material';

// --- Interfaces ---
interface TeamMember {
  name: string;
  role: string;
  image: string;
  email: string;
  bio?: string; // Added bio field
}
interface GalleryImage {
  src: string;
  title: string;
  desc: string;
}

// --- Data ---
const teamMembers: TeamMember[] = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Lab In-Charge',
    image: 'https://images.pexels.com/photos/1181696/pexels-photo-1181696.jpeg',
    email: 'mailto:sarah.johnson@lab.com',
    bio: 'PhD in Computer Science. 10+ years managing university labs. Passionate about student success and research excellence.'
  },
  {
    name: 'Mark Thompson',
    role: 'Lab Assistant',
    image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
    email: 'mailto:mark.thompson@lab.com',
    bio: 'Expert in hardware troubleshooting and lab logistics. Loves helping students and keeping the lab running smoothly.'
  },
  {
    name: 'Lisa Chen',
    role: 'Technical Support',
    image: 'https://images.pexels.com/photos/5212335/pexels-photo-5212335.jpeg',
    email: 'mailto:lisa.chen@lab.com',
    bio: 'Specialist in software and network support. Always ready to solve technical issues and support lab users.'
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

// --- Gallery Modal ---
const GalleryModal: React.FC<{ open: boolean; image: GalleryImage | null; onClose: () => void }> = ({ open, image, onClose }) => (
  <AnimatePresence>
    {open && image && (
      <motion.div className={styles.galleryModalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className={styles.galleryModal} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.4 }}>
          <IconButton className={styles.galleryModalClose} onClick={onClose} aria-label="Close image">
            <CloseIcon fontSize="large" />
          </IconButton>
          <img src={image.src} alt={image.title} className={styles.galleryModalImg} />
          <div className={styles.galleryModalDetails}>
            <h3>{image.title}</h3>
            <p>{image.desc}</p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Team Member Modal ---
interface TeamMemberModalProps {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
}
const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ open, member, onClose }) => (
  <AnimatePresence>
    {open && member && (
      <motion.div className={styles.galleryModalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className={styles.galleryModal} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.4 }}>
          <IconButton className={styles.galleryModalClose} onClick={onClose} aria-label="Close member info">
            <CloseIcon fontSize="large" />
          </IconButton>
          <img src={member.image} alt={member.name} className={styles.galleryModalImg} />
          <div className={styles.galleryModalDetails}>
            <h3>{member.name}</h3>
            <div style={{ color: '#2563eb', fontWeight: 500, marginBottom: 8 }}>{member.role}</div>
            <p>{member.bio}</p>
            <a href={member.email} className={styles.teamContactBtn} style={{ marginTop: 16, display: 'inline-block' }} tabIndex={0} aria-label={`Email ${member.name}`}>✉️ Contact</a>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Team: React.FC = () => {
  // Gallery modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<GalleryImage | null>(null);
  // Team member modal state
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Animations
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.18, duration: 0.7, type: 'spring', bounce: 0.18 } })
  };

  return (
    <div className={styles.teamRoot}>
      {/* Hero Section */}
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
              tabIndex={0}
              whileHover={{ scale: 1.045, boxShadow: '0 8px 32px #2563eb22' }}
              whileFocus={{ scale: 1.045, boxShadow: '0 8px 32px #2563eb22' }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <div className={styles.teamImgWrap} style={{ cursor: 'pointer' }}
                onClick={() => { setSelectedMember(member); setMemberModalOpen(true); }}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (setSelectedMember(member), setMemberModalOpen(true))}
                tabIndex={0}
                aria-label={`View biodata for ${member.name}`}
                role="button"
              >
                <img src={member.image} alt={member.name} className={styles.teamImg} />
              </div>
              <div className={styles.teamCardBody}>
                <h3 className={styles.teamName}>{member.name}</h3>
                <div className={styles.teamRole}>{member.role}</div>
                <a href={member.email} className={styles.teamContactBtn} tabIndex={0} aria-label={`Email ${member.name}`}>✉️ Contact</a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <TeamMemberModal open={memberModalOpen} member={selectedMember} onClose={() => setMemberModalOpen(false)} />

      {/* Lab Gallery Section */}
      <section className={styles.labGallerySection}>
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
              whileFocus={{ scale: 1.045, boxShadow: '0 8px 32px #2563eb22' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              tabIndex={0}
              onClick={() => { setModalImg(img); setModalOpen(true); }}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (setModalImg(img), setModalOpen(true))}
              aria-label={`View ${img.title}`}
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
        <GalleryModal open={modalOpen} image={modalImg} onClose={() => setModalOpen(false)} />
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerFeatures}>
          <div className={styles.footerFeature}><Star className={styles.footerIcon} /> Research Excellence</div>
          <div className={styles.footerFeature}><Devices className={styles.footerIcon} /> Modern Equipment</div>
          <div className={styles.footerFeature}><Chair className={styles.footerIcon} /> Comfortable Environment</div>
        </div>
        <div className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Negsus Lab. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Team; 