import React from 'react';
import styles from './Team.module.css';
import { motion } from 'framer-motion';

const teamMembers = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Lab In-Charge',
    image: 'https://images.pexels.com/photos/5212335/pexels-photo-5212335.jpeg',
    contact: '#',
    contactLabel: 'Contact',
    roleLink: '#',
    roleLabel: 'Lab In-Charge',
  },
  {
    name: 'Mark Thompson',
    role: 'Lab Assistant',
    image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
    contact: '#',
    contactLabel: 'Contact',
    roleLink: '#',
    roleLabel: 'Lab Assistant',
  },
  {
    name: 'Lisa Chen',
    role: 'Technical Support',
    image: 'https://images.pexels.com/photos/1181696/pexels-photo-1181696.jpeg',
    contact: '#',
    contactLabel: 'Contact',
    roleLink: '#',
    roleLabel: 'Technical Support',
  },
];

const Team: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
      className={styles.teamPage}
    >
      <h2 className={styles.heading}>Meet Our Team</h2>
      <p className={styles.subheading}>
        Our dedicated team is here to help you make the most of your lab experience.
      </p>
      <div className={styles.grid}>
        {teamMembers.map((member) => (
          <div className={styles.card} key={member.name}>
            <img src={member.image} alt={member.name} className={styles.image} />
            <div className={styles.cardBody}>
              <div className={styles.name}>{member.name}</div>
              <a href={member.roleLink} className={styles.role}>{member.role}</a>
              <div className={styles.contactRow}>
                <span className={styles.contactIcon}>&#9993;</span>
                <a href={member.contact} className={styles.contact}>{member.contactLabel}</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Team; 