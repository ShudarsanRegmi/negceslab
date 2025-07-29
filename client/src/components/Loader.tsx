import React from 'react';
import styles from './Loader.module.css';

const Loader: React.FC = () => (
  <div className={styles.loaderContainer}>
    <div className={styles.flaskWrapper}>
      <svg
        className={styles.flask}
        width="80"
        height="100"
        viewBox="0 0 80 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Flask Body */}
        <rect x="30" y="20" width="20" height="60" rx="10" fill="#ffffff" stroke="#4f8cff" strokeWidth="4" />
        <path d="M30 80 Q40 100 50 80" fill="#4f8cff" stroke="#4f8cff" strokeWidth="2" />

        {/* Flask Neck */}
        <rect x="36" y="0" width="8" height="30" rx="4" fill="#4f8cff" />

        {/* Bubbles */}
        <circle className={`${styles.bubble} ${styles.bubble1}`} cx="40" cy="35" r="4" fill="#00e6e6" />
        <circle className={`${styles.bubble} ${styles.bubble2}`} cx="47" cy="45" r="3.5" fill="#ff4fd8" />
        <circle className={`${styles.bubble} ${styles.bubble3}`} cx="33" cy="50" r="3" fill="#ffe24f" />
      </svg>
    </div>
    <div className={styles.labText}>NEGCES Lab</div>
  </div>
);

export default Loader;
