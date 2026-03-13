"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Upload, FileAudio, Download, Settings, Languages,
    Play, Pause, Trash2, Loader2, Music, Share2,
    ChevronDown, LogOut, User, Globe, Activity, Volume2, Copy, Check, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import Link from "next/link";

const LANGUAGES = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇧🇷" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "tr", name: "Turkish", flag: "🇹🇷" },
    { code: "nl", name: "Dutch", flag: "🇳🇱" },
    { code: "pl", name: "Polish", flag: "🇵🇱" },
    { code: "sv", name: "Swedish", flag: "🇸🇪" },
    { code: "ta", name: "Tamil", flag: "🇮🇳" },
    { code: "te", name: "Telugu", flag: "🇮🇳" },
    { code: "ml", name: "Malayalam", flag: "🇮🇳" },
    { code: "bn", name: "Bengali", flag: "🇮🇳" },
    { code: "th", name: "Thai", flag: "🇹🇭" },
    { code: "mn", name: "Mongolian", flag: "🇲🇳" },
    { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
    { code: "id", name: "Indonesian", flag: "🇮🇩" },
    { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
];

const VOICE_GENDER = {
    MALE: "male",
    FEMALE: "female"
};

const COUNTRY_VOICES = [
    {
        country: "Global / Universal", code: "gl", flag: "🌐", voices: [
            { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: VOICE_GENDER.FEMALE, engine: "elevenlabs" },
            { id: "ErXw9S1QoY4hY9iRko21", name: "Antoni", gender: VOICE_GENDER.MALE, engine: "elevenlabs" },
            { id: "nova", name: "Nova", gender: VOICE_GENDER.FEMALE, engine: "openai" },
            { id: "onyx", name: "Onyx", gender: VOICE_GENDER.MALE, engine: "openai" },
            { id: "default", name: "HF (English MS)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Universal", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "United States", code: "us", flag: "🇺🇸", langCode: "en", voices: [
            { id: "pNInz6ovSYqtW4qc44s8", name: "Lily", gender: VOICE_GENDER.FEMALE, engine: "elevenlabs" },
            { id: "TxGEqnS1S6S7M9DnuTX8", name: "Josh", gender: VOICE_GENDER.MALE, engine: "elevenlabs" },
            { id: "en-US-natalie", name: "Natalie", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "en-US-sam", name: "Sam", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "alloy", name: "Alloy", gender: VOICE_GENDER.FEMALE, engine: "openai" },
            { id: "echo", name: "Echo", gender: VOICE_GENDER.MALE, engine: "openai" },
            { id: "shimmer", name: "Shimmer", gender: VOICE_GENDER.FEMALE, engine: "openai" },
            { id: "fable", name: "Fable", gender: VOICE_GENDER.MALE, engine: "openai" },
            { id: "default", name: "HF English (US)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
        ]
    },
    {
        country: "United Kingdom", code: "gb", flag: "🇬🇧", langCode: "en", voices: [
            { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: VOICE_GENDER.FEMALE, engine: "elevenlabs" },
            { id: "bIH9z4p9vV8vScyCyc6G", name: "Jeremy", gender: VOICE_GENDER.MALE, engine: "elevenlabs" },
            { id: "en-GB-abigail", name: "Abigail", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "en-GB-harry", name: "Harry", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "Google UK", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "India", code: "in", flag: "🇮🇳", langCode: "hi", voices: [
            { id: "hi-IN-aditi", name: "Aditi", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "hi-IN-amit", name: "Amit", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "ta-IN-valluvar", name: "Valluvar (Tamil)", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "te-IN-venkat", name: "Venkat (Telugu)", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "HF (Hindi)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "HF (Tamil)", gender: VOICE_GENDER.MALE, engine: "huggingface" },
            { id: "default", name: "HF (Telugu)", gender: VOICE_GENDER.MALE, engine: "huggingface" },
            { id: "default", name: "Google Hindi", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
            { id: "default", name: "Google Tamil", gender: VOICE_GENDER.MALE, engine: "gtts" },
        ]
    },
    {
        country: "Spain", code: "es", flag: "🇪🇸", langCode: "es", voices: [
            { id: "es-ES-elena", name: "Elena", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "es-ES-sergio", name: "Sergio", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "HF (Spanish)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Spanish", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "France", code: "fr", flag: "🇫🇷", langCode: "fr", voices: [
            { id: "fr-FR-celeste", name: "Celeste", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "fr-FR-clément", name: "Clément", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "HF (French)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google French", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "Germany", code: "de", flag: "🇩🇪", langCode: "de", voices: [
            { id: "de-DE-heidi", name: "Heidi", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "de-DE-lukas", name: "Lukas", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "HF (German)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google German", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "Italy", code: "it", flag: "🇮🇹", langCode: "it", voices: [
            { id: "it-IT-giulia", name: "Giulia", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "it-IT-alessio", name: "Alessio", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "HF (Italian)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Italian", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "Japan", code: "jp", flag: "🇯🇵", langCode: "ja", voices: [
            { id: "ja-JP-nanami", name: "Nanami", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "ja-JP-keita", name: "Keita", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "HF (Japanese)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Japanese", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "China", code: "cn", flag: "🇨🇳", langCode: "zh", voices: [
            { id: "zh-CN-xiaoxiao", name: "Xiaoxiao", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "zh-CN-yunye", name: "Yunye", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "HF (Chinese)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Chinese", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "Brazil", code: "br", flag: "🇧🇷", langCode: "pt", voices: [
            { id: "pt-BR-francisca", name: "Francisca", gender: VOICE_GENDER.FEMALE, engine: "murf" },
            { id: "pt-BR-antonio", name: "Antonio", gender: VOICE_GENDER.MALE, engine: "murf" },
            { id: "default", name: "HF (Portuguese)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Portuguese", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "Russia", code: "ru", flag: "🇷🇺", langCode: "ru", voices: [
            { id: "default", name: "HF (Russian)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Russian", gender: VOICE_GENDER.MALE, engine: "gtts" },
        ]
    },
    {
        country: "Korea", code: "kr", flag: "🇰🇷", langCode: "ko", voices: [
            { id: "default", name: "HF (Korean)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Korean", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "Turkey", code: "tr", flag: "🇹🇷", langCode: "tr", voices: [
            { id: "default", name: "HF (Turkish)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Turkish", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "Netherlands", code: "nl", flag: "🇳🇱", langCode: "nl", voices: [
            { id: "default", name: "HF (Dutch)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Dutch", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
    {
        country: "Sweden", code: "se", flag: "🇸🇪", langCode: "sv", voices: [
            { id: "default", name: "HF (Swedish)", gender: VOICE_GENDER.FEMALE, engine: "huggingface" },
            { id: "default", name: "Google Swedish", gender: VOICE_GENDER.FEMALE, engine: "gtts" },
        ]
    },
];

export default function AudioApp() {
    const { data: session, status } = useSession();
    const [files, setFiles] = useState<File[]>([]);
    const [processedResults, setProcessedResults] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingIndex, setProcessingIndex] = useState(-1);
    const [processingStep, setProcessingStep] = useState("");
    const [sttEngine, setSttEngine] = useState("deepgram");
    const [ttsEngine, setTtsEngine] = useState("elevenlabs");
    const [selectedCountry, setSelectedCountry] = useState(COUNTRY_VOICES[0].code);
    const [gender, setGender] = useState(VOICE_GENDER.FEMALE);
    const [ttsVoice, setTtsVoice] = useState(COUNTRY_VOICES[0].voices[0].id);
    const [targetLang, setTargetLang] = useState("es");
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [conversionProgress, setConversionProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [syncLanguage, setSyncLanguage] = useState(true);

    // Audio Conversion Parameters
    const [outputFormat, setOutputFormat] = useState("mp3");
    const [wavCodec, setWavCodec] = useState("pcm_s16le");
    const [audioChannels, setAudioChannels] = useState("2");
    const [sampleRate, setSampleRate] = useState("44100");
    const [isConvertingOutput, setIsConvertingOutput] = useState(false);
    const [bitrate, setBitrate] = useState("128k");

    const ffmpegRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        loadFFmpeg();
    }, []);

    const loadFFmpeg = async () => {
        try {
            if (!ffmpegRef.current) {
                const { FFmpeg } = await import("@ffmpeg/ffmpeg");
                ffmpegRef.current = new FFmpeg();
            }
            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
            const ffmpeg = ffmpegRef.current;

            ffmpeg.on("progress", ({ progress }: { progress: number }) => {
                setConversionProgress(Math.round(progress * 100));
            });

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            });
            setFfmpegLoaded(true);
        } catch (e) {
            console.warn("FFmpeg load failed (will work on retry):", e);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            // Frontend validation for file size (Admin controlled)
            const MAX_SIZE_MB = 25; // Default limit
            const oversized = selectedFiles.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024);

            if (oversized.length > 0) {
                setErrorMsg(`Some files exceed the ${MAX_SIZE_MB}MB limit: ${oversized.map(f => f.name).join(", ")}`);
                const validFiles = selectedFiles.filter(f => f.size <= MAX_SIZE_MB * 1024 * 1024);
                if (validFiles.length > 0) {
                    setFiles(prev => [...prev, ...validFiles]);
                }
            } else {
                setErrorMsg(""); // Clear error if all files are valid
                setFiles(prev => [...prev, ...selectedFiles]);
            }
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearFiles = () => {
        setFiles([]);
        setProcessedResults([]);
    };

    const convertGeneratedAudio = async (result: any) => {
        if (!result.outputUrl || !ffmpegLoaded) return;

        setIsConvertingOutput(true);
        const ffmpeg = ffmpegRef.current;

        const response = await fetch(result.outputUrl);
        const audioBlob = await response.blob();

        const inputName = `input_${result.id}.mp3`;
        const outputName = `output_${result.id}.${outputFormat}`;

        await ffmpeg.writeFile(inputName, new Uint8Array(await audioBlob.arrayBuffer()));

        let ffmpegArgs = ["-i", inputName];

        // Always apply sample rate and channels
        ffmpegArgs.push("-ar", sampleRate);
        ffmpegArgs.push("-ac", audioChannels);

        if (outputFormat === "wav") {
            ffmpegArgs.push("-acodec", wavCodec);
        } else if (outputFormat === "mp3" || outputFormat === "ogg") {
            ffmpegArgs.push("-b:a", bitrate);
        } else if (outputFormat === "flac") {
            ffmpegArgs.push("-acodec", "flac");
        }

        ffmpegArgs.push(outputName);
        await ffmpeg.exec(ffmpegArgs);

        const data = await ffmpeg.readFile(outputName);
        const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: `audio/${outputFormat}` }));

        setIsConvertingOutput(false);

        const a = document.createElement("a");
        a.href = url;
        const langName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
        a.download = `translated-${langName}-${result.fileName.replace(/\.[^/.]+$/, "")}.${outputFormat}`;
        a.click();
    };

    const processAudio = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setErrorMsg("");
        setProcessedResults([]);

        for (let i = 0; i < files.length; i++) {
            const currentFile = files[i];
            setProcessingIndex(i);

            try {
                // Step 1: Speech-to-Text
                setProcessingStep(`🎙️ Transcribing ${currentFile.name}...`);
                const formData = new FormData();
                formData.append("file", currentFile);
                formData.append("engine", sttEngine);

                const sttResponse = await axios.post("/api/stt", formData);

                if (sttResponse.data.error) throw new Error(sttResponse.data.error);

                const sourceText = sttResponse.data.text;
                const sourceLang = sttResponse.data.language || "en";

                // Step 2: Translate
                setProcessingStep(`🌐 Translating ${currentFile.name}...`);
                const translateResponse = await axios.post("/api/translate", {
                    text: sourceText,
                    sourceLang: sourceLang,
                    targetLang: targetLang,
                });

                if (translateResponse.data.error) throw new Error(translateResponse.data.error);

                const translated = translateResponse.data.translatedText;

                // Step 3: Text-to-Speech
                setProcessingStep(`🔊 Generating voice for ${currentFile.name}...`);
                const ttsResponse = await axios.post("/api/tts", {
                    text: translated,
                    targetLang: targetLang,
                    engine: ttsEngine,
                    voiceId: ttsVoice,
                });

                if (ttsResponse.data.error) throw new Error(ttsResponse.data.error);

                setProcessedResults(prev => [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    fileName: currentFile.name,
                    originalText: sourceText,
                    translatedText: translated,
                    detectedLang: sourceLang,
                    outputUrl: ttsResponse.data.audioUrl,
                    isPlaying: false
                }]);

            } catch (error: any) {
                console.error(`Error processing ${currentFile.name}:`, error);
                const errMsg = error.response?.data?.error || error.message || "Unknown error";
                setErrorMsg(`Failed to process ${currentFile.name}: ${errMsg}`);
                // Continue to next file if one fails? Or stop? Let's stop for now to let user fix issues.
                // break; 
            }
        }

        setIsProcessing(false);
        setProcessingIndex(-1);
        setProcessingStep("");
    };

    const toggleResultPlayback = (id: string) => {
        setProcessedResults(prev => prev.map(res => {
            if (res.id === id) {
                return { ...res, isPlaying: !res.isPlaying };
            }
            return { ...res, isPlaying: false }; // Stop others? Or let them play? Let's stop others for simplicity in UI
        }));
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getLangName = (code: string) => {
        return LANGUAGES.find(l => l.code === code)?.name || code;
    };

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-4xl font-bold mb-4 gradient-text">VocalSync AI</h1>
                <p className="text-gray-400 mb-8">Please sign in to access the platform.</p>
                <button
                    onClick={() => window.location.href = "/auth/signin"}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-xl font-bold hover:scale-105 transition-all"
                >
                    Go to Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-start pb-24">
            {/* Background */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-[#0f172a]">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            {/* Navigation Bar */}
            <nav className="w-full max-w-6xl flex justify-between items-center mb-8 glass-morphism px-6 py-4 rounded-3xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Music className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white hidden sm:block">VocalSync AI</span>
                </div>
                <div className="flex items-center gap-4">
                    {(session?.user as any)?.role === "ADMIN" && (
                        <Link href="/admin">
                            <button className="h-10 px-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-full flex items-center gap-2 transition-all group">
                                <Shield className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                <span className="text-sm font-bold">Admin Hub</span>
                            </button>
                        </Link>
                    )}
                    <div className="h-10 px-4 glass-morphism rounded-full flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-white">{session?.user?.name || "User"}</span>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-2 hover:bg-red-500/10 rounded-full text-gray-400 hover:text-red-400 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </nav>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-6xl flex flex-col gap-12"
            >
                {/* Upload & Config Panel */}
                <div className="glass-card p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Upload Area */}
                        <div className="lg:col-span-5 flex flex-col">
                            <div
                                className={cn(
                                    "relative flex-1 min-h-[280px] border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center p-8 transition-all group overflow-hidden cursor-pointer",
                                    files.length > 0 ? "bg-primary/5 border-primary/30" : "hover:border-primary/50 hover:bg-white/5 bg-black/20"
                                )}
                                onClick={() => !isProcessing && fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="audio/*"
                                    onChange={handleFileUpload}
                                />

                                <AnimatePresence mode="popLayout">
                                    {files.length > 0 ? (
                                        <div className="w-full space-y-4 px-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                                                        <Music className="w-4 h-4 text-primary" />
                                                        Selected Files
                                                    </h3>
                                                    <span className="bg-white/10 text-gray-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        {files.length}
                                                    </span>
                                                    {files.length > 1 && (
                                                        <motion.span
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1"
                                                        >
                                                            <Activity className="w-2.5 h-2.5" />
                                                            Bulk Mode
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); clearFiles(); }}
                                                    className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 font-bold uppercase tracking-widest"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Clear
                                                </button>
                                            </div>
                                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                                {files.map((f, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group/item"
                                                    >
                                                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                                                            <FileAudio className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-white font-medium truncate">{f.name}</p>
                                                            <p className="text-xs text-gray-500 uppercase">{(f.size / (1024 * 1024)).toFixed(2)} MB • {f.type.split("/")[1]?.toUpperCase()}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                                            className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div key="empty" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                                                <Upload className="w-10 h-10 text-gray-500 group-hover:text-primary transition-colors" />
                                            </div>
                                            <p className="text-xl text-white font-bold mb-1">Drop your audio files</p>
                                            <p className="text-gray-500 text-sm">WAV, MP3, M4A — Multiple allowed</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isProcessing && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                                        <p className="text-white font-bold">{processingStep}</p>
                                        <p className="text-xs text-gray-400 mt-2 italic">Processing {processingIndex + 1} of {files.length}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5 text-primary" /> STT Engine
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={sttEngine}
                                            onChange={(e) => setSttEngine(e.target.value)}
                                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all"
                                        >
                                            <option value="deepgram">Deepgram Nova-2</option>
                                            <option value="whisper">OpenAI Whisper</option>
                                            <option value="assemblyai">AssemblyAI (Highly Accurate)</option>
                                            <option value="groq">Groq (Blazing Fast - FREE)</option>
                                            <option value="huggingface">Hugging Face (Open Source)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5 text-secondary" /> Target Language
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Smart Sync</span>
                                            <button
                                                onClick={() => setSyncLanguage(!syncLanguage)}
                                                className={cn(
                                                    "w-8 h-4 rounded-full relative transition-all",
                                                    syncLanguage ? "bg-primary" : "bg-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                                    syncLanguage ? "right-0.5" : "left-0.5"
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={targetLang}
                                            onChange={(e) => setTargetLang(e.target.value)}
                                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all font-medium"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.flag} {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Volume2 className="w-3.5 h-3.5 text-accent" /> TTS Engine
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={ttsEngine}
                                            onChange={(e) => {
                                                const engine = e.target.value;
                                                setTtsEngine(engine);
                                                // Reset country to first available for this engine
                                                const firstCountry = COUNTRY_VOICES.find(c => c.voices.some(v => v.engine === engine));
                                                if (firstCountry) {
                                                    setSelectedCountry(firstCountry.code);
                                                    const firstVoice = firstCountry.voices.find(v => v.engine === engine);
                                                    if (firstVoice) setTtsVoice(firstVoice.id);
                                                }
                                            }}
                                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all font-medium"
                                        >
                                            <option value="elevenlabs">ElevenLabs Premium</option>
                                            <option value="murf">Murf AI Studio</option>
                                            <option value="openai">OpenAI TTS HD</option>
                                            <option value="huggingface">Hugging Face (Open Source)</option>
                                            <option value="gtts">Free Google TTS (GTTS)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-secondary" /> Voice Country
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedCountry}
                                            onChange={(e) => {
                                                const countryCode = e.target.value;
                                                setSelectedCountry(countryCode);
                                                const country = (COUNTRY_VOICES as any).find((c: any) => c.code === countryCode);
                                                if (country) {
                                                    const firstVoice = country.voices.find((v: any) => v.engine === ttsEngine);
                                                    if (firstVoice) setTtsVoice(firstVoice.id);

                                                    // Smart Sync: set target language to country's langCode if enabled
                                                    if (syncLanguage && country.langCode) {
                                                        setTargetLang(country.langCode);
                                                    }
                                                }
                                            }}
                                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all font-medium"
                                        >
                                            {COUNTRY_VOICES.filter(c => c.voices.some(v => v.engine === ttsEngine)).map(c => (
                                                <option key={c.code} value={c.code}>{c.flag} {c.country}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5 text-primary" /> Voice Gender
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                                        <button
                                            onClick={() => setGender(VOICE_GENDER.MALE)}
                                            className={cn(
                                                "py-2 rounded-lg text-xs font-bold transition-all",
                                                gender === VOICE_GENDER.MALE ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                                            )}
                                        >
                                            Male
                                        </button>
                                        <button
                                            onClick={() => setGender(VOICE_GENDER.FEMALE)}
                                            className={cn(
                                                "py-2 rounded-lg text-xs font-bold transition-all",
                                                gender === VOICE_GENDER.FEMALE ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                                            )}
                                        >
                                            Female
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-accent" /> Available Voices
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={ttsVoice}
                                            onChange={(e) => setTtsVoice(e.target.value)}
                                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all"
                                        >
                                            {COUNTRY_VOICES.find(c => c.code === selectedCountry)
                                                ?.voices.filter(v => v.gender === gender && v.engine === ttsEngine)
                                                .map(voice => (
                                                    <option key={voice.id} value={voice.id}>
                                                        {voice.name}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={processAudio}
                                    disabled={files.length === 0 || isProcessing}
                                    className={cn(
                                        "flex-1 h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl",
                                        files.length > 0 && !isProcessing
                                            ? "bg-gradient-to-r from-primary to-secondary text-white hover:scale-[1.02] active:scale-[0.98] shadow-primary/20"
                                            : "bg-white/5 text-gray-500 cursor-not-allowed"
                                    )}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> {processingStep}</>
                                    ) : (
                                        <><Languages className="w-5 h-5" /> Transcribe, Translate & Generate</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {
                    errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 flex items-start gap-3"
                        >
                            <span className="text-red-400 text-lg">⚠️</span>
                            <div>
                                <p className="text-red-300 font-semibold text-sm">Error</p>
                                <p className="text-red-400/80 text-sm">{errorMsg}</p>
                            </div>
                            <button onClick={() => setErrorMsg("")} className="ml-auto text-red-500 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )
                }

                {/* Results List */}
                {
                    processedResults.length > 0 && (
                        <div className="space-y-8">
                            {processedResults.map((result) => (
                                <motion.div
                                    key={result.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card p-6 md:p-10 flex flex-col gap-8"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                            <Music className="w-5 h-5 text-primary" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white truncate">{result.fileName}</h2>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-white flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                                    Original ({getLangName(result.detectedLang || "en")})
                                                </h3>
                                                <button
                                                    onClick={() => copyText(result.originalText)}
                                                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                                                >
                                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="bg-black/30 rounded-3xl p-8 border border-white/10 min-h-[150px] shadow-inner">
                                                <p className="text-gray-200 leading-loose text-base">{result.originalText}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-white flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                                                    {getLangName(targetLang)} Translation
                                                </h3>
                                                <button
                                                    onClick={() => copyText(result.translatedText)}
                                                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="bg-black/30 rounded-3xl p-8 border border-white/10 min-h-[150px] shadow-inner">
                                                <p className="text-gray-200 leading-loose text-base">{result.translatedText}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {result.outputUrl && (
                                        <div className="mt-8 pt-8 border-t border-white/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-white flex items-center gap-2">
                                                    <Volume2 className="w-5 h-5 text-primary" />
                                                    Generated Audio
                                                </h3>
                                            </div>

                                            <div className="bg-black/30 rounded-2xl p-6 border border-white/5 space-y-6">
                                                <audio
                                                    src={result.outputUrl}
                                                    controls
                                                    className="w-full h-10 custom-audio-player"
                                                />

                                                <div className="pt-6 border-t border-white/5 space-y-5">
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                                        {/* Format */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Format</label>
                                                            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-medium">
                                                                <option value="mp3">MP3</option>
                                                                <option value="wav">WAV</option>
                                                                <option value="ogg">OGG</option>
                                                                <option value="flac">FLAC</option>
                                                            </select>
                                                        </div>

                                                        {/* Codec (WAV only) */}
                                                        {outputFormat === "wav" && (
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Codec</label>
                                                                <select value={wavCodec} onChange={(e) => setWavCodec(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-medium">
                                                                    <option value="pcm_s16le">16-bit PCM</option>
                                                                    <option value="pcm_s24le">24-bit PCM</option>
                                                                    <option value="pcm_s32le">32-bit PCM</option>
                                                                    <option value="pcm_u8">8-bit PCM</option>
                                                                    <option value="pcm_alaw">A-Law</option>
                                                                    <option value="pcm_mulaw">μ-Law</option>
                                                                </select>
                                                            </div>
                                                        )}

                                                        {/* Sample Rate */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sample Rate</label>
                                                            <select value={sampleRate} onChange={(e) => setSampleRate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-medium">
                                                                <option value="8000">8,000 Hz</option>
                                                                <option value="16000">16,000 Hz</option>
                                                                <option value="22050">22,050 Hz</option>
                                                                <option value="44100">44,100 Hz</option>
                                                                <option value="48000">48,000 Hz</option>
                                                            </select>
                                                        </div>

                                                        {/* Channels */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Channels</label>
                                                            <select value={audioChannels} onChange={(e) => setAudioChannels(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-medium">
                                                                <option value="1">Mono</option>
                                                                <option value="2">Stereo</option>
                                                            </select>
                                                        </div>

                                                        {/* Bitrate (MP3/OGG) */}
                                                        {(outputFormat === "mp3" || outputFormat === "ogg") && (
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bitrate</label>
                                                                <select value={bitrate} onChange={(e) => setBitrate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-medium">
                                                                    <option value="64k">64 kbps</option>
                                                                    <option value="128k">128 kbps</option>
                                                                    <option value="192k">192 kbps</option>
                                                                    <option value="256k">256 kbps</option>
                                                                    <option value="320k">320 kbps</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => convertGeneratedAudio(result)}
                                                        disabled={isConvertingOutput || !ffmpegLoaded}
                                                        className="w-full h-11 bg-white text-black hover:bg-gray-200 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg text-sm disabled:opacity-50"
                                                    >
                                                        {isConvertingOutput ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                                        Download {outputFormat.toUpperCase()}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )
                }

                {/* Footer Status Dashboard */}
                <div className="flex flex-col gap-6 px-4">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {[
                                { name: "STT Engines", status: "Active", color: "bg-green-500", icon: <Activity className="w-3 h-3" /> },
                                { name: "Translation", status: "Online", color: "bg-blue-400", icon: <Globe className="w-3 h-3" /> },
                                { name: "TTS Service", status: "Premium", color: "bg-purple-500", icon: <Volume2 className="w-3 h-3" /> },
                                { name: "Storage", status: "Encrypted", color: "bg-emerald-400", icon: <Check className="w-3 h-3" /> }
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors group cursor-default">
                                    <div className={cn("w-2 h-2 rounded-full", s.color, "animate-pulse")} />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter group-hover:text-white transition-colors">{s.name}</span>
                                    <span className="text-[10px] text-gray-600 font-medium">{s.status}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help">
                                <span className="w-1 h-1 bg-primary rounded-full" />
                                Privacy Secured
                            </div>
                            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help">
                                <span className="w-1 h-1 bg-secondary rounded-full" />
                                No AI Training
                            </div>
                            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help">
                                <span className="w-1 h-1 bg-accent rounded-full" />
                                SSL Encrypted
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div >
        </div >
    );
}
