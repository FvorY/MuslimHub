import { Capacitor, registerPlugin } from '@capacitor/core';
import { screenWakeLockService } from '@/shared/services/screen-wake-lock';

interface NativeTtsPlugin {
  speak(options: {
    text: string;
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    category?: string;
  }): Promise<void>;
  stop(): Promise<void>;
}

const NativeTts = registerPlugin<NativeTtsPlugin>('TextToSpeech');

let currentUtterance: SpeechSynthesisUtterance | null = null;
let playbackSession = 0;

const hasWindow = (): boolean => typeof window !== 'undefined';

const hasWebSpeech = (): boolean =>
  hasWindow() && typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';

export const isTtsSupported = (): boolean => {
  if (Capacitor.getPlatform() !== 'web') {
    return Capacitor.isPluginAvailable('TextToSpeech') || hasWebSpeech();
  }
  return hasWebSpeech();
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const splitTextIntoChunks = (text: string, maxLength = 260): string[] => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentenceLikeParts = normalized.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const part of sentenceLikeParts) {
    if (!part) continue;

    if (!current) {
      current = part;
      continue;
    }

    if (`${current} ${part}`.length <= maxLength) {
      current = `${current} ${part}`;
      continue;
    }

    chunks.push(current);
    current = part;
  }

  if (current) {
    chunks.push(current);
  }

  const safeChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxLength) {
      safeChunks.push(chunk);
      continue;
    }

    for (let i = 0; i < chunk.length; i += maxLength) {
      safeChunks.push(chunk.slice(i, i + maxLength));
    }
  }

  return safeChunks;
};

const resolveVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  if (!hasWebSpeech()) return [];

  const speechSynthesis = window.speechSynthesis;
  const existingVoices = speechSynthesis.getVoices();
  if (existingVoices.length) return existingVoices;

  return new Promise((resolve) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      resolve(speechSynthesis.getVoices());
    };

    speechSynthesis.onvoiceschanged = () => {
      done();
    };

    setTimeout(done, 400);
  });
};

const pickVoiceForLang = (voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null => {
  const target = lang.toLowerCase();
  const exact = voices.find((voice) => voice.lang.toLowerCase() === target);
  if (exact) return exact;

  const prefix = target.split('-')[0];
  const close = voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));
  return close ?? null;
};

const speakChunkWithWebSpeech = async (
  text: string,
  lang: string,
  session: number,
  voice: SpeechSynthesisVoice | null
): Promise<void> => {
  if (!hasWebSpeech()) {
    throw new Error('Speech synthesis is not supported on this device.');
  }

  const speechSynthesis = window.speechSynthesis;
  if (session !== playbackSession) return;

  await new Promise<void>((resolve, reject) => {
    if (session !== playbackSession) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voice) {
      utterance.voice = voice;
    }

    let settled = false;
    const settleResolve = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const settleReject = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    utterance.onend = () => {
      if (currentUtterance === utterance) {
        currentUtterance = null;
      }
      settleResolve();
    };

    utterance.onerror = (event) => {
      if (currentUtterance === utterance) {
        currentUtterance = null;
      }
      settleReject(new Error(`Speech synthesis error: ${event.error}`));
    };

    currentUtterance = utterance;
    speechSynthesis.speak(utterance);

    const timeoutMs = Math.max(5000, Math.min(22000, text.length * 95));
    setTimeout(() => {
      if (settled) return;
      if (currentUtterance === utterance) {
        currentUtterance = null;
      }
      settleReject(new Error('Speech synthesis timeout.'));
    }, timeoutMs);
  });
};

const speakWithWebSpeech = async (text: string, lang: string, session: number): Promise<void> => {
  if (!hasWebSpeech()) {
    throw new Error('Speech synthesis is not supported on this device.');
  }

  const speechSynthesis = window.speechSynthesis;
  const voices = await resolveVoices();
  const preferredVoice = pickVoiceForLang(voices, lang);
  const chunks = splitTextIntoChunks(text);
  if (!chunks.length) return;

  speechSynthesis.cancel();
  await wait(70);
  speechSynthesis.resume();

  for (let index = 0; index < chunks.length; index += 1) {
    if (session !== playbackSession) {
      return;
    }

    const chunk = chunks[index];
    try {
      await speakChunkWithWebSpeech(chunk, lang, session, preferredVoice);
    } catch (error) {
      // Retry once to improve reliability on some WebView engines.
      if (session !== playbackSession) return;
      await wait(90);
      await speakChunkWithWebSpeech(chunk, lang, session, preferredVoice);
    }
  }
};

const normalizeLangFallback = (lang: string): string[] => {
  const langs: string[] = [];
  if (lang) {
    langs.push(lang);
    const prefix = lang.split('-')[0];
    if (prefix && prefix !== lang) {
      langs.push(prefix);
    }
  }
  langs.push('en-US');
  return Array.from(new Set(langs));
};

const speakWithNativeTts = async (text: string, lang: string, session: number): Promise<void> => {
  const chunks = splitTextIntoChunks(text, 220);
  if (!chunks.length) return;

  try {
    await NativeTts.stop();
  } catch {
    // Ignore if no active session.
  }

  const langCandidates = normalizeLangFallback(lang);

  for (const chunk of chunks) {
    if (session !== playbackSession) return;

    let spoken = false;
    let lastError: unknown = null;

    for (const langCandidate of langCandidates) {
      if (session !== playbackSession) return;

      try {
        await NativeTts.speak({
          text: chunk,
          lang: langCandidate,
          rate: 1,
          pitch: 1,
          volume: 1
        });
        spoken = true;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!spoken) {
      throw lastError instanceof Error ? lastError : new Error('Native TTS failed to speak text chunk.');
    }

    await wait(60);
  }
};

export const speakText = async (text: string, lang = 'id-ID'): Promise<void> => {
  const cleanText = text.trim();
  if (!cleanText) return;
  const session = ++playbackSession;
  await screenWakeLockService.requestWakeLock();

  try {
    const shouldTryNative = Capacitor.getPlatform() !== 'web' && Capacitor.isPluginAvailable('TextToSpeech');

    if (shouldTryNative) {
      try {
        await speakWithNativeTts(cleanText, lang, session);
        if (session !== playbackSession) return;
        return;
      } catch (nativeError) {
        if (!hasWebSpeech()) throw nativeError;
      }
    }

    if (!hasWebSpeech()) {
      throw new Error('TextToSpeech plugin is unavailable and Web Speech API is not supported.');
    }

    await speakWithWebSpeech(cleanText, lang, session);
  } finally {
    if (session === playbackSession) {
      screenWakeLockService.releaseWakeLock();
    }
  }
};

export const stopTts = async (): Promise<void> => {
  playbackSession += 1;

  if (Capacitor.getPlatform() !== 'web' && Capacitor.isPluginAvailable('TextToSpeech')) {
    try {
      await NativeTts.stop();
    } catch {
      // Ignore if plugin is unavailable at runtime.
    }
  }

  if (hasWebSpeech()) {
    window.speechSynthesis.cancel();
  }

  currentUtterance = null;
  screenWakeLockService.releaseWakeLock();
};
