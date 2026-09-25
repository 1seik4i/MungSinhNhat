const SETTINGS_KEY = 'birthday-card-content-settings-v1';
const AUDIO_DB = 'birthday-card-audio-v1';
const AUDIO_STORE = 'tracks';

export const DEFAULT_CONTENT = {
  cardData: {
    name: 'Minh Anh',
    birthDate: '05 / 10',
    title: 'Chúc Mừng Sinh Nhật',
    message: 'Chúc em một ngày sinh nhật thật rực rỡ, ấm áp và đong đầy nụ cười!\nƯớc mong tuổi mới của em sẽ mở ra ngàn vạn điều may mắn, vạn sự hanh thông và luôn xinh đẹp rạng ngời như ánh ban mai. 💖🌸',
  },
  surpriseCards: {
    gift: { image: '', title: 'Hộp quà bí mật', description: 'Một món quà nhỏ đang chờ em mở ra.', action: 'Mở hộp quà' },
    fortune: { image: '', title: 'Gieo thẻ sinh nhật', description: 'Khám phá một lời nhắn may mắn cho tuổi mới.', action: 'Gieo thẻ ngay' },
  },
  memories: [
    { id: 'memory-1', title: 'Nụ Cười Tỏa Nắng', date: 'Mùa hè rực rỡ', caption: 'Chúc em luôn giữ trọn nụ cười hồn nhiên và rạng ngời này trên môi!', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', rotate: -3 },
    { id: 'memory-2', title: 'Những Chuyến Đi Xa', date: 'Thanh xuân phiêu lưu', caption: 'Mong em sẽ đi đến bất cứ nơi đâu em muốn và khám phá muôn điều kỳ diệu.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', rotate: 2 },
    { id: 'memory-3', title: 'Khoảnh Khắc Bình Yên', date: 'Những ngày thảnh thơi', caption: 'Mỗi ngày trôi qua đều là một món quà đáng trân trọng và ngập tràn niềm vui.', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80', rotate: -2 },
    { id: 'memory-4', title: 'Rạng Rỡ Đón Tuổi Mới', date: 'Sinh nhật ý nghĩa', caption: 'Tuổi mới mở ra những trang sách tuyệt vời nhất trong cuộc đời em!', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80', rotate: 3 },
  ],
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

export function saveContentSettings(settings) {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(SETTINGS_KEY, serialized);
    return { success: true };
  } catch (err) {
    console.error('Failed to save content settings:', err);
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      throw new Error('Bộ nhớ trình duyệt bị đầy do ảnh dung lượng quá lớn. Hệ thống đã tự động nén ảnh, vui lòng thử lại hoặc giảm bớt số lượng ảnh.');
    }
    throw new Error('Không thể lưu dữ liệu: ' + (err.message || 'Lỗi không xác định'));
  }
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
  const db = await openAudioDb();
  const id = crypto.randomUUID();
  await new Promise((resolve, reject) => {
    const request = db.transaction(AUDIO_STORE, 'readwrite').objectStore(AUDIO_STORE).put({ id, file });
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
  db.close();
  return id;
}

export async function getAudioFileUrl(id) {
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

