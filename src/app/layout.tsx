import './globals.css';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <title>Wildlife Sanctuary Chatbot</title>
        <meta name="description" content="Chatbot providing information about wildlife sanctuaries and national parks" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="chat-container">
          {children}
        </div>
      </body>
    </html>
  );
}
