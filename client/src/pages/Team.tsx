import React from 'react';
import styles from './Team.module.css';
import { motion } from 'framer-motion';
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Chip } from '@mui/material';
import {
  Groups as UsersIcon,
  Star,
  Devices,
  Chair,
  ExpandMore,
} from '@mui/icons-material';
import indhu from '@images/indhu.jpeg';
import deepak from '@images/deepak.jpeg';
import richa from '@images/richa.jpeg';
import shud from '@images/shud.jpeg';
import jinka from '@images/jinka.jpeg';

interface TeamMember {
  name: string;
  role: string;
  image?: string;
  email: string;
  bio: string;
  contact: string;
  tenure: string;
  status: 'current' | 'previous';
  linkedin?: string;
}

interface LabRoleGroup {
  title: string;
  current: TeamMember[];
  previous: TeamMember[];
}

const labRoleGroups: LabRoleGroup[] = [
  {
    title: 'Lab In-Charge',
    current: [
      {
        name: 'Dr. J. V. Aravind',
        role: 'Lab In-Charge',
        image: jinka,
        email: 'jv_aravind@ch.amrita.edu',
        bio: 'Assistant Professor at the School of Computing, Amrita Vishwa Vidyapeetham, Chennai. His research interests include Machine Learning, Deep Learning, Computer Vision, Edge AI Computing Systems, Internet of Things, Real-Time Object Detection and Tracking (Underwater), Wireless Optical Communication, and Embedded Systems.',
        contact: '+91 94946 28886',
        tenure: 'Current',
        status: 'current',
        linkedin: 'https://www.linkedin.com/in/j-v-aravind-26b061a1/',
      },
    ],
    previous: [
      {
        name: 'Dr. Deepak K',
        role: 'Former Lab In-Charge',
        image: deepak,
        email: 'k_deepak@ch.amrita.edu',
        bio: 'Assistant Professor at the School of Computing, Amrita Vishwa Vidyapeetham, Chennai. His research interests include Machine Learning, Deep Learning, Computer Vision, Video Anomaly Detection, Human Activity Recognition, and Vision-based Heart Rate Estimation.',
        contact: '+91 99406 87412',
        tenure: '2025-2026',
        status: 'previous',
        linkedin: 'https://www.linkedin.com/in/deepak-k-27023a47/',
      }  
    ],
  },
  {
    title: 'Lab Technician',
    current: [
      {
        name: 'Mrs. Indhu S',
        role: 'Lab Technician',
        image: indhu,
        email: 's_indhu@ch.amrita.edu',
        bio: 'Expert in hardware troubleshooting and lab logistics. Passionate about assisting students and maintaining lab operations efficiently.',
        contact: '+919791922590',
        tenure: 'Current',
        status: 'current',
      },
    ],
    previous: [],
  },
];

const developers = [
  {
    name: 'Shudarsan Regmi',
    role: 'Full Stack Developer',
    description: 'Lead developer and system architect responsible for product research, requirement identification, solution design, full-stack implementation, testing, deployment, and ongoing maintenance',
    github: 'https://github.com/ShudarsanRegmi',
    linkedin: 'https://linkedin.in/shudarsanregmi',
    photo: shud
  },
  {
    name: 'Richa Kumari Jaishwal',
    role: 'Full Stack Developer',
    description: 'Full stack developer focused on core functionality implementation across frontend and backend, with primary contributions in UI/UX design and interface development.',
    github: 'https://github.com/richajaishwal0',
    linkedin: 'https://www.linkedin.com/in/richa-jaishwal/',
    photo: richa
  }
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

  const renderMemberCard = (member: TeamMember, i: number) => (
    <motion.div
      className={`${styles.teamCard} ${member.status === 'current' ? styles.currentTeamCard : styles.previousTeamCard}`}
      key={`${member.role}-${member.name}`}
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
          border: member.status === 'current' ? '4px solid #2563eb' : '4px solid #cbd5e1'
        }}
      >
        {member.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)}
      </Avatar>
      <div className={styles.teamCardBody}>
        <div className={styles.memberHeaderLine}>
          <h3 className={styles.teamName}>{member.name}</h3>
          {member.status === 'previous' && (
            <Chip label={member.tenure} size="small" variant="outlined" />
          )}
        </div>
        <div className={styles.teamRole}>{member.role}</div>
        <p className={styles.teamBio}>{member.bio}</p>
        <p><strong>Email:</strong> <a href={`mailto:${member.email}`}>{member.email}</a></p>
        <p><strong>Phone:</strong> <a href={`tel:${member.contact}`}>{member.contact}</a></p>
        {member.linkedin && (
          <p><strong>LinkedIn:</strong> <a href={member.linkedin} target="_blank" rel="noopener noreferrer">View Profile</a></p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className={styles.teamRoot}>
      <motion.section className={styles.heroSection} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <div className={styles.heroIconBg}><UsersIcon className={styles.heroIcon} /></div>
        <h1 className={styles.heroTitle}>Meet Our Team</h1>
        <p className={styles.heroSubtitle}>Our dedicated team is here to help you make the most of your lab experience</p>
      </motion.section>

      <section className={styles.teamSection}>
        <div className={styles.sectionHeader}>
          <h2>Lab Leadership</h2>
          <p>Current role holders are highlighted, with academic-year history preserved below.</p>
        </div>

        <div className={styles.rolePanelsGrid}>
          {labRoleGroups.map((group, groupIndex) => (
            <section className={styles.rolePanel} key={group.title}>
              <div className={styles.rolePanelHeader}>
                <h3>{group.title}</h3>
              </div>

              <div className={styles.roleCardSlot}>
                {group.current.map((member, memberIndex) =>
                  renderMemberCard(member, groupIndex + memberIndex)
                )}
              </div>

              {group.previous.length > 0 && (
                <div className={styles.previousInlineHistory}>
                  <div className={styles.previousRolesHeading}>Previous {group.title}s</div>
                  {group.previous.map((member, i) => (
                    <Accordion className={styles.historyAccordion} key={`${group.title}-${member.name}`}>
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        aria-controls={`${member.name}-history-content`}
                        id={`${member.name}-history-header`}
                      >
                        <div className={styles.historySummary}>
                          <Avatar src={member.image} alt={member.name} sx={{ width: 40, height: 40 }}>
                            {member.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .slice(0, 2)}
                          </Avatar>
                          <div>
                            <div className={styles.historyName}>{member.name}</div>
                            <div className={styles.historyMeta}>{member.tenure}</div>
                          </div>
                        </div>
                      </AccordionSummary>
                      <AccordionDetails>
                        <div className={styles.previousCardSlot}>
                          {renderMemberCard(member, i)}
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </section>

      <section className={styles.developerSection}>
        <h2 className={styles.developerHeading}>Meet the Developers</h2>
        <div className={styles.teamGrid}>
          {developers.map((dev, i) => (
            <motion.div
              className={styles.teamCard}
              key={dev.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ scale: 1.03, boxShadow: '0 6px 24px #2563eb22' }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <Avatar
                src={dev.photo}
                alt={dev.name}
                sx={{
                  width: 128,
                  height: 128,
                  margin: '0 auto',
                  marginBottom: '1rem',
                  border: '4px solid #2563eb'
                }}
              />
              <div className={styles.teamCardBody}>
                <h3 className={styles.teamName}>{dev.name}</h3>
                <div className={styles.teamRole}>{dev.role}</div>
                <p className={styles.teamBio}>{dev.description}</p>
                <div className={styles.developerLinks}>
                  <a href={dev.github} target="_blank" rel="noopener noreferrer">GitHub</a> |{' '}
                  <a href={dev.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

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
