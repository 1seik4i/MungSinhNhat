import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const SETTINGS_FILE = path.join(__dirname, 'contentSettings.json');

// Default initial content settings
const DEFAULT_CONTENT = {
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

let cachedSettings = null;

function loadStoredSettings() {
  if (cachedSettings) return cachedSettings;
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      cachedSettings = JSON.parse(data);
      return cachedSettings;
    }
  } catch (err) {
    console.warn('Could not read stored content settings:', err);
  }
  cachedSettings = { ...DEFAULT_CONTENT };
  return cachedSettings;
}

function saveStoredSettings(data) {
  cachedSettings = data;
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist content settings to disk (likely read-only serverless environment):', err);
  }
}

// In-memory / initial storage
let wishes = [
  {
    id: 'w1',
    author: 'Bạn Thân',
    avatar: '🌸',
    color: '#ff6b9d',
    content: 'Chúc Minh Anh sinh nhật siêu cấp rực rỡ! Tuổi mới luôn ngập tràn may mắn, xinh đẹp rạng ngời và đạt được mọi mục tiêu nhé! ✨🎂',
    likes: 12,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    sticker: '🎉'
  },
  {
    id: 'w2',
    author: 'Cạ Cứng',
    avatar: '🐱',
    color: '#c78bfa',
    content: 'Happy Birthday to my favorite human! Mong cậu luôn giữ nụ cười tỏa nắng, ăn hoài không béo và tiền vô như nước nha! 🥳💖',
    likes: 8,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    sticker: '🍰'
  },
  {
    id: 'w3',
    author: 'Gia Đình Nhỏ',
    avatar: '⭐',
    color: '#fbbf24',
    content: 'Chúc cô gái tuổi mới luôn bình an, mạnh khỏe và được bao bọc trong tình yêu thương ấm áp nhất! Yêu thương nhiều! 🌻',
    likes: 15,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    sticker: '🎁'
  }
];

let customCards = {
  default: {
    name: 'Minh Anh',
    birthDate: '05/10',
    title: 'Chúc Mừng Sinh Nhật',
    message: 'Chúc em một ngày sinh nhật thật vui vẻ và hạnh phúc! Mong rằng mọi ước mơ của em sẽ sớm thành hiện thực, cuộc sống luôn tràn ngập tiếng cười, sự tự tin và thành công rực rỡ. Cảm ơn vì đã là một phần tuyệt vời trong thế giới này! 💖🌸',
    theme: 'galaxy', // galaxy, sakura, twilight, sunset, aurora
    musicTheme: 'lofi',
    photos: []
  }
};

// Wishes API
app.get('/api/wishes', (req, res) => {
  res.json({ success: true, data: wishes });
});

app.post('/api/wishes', (req, res) => {
  const { author, content, avatar, color, sticker } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Nội dung lời chúc không được để trống' });
  }

  const newWish = {
    id: 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    author: author?.trim() || 'Người bạn giấu tên',
    avatar: avatar || '🎈',
    color: color || '#ff6b9d',
    sticker: sticker || '✨',
    content: content.trim(),
    likes: 0,
    createdAt: new Date().toISOString()
  };

  wishes.unshift(newWish);
  res.status(201).json({ success: true, data: newWish });
});

app.post('/api/wishes/:id/like', (req, res) => {
  const { id } = req.params;
  const wish = wishes.find(w => w.id === id);
  if (!wish) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lời chúc' });
  }
  wish.likes += 1;
  res.json({ success: true, likes: wish.likes });
});

// Content Settings Sync API (Sync across desktop and mobile devices)
app.get('/api/content-settings', (req, res) => {
  const settings = loadStoredSettings();
  res.json({ success: true, data: settings });
});

app.post('/api/content-settings', (req, res) => {
  try {
    const newSettings = req.body;
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
    const current = loadStoredSettings();
    const merged = {
      ...current,
      ...newSettings,
      cardData: { ...current.cardData, ...(newSettings.cardData || {}) },
      surpriseCards: { ...current.surpriseCards, ...(newSettings.surpriseCards || {}) },
      memories: Array.isArray(newSettings.memories) ? newSettings.memories : current.memories,
      tracks: Array.isArray(newSettings.tracks) ? newSettings.tracks : current.tracks,
    };
    saveStoredSettings(merged);
    res.json({ success: true, data: merged });
  } catch (err) {
    console.error('Error saving content settings:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi lưu trữ dữ liệu' });
  }
});

// Card Customizer API
app.get('/api/card/:id?', (req, res) => {
  const id = req.params.id || 'default';
  const card = customCards[id] || customCards.default;
  res.json({ success: true, data: card });
});

app.post('/api/card', (req, res) => {
  const { name, birthDate, title, message, theme, musicTheme, photos } = req.body;
  const id = 'card_' + Date.now().toString(36);
  customCards[id] = {
    name: name || 'Minh Anh',
    birthDate: birthDate || '05/10',
    title: title || 'Chúc Mừng Sinh Nhật',
    message: message || 'Sinh nhật ấm áp và hạnh phúc nhất!',
    theme: theme || 'galaxy',
    musicTheme: musicTheme || 'lofi',
    photos: photos || []
  };
  res.status(201).json({ success: true, id, data: customCards[id] });
});

// Serve frontend in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🎂 Birthday Celebration Server running on http://localhost:${PORT}`);
  });
}

export default app;

