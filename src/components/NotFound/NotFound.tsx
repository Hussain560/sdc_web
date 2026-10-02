'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="sdc-notfound-page-wrapper">
      <Header />

      <main className="sdc-notfound-main">
        <div className="sdc-notfound-container">
          {/* البوكس المحدد في الفيجما مع الأيقونات المبعثرة بمقاسات مختلفة */}
          <div className="sdc-notfound-graphic-wrapper">
            {/* أيقونات كبيرة ووسط وصغيرة مكررة وموزعة */}
            <img
              src="/assets/cancel-02.png"
              alt="icon"
              className="sdc-floating-img icon-lg pos-top-center"
            />
            <img
              src="/assets/search-remove.png"
              alt="icon"
              className="sdc-floating-img icon-sm pos-top-left-1"
            />
            <img
              src="/assets/cancel-circle.png"
              alt="icon"
              className="sdc-floating-img icon-md pos-top-right-1"
            />
            <img
              src="/assets/unavailable.png"
              alt="icon"
              className="sdc-floating-img icon-lg pos-top-right-2"
            />
            <img
              src="/assets/alert-02.png"
              alt="icon"
              className="sdc-floating-img icon-sm pos-mid-right"
            />

            <img
              src="/assets/cancel-02.png"
              alt="icon"
              className="sdc-floating-img icon-md pos-mid-left-far"
            />
            <img
              src="/assets/search-remove.png"
              alt="icon"
              className="sdc-floating-img icon-lg pos-mid-left-near"
            />
            <img
              src="/assets/cancel-circle.png"
              alt="icon"
              className="sdc-floating-img icon-sm pos-bottom-right-far"
            />
            <img
              src="/assets/alert-02.png"
              alt="icon"
              className="sdc-floating-img icon-md pos-bottom-right-near"
            />

            <img
              src="/assets/unavailable.png"
              alt="icon"
              className="sdc-floating-img icon-lg pos-bottom-center"
            />
            <img
              src="/assets/cancel-circle.png"
              alt="icon"
              className="sdc-floating-img icon-md pos-bottom-left-1"
            />
            <img
              src="/assets/cancel-02.png"
              alt="icon"
              className="sdc-floating-img icon-sm pos-bottom-left-2"
            />

            {/* رقم 404 مطبق بلون الفيجما والفوتر */}
            <h1 className="sdc-404-number">404</h1>
          </div>

          {/* النصوص والزر */}
          <h2 className="sdc-notfound-title">حدث خطأ</h2>
          <p className="sdc-notfound-desc">عذراً، لم نستطع إيجاد الصفحة التي تبحث عنها</p>

          <Link href="/" className="sdc-back-home-btn">
            الرجوع للرئيسية
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
