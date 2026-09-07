'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// قاموس الأسماء المختصرة للمسارات
const routeNameMap = {
  about: 'عن المجتمع',
  members: 'الأعضاء',
  events: 'الفعاليات',
  articles: 'المقالات',
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter((segment) => segment !== '');

  return (
    <nav className="sdc-breadcrumb-nav" aria-label="breadcrumb">
      <ol style={{ display: 'flex', gap: '6px', listStyle: 'none', padding: 0, margin: '0 0 8px 0', alignItems: 'center' }}>
        
        {/* رابط الرئيسية - ينقلك للصفحة الرئيسية / عند الضغط */}
        <li>
          <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>
            الرئيسية
          </Link>
        </li>

        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          
          // إذا كانت تفاصيل عضو (ID أرقام)، يعرض "تفاصيل العضو"، وإلا يقرأ من القاموس
          let translatedName = routeNameMap[segment];
          if (!translatedName) {
            translatedName = !isNaN(segment) ? 'تفاصيل العضو' : decodeURIComponent(segment);
          }

          return (
            <li key={href} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>&gt;</span>
              {isLast ? (
                <span style={{ color: '#E5E7EB', fontWeight: '600', fontSize: '0.85rem' }}>
                  {translatedName}
                </span>
              ) : (
                <Link href={href} style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>
                  {translatedName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}