/**
 * MAIN.JS — Punto de entrada AURORA AR
 *
 * ORDEN CRÍTICO PARA iOS:
 * 1. Al click del usuario → activar AudioContext Y TTS SIN await previo
 * 2. Solo después continuar con permisos y carga
 *
 * Este orden garantiza que iOS acepte la reproducción de audio.
 */

// ── Estado global ────────────────────────────────────────────────────────────
let grupoSeleccionado = null;

// ── DOM Ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== ATHENA AR ===');

  _detectSafari();

  const btnIniciar = document.getElementById('btn-iniciar');
  const btnConfirmar = document.getElementById('btn-confirmar-grupo');

  if (btnIniciar)    btnIniciar.addEventListener('click', _onIniciarClick);
  if (btnConfirmar)  btnConfirmar.addEventListener('click', _onConfirmarGrupo);

  // Enter en el input de grupo
  const inputGrupo = document.getElementById('input-grupo');
  if (inputGrupo) {
    inputGrupo.addEventListener('keydown', e => {
      if (e.key === 'Enter') _onConfirmarGrupo();
    });
  }

  console.log('[Main] Listo. Esperando usuario...');
});

// ── Paso 1: click en INICIAR ─────────────────────────────────────────────────
function _onIniciarClick() {
  console.log('[Main] INICIAR presionado');

  // 🔥 CRÍTICO iOS: activar audio en el gesto
  if (window.ttsManager)   ttsManager.activate();
  if (window.audioManager) audioManager.activate();

  // Grupo fijo — saltar pantalla de selección
  const grupo = AR_CONFIG.grupoFijo || 1;
  arController.setGrupo(grupo);

  // Actualizar badge
  const badge = document.getElementById('badge-text');
  if (badge) badge.textContent = `GRUPO ${grupo}`;

  // Ir directo al loading
  _showScreen('screen-loading');
  _loadAR();
}

// ── Paso 2: confirmar grupo ──────────────────────────────────────────────────
function _onConfirmarGrupo() {
  const input = document.getElementById('input-grupo');
  const n = parseInt(input?.value);

  if (!n || n < 1 || n > 8) {
    _showError('Ingresa un número de grupo válido (1 – 8)');
    return;
  }

  grupoSeleccionado = n;
  arController.setGrupo(n);
  console.log('[Main] Grupo confirmado:', n);

  // Ocultar error si había
  _showError('');

  // Avanzar a permisos y carga
  _showScreen('screen-loading');
  _loadAR();
}

// ── Paso 3: solicitar cámara y cargar AR ─────────────────────────────────────
async function _loadAR() {
  _setProgress(15, 'Solicitando acceso a cámara...');

  try {
    // Permisos de cámara
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode:'environment', width:{ideal:1280}, height:{ideal:720} },
      audio: false,
    });
    // Liberar stream — MindAR tomará la cámara después
    setTimeout(() => stream.getTracks().forEach(t => t.stop()), 100);
    console.log('[Main] ✓ Permisos de cámara');
    _setProgress(40, 'Permisos otorgados...');

  } catch(e) {
    console.error('[Main] Error cámara:', e);
    let msg = 'No se pudo acceder a la cámara. ';
    if (e.name === 'NotAllowedError') msg += 'Debes permitir el acceso.';
    else if (e.name === 'NotFoundError') msg += 'No se encontró cámara.';
    else msg += 'Verifica los permisos en Ajustes.';
    _showFatalError(msg);
    return;
  }

  _setProgress(60, 'Cargando experiencia AR...');

  // Esperar a que a-scene esté lista
  await _waitForScene();

  _setProgress(85, 'Iniciando sistema...');

  // Inicializar AR Controller
  arController.init();

  _setProgress(100, '¡Listo!');

  // Pequeña pausa visual y mostrar AR
  await new Promise(r => setTimeout(r, 600));
  _showScreen('screen-ar');
  document.body.classList.add('ar-active');
  _startMindAR();

  console.log('[Main] === AURORA AR ACTIVO ===');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _waitForScene() {
  return new Promise(resolve => {
    const scene = document.querySelector('a-scene');
    if (!scene) { resolve(); return; }
    if (scene.hasLoaded) { resolve(); return; }
    scene.addEventListener('loaded', resolve, { once: true });
    // Timeout de seguridad
    setTimeout(resolve, 5000);
  });
}

function _startMindAR() {
  const scene = document.querySelector('a-scene');
  if (!scene) return;
  const sys = scene.systems?.['mindar-image-system'];
  if (sys?.start && !sys.started) {
    sys.start();
    console.log('[Main] MindAR iniciado');
  }
  // Monitorear que MindAR arranque
  const check = setInterval(() => {
    const s2 = document.querySelector('a-scene')?.systems?.['mindar-image-system'];
    if (s2) { if (s2.start && !s2.started) s2.start(); clearInterval(check); }
  }, 500);
  setTimeout(() => clearInterval(check), 8000);
}

function _showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function _setProgress(pct, text) {
  const bar  = document.getElementById('progress-bar');
  const info = document.getElementById('loading-text');
  if (bar)  bar.style.width = pct + '%';
  if (info && text) info.textContent = text;
}

function _showError(msg) {
  const el = document.getElementById('grupo-error');
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}

function _showFatalError(msg) {
  _showScreen('screen-bienvenida');
  const el = document.getElementById('fatal-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function _detectSafari() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS    = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const warn     = document.getElementById('safari-warning');
  if (warn && isIOS && !isSafari) warn.style.display = 'flex';
}

window.grupoSeleccionado = () => grupoSeleccionado;
console.log('[Main] main.js cargado');
