import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, ArrowRight, Loader2, AlertCircle, UploadCloud, Folder } from 'lucide-react';

export default function MobilePairing({ onConnect, isLoading, error, initialCode = '' }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (initialCode && initialCode.length === 6) {
      const newDigits = initialCode.split('').slice(0, 6);
      setDigits(newDigits);
      onConnect(initialCode);
    } else {
      inputRefs[0].current?.focus();
    }
  }, [initialCode]);

  const handleChange = (index, value) => {
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      onConnect(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = Array(6).fill('');
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      if (pasted.length === 6) {
        onConnect(pasted);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length === 6) {
      onConnect(code);
    }
  };

  return (
    <div className="pairing-container screen-pairing mobile-pairing-screen">
      {/* Pearl Glass Orb for Mobile */}
      <div className="pearl-orb-container">
        <div className="pearl-orb-outer">
          <div className="pearl-orb-inner orb-interactive">
            <UploadCloud size={32} className="orb-upload-icon" />
            <h3 className="orb-main-title">Enter 6-Digit Code</h3>
            <p className="orb-sub-title">Enter code from computer screen</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="digit-form-screen">
        <div className="digit-inputs-row-screen" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`digit-input-screen ${digit ? 'filled' : ''}`}
              disabled={isLoading}
            />
          ))}
        </div>

        {error && (
          <div className="error-banner-screen fade-in">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="pill-action-btn submit-connect-btn"
          disabled={isLoading || digits.join('').length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span>Connect to Computer</span>
              <ArrowRight size={18} className="btn-arrow" />
            </>
          )}
        </button>
      </form>

      <footer className="screen-pairing-footer">
        <p>Instantly pair devices with a one-time 6-digit code.</p>
      </footer>
    </div>
  );
}
