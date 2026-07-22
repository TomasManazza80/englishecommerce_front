import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StickmanCompanion = ({ mood, emoji }) => {
    // Moods: 'idle', 'happy', 'sad'

    const variants = {
        idle: {
            head: { cx: 50, cy: [30, 27, 30], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } },
            body: { x1: 50, y1: [45, 42, 45], x2: 50, y2: 90, transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } },
            leftArm: { x1: 50, y1: [55, 52, 55], x2: [30, 35, 30], y2: [80, 75, 80], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } },
            rightArm: { x1: 50, y1: [55, 52, 55], x2: [70, 75, 70], y2: [80, 85, 80], transition: { repeat: Infinity, duration: 1.6, ease: "easeInOut" } },
            leftLeg: { x1: 50, y1: 90, x2: 35, y2: 135 },
            rightLeg: { x1: 50, y1: 90, x2: 65, y2: 135 },
            container: { y: 0 }
        },
        dancing: {
            head: { cx: 50, cy: [15, 10, 15, 10, 15], transition: { repeat: Infinity, duration: 0.6, ease: "linear" } },
            body: { x1: 50, y1: [30, 25, 30, 25, 30], x2: [45, 55, 45, 55, 45], y2: [75, 70, 75, 70, 75], transition: { repeat: Infinity, duration: 0.6, ease: "linear" } },
            leftArm: { x1: 50, y1: [35, 30, 35, 30, 35], x2: [15, 25, 15, 25, 15], y2: [5, 25, 5, 25, 5], transition: { repeat: Infinity, duration: 0.6, ease: "linear" } }, 
            rightArm: { x1: 50, y1: [35, 30, 35, 30, 35], x2: [85, 75, 85, 75, 85], y2: [25, 5, 25, 5, 25], transition: { repeat: Infinity, duration: 0.6, ease: "linear" } },
            leftLeg: { x1: [45, 55, 45, 55, 45], y1: [75, 70, 75, 70, 75], x2: [20, 30, 20, 30, 20], y2: [110, 90, 110, 90, 110], transition: { repeat: Infinity, duration: 0.6, ease: "linear" } },
            rightLeg: { x1: [45, 55, 45, 55, 45], y1: [75, 70, 75, 70, 75], x2: [70, 80, 70, 80, 70], y2: [90, 110, 90, 110, 90], transition: { repeat: Infinity, duration: 0.6, ease: "linear" } },
            container: { y: [0, -15, 0], x: [-5, 5, -5], transition: { repeat: Infinity, duration: 0.3, ease: "easeOut" } } 
        },
        yawning: {
            head: { cx: 50, cy: [25, 15, 25], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
            body: { x1: 50, y1: [40, 30, 40], x2: 50, y2: 90, transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
            leftArm: { x1: 50, y1: [45, 35, 45], x2: 20, y2: [30, 10, 30], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
            rightArm: { x1: 50, y1: [45, 35, 45], x2: 80, y2: [30, 10, 30], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
            leftLeg: { x1: 50, y1: 90, x2: 35, y2: 135 },
            rightLeg: { x1: 50, y1: 90, x2: 65, y2: 135 },
            container: { y: 0 }
        },
        waving: {
            head: { cx: 50, cy: 30 },
            body: { x1: 50, y1: 45, x2: 50, y2: 90 },
            leftArm: { x1: 50, y1: 55, x2: 30, y2: 80 },
            rightArm: { x1: 50, y1: 55, x2: [85, 75, 85, 75, 85], y2: [20, 30, 20, 30, 20], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            leftLeg: { x1: 50, y1: 90, x2: 35, y2: 135 },
            rightLeg: { x1: 50, y1: 90, x2: 65, y2: 135 },
            container: { y: 0 }
        },
        thinking: {
            head: { cx: [50, 45, 50], cy: [35, 40, 35], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
            body: { x1: 50, y1: 50, x2: 50, y2: 90 },
            leftArm: { x1: 50, y1: 60, x2: 45, y2: [45, 50, 45], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }, // hand to chin
            rightArm: { x1: 50, y1: 60, x2: 60, y2: 90 }, // resting
            leftLeg: { x1: 50, y1: 90, x2: 40, y2: 135 },
            rightLeg: { x1: 50, y1: 90, x2: 50, y2: 135 }, // crossed leg
            container: { y: 0 }
        },
        excited: {
            head: { cx: 50, cy: 15, transition: { repeat: Infinity, duration: 0.2, ease: "easeInOut" } },
            body: { x1: 50, y1: 30, x2: 50, y2: 75, transition: { repeat: Infinity, duration: 0.2, ease: "easeInOut" } },
            leftArm: { x1: 50, y1: 40, x2: 25, y2: 15, transition: { repeat: Infinity, duration: 0.2, ease: "easeInOut" } },
            rightArm: { x1: 50, y1: 40, x2: 75, y2: 15, transition: { repeat: Infinity, duration: 0.2, ease: "easeInOut" } },
            leftLeg: { x1: 50, y1: 75, x2: 35, y2: 100 },
            rightLeg: { x1: 50, y1: 75, x2: 65, y2: 100 },
            container: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 0.2, ease: "easeOut" } } 
        },
        stretching: {
            head: { cx: 50, cy: [30, 20, 30], transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } },
            body: { x1: 50, y1: [45, 35, 45], x2: 50, y2: 90, transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } },
            leftArm: { x1: 50, y1: [55, 45, 55], x2: [10, 5, 10], y2: [55, 45, 55], transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } },
            rightArm: { x1: 50, y1: [55, 45, 55], x2: [90, 95, 90], y2: [55, 45, 55], transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } },
            leftLeg: { x1: 50, y1: 90, x2: 25, y2: 135, transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } },
            rightLeg: { x1: 50, y1: 90, x2: 75, y2: 135, transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } },
            container: { y: 0 }
        },
        slide_in_right: {
            head: { cx: [30, 40, 40, 50], cy: [45, 35, 35, 30], transition: { duration: 2, times: [0, 0.4, 0.7, 1] } },
            body: { x1: 50, y1: [60, 45, 45, 45], x2: 50, y2: 90 },
            leftArm: { 
                x1: 50, y1: [70, 55, 55, 55], 
                x2: [30, 20, 30, 20], 
                y2: [50, 30, 40, 20], 
                transition: { duration: 2, times: [0, 0.4, 0.7, 1] } 
            },
            rightArm: { x1: 50, y1: [70, 55, 55, 55], x2: 80, y2: 55 },
            leftLeg: { x1: 50, y1: 90, x2: 35, y2: 135 }, 
            rightLeg: { x1: 50, y1: 90, x2: 65, y2: 135 },
            container: { x: [150, 40, 40, 0], transition: { duration: 2, times: [0, 0.4, 0.7, 1], ease: "easeInOut" } }
        },
        moonwalking: {
            head: { cx: 50, cy: [30, 28, 30], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            body: { x1: 50, y1: 45, x2: 50, y2: 90 },
            leftArm: { x1: 50, y1: 55, x2: [35, 65, 35], y2: [75, 75, 75], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            rightArm: { x1: 50, y1: 55, x2: [65, 35, 65], y2: [75, 75, 75], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            leftLeg: { x1: 50, y1: 90, x2: [40, 70, 40], y2: [135, 135, 135], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } }, 
            rightLeg: { x1: 50, y1: 90, x2: [70, 55, 40, 70], y2: [135, 115, 135, 135], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            container: { x: [-250, 0], transition: { duration: 2.5, ease: "linear" } }
        },
        moonwalking_in_place: {
            head: { cx: 50, cy: [30, 28, 30], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            body: { x1: 50, y1: 45, x2: 50, y2: 90 },
            leftArm: { x1: 50, y1: 55, x2: [35, 65, 35], y2: [75, 75, 75], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            rightArm: { x1: 50, y1: 55, x2: [65, 35, 65], y2: [75, 75, 75], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            leftLeg: { x1: 50, y1: 90, x2: [40, 70, 40], y2: [135, 135, 135], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } }, 
            rightLeg: { x1: 50, y1: 90, x2: [70, 55, 40, 70], y2: [135, 115, 135, 135], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            container: { x: 0 }
        },
        pointing: {
            head: { cx: 50, cy: 35, transition: { duration: 0.4 } },
            body: { x1: 50, y1: 45, x2: 50, y2: 90 },
            leftArm: { x1: 50, y1: 55, x2: 35, y2: 20, transition: { type: "spring", duration: 0.5 } }, // Hand on hat/head
            rightArm: { x1: 50, y1: 55, x2: 85, y2: 55, transition: { type: "spring", duration: 0.5 } }, // Pointing directly right
            leftLeg: { x1: 50, y1: 90, x2: 60, y2: 135, transition: { duration: 0.4 } }, // Crossed rightward
            rightLeg: { x1: 50, y1: 90, x2: 40, y2: 135, transition: { duration: 0.4 } }, // Crossed leftward (tip toe)
            container: { x: 0, y: 0 }
        },
        sad: {
            head: { cx: 50, cy: 45 }, // head drooping down
            body: { x1: 50, y1: 60, x2: 50, y2: 100 }, // hunched body
            leftArm: { x1: 50, y1: 70, x2: 40, y2: 100 }, // arms dangling
            rightArm: { x1: 50, y1: 70, x2: 60, y2: 100 },
            leftLeg: { x1: 50, y1: 100, x2: 40, y2: 145 },
            rightLeg: { x1: 50, y1: 100, x2: 60, y2: 145 },
            container: { y: 0 }
        },
        walking: {
            head: { cx: 50, cy: [30, 27, 30, 27, 30], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            body: { x1: 50, y1: [45, 42, 45, 42, 45], x2: 50, y2: [90, 87, 90, 87, 90], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            leftArm: { x1: 50, y1: [55, 52, 55, 52, 55], x2: [70, 50, 30, 50, 70], y2: [80, 90, 80, 90, 80], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            rightArm: { x1: 50, y1: [55, 52, 55, 52, 55], x2: [30, 50, 70, 50, 30], y2: [80, 90, 80, 90, 80], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            leftLeg: { x1: 50, y1: [90, 87, 90, 87, 90], x2: [30, 50, 70, 50, 30], y2: [135, 125, 135, 140, 135], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            rightLeg: { x1: 50, y1: [90, 87, 90, 87, 90], x2: [70, 50, 30, 50, 70], y2: [135, 140, 135, 125, 135], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } },
            container: { y: 0 }
        }
    };

    const current = variants[mood] || variants.idle;
    const t = { type: "spring", stiffness: 120, damping: 12 };

    return (
        <motion.svg 
            width="60" 
            height="120" 
            viewBox="0 0 100 150" 
            animate={current.container}
            className="overflow-visible drop-shadow-lg"
        >
            {/* The Rope */}
            <AnimatePresence>
                {mood === 'sliding_rope' && (
                    <motion.line 
                        x1="50" y1="-2000" x2="50" y2="10" 
                        stroke="#1d1d1d" strokeWidth="2" strokeDasharray="5,5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>

            {/* Head */}
            <motion.circle r="14" fill="#1d1d1d" animate={current.head} />
            {/* Body */}
            <motion.line stroke="#1d1d1d" strokeWidth="7" strokeLinecap="round" animate={current.body} />
            {/* Left Arm */}
            <motion.line stroke="#1d1d1d" strokeWidth="7" strokeLinecap="round" animate={current.leftArm} />
            {/* Right Arm */}
            <motion.line stroke="#1d1d1d" strokeWidth="7" strokeLinecap="round" animate={current.rightArm} />
            {/* Left Leg */}
            <motion.line stroke="#1d1d1d" strokeWidth="7" strokeLinecap="round" animate={current.leftLeg} />
            {/* Right Leg */}
            <motion.line stroke="#1d1d1d" strokeWidth="7" strokeLinecap="round" animate={current.rightLeg} />
        </motion.svg>
    );
};

export default StickmanCompanion;
