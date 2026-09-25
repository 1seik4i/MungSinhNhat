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
app.use(express.json());

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
    message: 'Chúc bạn một ngày sinh nhật thật vui vẻ và hạnh phúc! Mong rằng mọi ước mơ của bạn sẽ sớm thành hiện thực, cuộc sống luôn tràn ngập tiếng cười, sự tự tin và thành công rực rỡ. Cảm ơn vì đã là một phần tuyệt vời trong thế giới này! 💖🌸',
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

