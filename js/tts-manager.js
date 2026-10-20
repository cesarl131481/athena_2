/**
 * TTS-MANAGER.JS — Síntesis de voz optimizada para iOS
 * Basado en el patrón probado: activar en el gesto del usuario,
 * sin await previo, para que iOS considere el contexto válido.
 */

class TTSManager {
  constructor() {
    this.synth        = window.speechSynthesis;
    this.utterance    = null;
    this.voice        = null;
    this.isReady      = false;
    this.isSpeaking   = false;
    this.isActivated  = false;

    this.config = { lang:'es-ES', rate:1.0, pitch:1.05, volume:1.0 };

    this.isIOS       = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isSupported = 'speechSynthesis' in window;

    console.log('[TTS] iOS:', this.isIOS, '| Soportado:', this.isSupported);
    this._initVoices();
  }

  _initVoices() {
    const load = () => {
      const voices = this.synth.getVoices();
      if (!voices.length) return;
      // Prioridad: español latinoamericano > español genérico > primera disponible
      this.voice =
        voices.find(v => v.lang === 'es-419') ||
        voices.find(v => v.lang === 'es-ES')  ||
        voices.find(v => v.lang.startsWith('es')) ||
        voices[0];
      this.isReady = true;
      console.log('[TTS] Voz:', this.voice?.name, this.voice?.lang);
    };
    load();
    if (this.synth.onvoiceschanged !== undefined) this.synth.onvoiceschanged = load;
    setTimeout(load, 500);
  }

  /**
   * CRÍTICO iOS: llamar sin await dentro del evento click del usuario.
   * Activa el contexto de audio con un utterance silencioso ultrarrápido.
   */
  async activate() {
    if (!this.isSupported) return false;
    if (this.isActivated)  return true;

    try {
      const silent = new SpeechSynthesisUtterance(' ');
      silent.volume = 0.01;
      silent.rate   = 10;
      await new Promise(resolve => {
        silent.onend   = resolve;
        silent.onerror = resolve;
        this.synth.speak(silent);
        setTimeout(resolve, 250); // timeout de seguridad
      });
      if (this.isIOS) { this.synth.cancel(); this.synth.resume(); }
      this.isActivated = true;
      console.log('[TTS] ✓ Activado');
      return true;
    } catch(e) {
      console.warn('[TTS] Error activando:', e);
      return false;
    }
  }

  speak(text, onEnd = null) {
    if (!this.isSupported || !this.isReady || !text) {
      if (onEnd) onEnd(); return;
    }
    if (this.isIOS && !this.isActivated) {
      this.activate().then(() => this.speak(text, onEnd)); return;
    }
    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.voice  = this.voice;
    this.utterance.lang   = this.config.lang;
    this.utterance.rate   = this.config.rate;
    this.utterance.pitch  = this.config.pitch;
    this.utterance.volume = this.config.volume;

    this.utterance.onstart = () => { this.isSpeaking = true; };
    this.utterance.onend   = () => { this.isSpeaking = false; if (onEnd) onEnd(); };
    this.utterance.onerror = (e) => {
      if (e.error === 'interrupted') { this.isSpeaking = false; if (onEnd) onEnd(); return; }
      console.warn('[TTS] Error:', e.error);
      this.isSpeaking = false;
      if (this.isIOS && e.error === 'not-allowed') this.isActivated = false;
      if (onEnd) onEnd();
    };

    if (this.isIOS) this.synth.resume();
    this.synth.speak(this.utterance);
    console.log('[TTS] Hablando:', text.substring(0, 40));
  }

  stop() {
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel(); this.isSpeaking = false;
    }
  }
}

window.ttsManager = new TTSManager();
console.log('[TTS] tts-manager.js cargado');
