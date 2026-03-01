import React from 'react';

type ModalProps = {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ show, onClose, title, children }: ModalProps) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 560, maxWidth: '90vw', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
