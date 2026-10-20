/**
 * AUDIO-MANAGER.JS
 * Reproduce archivos MP3 y expone datos de frecuencia
 * para el visualizador de onda estilo JARVIS.
 * Compatible iOS: el AudioContext se crea/resume dentro del gesto del usuario.
 */

class AudioManager {
  constructor() {
    this.context      = null;
    this.analyser     = null;
    this.source       = null;
    this.gainNode     = null;
    this.currentAudio = null;
    this.isPlaying    = false;
    this.isActivated  = false;
    this.freqData     = null;

    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log('[Audio] AudioManager creado. iOS:', this.isIOS);
  }

  /**
   * CRÍTICO iOS: llamar dentro del gesto del usuario (click).
   * Crea y resume el AudioContext en el contexto correcto.
   */
  activate() {
    if (this.isActivated) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.context  = new Ctx();
      this.analyser = this.context.createAnalyser();
      this.gainNode = this.context.createGain();

      this.analyser.fftSize          = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.context.destination);

      // iOS: resume inmediatamente
      if (this.context.state === 'suspended') this.context.resume();

      this.isActivated = true;
      console.log('[Audio] ✓ AudioContext activado. Estado:', this.context.state);
    } catch(e) {
      console.warn('[Audio] Error creando AudioContext:', e);
    }
  }

  /**
   * Carga y reproduce un archivo de audio.
   * @param {string} url   - ruta al archivo MP3
   * @param {Function} onEnd - callback al terminar
   */
  async play(url, onEnd = null) {
    if (!this.isActivated) {
      console.warn('[Audio] No activado. Llama activate() primero.');
      return;
    }

    // Detener audio previo
    this.stop();

    try {
      // Resume si iOS lo suspendió
      if (this.context.state === 'suspended') await this.context.resume();

      // Cargar archivo
      console.log('[Audio] Cargando:', url);
      const res    = await fetch(url);
      const buffer = await res.arrayBuffer();
      const decoded = await this.context.decodeAudioData(buffer);

      // Crear source
      this.source = this.context.createBufferSource();
      this.source.buffer = decoded;
      this.source.connect(this.gainNode);

      this.source.onended = () => {
        this.isPlaying = false;
        console.log('[Audio] Reproducción terminada');
        if (onEnd) onEnd();
      };

      this.source.start(0);
      this.isPlaying = true;
      console.log('[Audio] ▶ Reproduciendo:', url);

    } catch(e) {
      console.error('[Audio] Error reproduciendo:', e);
      this.isPlaying = false;
      if (onEnd) onEnd();
    }
  }

  stop() {
    if (this.source) {
      try { this.source.stop(); } catch(_) {}
      this.source = null;
    }
    this.isPlaying = false;
  }

  /**
   * Retorna nivel de volumen normalizado 0-1 para el visualizador.
   */
  getLevel() {
    if (!this.analyser || !this.isPlaying) return 0;
    this.analyser.getByteFrequencyData(this.freqData);
    const sum = this.freqData.reduce((a, b) => a + b, 0);
    return sum / (this.freqData.length * 255);
  }

  /**
   * Retorna array de frecuencias para visualizador de barras.
   */
  getFrequencies() {
    if (!this.analyser) return new Uint8Array(128).fill(0);
    this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  setVolume(v) {
    if (this.gainNode) this.gainNode.gain.value = Math.max(0, Math.min(1, v));
  }
}

window.audioManager = new AudioManager();
console.log('[Audio] audio-manager.js cargado');
