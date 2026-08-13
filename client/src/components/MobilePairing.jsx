import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, ArrowRight, Loader2, AlertCircle, Lock } from 'lucide-react';

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
    // Only accept numeric characters
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto submit when all 6 digits entered
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
      } else {
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs[nextIndex].current?.focus();
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
    <div className="pairing-container mobile-pairing">
      <div className="pairing-card glass-panel">
        <div className="card-badge">
          <Smartphone className="badge-icon" />
          <span>Phone Connection</span>
        </div>

        <h2 className="pairing-headline">Enter connection code</h2>
        <p className="pairing-subtext">
          Enter the 6-digit code displayed on your computer screen:
        </p>

        <form onSubmit={handleSubmit} className="digit-form">
          <div className="digit-inputs-row" onPaste={handlePaste}>
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
                className={`digit-input ${digit ? 'filled' : ''}`}
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <div className="error-banner fade-in">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="connect-submit-btn"
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
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="security-note">
          <Lock className="sec-icon" />
          <span>Instant P2P connection. Code expires immediately upon connecting.</span>
        </div>
      </div>
    </div>
  );
}
