import React from 'react';
import birthdayCake from '../assets/birthday-cake.webp';
import balloon from '../assets/balloon.webp';
import birthdayBunting from '../assets/birthday-bunting-cropped.png';
import goldenBirthday from '../assets/golden-happy-birthday-cropped.png';
import partyPopper from '../assets/party-popper.webp';

export default function BirthdayDecorations() {
  return (
    <div className="birthday-decorations" aria-hidden="true">
      <img className="party-art party-art-top" src={birthdayBunting} alt="" />
      <img className="party-art party-art-golden-title" src={goldenBirthday} alt="" />
      <img className="party-art party-art-left" src={balloon} alt="" />
      <img className="party-art party-art-left-alt" src={balloon} alt="" />
      <img className="party-art party-art-right" src={birthdayCake} alt="" />
      <img className="party-art party-art-right-alt" src={partyPopper} alt="" />
    </div>
  );
}
