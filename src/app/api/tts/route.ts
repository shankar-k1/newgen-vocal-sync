import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSetting } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang, engine, voiceId } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    console.log(`[TTS] Engine: ${engine}, Lang: ${targetLang}, Text: "${text.substring(0, 80)}..."`);

    if (engine === "elevenlabs") {
      const apiKey = getSetting("ELEVENLABS_API_KEY") || process.env.ELEVENLABS_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "ElevenLabs API key not configured." }, { status: 401 });
      }

      const selectedVoice = voiceId || "21m00Tcm4TlvDq8ikWAM";

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
      return NextResponse.json({
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        message: "Generated via ElevenLabs Multilingual V2"
      });

    } else if (engine === "murf") {
      const apiKey = getSetting("MURF_API_KEY") || process.env.MURF_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Murf AI API key not configured." }, { status: 401 });
      }

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

    } else if (engine === "openai") {
      const apiKey = getSetting("OPENAI_API_KEY") || process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 401 });
      }

      const response = await axios.post(
        "https://api.openai.com/v1/audio/speech",
        {
          model: "tts-1-hd",
          input: text,
          voice: voiceId || "alloy",
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );

      const base64Audio = Buffer.from(response.data).toString("base64");
      return NextResponse.json({
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        message: "Generated via OpenAI TTS HD"
      });

    } else if (engine === "huggingface") {
      const apiKey = getSetting("HUGGINGFACE_API_KEY") || process.env.HUGGINGFACE_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Hugging Face API key not configured." }, { status: 401 });
      }

      const mmsModelMap: Record<string, string> = {
        "en": "eng", "es": "spa", "fr": "fra", "de": "deu", "it": "ita",
        "pt": "por", "hi": "hin", "ja": "jpn", "zh": "cmn", "ru": "rus",
        "ko": "kor", "ta": "tam", "bn": "ben", "ml": "mal", "te": "tel"
      };

      const mmsSuffix = mmsModelMap[targetLang] || "eng";
      const modelId = `facebook/mms-tts-${mmsSuffix}`;

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Hugging Face API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");
      return NextResponse.json({
        audioUrl: `data:audio/wav;base64,${base64Audio}`,
        message: `Generated via Hugging Face MMS TTS (${mmsSuffix})`
      });

    } else if (engine === "gtts") {
      const lang = targetLang || "en";
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

      return NextResponse.json({
        audioUrl: url,
        message: "Generated via Free Google TTS (GTTS)"
      });

    } else {
      return NextResponse.json({ error: `Unsupported TTS engine: ${engine}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[TTS] Error:", error.response?.status, error.message);
    return NextResponse.json({
      error: error.response?.data?.detail?.message || error.message || "TTS generation failed"
    }, { status: 500 });
  }
}
