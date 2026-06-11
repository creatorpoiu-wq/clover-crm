import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Session',
  description: 'Book your session online.'
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
