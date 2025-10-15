import { useEffect } from 'react';
import './Modal.css';

/**
 * AlertModal Component
 *
 * Beautiful alert dialog to replace ugly browser alert()
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Close handler
 * @param {string} title - Modal title
 * @param {string} message - Modal message/description
 * @param {string} variant - 'success' | 'error' | 'warning' | 'info'
 * @param {string} buttonText - Close button text (default: 'OK')
 * @param {number} autoCloseDelay - Auto-close after N milliseconds (0 = disabled)
 */
function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    variant = 'info',
    buttonText = 'OK',
    autoCloseDelay = 0
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

    // Auto-close timer
    useEffect(() => {
        if (isOpen && autoCloseDelay > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [isOpen, autoCloseDelay, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Map error variant to danger
    const iconVariant = variant === 'error' ? 'danger' : variant;

    // Icon based on variant
    const getIcon = () => {
        switch (variant) {
            case 'success':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
                    <div className={`modal-icon ${iconVariant}`}>
                        {getIcon()}
                    </div>
                    <div className="modal-content">
                        <h2 className="modal-title">{title}</h2>
                        <p className="modal-message large">{message}</p>
                    </div>
                </div>

                <div className="modal-actions center">
                    <button
                        className={`modal-btn ${variant === 'error' ? 'danger' : variant === 'success' ? 'success' : 'primary'}`}
                        onClick={onClose}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AlertModal;
