import React from 'react';

const TREATS = ['🍬', '🍭', '🧁', '🍩', '🍪', '🍰', '🍫', '🍬', '🍭', '🧁'];

export default function FallingTreats() {
  return (
    <div className="falling-treats" aria-hidden="true">
      {TREATS.map((treat, index) => (
        <span
          key={`${treat}-${index}`}
          className="falling-treat"
          style={{
            '--treat-left': `${6 + ((index * 11) % 86)}%`,
            '--treat-delay': `${-(index * 2.1)}s`,
            '--treat-duration': `${15 + (index % 4) * 2}s`,
            '--treat-size': `${22 + (index % 3) * 6}px`,
            '--treat-rotation': `${index % 2 ? 360 : -360}deg`,
          }}
        >
          {treat}
        </span>
      ))}
    </div>
  );
}
