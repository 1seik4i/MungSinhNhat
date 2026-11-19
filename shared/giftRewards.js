const ORIGINAL_REWARDS = [
  { title: 'Voucher Trà Sữa Full Topping', desc: 'Đổi một ly trà sữa size L, chọn topping em thích.', code: 'MILKTEA-HAPPY-BDAY', tone: '#d95f79' },
  { title: 'Vé “Một Điều Ước”', desc: 'Người tặng sẽ thực hiện một điều ước trong khả năng.', code: 'VIP-WISH-UNLIMITED', tone: '#c18b3e' },
  { title: 'Phiếu Bao Ăn Một Bữa', desc: 'Chọn món em thèm, người tặng mời một bữa thật ngon.', code: 'FOOD-LOVER-2026', tone: '#5d9c97' },
  { title: 'Voucher Phim Đôi', desc: 'Một buổi xem phim kèm bắp nước để em thư giãn.', code: 'MOVIE-NIGHT-FOR2', tone: '#8867c6' },
  { title: 'Phiếu Cà Phê Hẹn Hò', desc: 'Một cuộc hẹn cà phê và câu chuyện em muốn kể.', code: 'COFFEE-DATE-2026', tone: '#b87354' },
  { title: 'Quỹ Mua Sách', desc: 'Một cuốn sách bất kỳ em muốn thêm vào kệ.', code: 'BOOKS-FOR-MINHANH', tone: '#517fa4' },
  { title: 'Ngày Không Làm Gì', desc: 'Một ngày được chiều chuộng và không cần bận tâm gì.', code: 'REST-DAY-PASS', tone: '#a56c88' },
  { title: 'Voucher Bánh Ngọt', desc: 'Chọn chiếc bánh em thích để kéo dài niềm vui sinh nhật.', code: 'SWEET-TREAT-2026', tone: '#d17b5d' },
];

const REWARD_WEIGHTS = [24, 28, 22, 9, 7, 4, 3, 3];
export const GIFT_CARD = Object.freeze({title:'Hộp quà sinh nhật',description:'Mở hộp quà và thử vận may với những món quà dành riêng cho bạn.',action:'Quay quà'});

export const DEFAULT_GIFT_REWARDS = ORIGINAL_REWARDS.map((reward,index) => ({...reward,id:`default-gift-${index+1}`,weight:REWARD_WEIGHTS[index]}));
export const getGiftRewards = content => content.giftRewards === undefined ? DEFAULT_GIFT_REWARDS : content.giftRewards;
export function pickRewardIndex(rewards, random = Math.random) {
  if (!rewards.length) return -1;
  const total = rewards.reduce((sum,reward) => sum + reward.weight,0);
  let cursor = random() * total;
  for (let index=0;index<rewards.length;index++) {
    cursor -= rewards[index].weight;
    if (cursor < 0) return index;
  }
  return rewards.length-1;
}
export function rewardRollTarget(count,index) {
  return Math.ceil(24/count)*count + index;
}
