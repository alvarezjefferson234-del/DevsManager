// Only the three GLBs explicitly selected in Documents/3d are active.
export const SOURCE_DIRECTORY = 'C:/Users/PLAYER666/Documents/3d';
export const ASSETS = [
  { id: 'logo', label: 'Nuestra identidad', short: 'Identidad', kind: '01 / IDENTIDAD', source: 'devsmanager_logo_premium_v03.glb', file: 'logo.glb', poster: 'logo.png', orientation: [0, 0, 0], yaw: 0, pitch: 0, layout: 'wide', description: 'Una marca que despierta curiosidad y deja huella.' },
  { id: 'globe', label: 'Un mundo de posibilidades', short: 'Conexión', kind: '02 / CONEXIÓN', source: 'binary_globe_astra_v03.glb', file: 'globe.glb', poster: 'globe.png', orientation: [0, 0, 0], yaw: 0, pitch: 0, scrub: true, description: 'Lo que haces merece llegar más lejos.' },
  { id: 'atelier', label: 'Donde nacen las ideas', short: 'Creación', kind: '03 / CREACIÓN', source: 'devsmanager_atelier_v07.glb', file: 'atelier.glb', poster: 'atelier.png', orientation: [0, 0, 0], yaw: 0, pitch: 0.04, description: 'El lugar donde imaginamos lo que tu negocio puede llegar a ser.' },
];
export const STORY_IDS = ASSETS.map(asset => asset.id);
export const assetById = id => ASSETS.find(asset => asset.id === id);
export const assetUrl = asset => `/models/${asset.file}`;
export const posterUrl = asset => asset.poster ? `/posters/${asset.poster}` : null;
