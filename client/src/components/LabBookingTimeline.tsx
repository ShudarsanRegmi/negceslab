import React, { useState } from "react";
import {
  FiLock,
  FiClock,
  FiCheckCircle,
  FiFileText,
  FiChevronRight,
  FiCheck,
} from "react-icons/fi";
import styles from './LabBookingTimeline.module.css';

type Step = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const steps: Step[] = [
  {
    title: "Authentication",
    description: "Sign in with your institutional credentials to access the lab booking system securely.",
    icon: <FiLock className="w-6 h-6" />,
  },
  {
    title: "Select Schedule",
    description: "Choose your preferred date and time slot for your laboratory session.",
    icon: <FiClock className="w-6 h-6" />,
  },
  {
    title: "Review Booking",
    description: "Double-check your booking details and ensure all information is correct.",
    icon: <FiCheckCircle className="w-6 h-6" />,
  },
  {
    title: "Confirmation",
    description: "Receive a confirmation and summary of your booking for your records.",
    icon: <FiFileText className="w-6 h-6" />,
  },
];

const getStepState = (activeStep: number, idx: number) => {
  if (activeStep > idx) return "completed";
  if (activeStep === idx) return "active";
  return "pending";
};

const stateStyles = {
  pending: {
    border: "border-gray-300",
    bg: "bg-gray-100",
    text: "text-gray-500",
    iconBg: "bg-gray-100",
    iconBorder: "border-gray-300",
    progress: "bg-gray-300",
    shadow: "shadow",
    chevron: "text-gray-400",
  },
  active: {
    border: "border-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
    iconBg: "bg-blue-100",
    iconBorder: "border-blue-200",
    progress: "bg-blue-600",
    shadow: "shadow-lg",
    chevron: "text-blue-600",
  },
  completed: {
    border: "border-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    iconBg: "bg-emerald-100",
    iconBorder: "border-emerald-200",
    progress: "bg-emerald-600",
    shadow: "shadow-lg",
    chevron: "text-emerald-600",
  },
};

const LabBookingTimeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const progressHeight = `${(activeStep / (steps.length - 1)) * 100}%`;

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineWrapper}>
        {/* Timeline Line */}
        <div className={styles.timelineLine} />
        {/* Progress Line */}
        <div
          className={styles.timelineProgress}
          style={{ height: progressHeight }}
        />
        <div className={styles.stepsColumn}>
          {steps.map((step, idx) => {
            const state = getStepState(activeStep, idx);
            const isActive = state === "active";
            const isCompleted = state === "completed";
            return (
              <div key={step.title} className={styles.stepRow}>
                {/* Step Circle */}
                <div className={styles.stepCircleWrapper}>
                  <div
                    className={
                      styles.stepCircle +
                      ' ' +
                      styles[state + 'Circle'] +
                      (isActive ? ' ' + styles.activeCircle : '') +
                      (isCompleted ? ' ' + styles.completedCircle : '')
                    }
                  >
                    {isCompleted ? (
                      <FiCheck className={styles.checkIcon} />
                    ) : (
                      <span className={isActive ? styles.activeStepNum : styles.stepNum}>
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  {/* Timeline line for mobile */}
                  {idx < steps.length - 1 && <div className={styles.mobileLine} />}
                </div>
                {/* Card */}
                <button
                  className={
                    styles.stepCard +
                    ' ' +
                    styles[state + 'Card'] +
                    (isActive ? ' ' + styles.activeCard : '') +
                    (isCompleted ? ' ' + styles.completedCard : '')
                  }
                  onClick={() => setActiveStep(idx)}
                  aria-current={isActive ? "step" : undefined}
                  tabIndex={0}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon + ' ' + styles[state + 'Icon']}>
                      {step.icon}
                    </span>
                    <span className={styles.cardTitle + ' ' + styles[state + 'Text']}>
                      {step.title}
                    </span>
                    <span
                      className={
                        styles.chevron +
                        (isActive ? ' ' + styles.activeChevron : '') +
                        ' ' + styles[state + 'Chevron']
                      }
                    >
                      <FiChevronRight />
                    </span>
                  </div>
                  <div className={styles.cardDesc + ' ' + styles[state + 'Text']}>
                    {step.description}
                  </div>
                  {/* Progress bar and status */}
                  <div className={styles.cardFooter}>
                    <div className={styles.progressBarBg}>
                      <div
                        className={
                          styles.progressBar +
                          (isCompleted
                            ? ' ' + styles.completedProgress
                            : isActive
                            ? ' ' + styles.activeProgress
                            : '')
                        }
                        style={{
                          width: isCompleted ? "100%" : isActive ? "70%" : "0%",
                        }}
                      />
                    </div>
                    <span
                      className={
                        styles.status +
                        (isCompleted
                          ? ' ' + styles.completedStatus
                          : isActive
                          ? ' ' + styles.activeStatus
                          : ' ' + styles.pendingStatus)
                      }
                    >
                      {isCompleted
                        ? "Completed"
                        : isActive
                        ? "In Progress"
                        : "Pending"}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LabBookingTimeline; 