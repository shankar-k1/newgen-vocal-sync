"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Upload, FileAudio, Download, Settings, Languages,
    Play, Pause, Trash2, Loader2, Music, Share2,
    ChevronDown, LogOut, User, Globe, Activity, Volume2, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";

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

const TTS_VOICES: Record<string, { id: string, name: string }[]> = {
    elevenlabs: [
        { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Female - Clear)" },
        { id: "pNInz6ovSYqtW4qc44s8", name: "Lily (Female - Soft)" },
        { id: "ErXw9S1QoY4hY9iRko21", name: "Antoni (Male - Deep)" },
        { id: "TxGEqnS1S6S7M9DnuTX8", name: "Josh (Male - Casual)" },
        { id: "VR6A4W7MjkS7M9DnuTX8", name: "Arnold (Male - Bold)" },
    ],
    murf: [
        { id: "en-US-natalie", name: "Natalie (Professional)" },
        { id: "en-US-clara", name: "Clara (Friendly)" },
        { id: "en-US-sam", name: "Sam (Narrator)" },
        { id: "en-US-mike", name: "Mike (Steady)" },
    ]
};

export default function AudioApp() {
    const { data: session, status } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState("");
    const [sttEngine, setSttEngine] = useState("deepgram");
    const [ttsEngine, setTtsEngine] = useState("elevenlabs");
    const [ttsVoice, setTtsVoice] = useState(TTS_VOICES.elevenlabs[0].id);
    const [targetLang, setTargetLang] = useState("es");
    const [originalText, setOriginalText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [detectedLang, setDetectedLang] = useState("");
    const [isConverted, setIsConverted] = useState(false);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [conversionProgress, setConversionProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Audio Conversion Parameters
    const [outputFormat, setOutputFormat] = useState("mp3");
    const [wavCodec, setWavCodec] = useState("pcm_s16le");
    const [audioChannels, setAudioChannels] = useState("2");
    const [sampleRate, setSampleRate] = useState("44100");
    const [isConvertingOutput, setIsConvertingOutput] = useState(false);

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
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            setIsConverted(false);
            setOriginalText("");
            setTranslatedText("");
            setOutputUrl(null);
            setErrorMsg("");
        }
    };

    const convertGeneratedAudio = async () => {
        if (!outputUrl || !ffmpegLoaded) return;

        setIsConvertingOutput(true);
        const ffmpeg = ffmpegRef.current;
        
        // Fetch the generated audioblob from its URL
        const response = await fetch(outputUrl);
        const audioBlob = await response.blob();
        
        const inputName = "generated_input.mp3"; // Assume ElevenLabs output is mp3 initially
        const outputName = `translated_output.${outputFormat}`;

        await ffmpeg.writeFile(inputName, new Uint8Array(await audioBlob.arrayBuffer()));
        
        let ffmpegArgs = ["-i", inputName];
        
        if (outputFormat === "wav") {
            ffmpegArgs.push("-acodec", wavCodec);
            ffmpegArgs.push("-ac", audioChannels);
            ffmpegArgs.push("-ar", sampleRate);
        }
        
        ffmpegArgs.push(outputName);
        
        await ffmpeg.exec(ffmpegArgs);

        const data = await ffmpeg.readFile(outputName);
        const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: `audio/${outputFormat}` }));

        setIsConvertingOutput(false);

        const a = document.createElement("a");
        a.href = url;
        const langName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
        a.download = `translated-${langName}-${file?.name || "audio"}.${outputFormat}`;
        a.click();
    };

    const processAudio = async () => {
        if (!file) return;
        setIsProcessing(true);
        setOriginalText("");
        setTranslatedText("");
        setOutputUrl(null);
        setErrorMsg("");

        try {
            // Step 1: Speech-to-Text
            setProcessingStep("🎙️ Transcribing audio...");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("engine", sttEngine);

            const sttResponse = await axios.post("/api/stt", formData);

            if (sttResponse.data.error) {
                setErrorMsg(sttResponse.data.error);
                setIsProcessing(false);
                return;
            }

            const sourceText = sttResponse.data.text;
            const sourceLang = sttResponse.data.language || "en";
            setOriginalText(sourceText);
            setDetectedLang(sourceLang);

            // Step 2: Translate
            setProcessingStep("🌐 Translating to target language...");
            const translateResponse = await axios.post("/api/translate", {
                text: sourceText,
                sourceLang: sourceLang,
                targetLang: targetLang,
            });

            if (translateResponse.data.error) {
                setErrorMsg(translateResponse.data.error);
                setIsProcessing(false);
                return;
            }

            const translated = translateResponse.data.translatedText;
            setTranslatedText(translated);

            // Step 3: Text-to-Speech in target language
            setProcessingStep("🔊 Generating voice in target language...");
            const ttsResponse = await axios.post("/api/tts", {
                text: translated,
                targetLang: targetLang,
                engine: ttsEngine,
                voiceId: ttsVoice,
            });

            if (ttsResponse.data.audioUrl) {
                setOutputUrl(ttsResponse.data.audioUrl);
            } else if (ttsResponse.data.error) {
                setErrorMsg(`TTS: ${ttsResponse.data.error}`);
            }

            setIsConverted(true);
        } catch (error: any) {
            console.error("Processing error:", error);
            const errMsg = error.response?.data?.error || error.message || "Unknown error";
            setErrorMsg(errMsg);
        } finally {
            setIsProcessing(false);
            setProcessingStep("");
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current || !outputUrl) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const downloadAudio = () => {
        if (!outputUrl) return;
        const a = document.createElement("a");
        a.href = outputUrl;
        const langName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
        a.download = `translated-${langName}-${file?.name || "audio"}.mp3`;
        a.click();
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
                                    file ? "bg-primary/5 border-primary/30" : "hover:border-primary/50 hover:bg-white/5 bg-black/20"
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

                                <AnimatePresence mode="wait">
                                    {file ? (
                                        <motion.div key="file" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                <FileAudio className="w-10 h-10 text-primary" />
                                            </div>
                                            <p className="text-lg text-white font-semibold mb-1 truncate max-w-[250px] mx-auto">{file.name}</p>
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                <span className="text-primary text-sm">{file.type.split("/")[1]?.toUpperCase() || "AUDIO"}</span>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="empty" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                                                <Upload className="w-10 h-10 text-gray-500 group-hover:text-primary transition-colors" />
                                            </div>
                                            <p className="text-xl text-white font-bold mb-1">Drop your audio here</p>
                                            <p className="text-gray-500 text-sm">WAV, MP3, M4A — any language</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isProcessing && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                                        <p className="text-white font-bold">{processingStep}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="lg:col-span-12 flex flex-col justify-between gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-secondary" /> Target Language
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={targetLang}
                                            onChange={(e) => setTargetLang(e.target.value)}
                                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all"
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
                                                setTtsVoice(TTS_VOICES[engine][0].id);
                                            }}
                                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all"
                                        >
                                            <option value="elevenlabs">ElevenLabs Premium</option>
                                            <option value="murf">Murf AI Studio</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-secondary" /> Voice Choice
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={ttsVoice}
                                            onChange={(e) => setTtsVoice(e.target.value)}
                                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all"
                                        >
                                            {TTS_VOICES[ttsEngine].map(voice => (
                                                <option key={voice.id} value={voice.id}>{voice.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={processAudio}
                                    disabled={!file || isProcessing}
                                    className={cn(
                                        "flex-1 h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl",
                                        file && !isProcessing
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
                {errorMsg && (
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
                )}

                {/* Results Panel */}
                {(originalText || translatedText) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 md:p-10 flex flex-col gap-8"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Original Transcription */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                        Original ({getLangName(detectedLang || "en")})
                                    </h3>
                                    <button
                                        onClick={() => copyText(originalText)}
                                        className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="bg-black/30 rounded-3xl p-8 border border-white/10 min-h-[220px] shadow-inner">
                                    <p className="text-gray-200 leading-loose text-base">{originalText}</p>
                                </div>
                            </div>

                            {/* Translated Text */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full" />
                                        {getLangName(targetLang)} Translation
                                    </h3>
                                    {translatedText && (
                                        <button
                                            onClick={() => copyText(translatedText)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="bg-black/30 rounded-3xl p-8 border border-white/10 min-h-[220px] shadow-inner">
                                    {translatedText ? (
                                        <p className="text-gray-200 leading-loose text-base">{translatedText}</p>
                                    ) : (
                                        <div className="flex items-center gap-3 text-gray-500 justify-center h-full min-h-[150px]">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span className="text-base font-medium">Translating...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Audio Player & Download */}
                        {outputUrl && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-12 pt-10 border-t border-white/10"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Volume2 className="w-5 h-5 text-primary" />
                                        Generated Audio ({getLangName(targetLang)})
                                    </h3>
                                    <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                                        via {ttsEngine === "elevenlabs" ? "ElevenLabs" : "Murf AI"}
                                    </span>
                                </div>

                                <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                                    <audio
                                        ref={audioRef}
                                        src={outputUrl}
                                        onEnded={() => setIsPlaying(false)}
                                        className="hidden"
                                    />
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={togglePlayback}
                                            className="w-12 h-12 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center transition-all shadow-lg"
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-5 h-5 text-white" />
                                            ) : (
                                                <Play className="w-5 h-5 text-white ml-0.5" />
                                            )}
                                        </button>

                                        <div className="flex-1">
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className={cn("h-full bg-primary rounded-full transition-all", isPlaying && "animate-pulse")} style={{ width: isPlaying ? "60%" : "0%" }} />
                                            </div>
                                            <p className="text-xs text-gray-300 mt-1 font-medium">
                                                {getLangName(targetLang)} audio • Click play to listen
                                            </p>
                                        </div>
                                     </div>
                                    
                                    {/* Advanced Download Options */}
                                    <div className="mt-10 pt-8 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-accent" /> Export Settings
                                        </h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                            {/* Format Selection */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Format</label>
                                                <div className="relative">
                                                    <select
                                                        value={outputFormat}
                                                        onChange={(e) => setOutputFormat(e.target.value)}
                                                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                    >
                                                        <option value="mp3">MP3</option>
                                                        <option value="wav">WAV</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* WAV specific arguments */}
                                            {outputFormat === "wav" && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Codec</label>
                                                        <div className="relative">
                                                            <select
                                                                value={wavCodec}
                                                                onChange={(e) => setWavCodec(e.target.value)}
                                                                className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                            >
                                                                <option value="pcm_s16le">Standard 16-bit (PCM)</option>
                                                                <option value="pcm_alaw">A-Law</option>
                                                                <option value="pcm_mulaw">Mu-Law</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Channels</label>
                                                        <div className="relative">
                                                            <select
                                                                value={audioChannels}
                                                                onChange={(e) => setAudioChannels(e.target.value)}
                                                                className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                            >
                                                                <option value="1">Mono (1)</option>
                                                                <option value="2">Stereo (2)</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sample Rate</label>
                                                        <div className="relative">
                                                            <select
                                                                value={sampleRate}
                                                                onChange={(e) => setSampleRate(e.target.value)}
                                                                className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                            >
                                                                <option value="16000">16,000 Hz</option>
                                                                <option value="8000">8,000 Hz</option>
                                                                <option value="1000">1,000 Hz</option>
                                                                <option value="44100">44,100 Hz</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={convertGeneratedAudio}
                                            disabled={isConvertingOutput || !ffmpegLoaded}
                                            className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl"
                                        >
                                            {isConvertingOutput ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                            ) : (
                                                <><Download className="w-5 h-5" /> Download as {outputFormat.toUpperCase()}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Footer Status */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4 text-gray-600 text-xs">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>Deepgram Ready</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>ElevenLabs Active</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>Translation API</span>
                        </div>
                    </div>
                    <span>Privacy Secured • No AI Training • Encrypted</span>
                </div>
            </motion.div>
        </div>
    );
}
