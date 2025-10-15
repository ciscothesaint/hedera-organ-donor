import { useEffect } from 'react';
import './Modal.css';

/**
 * ConfirmModal Component
 *
 * Beautiful confirmation dialog to replace ugly browser confirm()
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm button handler
 * @param {string} title - Modal title
 * @param {string} message - Modal message/description
 * @param {string} variant - 'danger' | 'warning' | 'info' | 'success'
 * @param {string} confirmText - Confirm button text (default: 'Confirm')
 * @param {string} cancelText - Cancel button text (default: 'Cancel')
 * @param {array} details - Array of {label, value, variant} for additional info
 * @param {string} warningText - Optional warning message
 * @param {boolean} loading - Show loading state on confirm button
 */
function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    variant = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    details = [],
    warningText = null,
    loading = false
}) {
    // Handle ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!loading) {
            onConfirm();
        }
    };

    // Icon based on variant
    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'success':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default: // info
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-container">
                <div className="modal-header">
                    <div className={`modal-icon ${variant}`}>
                        {getIcon()}
                    </div>
                    <div className="modal-content">
                        <h2 className="modal-title">{title}</h2>
                        <p className="modal-message">{message}</p>
                    </div>
                </div>

                {details.length > 0 && (
                    <div className="modal-details">
                        {details.map((detail, index) => (
                            <div key={index} className="modal-detail-item">
                                <span className="modal-detail-label">{detail.label}</span>
                                <span className={`modal-detail-value ${detail.variant || ''}`}>
                                    {detail.value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {warningText && (
                    <div className="modal-warning">
                        <p>{warningText}</p>
                    </div>
                )}

                <div className="modal-actions">
                    <button
                        className="modal-btn secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`modal-btn ${variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary'}`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="modal-loading">
                                <div className="modal-spinner"></div>
                                <span>Processing...</span>
                            </div>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
