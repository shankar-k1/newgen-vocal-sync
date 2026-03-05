import { NextRequest, NextResponse } from "next/server";
import { DeepgramClient } from "@deepgram/sdk";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const engine = formData.get("engine") as string || "deepgram";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`[STT] Engine: ${engine}, File: ${file.name}, Size: ${file.size} bytes`);

    if (engine === "deepgram") {
      const apiKey = process.env.DEEPGRAM_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Deepgram API key not configured. Update .env file." }, { status: 401 });
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
      console.log("[STT] Deepgram response keys:", Object.keys(result));

      const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      const detectedLang = result?.results?.channels?.[0]?.detected_language || "en";

      if (!transcript) {
        console.error("[STT] No transcript found in response:", JSON.stringify(result).substring(0, 500));
        return NextResponse.json({ error: "No transcript could be generated from this audio." }, { status: 422 });
      }

      return NextResponse.json({ 
        text: transcript,
        language: detectedLang
      });

    } else if (engine === "whisper") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "OpenAI API key not configured. Select 'Deepgram' or update .env file." }, { status: 401 });
      }

      const whisperFormData = new FormData();
      whisperFormData.append("file", file);
      whisperFormData.append("model", "whisper-1");

      const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", whisperFormData, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        }
      });

      return NextResponse.json({ 
        text: response.data.text,
        language: "en" 
      });

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
