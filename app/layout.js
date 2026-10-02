import { LanguageProvider } from '../src/context/LanguageContext';
import { SearchProvider } from '../src/context/SearchContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import './globals.css';

export const metadata = {
  title: 'Saudi Developer Community',
  description: 'Saudi Developer Community platform',
};

// يشتغل قبل أول رسم للصفحة عشان ما يصير "فلاش" لوضع خاطئ قبل ما تجهز React.
// الديفولت Dark دايمًا إلا إذا كان عندنا اختيار محفوظ للمستخدم يقول Light.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('sdc_theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SearchProvider>
                {children}
              </SearchProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}