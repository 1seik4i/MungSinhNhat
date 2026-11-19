import records from './data/guanyin100.json' with { type: 'json' };
export const FORTUNE_CATALOG_VERSION = 'ctc-guanyin-100-v1';
export const FORTUNE_CARD = Object.freeze({image:'',title:'Gieo quẻ may mắn',description:'Rút một trong 100 quẻ Quan Âm để đọc lời nhắn cho tuổi mới.',action:'Gieo quẻ'});
export const DEFAULT_FORTUNES = Object.freeze(records.map(record=>Object.freeze(record)));
export const getFortunes = () => DEFAULT_FORTUNES;
export function drawFortune(random=Math.random) {
 return DEFAULT_FORTUNES[Math.min(99,Math.max(0,Math.floor(random()*100)))];
}
