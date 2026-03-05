"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Github, Chrome } from "lucide-react";

export default function SignIn() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await signIn("credentials", {
            username,
            password,
            callbackUrl: "/",
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0f172a]" />
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden opacity-50">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-card p-8 md:p-10 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to VocalSync AI</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="admin"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-primary to-secondary rounded-xl font-bold text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                    >
                        Sign In
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#1a1f35] px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="flex items-center justify-center gap-2 py-3 glass-morphism rounded-xl hover:bg-white/10 transition-all text-sm font-medium"
                    >
                        <Chrome className="w-4 h-4 text-red-500" /> Google
                    </button>
                    <button
                        className="flex items-center justify-center gap-2 py-3 glass-morphism rounded-xl hover:bg-white/10 transition-all text-sm font-medium"
                    >
                        <Github className="w-4 h-4" /> GitHub
                    </button>
                </div>

                <p className="mt-8 text-center text-gray-500 text-sm">
                    Don't have an account? <span className="text-primary hover:underline cursor-pointer">Sign Up</span>
                </p>
            </motion.div>
        </div>
    );
}
