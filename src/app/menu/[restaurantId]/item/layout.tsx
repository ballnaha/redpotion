'use client';

export default function ItemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: "'Prompt', sans-serif" }}>
      {children}
    </div>
  );
} 