import React from 'react';

type ToastProps = {
  show: boolean;
  message: string;
  type?: 'success' | 'error';
};

export default function Toast({ show, message, type = 'success' }: ToastProps) {
  if (!show || !message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        background: type === 'success' ? '#38a169' : '#e53e3e',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 8,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}
