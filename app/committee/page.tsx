'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../src/components/Header/Header';
import Footer from '../../src/components/Footer/Footer';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { allEventsData } from '../../src/data/allEvents';
import { COMMITTEE_EMAILS } from '../../src/data/committeeEmails';
import type { Database } from '../../src/lib/supabase';

type Registration = Database['public']['Tables']['event_registrations']['Row'];
type MemberName = Pick<Database['public']['Tables']['members']['Row'], 'first_name' | 'last_name'>;
type RegistrationStatus = 'accepted' | 'rejected';

function normalizeName(name: string | null | undefined) {
  return (name || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export default function CommitteePage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [members, setMembers] = useState<MemberName[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const isAuthorized = isLoggedIn && COMMITTEE_EMAILS.includes(user?.email ?? '');

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.push('/login?redirect=/committee');
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    async function loadData() {
      if (!isAuthorized) {
        setLoadingData(false);
        return;
      }

      const [{ data: regs, error: regsError }, { data: mems, error: memsError }] = await Promise.all([
        supabase.from('event_registrations').select('*').order('created_at', { ascending: true }),
        supabase.from('members').select('first_name, last_name'),
      ]);

      if (!regsError && regs) setRegistrations(regs);
      if (!memsError && mems) setMembers(mems);
      setLoadingData(false);
    }

    loadData();
  }, [isAuthorized]);

  const isMemberName = (fullName: string | null) => {
    const typed = normalizeName(fullName);
    if (!typed) return false;
    return members.some((m) => normalizeName(`${m.first_name || ''} ${m.last_name || ''}`) === typed);
  };

  const handleStatusChange = async (regId: number, newStatus: RegistrationStatus) => {
    setActionId(regId);
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: newStatus })
      .eq('id', regId);

    if (!error) {
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: newStatus } : r))
      );

      const reg = registrations.find((r) => r.id === regId);
      if (reg) {
        const eventInfo = allEventsData.find((e) => e.id === reg.event_id);
        const eventTitle = eventInfo ? eventInfo.title.ar : `فعالية #${reg.event_id}`;

        // إرسال إيميل القبول/الرفض بدون ما نوقف الواجهة بانتظاره
        supabase.functions.invoke('send-status-email', {
          body: {
            to: reg.email,
            fullName: reg.full_name,
            eventTitle,
            status: newStatus,
          },
        }).catch((err) => console.error('status email error:', err));
      }
    }
    setActionId(null);
  };

  const registrationsByEvent = registrations.reduce((acc, reg) => {
    const key = reg.event_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(reg);
    return acc;
  }, {} as Record<number, Registration[]>);

  if (loading || (isLoggedIn && loadingData)) {
    return (
      <div style={{ backgroundColor: '#0D0E12', minHeight: '100vh' }}>
        <Header />
        <div style={{ color: '#fff', textAlign: 'center', padding: '80px 20px' }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  if (!isAuthorized) {
    return (
      <div style={{ backgroundColor: '#0D0E12', minHeight: '100vh' }}>
        <Header />
        <div style={{ color: '#fff', textAlign: 'center', padding: '80px 20px' }}>
          <h2>غير مصرح لك بالدخول لهذه الصفحة</h2>
          <p style={{ color: '#888' }}>هذه الصفحة مخصصة لأعضاء اللجنة فقط.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const eventIdsWithRegs = Object.keys(registrationsByEvent).map(Number);

  return (
    <div style={{ backgroundColor: '#0D0E12', minHeight: '100vh' }}>
      <Header />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: '#fff' }}>
        <h1 style={{ marginBottom: '8px' }}>مراجعة تسجيلات الفعاليات</h1>
        <p style={{ color: '#888', marginBottom: '32px' }}>
          إجمالي التسجيلات: {registrations.length}
        </p>

        {eventIdsWithRegs.length === 0 && (
          <p style={{ color: '#888' }}>لا يوجد أي تسجيلات حتى الآن.</p>
        )}

        {eventIdsWithRegs.map((eventId) => {
          const eventInfo = allEventsData.find((e) => e.id === eventId);
          const eventTitle = eventInfo ? eventInfo.title.ar : `فعالية #${eventId}`;
          const regs = registrationsByEvent[eventId] ?? [];

          return (
            <div key={eventId} style={{ marginBottom: '40px' }}>
              <h2 style={{
                color: '#00E676',
                borderBottom: '1px solid #2a2d33',
                paddingBottom: '10px',
                marginBottom: '16px',
              }}>
                {eventTitle} <span style={{ color: '#888', fontSize: '14px' }}>({regs.length} مسجل)</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {regs.map((reg) => {
                  const member = isMemberName(reg.full_name);
                  return (
                    <div
                      key={reg.id}
                      style={{
                        background: '#16181d',
                        border: '1px solid #2a2d33',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {reg.full_name || 'بدون اسم'}{' '}
                          <span style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            marginRight: '6px',
                            background: member ? 'rgba(0,230,118,0.15)' : 'rgba(255,193,7,0.15)',
                            color: member ? '#00E676' : '#FFC107',
                          }}>
                            {member ? 'عضو' : 'زائر'}
                          </span>
                        </div>
                        <div style={{ color: '#888', fontSize: '14px' }}>{reg.email}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '13px',
                          color:
                            reg.status === 'accepted' ? '#00E676' :
                            reg.status === 'rejected' ? '#ef4444' : '#888',
                        }}>
                          {reg.status === 'accepted' ? 'مقبول' : reg.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                        </span>

                        <button
                          onClick={() => handleStatusChange(reg.id, 'accepted')}
                          disabled={actionId === reg.id}
                          style={{
                            background: '#00E676',
                            color: '#000',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            opacity: reg.status === 'accepted' ? 0.5 : 1,
                          }}
                        >
                          قبول
                        </button>

                        <button
                          onClick={() => handleStatusChange(reg.id, 'rejected')}
                          disabled={actionId === reg.id}
                          style={{
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            opacity: reg.status === 'rejected' ? 0.5 : 1,
                          }}
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      <Footer />
    </div>
  );
}