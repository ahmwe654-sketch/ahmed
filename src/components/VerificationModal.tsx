import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

interface VerificationModalProps {
  onClose: () => void;
}

export default function VerificationModal({ onClose }: VerificationModalProps) {
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Timers & Limits
  const [cooldown, setCooldown] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(300); // 5 دقائق (300 ثانية)
  const [attempts, setAttempts] = useState(0);

  // إدارة عداد الـ Cooldown للزرار
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // إدارة عداد انتهاء صلاحية الكود (5 دقائق)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && expiryTimer > 0) {
      timer = setInterval(() => setExpiryTimer((prev) => prev - 1), 1000);
    } else if (expiryTimer === 0 && step === 2) {
      setGeneratedCode('');
      setStatusMsg('Expired! Code is no longer valid. Please request a new one.');
      setIsError(true);
    }
    return () => clearInterval(timer);
  }, [step, expiryTimer]);

  // دالة إرسال الكود عبر EmailJS
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setLoading(true);
    setStatusMsg('');
    setIsError(false);

    // توليد كود عشوائي مكون من 6 أرقام
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    emailjs
      .send(
        'service_hqewk0j',
        'template_tpxi2sp',
        { email: email, passcode: code },
        'kfxnN3n5Q3scuoOXx'
      )
      .then(() => {
        setLoading(false);
        setStep(2);
        setCooldown(60); // قفل الزرار لمدة 60 ثانية
        setExpiryTimer(300); // إعادة العداد لـ 5 دقائق
        setAttempts(0); // إعادة صفر للمحاولات
        setStatusMsg('Verification code sent! Check your inbox.');
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setIsError(true);
        setStatusMsg('Failed to send code. Please try again.');
      });
  };

  // دالة التحقق من الكود المدخل
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (expiryTimer === 0) {
      setStatusMsg('This code has expired. Please resend a new code.');
      setIsError(true);
      return;
    }

    if (attempts >= 3) {
      setStatusMsg('Too many failed attempts. Please request a new code.');
      setIsError(true);
      return;
    }

    if (userCode.trim() === generatedCode) {
      setIsError(false);
      setStatusMsg('✅ Access Granted! Welcome to Aegis Core.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setIsError(true);
      if (newAttempts >= 3) {
        setStatusMsg('❌ Too many incorrect attempts. Code blocked.');
      } else {
        setStatusMsg(`❌ Invalid code! Attempts remaining: ${3 - newAttempts}`);
      }
    }
  };

  // تنسيق الثواني إلى شكل دقائق:ثواني (05:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#12131C', padding: '28px', borderRadius: '16px',
        border: '1px solid #2B2D42', color: '#fff', width: '340px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)', position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* زرار الإغلاق */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '14px', background: 'none',
          border: 'none', color: '#6C7293', fontSize: '18px', cursor: 'pointer'
        }}>✕</button>

        {/* العنوان الرئيسي */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#5865F2', fontSize: '20px', fontWeight: 'bold' }}>
            Aegis Core
          </h3>
          <p style={{ margin: '4px 0 0', color: '#8A8FAD', fontSize: '12px' }}>
            {step === 1 ? 'Enter email for verification' : `Code sent to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid #2B2D42', backgroundColor: '#1A1B26',
                color: '#fff', marginBottom: '14px', outline: 'none',
                boxSizing: 'border-box', fontSize: '14px'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: loading ? '#3B4279' : '#5865F2', color: '#fff',
                fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', transition: 'background 0.2s'
              }}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <input
              type="text"
              placeholder="000000"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              maxLength={6}
              required
              disabled={attempts >= 3 || expiryTimer === 0}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid #2B2D42', backgroundColor: '#1A1B26',
                color: '#fff', marginBottom: '10px', textAlign: 'center',
                letterSpacing: '6px', fontSize: '20px', fontWeight: 'bold',
                outline: 'none', boxSizing: 'border-box'
              }}
            />

            {/* العداد التنازلي للـ Expiry */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '12px', color: '#8A8FAD', marginBottom: '14px'
            }}>
              <span>Code expires in:</span>
              <span style={{ color: expiryTimer < 60 ? '#ED4245' : '#57F287', fontWeight: 'bold' }}>
                {formatTime(expiryTimer)}
              </span>
            </div>

            <button
              type="submit"
              disabled={attempts >= 3 || expiryTimer === 0}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: attempts >= 3 || expiryTimer === 0 ? '#2B2D42' : '#23A55A',
                color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
              }}
            >
              Verify & Access
            </button>

            {/* زرار إعادة الإرسال مع Cooldown */}
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={cooldown > 0 || loading}
                style={{
                  background: 'none', border: 'none', color: cooldown > 0 ? '#4A4D6B' : '#5865F2',
                  fontSize: '12px', cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* رسائل التنبيه والخطأ */}
        {statusMsg && (
          <div style={{
            marginTop: '14px', padding: '10px', borderRadius: '6px',
            backgroundColor: isError ? 'rgba(237, 66, 69, 0.1)' : 'rgba(87, 242, 135, 0.1)',
            border: `1px solid ${isError ? 'rgba(237, 66, 69, 0.3)' : 'rgba(87, 242, 135, 0.3)'}`,
            color: isError ? '#ED4245' : '#57F287', fontSize: '12px',
            textAlign: 'center', lineHeight: '1.4'
          }}>
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
}
