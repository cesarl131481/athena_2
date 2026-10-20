/**
 * AR-CONTROLLER.JS
 * Orquesta los eventos de MindAR targets con audioManager y jarvisUI.
 * Sigue el patrón del integrator.js original: escuchar found/lost
 * y ejecutar la lógica correspondiente según el tipo de target.
 */

class ARController {
  constructor() {
    this.activeTarget  = null;
    this.isProcessing  = false;
    this.grupo         = 1;
    this._initialized  = false;
  }

  setGrupo(g) {
    this.grupo = parseInt(g) || 1;
    if (window.jarvisUI) jarvisUI.setGrupo(this.grupo);
    console.log('[ARCtrl] Grupo establecido:', this.grupo);
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    const scene = document.querySelector('a-scene');
    if (!scene) { console.error('[ARCtrl] No se encontró a-scene'); return; }

    // Registrar listeners para cada target configurado
    AR_CONFIG.targets.forEach(cfg => {
      const targetEl = document.getElementById(`target-${cfg.index}`);
      if (!targetEl) {
        console.warn(`[ARCtrl] Elemento target-${cfg.index} no encontrado en HTML`);
        return;
      }

      targetEl.addEventListener('targetFound', () => {
        console.log(`[ARCtrl] ✓ TARGET ${cfg.index} ENCONTRADO: ${cfg.nombre}`);
        this._onTargetFound(cfg);
      });

      targetEl.addEventListener('targetLost', () => {
        console.log(`[ARCtrl] ✗ TARGET ${cfg.index} PERDIDO`);
        this._onTargetLost(cfg);
      });

      console.log(`[ARCtrl] Listener registrado para target-${cfg.index}`);
    });

    console.log('[ARCtrl] ✓ Inicializado con', AR_CONFIG.targets.length, 'targets');
  }

  async _onTargetFound(cfg) {
    // Si hay otro target activo, limpiarlo primero
    if (this.activeTarget !== null) {
      this._stopCurrent();
      await new Promise(r => setTimeout(r, 200));
    }

    this.activeTarget = cfg.index;
    this.isProcessing = true;

    // Hablar el mensaje (TTS) — compatible iOS
    if (window.ttsManager && cfg.mensaje) {
      ttsManager.speak(cfg.mensaje);
    }

    if (cfg.tipo === 'audio') {
      await this._handleAudio(cfg);
    } else if (cfg.tipo === 'clave') {
      this._handleClave(cfg);
    }

    this.isProcessing = false;
  }

  async _handleAudio(cfg) {
    // Mostrar interfaz JARVIS
    if (window.jarvisUI) jarvisUI.showAudio(cfg);

    // Reproducir MP3
    if (window.audioManager && cfg.audio) {
      const url = `assets/audio/${cfg.audio}`;
      audioManager.play(url, () => {
        console.log('[ARCtrl] Audio terminado:', cfg.audio);
        // Mantener la interfaz visible hasta que el target se pierda
      });
    }
  }

  _handleClave(cfg) {
    // Mostrar panel de clave con animación de decodificación
    if (window.jarvisUI) jarvisUI.showClave(cfg);
  }

  _onTargetLost(cfg) {
    if (this.activeTarget !== cfg.index) return;
    this._stopCurrent();
  }

  _stopCurrent() {
    // Detener audio
    if (window.audioManager) audioManager.stop();

    // Detener TTS
    if (window.ttsManager) ttsManager.stop();

    // Ocultar UI
    if (window.jarvisUI) jarvisUI.hide();

    this.activeTarget = null;
    console.log('[ARCtrl] Todo detenido');
  }
}

window.arController = new ARController();
console.log('[ARCtrl] ar-controller.js cargado');
