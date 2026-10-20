/**
 * CONFIG.JS — Tabla central de configuración AURORA AR
 * Para agregar targets: añadir entrada en AR_CONFIG.targets
 * Para agregar audios: añadir archivo en assets/audio/ y referenciar aquí
 */

const AR_CONFIG = {

  
  grupoFijo: 1,
  // ── Grupos y sus nombres ──────────────────────────────────────────────────
  grupos: {
    1: 'Grupo 1',
  },

  // ── Targets / Marcadores ──────────────────────────────────────────────────
  // tipo: 'audio'  → reproduce MP3 + muestra interfaz JARVIS
  // tipo: 'clave'  → muestra código de desbloqueo según grupo
  //
  // Para agregar más: copiar un bloque y cambiar index, tipo y datos
  targets: [
    {
      index:    0,
      nombre:   'Introducción',
      tipo:     'audio',
      audio:    'ATHENA_0.mp3',       // archivo en assets/audio/
      mensaje:  'ATHENA en línea.',
      subtitulo: '',
    },
    {
      index:    1,
      nombre:   'Núcleo 1 — Competencias',
      tipo:     'clave',
      nucleoIndex: 1,                 // columna de la tabla de claves
      mensaje:  'Código de acceso al Núcleo 1 identificado.',
      subtitulo: 'Núcleo 1: Competencias y Resultados',
    },
    {
      index:    2,
      nombre:   'Núcleo 2 — Metodologías Activas',
      tipo:     'clave',
      nucleoIndex: 2,                 // columna de la tabla de claves
      mensaje:  'Código de acceso al Núcleo 2 identificado.',
      subtitulo: 'Núcleo 2: Metodologías Activas',
    },
    {
      index:    3,
      nombre:   'Núcleo 3 — STEAM',
      tipo:     'clave',
      nucleoIndex: 3,                 // columna de la tabla de claves
      mensaje:  'Código de acceso al Núcleo 3 identificado.',
      subtitulo: 'Núcleo 3: STEAM',
    },
    {
      index:    4,
      nombre:   'Núcleo 4 — Gamificación',
      tipo:     'clave',
      nucleoIndex: 4,                 // columna de la tabla de claves
      mensaje:  'Código de acceso al Núcleo 4 identificado.',
      subtitulo: 'Núcleo 4: Gamificación',
    },
    {
      index:    5,
      nombre:   'Núcleo 1 — Evaluación',
      tipo:     'clave',
      nucleoIndex: 5,                 // columna de la tabla de claves
      mensaje:  'Código de acceso al Núcleo 5 identificado.',
      subtitulo: 'Núcleo 5: Evaluación',
    },
    {
      index:    6,
      nombre:   'Núcleo 6 — Reflexión y Análisis',
      tipo:     'clave',
      nucleoIndex: 6,                 // columna de la tabla de claves
      mensaje:  'Código de acceso al Núcleo 6 identificado.',
      subtitulo: 'Núcleo 6: Reflexión y Análisis',
    },
    {
      index:    7,
      nombre:   'Núcle 1: Instrucciones',
      tipo:     'audio',
      audio:    'ATHENA_1.mp3',       // archivo en assets/audio/
      mensaje:  'ATHENA en línea.',
      subtitulo: '',
    },
    {
      index:    8,
      nombre:   'Núcle 2: Instrucciones',
      tipo:     'audio',
      audio:    'ATHENA_2.mp3',       // archivo en assets/audio/
      mensaje:  'ATHENA en línea.',
      subtitulo: '',
    },
    {
      index:    9,
      nombre:   'Núcle 3: Instrucciones',
      tipo:     'audio',
      audio:    'ATHENA_3.mp3',       // archivo en assets/audio/
      mensaje:  'ATHENA en línea.',
      subtitulo: '',
    },
    {
      index:    10,
      nombre:   'Núcle 4: Instrucciones',
      tipo:     'audio',
      audio:    'ATHENA_4.mp3',       // archivo en assets/audio/
      mensaje:  'ATHENA en línea.',
      subtitulo: '',
    },
    {
      index:    11,
      nombre:   'Núcle 5: Instrucciones',
      tipo:     'audio',
      audio:    'ATHENA_5.mp3',       // archivo en assets/audio/
      mensaje:  'ATHENA en línea.',
      subtitulo: '',
    },
    {
      index:    12,
      nombre:   'Núcle 6: Instrucciones',
      tipo:     'audio',
      audio:    'ATHENA_6.mp3',       // archivo en assets/audio/
      mensaje:  'ATHENA en línea.',
      subtitulo: '',
    },
    // ── Agregar más targets aquí ──────────────────────────────────────────
    // {
    //   index:    2,
    //   nombre:   'Misión II',
    //   tipo:     'audio',
    //   audio:    'Mision_II.mp3',
    //   mensaje:  '...',
    //   subtitulo: '...',
    // },
    // {
    //   index:    3,
    //   nombre:   'Núcleo 2',
    //   tipo:     'clave',
    //   nucleoIndex: 2,
    //   mensaje:  '...',
    //   subtitulo: '...',
    // },
  ],

  // ── Claves por grupo y núcleo ─────────────────────────────────────────────
  // claves[grupo][nucleo] = código de 5 dígitos
  claves: {
    1: { 1:14782, 2:29531, 3:63048, 4:47195, 5:81326, 6:52904 },
  },

  // ── Configuración de audio ────────────────────────────────────────────────
  audio: {
    volume: 1.0,
    fadeInMs: 300,
    fadeOutMs: 500,
  },

  // ── Configuración visual JARVIS ───────────────────────────────────────────
  jarvis: {
    colorPrimario:   '#00d4ff',
    colorSecundario: '#0066ff',
    colorAlerta:     '#ff6b00',
    colorExito:      '#00ff88',
  },
};

window.AR_CONFIG = AR_CONFIG;
console.log('[Config] Cargado. Targets:', AR_CONFIG.targets.length);
