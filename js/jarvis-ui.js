/**
 * JARVIS-UI.JS
 * Interfaz visual estilo FRIDAY/JARVIS de Iron Man.
 * Gestiona dos paneles:
 *   - Panel AUDIO: círculos HUD + visualizador de onda modular
 *   - Panel CLAVE: código de 5 dígitos con animación de decodificación
 */

class JarvisUI {
  constructor() {
    this.canvas       = null;
    this.ctx          = null;
    this.animFrame    = null;
    this.mode         = null;   // 'audio' | 'clave' | null
    this.isVisible    = false;
    this.targetConfig = null;
    this.grupo        = 1;

    // Animación interna
    this._tick        = 0;
    this._decoding    = false;
    this._decodedDigits = [];

    this._build();
  }

  _build() {
    // Contenedor principal (overlay sobre la cámara)
    this.container = document.createElement('div');
    this.container.id = 'jarvis-overlay';
    this.container.style.cssText = `
      position: fixed; inset: 0; z-index: 100;
      display: none; flex-direction: column;
      align-items: center; justify-content: center;
      pointer-events: none;
    `;

    // Canvas para efectos gráficos
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute; inset: 0;
      width: 100%; height: 100%;
    `;
    this.container.appendChild(this.canvas);

    // Panel de información (encima del canvas)
    this.infoPanel = document.createElement('div');
    this.infoPanel.id = 'jarvis-info';
    this.infoPanel.style.cssText = `
      position: relative; z-index: 10;
      text-align: center; padding: 1rem;
      max-width: 90vw;
    `;
    this.container.appendChild(this.infoPanel);

    // Panel de clave (separado, debajo del info)
    this.clavePanel = document.createElement('div');
    this.clavePanel.id = 'jarvis-clave';
    this.clavePanel.style.cssText = `
      position: relative; z-index: 10;
      display: none; margin-top: 1.5rem;
    `;
    this.container.appendChild(this.clavePanel);

    document.body.appendChild(this.container);

    // Ajustar canvas al tamaño de pantalla
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    console.log('[JarvisUI] Overlay creado');
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
  }

  // ── API PÚBLICA ──────────────────────────────────────────────────────────

  setGrupo(g) { this.grupo = g; }

  /**
   * Mostrar panel de AUDIO (interfaz JARVIS con visualizador)
   */
  showAudio(targetConfig) {
    this.targetConfig = targetConfig;
    this.mode = 'audio';
    this._show();
    this._renderInfoAudio();
    this.clavePanel.style.display = 'none';
    this._startLoop();
    console.log('[JarvisUI] Modo AUDIO');
  }

  /**
   * Mostrar panel de CLAVE con animación de decodificación
   */
  showClave(targetConfig) {
    this.targetConfig = targetConfig;
    this.mode = 'clave';
    this._show();
    this._renderInfoClave();
    this._startDecoding();
    this._startLoop();
    console.log('[JarvisUI] Modo CLAVE — Grupo', this.grupo);
  }

  hide() {
    this.mode = null;
    this.isVisible = false;
    this.container.style.display = 'none';
    this._stopLoop();
    this._clearCanvas();
    this.clavePanel.style.display = 'none';
    console.log('[JarvisUI] Oculto');
  }

  // ── PANEL INFO ────────────────────────────────────────────────────────────

  _renderInfoAudio() {
    const cfg = this.targetConfig;
    this.infoPanel.innerHTML = `
      <div style="
        font-family:'Orbitron',sans-serif;
        font-size:clamp(0.6rem,3vw,0.85rem);
        color:#00d4ff; letter-spacing:0.15em;
        opacity:0.7; margin-bottom:0.5rem;
        text-transform:uppercase;
      ">ATHENA · SISTEMA ACTIVO</div>
      <div style="
        font-family:'Share Tech Mono',monospace;
        font-size:clamp(0.9rem,4.5vw,1.3rem);
        color:#e8f4ff; letter-spacing:0.1em;
        text-shadow: 0 0 20px #00d4ff88;
        margin-bottom:0.4rem;
      ">${cfg.subtitulo || cfg.nombre}</div>
      <div style="
        font-family:'Exo 2',sans-serif;
        font-size:clamp(0.72rem,3.5vw,0.9rem);
        color:#00d4ffaa; font-weight:300;
      ">${cfg.mensaje}</div>
    `;
  }

  _renderInfoClave() {
    const cfg = this.targetConfig;
    const clave = AR_CONFIG.claves[this.grupo]?.[cfg.nucleoIndex] || '-----';
    const grupoNombre = AR_CONFIG.grupos[this.grupo] || `Grupo ${this.grupo}`;

    this.infoPanel.innerHTML = `
      <div style="
        font-family:'Orbitron',sans-serif;
        font-size:clamp(0.6rem,3vw,0.85rem);
        color:#00ff88; letter-spacing:0.15em;
        opacity:0.8; margin-bottom:0.5rem;
        text-transform:uppercase;
      ">ATHENA · CÓDIGO DETECTADO</div>
      <div style="
        font-family:'Share Tech Mono',monospace;
        font-size:clamp(0.8rem,4vw,1.1rem);
        color:#e8f4ff88; letter-spacing:0.1em;
        margin-bottom:0.3rem;
      ">${cfg.subtitulo || cfg.nombre}</div>
      <div style="
        font-family:'Exo 2',sans-serif;
        font-size:clamp(0.68rem,3vw,0.82rem);
        color:#00ff8888; font-weight:300;
        margin-bottom:1rem;
      ">${grupoNombre} · ${cfg.mensaje}</div>
    `;

    // Panel de clave con dígitos
    this.clavePanel.style.display = 'block';
    this.clavePanel.innerHTML = `
      <div id="clave-digits" style="
        display:flex; gap:clamp(0.5rem,3vw,1rem);
        justify-content:center; align-items:center;
      ">
        ${String(clave).split('').map((d,i) => `
          <div class="clave-digit" data-index="${i}" data-real="${d}" style="
            width:clamp(44px,12vw,64px); height:clamp(56px,15vw,80px);
            border:2px solid #00ff8844;
            background:rgba(0,255,136,0.06);
            border-radius:8px;
            display:flex; align-items:center; justify-content:center;
            font-family:'Orbitron',sans-serif;
            font-size:clamp(1.4rem,6vw,2.2rem);
            font-weight:900; color:#111;
            box-shadow: 0 0 20px #00ff8822;
            transition: all 0.3s ease;
          ">?</div>
        `).join('')}
      </div>
      <div style="
        font-family:'Share Tech Mono',monospace;
        font-size:clamp(0.6rem,2.5vw,0.72rem);
        color:#00ff8866; text-align:center;
        margin-top:0.75rem; letter-spacing:0.1em;
      ">CÓDIGO DE ACCESO · NÚCLEO ${cfg.nucleoIndex}</div>
    `;
  }

  // ── DECODIFICACIÓN ANIMADA ────────────────────────────────────────────────

  _startDecoding() {
    this._decoding = true;
    this._decodedDigits = [false, false, false, false, false];
    const digits = () => document.querySelectorAll('.clave-digit');

    // Mostrar números random mientras "decodifica"
    const scramble = setInterval(() => {
      digits().forEach((el, i) => {
        if (!this._decodedDigits[i]) {
          el.textContent = Math.floor(Math.random() * 10);
          el.style.color = '#00ff8855';
        }
      });
    }, 80);

    // Revelar dígito por dígito
    [0,1,2,3,4].forEach(i => {
      setTimeout(() => {
        const el = document.querySelector(`.clave-digit[data-index="${i}"]`);
        if (!el) return;
        this._decodedDigits[i] = true;
        el.textContent = el.dataset.real;
        el.style.color = '#00ff88';
        el.style.borderColor = '#00ff8888';
        el.style.boxShadow = '0 0 30px #00ff8844, inset 0 0 15px #00ff8811';
        el.style.background = 'rgba(0,255,136,0.1)';

        if (i === 4) {
          clearInterval(scramble);
          this._decoding = false;
          // Flash de confirmación
          setTimeout(() => this._flashConfirm(), 200);
        }
      }, 600 + i * 400);
    });
  }

  _flashConfirm() {
    const panel = this.clavePanel;
    panel.style.transition = 'opacity 0.1s';
    let flashes = 0;
    const flash = setInterval(() => {
      panel.style.opacity = flashes % 2 === 0 ? '0.3' : '1';
      flashes++;
      if (flashes > 5) { clearInterval(flash); panel.style.opacity = '1'; }
    }, 100);
  }

  // ── RENDER LOOP ───────────────────────────────────────────────────────────

  _show() {
    this.isVisible = true;
    this.container.style.display = 'flex';
  }

  _startLoop() {
    this._stopLoop();
    const loop = () => {
      this._tick++;
      this._drawFrame();
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  _stopLoop() {
    if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
  }

  _clearCanvas() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _drawFrame() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const cx = W / 2;
    const cy = H * 0.38; // Centro visual un poco arriba del centro real
    const t  = this._tick;

    ctx.clearRect(0, 0, W, H);

    if (this.mode === 'audio') {
      this._drawAudioFrame(ctx, W, H, cx, cy, t);
    } else if (this.mode === 'clave') {
      this._drawClaveFrame(ctx, W, H, cx, cy, t);
    }
  }

  // ── FRAME MODO AUDIO (JARVIS) ─────────────────────────────────────────────
  _drawAudioFrame(ctx, W, H, cx, cy, t) {
    const level = window.audioManager ? audioManager.getLevel() : 0;
    const pulse = 0.85 + level * 0.5 + Math.sin(t * 0.05) * 0.08;

    // Fondo semi-transparente suave
    ctx.fillStyle = 'rgba(0,8,20,0.45)';
    ctx.fillRect(0, 0, W, H);

    // Líneas de grid HUD (horizontales)
    ctx.strokeStyle = 'rgba(0,212,255,0.06)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Círculo externo giratorio
    const r1 = Math.min(W, H) * 0.30 * pulse;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.008);
    ctx.strokeStyle = `rgba(0,212,255,${0.25 + level * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([12, 8, 4, 8]);
    ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Círculo medio contra-rotatorio
    const r2 = r1 * 0.72;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-t * 0.015);
    ctx.strokeStyle = `rgba(0,102,255,${0.3 + level * 0.5})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 10]);
    ctx.beginPath(); ctx.arc(0, 0, r2, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Círculo interno pulsante
    const r3 = r1 * 0.42 * (1 + level * 0.3);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r3);
    grad.addColorStop(0, `rgba(0,212,255,${0.15 + level * 0.25})`);
    grad.addColorStop(1, 'rgba(0,212,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r3, 0, Math.PI * 2); ctx.fill();

    // Núcleo central
    ctx.fillStyle = `rgba(0,212,255,${0.6 + level * 0.4})`;
    ctx.beginPath(); ctx.arc(cx, cy, 6 + level * 8, 0, Math.PI * 2); ctx.fill();

    // ── Visualizador de onda (abajo) ──────────────────────────────────────
    const freqs  = window.audioManager ? audioManager.getFrequencies() : new Uint8Array(128).fill(0);
    const waveY  = cy + r1 + clamp(H * 0.06, 20, 50);
    const waveW  = Math.min(W * 0.85, 340);
    const waveH  = clamp(H * 0.10, 30, 70);
    const barW   = waveW / freqs.length * 2;
    const waveX  = cx - waveW / 2;

    // Fondo de la onda
    ctx.fillStyle = 'rgba(0,212,255,0.04)';
    ctx.fillRect(waveX, waveY - waveH / 2, waveW, waveH);

    // Barras de frecuencia
    for (let i = 0; i < freqs.length / 2; i++) {
      const v  = freqs[i] / 255;
      const bh = v * waveH;
      const x  = waveX + i * barW * 2;
      const alpha = 0.4 + v * 0.6;
      ctx.fillStyle = `rgba(0,212,255,${alpha})`;
      ctx.fillRect(x, waveY - bh / 2, barW * 1.6, bh);
    }

    // Línea central de la onda
    ctx.strokeStyle = 'rgba(0,212,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(waveX, waveY); ctx.lineTo(waveX + waveW, waveY); ctx.stroke();

    // Marcadores de esquina HUD
    this._drawCorners(ctx, W, H, '#00d4ff', 0.25 + level * 0.3);
  }

  // ── FRAME MODO CLAVE ──────────────────────────────────────────────────────
  _drawClaveFrame(ctx, W, H, cx, cy, t) {
    // Fondo
    ctx.fillStyle = 'rgba(0,10,5,0.55)';
    ctx.fillRect(0, 0, W, H);

    // Grid diagonal
    ctx.strokeStyle = 'rgba(0,255,136,0.04)';
    ctx.lineWidth = 1;
    for (let x = -H; x < W + H; x += 35) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
    }

    // Anillo exterior girando lento
    const r1 = Math.min(W, H) * 0.28;
    ctx.save(); ctx.translate(cx, cy * 0.55); ctx.rotate(t * 0.005);
    ctx.strokeStyle = `rgba(0,255,136,0.2)`;
    ctx.lineWidth = 1.5; ctx.setLineDash([20, 15, 5, 15]);
    ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();

    // Pulso central verde
    const pulseR = 8 + Math.sin(t * 0.08) * 4;
    const g2 = ctx.createRadialGradient(cx, cy*0.55, 0, cx, cy*0.55, r1 * 0.5);
    g2.addColorStop(0, 'rgba(0,255,136,0.12)');
    g2.addColorStop(1, 'rgba(0,255,136,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cx, cy*0.55, r1*0.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = `rgba(0,255,136,0.8)`;
    ctx.beginPath(); ctx.arc(cx, cy*0.55, pulseR, 0, Math.PI*2); ctx.fill();

    // Scan line horizontal animado
    const scanY = (t * 3) % H;
    const scanGrad = ctx.createLinearGradient(0, scanY-15, 0, scanY+15);
    scanGrad.addColorStop(0,   'rgba(0,255,136,0)');
    scanGrad.addColorStop(0.5, 'rgba(0,255,136,0.15)');
    scanGrad.addColorStop(1,   'rgba(0,255,136,0)');
    ctx.fillStyle = scanGrad; ctx.fillRect(0, scanY-15, W, 30);

    this._drawCorners(ctx, W, H, '#00ff88', 0.4);
  }

  // ── MARCADORES DE ESQUINA HUD ─────────────────────────────────────────────
  _drawCorners(ctx, W, H, color, alpha) {
    const len = clamp(Math.min(W, H) * 0.06, 14, 28);
    const m   = clamp(Math.min(W, H) * 0.04, 10, 20);
    ctx.strokeStyle = `rgba(${hexToRgb(color)},${alpha})`;
    ctx.lineWidth = 2;
    // TL
    ctx.beginPath(); ctx.moveTo(m+len,m); ctx.lineTo(m,m); ctx.lineTo(m,m+len); ctx.stroke();
    // TR
    ctx.beginPath(); ctx.moveTo(W-m-len,m); ctx.lineTo(W-m,m); ctx.lineTo(W-m,m+len); ctx.stroke();
    // BL
    ctx.beginPath(); ctx.moveTo(m+len,H-m); ctx.lineTo(m,H-m); ctx.lineTo(m,H-m-len); ctx.stroke();
    // BR
    ctx.beginPath(); ctx.moveTo(W-m-len,H-m); ctx.lineTo(W-m,H-m); ctx.lineTo(W-m,H-m-len); ctx.stroke();
  }
}

// Utilidades
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

window.jarvisUI = new JarvisUI();
console.log('[JarvisUI] jarvis-ui.js cargado');
