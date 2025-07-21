import React, { useMemo } from "react";
import styles from "./RulesBackground.module.css";

const orbConfigs = [
  {
    className: styles.orb1,
    style: {
      top: "-80px",
      left: "-80px",
      width: 384,
      height: 384,
      background:
        "radial-gradient(circle at 30% 30%, rgba(191,219,254,0.4) 0%, rgba(129,140,248,0.3) 100%)",
      animationDuration: "6s",
      animationDelay: "0s",
    },
  },
  {
    className: styles.orb2,
    style: {
      top: "25%",
      right: "-80px",
      width: 320,
      height: 320,
      background:
        "radial-gradient(circle at 70% 30%, rgba(110,231,183,0.35) 0%, rgba(191,219,254,0.25) 100%)",
      animationDuration: "8s",
      animationDelay: "2s",
    },
  },
  {
    className: styles.orb3,
    style: {
      bottom: "25%",
      left: "25%",
      width: 288,
      height: 288,
      background:
        "radial-gradient(circle at 40% 60%, rgba(129,140,248,0.3) 0%, rgba(196,181,253,0.2) 100%)",
      animationDuration: "7s",
      animationDelay: "4s",
    },
  },
  {
    className: styles.orb4,
    style: {
      bottom: "-80px",
      right: "-80px",
      width: 256,
      height: 256,
      background:
        "radial-gradient(circle at 60% 70%, rgba(191,219,254,0.25) 0%, rgba(103,232,249,0.2) 100%)",
      animationDuration: "9s",
      animationDelay: "1s",
    },
  },
];

function randomParticles() {
  return Array.from({ length: 20 }).map(() => {
    const size = Math.random() * 8 + 4;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 5;
    return {
      size,
      left,
      top,
      duration,
      delay,
    };
  });
}

const RulesBackground: React.FC = () => {
  const particles = useMemo(() => randomParticles(), []);
  return (
    <div className={styles.bgRoot} aria-hidden="true">
      {/* Orbs */}
      {orbConfigs.map((orb, i) => (
        <div
          key={i}
          className={styles.orb + " " + orb.className}
          style={orb.style}
        />
      ))}
      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className={styles.particle}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      {/* Subtle grid */}
      <div className={styles.gridOverlay} />
      {/* Moving gradient overlay */}
      <div className={styles.gradientOverlay} />
      {/* Blue diamond shapes */}
      <div className={styles.diamond + ' ' + styles.diamond1} />
      <div className={styles.diamond + ' ' + styles.diamond2} />
      <div className={styles.diamond + ' ' + styles.diamond3} />
    </div>
  );
};

export default RulesBackground; 