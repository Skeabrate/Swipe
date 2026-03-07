import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const cards = [
    {
      bg: 'linear-gradient(135deg, #f43f5e 0%, #9d174d 100%)',
      transform: 'rotate(-8deg) scale(0.9)',
    },
    {
      bg: 'linear-gradient(135deg, #2563eb 0%, #3730a3 100%)',
      transform: 'rotate(4deg) scale(0.95)',
    },
    { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', transform: 'rotate(-1deg)' },
  ];

  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        position: 'relative',
      }}
    >
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 112,
            height: 70,
            borderRadius: 16,
            background: card.bg,
            transform: card.transform,
          }}
        />
      ))}
    </div>,
    { width: 180, height: 180 },
  );
}
