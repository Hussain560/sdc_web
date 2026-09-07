import { LanguageProvider } from '../src/context/LanguageContext';
import { SearchProvider } from '../src/context/SearchContext';
import { AuthProvider } from '../src/context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'Saudi Developer Community',
  description: 'Saudi Developer Community platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            <SearchProvider>
              {children}
            </SearchProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}