const SETTINGS_KEY = 'birthday-card-content-settings-v1';
const AUDIO_DB = 'birthday-card-audio-v1';
const AUDIO_STORE = 'tracks';

export const DEFAULT_CONTENT = {
  cardData: {
    name: '',
    birthDate: '',
    title: '',
    message: '',
  },
  surpriseCards: {
    gift: { image: '', title: '', description: '', action: '' },
    fortune: { image: '', title: '', description: '', action: '' },
  },
  memories: [],
  tracks: [],
};

export function loadContentSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (!saved) return DEFAULT_CONTENT;
    return {
      ...DEFAULT_CONTENT,
      ...saved,
      surpriseCards: { ...DEFAULT_CONTENT.surpriseCards, ...saved.surpriseCards },
      cardData: { ...DEFAULT_CONTENT.cardData, ...saved.cardData },
      memories: Array.isArray(saved.memories) ? saved.memories : DEFAULT_CONTENT.memories,
      tracks: Array.isArray(saved.tracks) ? saved.tracks : [],
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}

// Fetch settings from server to sync desktop & mobile across different devices/browsers
export async function fetchServerContentSettings() {
  try {
    const res = await fetch('/api/content-settings', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      const serverData = json.data;
      const merged = {
        ...DEFAULT_CONTENT,
        ...serverData,
        surpriseCards: { ...DEFAULT_CONTENT.surpriseCards, ...serverData.surpriseCards },
        cardData: { ...DEFAULT_CONTENT.cardData, ...serverData.cardData },
        memories: Array.isArray(serverData.memories) ? serverData.memories : DEFAULT_CONTENT.memories,
        tracks: Array.isArray(serverData.tracks) ? serverData.tracks : [],
      };
      // Keep local storage up to date with server data
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      } catch (e) {
        console.warn('Could not write server data to localStorage:', e);
      }
      return merged;
    }
  } catch (err) {
    console.warn('Could not sync with /api/content-settings:', err);
  }
  return null;
}

export async function fetchServerTracks() {
  try {
    const response = await fetch('/api/tracks', { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success && Array.isArray(payload.data) ? payload.data : null;
  } catch (error) {
    console.warn('Could not load the fast track list:', error);
    return null;
  }
}

export function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP...).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target.result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Nén ảnh sang JPEG chất lượng cao nhưng dung lượng siêu nhỏ (~150KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh này. Vui lòng thử ảnh khác.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp ảnh từ máy.'));
    reader.readAsDataURL(file);
  });
}

async function readApiError(response, fallback) {
  try {
    const payload = await response.json();
    return payload.message || fallback;
  } catch {
    return fallback;
  }
}

export async function saveContentSettings(settings) {
  const serialized = JSON.stringify(settings);
  const response = await fetch('/api/content-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: serialized,
  });
  if (!response.ok) throw new Error(await readApiError(response, 'Không thể lưu thay đổi lên Supabase.'));
  const payload = await response.json();
  if (!payload.success || !payload.data) throw new Error('Máy chủ không xác nhận được dữ liệu đã lưu.');

  const saved = {
    ...DEFAULT_CONTENT,
    ...payload.data,
    surpriseCards: { ...DEFAULT_CONTENT.surpriseCards, ...payload.data.surpriseCards },
    cardData: { ...DEFAULT_CONTENT.cardData, ...payload.data.cardData },
    memories: Array.isArray(payload.data.memories) ? payload.data.memories : [],
    tracks: Array.isArray(payload.data.tracks) ? payload.data.tracks : [],
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
  } catch (err) {
    console.warn('Không thể cập nhật bản sao trong trình duyệt:', err);
  }
  return saved;
}

export async function getEditorSession() {
  const response = await fetch('/api/editor-session', { cache: 'no-store' });
  if (!response.ok) return { authenticated: false, configured: false };
  return response.json();
}

export async function loginEditor(password) {
  const response = await fetch('/api/editor-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) throw new Error(await readApiError(response, 'Không thể đăng nhập.'));
  return true;
}

export async function logoutEditor() {
  await fetch('/api/editor-session', { method: 'DELETE' });
}

export function getYouTubeVideoId(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace('www.', '');
    if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || '';
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || '';
      return url.searchParams.get('v') || '';
    }
  } catch {
    return '';
  }
  return '';
}

function openAudioDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUDIO_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioFile(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không thể đọc tệp âm thanh.'));
    reader.readAsDataURL(file);
  });

  return uploadContentMedia(dataUrl);
}

export async function saveImageFile(file) {
  const dataUrl = await compressImageFile(file);
  return uploadContentMedia(dataUrl);
}

async function uploadContentMedia(dataUrl) {
  const response = await fetch('/api/content-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl }),
  });
  if (!response.ok) throw new Error(await readApiError(response, 'Máy chủ không thể lưu tệp.'));
  const json = await response.json();
  return json.data.source;
}

export async function getAudioFileUrl(id) {
  if (typeof id === 'string' && (id.startsWith('/api/content-media/') || id.startsWith('/media/') || /^https?:\/\//.test(id))) return id;
  const db = await openAudioDb();
  const entry = await new Promise((resolve, reject) => {
    const request = db.transaction(AUDIO_STORE, 'readonly').objectStore(AUDIO_STORE).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return entry?.file ? URL.createObjectURL(entry.file) : '';
}

export async function deleteAudioFile(id) {
  if (typeof id === 'string' && (id.startsWith('/api/content-media/') || id.startsWith('/media/'))) {
    const response = await fetch(`/api/content-media/${encodeURIComponent(id.split('/').pop())}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Không thể xóa tệp âm thanh.'));
    return;
  }
  try {
    const db = await openAudioDb();
    await new Promise((resolve, reject) => {
      const request = db.transaction(AUDIO_STORE, 'readwrite').objectStore(AUDIO_STORE).delete(id);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch (err) {
    console.warn('Could not delete audio file from IndexedDB:', err);
  }
}

