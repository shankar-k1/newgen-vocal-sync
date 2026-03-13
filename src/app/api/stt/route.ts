import { NextRequest, NextResponse } from "next/server";
import { DeepgramClient } from "@deepgram/sdk";
import axios from "axios";
import { getSetting } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const engine = formData.get("engine") as string || "deepgram";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file size limit from database
    const limitMb = parseInt(getSetting("FILE_SIZE_LIMIT_MB") || "25");
    const limitBytes = limitMb * 1024 * 1024;

    if (file.size > limitBytes) {
      return NextResponse.json({
        error: `File size exceeds the limit of ${limitMb}MB set by administrator.`
      }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`[STT] Engine: ${engine}, File: ${file.name}, Size: ${file.size} bytes`);

    if (engine === "deepgram") {
      const apiKey = getSetting("DEEPGRAM_API_KEY") || process.env.DEEPGRAM_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Deepgram API key not configured. Update in Admin Panel or .env file." }, { status: 401 });
      }

      // Use Deepgram REST API directly for reliability
      const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true", {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": file.type || "audio/mpeg",
        },
        body: buffer,
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("[STT] Deepgram API Error:", response.status, errBody);
        return NextResponse.json({ error: `Deepgram error: ${response.status} - ${errBody}` }, { status: response.status });
      }

      const result = await response.json();

      const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      const detectedLang = result?.results?.channels?.[0]?.detected_language || "en";

      if (!transcript) {
        return NextResponse.json({ error: "No transcript could be generated from this audio." }, { status: 422 });
      }

      return NextResponse.json({ text: transcript, language: detectedLang });

    } else if (engine === "whisper") {
      const apiKey = getSetting("OPENAI_API_KEY") || process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 401 });
      }

      const whisperFormData = new FormData();
      whisperFormData.append("file", file);
      whisperFormData.append("model", "whisper-1");

      const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", whisperFormData, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });

      return NextResponse.json({ text: response.data.text, language: "en" });

    } else if (engine === "assemblyai") {
      const apiKey = getSetting("ASSEMBLYAI_API_KEY") || process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "AssemblyAI API key not configured." }, { status: 401 });
      }

      // Step 1: Upload file
      const uploadResponse = await axios.post("https://api.assemblyai.com/v2/upload", buffer, {
        headers: { "Authorization": apiKey, "Content-Type": "application/octet-stream" }
      });

      const audioUrl = uploadResponse.data.upload_url;

      // Step 2: Transcribe
      const transcribeResponse = await axios.post("https://api.assemblyai.com/v2/transcript", {
        audio_url: audioUrl,
        language_detection: true,
      }, {
        headers: { "Authorization": apiKey, "Content-Type": "application/json" }
      });

      const transcriptId = transcribeResponse.data.id;

      // Step 3: Wait for completion
      let status = "queued";
      let transcriptResult: any = null;

      while (status !== "completed" && status !== "error") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { "Authorization": apiKey }
        });
        status = statusResponse.data.status;
        transcriptResult = statusResponse.data;
      }

      if (status === "error") {
        return NextResponse.json({ error: "AssemblyAI transcription failed." }, { status: 500 });
      }

      return NextResponse.json({ text: transcriptResult.text, language: transcriptResult.language_code || "en" });

    } else if (engine === "groq") {
      const apiKey = getSetting("GROQ_API_KEY") || process.env.GROQ_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Groq API key not configured." }, { status: 401 });
      }

      const groqFormData = new FormData();
      groqFormData.append("file", file);
      groqFormData.append("model", "whisper-large-v3");
      groqFormData.append("response_format", "verbose_json"); // Request detailed output including language

      const response = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", groqFormData, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });

      return NextResponse.json({ text: response.data.text, language: response.data.language || "en" });

    } else if (engine === "huggingface") {
      const apiKey = getSetting("HUGGINGFACE_API_KEY") || process.env.HUGGINGFACE_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Hugging Face API key not configured." }, { status: 401 });
      }

      const response = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3", {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: "POST",
        body: buffer,
      });

      const result = await response.json();
      return NextResponse.json({ text: result.text, language: "en" });

    } else {
      return NextResponse.json({ error: `Unsupported STT engine: ${engine}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[STT] Unhandled Error:", error.response?.data || error.message || error);
    return NextResponse.json({
      error: error.response?.data?.error?.message || error.message || "Unknown error occurred"
    }, { status: 500 });
  }
}
