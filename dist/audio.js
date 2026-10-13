import { isAudioEnabled, setAudioEnabled } from './storage.js';
export function soundEnabled() {
    return isAudioEnabled();
}
export function setSound(enabled) {
    setAudioEnabled(enabled);
}
let audioCtx = null;
function getAudioContext() {
    if (typeof window === 'undefined')
        return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }
    return audioCtx;
}
export function playChime() {
    return new Promise((resolve) => {
        if (!isAudioEnabled()) {
            resolve();
            return;
        }
        try {
            const ctx = getAudioContext();
            if (!ctx) {
                resolve();
                return;
            }
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(659.25, now);
            gain1.gain.setValueAtTime(0.2, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.35);
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(830.61, now + 0.25);
            gain2.gain.setValueAtTime(0.25, now + 0.25);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.25);
            osc2.stop(now + 0.75);
            setTimeout(() => {
                resolve();
            }, 750);
        }
        catch (e) {
            console.warn('Audio chime error:', e);
            resolve();
        }
    });
}
function formatTicketForSpeech(ticketNumber) {
    const parts = ticketNumber.split('-');
    if (parts.length < 2)
        return ticketNumber;
    const letter = parts[0].toUpperCase();
    const digits = parts[1].split('').map((d) => {
        switch (d) {
            case '0': return 'kosong';
            case '1': return 'satu';
            case '2': return 'dua';
            case '3': return 'tiga';
            case '4': return 'empat';
            case '5': return 'lima';
            case '6': return 'enam';
            case '7': return 'tujuh';
            case '8': return 'delapan';
            case '9': return 'sembilan';
            default: return d;
        }
    }).join(' ');
    return `${letter}, ${digits}`;
}
export async function announceTicket(ticketNumber, loket) {
    if (!isAudioEnabled())
        return;
    await playChime();
    if (typeof window === 'undefined' || !window.speechSynthesis)
        return;
    try {
        window.speechSynthesis.cancel();
        const spokenTicket = formatTicketForSpeech(ticketNumber);
        const speechText = `Nomor antrian, ${spokenTicket}, silakan menuju loket ${loket}`;
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'id-ID';
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find((v) => v.lang.includes('id') || v.lang.includes('ID'));
        if (indonesianVoice) {
            utterance.voice = indonesianVoice;
        }
        window.speechSynthesis.speak(utterance);
    }
    catch (e) {
        console.warn('Speech synthesis error:', e);
    }
}
//# sourceMappingURL=audio.js.map