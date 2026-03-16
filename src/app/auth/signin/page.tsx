"use client";

import "./signin.css";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Github, Chrome, Sparkles, AudioWaveform } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
};

const floatingVariants = {
    animate: {
        y: [0, -12, 0],
        rotate: [0, 3, -3, 0],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut" as const,
        },
    },
};

export default function SignIn() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await signIn("credentials", {
            username,
            password,
            callbackUrl: "/",
        });
    };

    return (
        <div className="signin-page">
            {/* Animated background */}
            <div className="signin-bg">
                <motion.div
                    className="signin-orb signin-orb-1"
                    animate={{
                        x: [0, 40, -20, 0],
                        y: [0, -30, 20, 0],
                        scale: [1, 1.15, 0.95, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="signin-orb signin-orb-2"
                    animate={{
                        x: [0, -30, 25, 0],
                        y: [0, 25, -35, 0],
                        scale: [1, 0.9, 1.1, 1],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="signin-orb signin-orb-3"
                    animate={{
                        x: [0, 20, -15, 0],
                        y: [0, -20, 15, 0],
                        scale: [1, 1.05, 0.92, 1],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Grid pattern overlay */}
                <div className="signin-grid-overlay" />
            </div>

            <div className="signin-layout">
                {/* Left side — branding */}
                <motion.div
                    className="signin-branding"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <motion.div variants={floatingVariants} animate="animate" className="signin-brand-icon">
                        <AudioWaveform size={40} strokeWidth={1.5} />
                    </motion.div>
                    <h2 className="signin-brand-title">
                        Vocal<span>Sync</span> AI
                    </h2>
                    <p className="signin-brand-desc">
                        Transform your audio with the power of artificial intelligence.
                        Generate, convert, and enhance with studio-quality precision.
                    </p>

                    <div className="signin-features">
                        {[
                            { icon: "🎙️", label: "AI Voice Generation" },
                            { icon: "🌐", label: "Multi-language Support" },
                            { icon: "⚡", label: "Real-time Processing" },
                        ].map((feat, i) => (
                            <motion.div
                                key={feat.label}
                                className="signin-feature"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
                            >
                                <span className="signin-feature-icon">{feat.icon}</span>
                                <span>{feat.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right side — sign-in card */}
                <motion.div
                    className="signin-card"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="signin-card-header">
                        <div className="signin-sparkle-badge">
                            <Sparkles size={14} />
                            <span>Secure Login</span>
                        </div>
                        <h1 className="signin-title">Welcome Back</h1>
                        <p className="signin-subtitle">
                            Sign in to continue to your dashboard
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit}>
                        <motion.div variants={itemVariants} className="signin-field">
                            <label
                                className={`signin-label ${focusedField === "username" ? "signin-label--active" : ""}`}
                            >
                                <Mail size={15} />
                                <span>Username</span>
                            </label>
                            <div
                                className={`signin-input-wrap ${focusedField === "username" ? "signin-input-wrap--focus" : ""}`}
                            >
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onFocus={() => setFocusedField("username")}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Enter your username"
                                    className="signin-input"
                                    id="signin-username"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="signin-field">
                            <label
                                className={`signin-label ${focusedField === "password" ? "signin-label--active" : ""}`}
                            >
                                <Lock size={15} />
                                <span>Password</span>
                            </label>
                            <div
                                className={`signin-input-wrap ${focusedField === "password" ? "signin-input-wrap--focus" : ""}`}
                            >
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Enter your password"
                                    className="signin-input"
                                    id="signin-password"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="signin-forgot">
                            <span>Forgot password?</span>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            type="submit"
                            className="signin-submit"
                            whileHover={{ scale: 1.015, y: -1 }}
                            whileTap={{ scale: 0.985 }}
                            id="signin-submit-btn"
                        >
                            <span>Sign In</span>
                            <motion.span
                                className="signin-submit-arrow"
                                initial={{ x: 0 }}
                                whileHover={{ x: 4 }}
                            >
                                →
                            </motion.span>
                        </motion.button>
                    </form>

                    <motion.div variants={itemVariants} className="signin-divider">
                        <div className="signin-divider-line" />
                        <span className="signin-divider-text">or continue with</span>
                        <div className="signin-divider-line" />
                    </motion.div>

                    <motion.div variants={itemVariants} className="signin-social-row">
                        <motion.button
                            onClick={() => signIn("google", { callbackUrl: "/" })}
                            className="signin-social-btn"
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            id="signin-google-btn"
                        >
                            <Chrome size={18} className="signin-social-icon signin-social-icon--google" />
                            <span>Google</span>
                        </motion.button>
                        <motion.button
                            className="signin-social-btn"
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            id="signin-github-btn"
                        >
                            <Github size={18} className="signin-social-icon" />
                            <span>GitHub</span>
                        </motion.button>
                    </motion.div>

                    <motion.p variants={itemVariants} className="signin-footer-text">
                        Don&apos;t have an account?{" "}
                        <span className="signin-link">Sign Up</span>
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
