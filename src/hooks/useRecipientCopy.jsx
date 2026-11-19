import React, { createContext, useContext } from 'react';
export const RecipientGenderContext=createContext(undefined);
export function recipientCopy(gender){const you=gender==='male'?'anh':gender==='female'?'em':'bạn';return {you,day:`Ngày của ${you}`,wishTitle:`✨ Ước nguyện của ${you} đã bay lên vũ trụ! ✨`,wishPlaceholder:`Gõ điều ước sinh nhật bí mật của ${you} vào đây…`,sample:name=>`Chúc mừng sinh nhật ${name||you}! Chúc ${you} một tuổi mới thật nhiều niềm vui, bình an và những điều tuyệt vời. Mong rằng mỗi ngày đều có một lý do để ${you} mỉm cười!`};}
export const useRecipientCopy=()=>recipientCopy(useContext(RecipientGenderContext));
