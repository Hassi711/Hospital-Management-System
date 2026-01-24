import React, { useEffect } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirm-modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirm-modal-container">
        <div className="confirm-modal-content">
          <div className="confirm-modal-header">
            <h3 className="confirm-modal-title">{title}</h3>
          </div>
          <div className="confirm-modal-body">
            <p className="confirm-modal-message">{message}</p>
          </div>
          <div className="confirm-modal-actions">
            <button
              className="confirm-modal-button confirm-modal-button-cancel"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              className={`confirm-modal-button ${isDestructive ? 'confirm-modal-button-destructive' : 'confirm-modal-button-confirm'}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






