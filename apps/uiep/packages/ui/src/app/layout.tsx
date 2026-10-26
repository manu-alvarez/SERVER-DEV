import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UIEP - Universal Intelligence Engineering Platform',
  description: 'Design, generate, and deploy intelligent systems from a single platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
