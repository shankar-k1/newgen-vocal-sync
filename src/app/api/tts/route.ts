import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang, engine, voiceId } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    console.log(`[TTS] Engine: ${engine}, Lang: ${targetLang}, Text: "${text.substring(0, 80)}..."`);

    if (engine === "elevenlabs") {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "ElevenLabs API key not configured." }, { status: 401 });
      }

      // Use multilingual v2 model which supports 29+ languages
      const selectedVoice = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default to Rachel if not provided
      
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
        {
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { 
            stability: 0.5, 
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
          },
          responseType: "arraybuffer",
          timeout: 30000,
        }
      );

      const base64Audio = Buffer.from(response.data).toString("base64");
      console.log(`[TTS] ElevenLabs: Generated ${response.data.byteLength} bytes of audio`);
      
      return NextResponse.json({ 
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        message: "Generated via ElevenLabs Multilingual V2" 
      });

    } else if (engine === "murf") {
      const apiKey = process.env.MURF_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Murf API key not configured." }, { status: 401 });
      }

      // Murf API
      const response = await axios.post("https://api.murf.ai/v1/speech/generate", {
        voiceId: voiceId || "en-US-natalie",
        text: text,
        format: "MP3",
        sampleRate: 48000,
      }, {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        },
        timeout: 30000,
      });

      return NextResponse.json({ 
        audioUrl: response.data.audioFile,
        message: "Generated via Murf AI" 
      });

    } else {
      return NextResponse.json({ error: `Unsupported TTS engine: ${engine}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[TTS] Error:", error.response?.status, error.response?.data ? 
      Buffer.isBuffer(error.response.data) ? error.response.data.toString().substring(0, 200) : JSON.stringify(error.response.data).substring(0, 200)
      : error.message);
    return NextResponse.json({ 
      error: error.response?.data?.detail?.message || error.message || "TTS generation failed" 
    }, { status: 500 });
  }
}
