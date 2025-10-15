import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDaoAuthStore } from '../services/daoAuthStore';
import { daoProposalAPI, daoPatientAPI } from '../services/daoApi';
import AlertModal from '../components/Modal/AlertModal';
import './CreateProposal.css';

function CreateProposal() {
    const navigate = useNavigate();
    const { doctor, canCreateProposals } = useDaoAuthStore();

    // Form state
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        proposalType: 'URGENCY_UPDATE',
        urgencyLevel: 'STANDARD',
        patientHash: '',
        currentValue: '',
        proposedValue: '',
        reasoning: '',
        evidenceHash: '',
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Success modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdProposalId, setCreatedProposalId] = useState(null);

    // Patient data
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    // Load patients when component mounts
    useEffect(() => {
        loadPatients();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.patient-search-container')) {
                setShowPatientDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadPatients = async () => {
        try {
            setLoadingPatients(true);
            const response = await daoPatientAPI.getAllPatients();
            setPatients(response.data.patients || []);
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setLoadingPatients(false);
        }
    };

    // Filter patients based on search
    const filteredPatients = patients.filter(patient => {
        const searchLower = patientSearch.toLowerCase();
        return (
            patient.patientHash?.toLowerCase().includes(searchLower) ||
            patient.organType?.toLowerCase().includes(searchLower) ||
            patient.bloodType?.toLowerCase().includes(searchLower)
        );
    });

    const selectPatient = (patient) => {
        handleInputChange('patientHash', patient.patientHash);
        // Auto-fill current urgency if available
        if (patient.urgencyScore) {
            handleInputChange('currentValue', patient.urgencyScore.toString());
        }
        setPatientSearch('');
        setShowPatientDropdown(false);
    };

    // Check if user can create proposals
    if (!canCreateProposals()) {
        return (
            <div className="create-proposal-unauthorized">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2>Unauthorized</h2>
                <p>You must be an authorized doctor to create proposals.</p>
                <button onClick={() => navigate('/dashboard')} className="btn-back">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.proposalType) {
            newErrors.proposalType = 'Please select a proposal type';
        }

        if (!formData.urgencyLevel) {
            newErrors.urgencyLevel = 'Please select an urgency level';
        }

        if (formData.proposalType === 'URGENCY_UPDATE' || formData.proposalType === 'PATIENT_REMOVAL') {
            if (!formData.patientHash || formData.patientHash.trim().length === 0) {
                newErrors.patientHash = 'Patient hash is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (formData.proposalType === 'URGENCY_UPDATE') {
            if (!formData.currentValue || formData.currentValue.trim().length === 0) {
                newErrors.currentValue = 'Current urgency value is required';
            }

            if (!formData.proposedValue || formData.proposedValue.trim().length === 0) {
                newErrors.proposedValue = 'Proposed urgency value is required';
            }
        }

        if (formData.proposalType === 'SYSTEM_PARAMETER') {
            if (!formData.currentValue || formData.currentValue.trim().length === 0) {
                newErrors.currentValue = 'Current parameter value is required';
            }

            if (!formData.proposedValue || formData.proposedValue.trim().length === 0) {
                newErrors.proposedValue = 'Proposed parameter value is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors = {};

        if (!formData.reasoning || formData.reasoning.trim().length < 50) {
            newErrors.reasoning = 'Medical reasoning must be at least 50 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        let isValid = false;

        if (step === 1) isValid = validateStep1();
        if (step === 2) isValid = validateStep2();
        if (step === 3) isValid = validateStep3();

        if (isValid) {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const response = await daoProposalAPI.create({
                proposalType: formData.proposalType,
                urgencyLevel: formData.urgencyLevel,
                patientHash: formData.patientHash || undefined,
                currentValue: formData.currentValue ? parseInt(formData.currentValue) : undefined,
                proposedValue: formData.proposedValue ? parseInt(formData.proposedValue) : undefined,
                reasoning: formData.reasoning.trim(),
                evidenceHash: formData.evidenceHash.trim() || undefined,
            });

            // DEBUG: Log what we received from backend
            console.log('📥 RECEIVED FROM BACKEND:', {
                fullResponse: response.data,
                proposalId: response.data.proposalId,
                proposalIdType: typeof response.data.proposalId,
                hasProposalId: !!response.data.proposalId
            });

            // proposalId is at root level of response.data, not nested in proposal object
            const proposalId = response.data.proposalId;

            console.log('🔍 EXTRACTED proposalId:', proposalId, 'Type:', typeof proposalId);

            // Show success modal
            setCreatedProposalId(proposalId);
            setShowSuccessModal(true);

        } catch (err) {
            console.error('Error creating proposal:', err);
            setSubmitError(err.response?.data?.error || 'Failed to create proposal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-proposal-page">
            <div className="create-proposal-header">
                <button onClick={() => navigate('/proposals')} className="back-link">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Proposals
                </button>
                <h1>Create New Proposal</h1>
                <p className="subtitle">Submit a governance proposal for DAO review</p>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
                <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">Type & Urgency</div>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">Details</div>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                    <div className="step-number">3</div>
                    <div className="step-label">Reasoning</div>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
                    <div className="step-number">4</div>
                    <div className="step-label">Review</div>
                </div>
            </div>

            {/* Form Content */}
            <div className="form-content">
                {/* Step 1: Proposal Type & Urgency */}
                {step === 1 && (
                    <div className="form-step">
                        <h2>Select Proposal Type and Urgency</h2>

                        <div className="form-group">
                            <label>Proposal Type <span className="required">*</span></label>
                            <div className="proposal-type-grid">
                                <button
                                    type="button"
                                    className={`type-option ${formData.proposalType === 'URGENCY_UPDATE' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('proposalType', 'URGENCY_UPDATE')}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <strong>Urgency Update</strong>
                                    <small>Change patient urgency level</small>
                                </button>

                                <button
                                    type="button"
                                    className={`type-option ${formData.proposalType === 'PATIENT_REMOVAL' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('proposalType', 'PATIENT_REMOVAL')}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
                                    </svg>
                                    <strong>Patient Removal</strong>
                                    <small>Remove patient from waitlist</small>
                                </button>

                                <button
                                    type="button"
                                    className={`type-option ${formData.proposalType === 'SYSTEM_PARAMETER' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('proposalType', 'SYSTEM_PARAMETER')}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <strong>System Parameter</strong>
                                    <small>Modify system settings</small>
                                </button>

                                <button
                                    type="button"
                                    className={`type-option ${formData.proposalType === 'EMERGENCY_OVERRIDE' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('proposalType', 'EMERGENCY_OVERRIDE')}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <strong>Emergency Override</strong>
                                    <small>Critical immediate action</small>
                                </button>
                            </div>
                            {errors.proposalType && <span className="error-message">{errors.proposalType}</span>}
                        </div>

                        {(formData.proposalType === 'URGENCY_UPDATE' || formData.proposalType === 'PATIENT_REMOVAL') && (
                            <div className="form-group">
                                <label htmlFor="patientHash">Select Patient <span className="required">*</span></label>

                                {/* Search/Filter Input */}
                                <div className="patient-search-container">
                                    <input
                                        type="text"
                                        id="patientSearch"
                                        value={patientSearch}
                                        onChange={(e) => {
                                            setPatientSearch(e.target.value);
                                            setShowPatientDropdown(true);
                                        }}
                                        onFocus={() => setShowPatientDropdown(true)}
                                        placeholder="Search patients by hash, organ type, or blood type..."
                                        className="patient-search-input"
                                    />

                                    {/* Dropdown List */}
                                    {showPatientDropdown && (
                                        <div className="patient-dropdown">
                                            {loadingPatients ? (
                                                <div className="dropdown-loading">Loading patients...</div>
                                            ) : filteredPatients.length === 0 ? (
                                                <div className="dropdown-empty">
                                                    {patientSearch ? 'No patients found' : 'No patients available'}
                                                </div>
                                            ) : (
                                                <div className="dropdown-list">
                                                    {filteredPatients.map((patient, index) => (
                                                        <div
                                                            key={index}
                                                            className="dropdown-item"
                                                            onClick={() => selectPatient(patient)}
                                                        >
                                                            <div className="patient-info">
                                                                <div className="patient-hash">
                                                                    {patient.patientHash?.substring(0, 20)}...
                                                                </div>
                                                                <div className="patient-details">
                                                                    <span className="badge badge-organ">{patient.organType}</span>
                                                                    <span className="badge badge-blood">{patient.bloodType}</span>
                                                                    <span className="urgency-badge">Score: {patient.urgencyScore || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Patient Display */}
                                {formData.patientHash && (
                                    <div className="selected-patient">
                                        <strong>Selected:</strong> {formData.patientHash.substring(0, 30)}...
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('patientHash', '')}
                                            className="btn-clear"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {errors.patientHash && <span className="error-message">{errors.patientHash}</span>}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Urgency Level <span className="required">*</span></label>
                            <div className="urgency-level-options">
                                <button
                                    type="button"
                                    className={`urgency-option emergency ${formData.urgencyLevel === 'EMERGENCY' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('urgencyLevel', 'EMERGENCY')}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <strong>Emergency</strong>
                                        <small>24-48 hour voting period</small>
                                        <small>Requires 66% approval</small>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`urgency-option standard ${formData.urgencyLevel === 'STANDARD' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('urgencyLevel', 'STANDARD')}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <strong>Standard</strong>
                                        <small>7-14 day voting period</small>
                                        <small>Requires 60% approval</small>
                                    </div>
                                </button>
                            </div>
                            {errors.urgencyLevel && <span className="error-message">{errors.urgencyLevel}</span>}
                        </div>
                    </div>
                )}

                {/* Step 2: Proposal Details */}
                {step === 2 && (
                    <div className="form-step">
                        <h2>Proposal Details</h2>

                        {formData.proposalType === 'URGENCY_UPDATE' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="currentValue">Current Urgency Score <span className="required">*</span></label>
                                    <input
                                        type="number"
                                        id="currentValue"
                                        value={formData.currentValue}
                                        onChange={(e) => handleInputChange('currentValue', e.target.value)}
                                        placeholder="e.g., 50"
                                        min="0"
                                        max="100"
                                        disabled
                                        className="read-only"
                                    />
                                    <small className="field-help">Auto-filled from patient's current urgency level</small>
                                    {errors.currentValue && <span className="error-message">{errors.currentValue}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="proposedValue">Proposed Urgency Score <span className="required">*</span></label>
                                    <input
                                        type="number"
                                        id="proposedValue"
                                        value={formData.proposedValue}
                                        onChange={(e) => handleInputChange('proposedValue', e.target.value)}
                                        placeholder="e.g., 85"
                                        min="0"
                                        max="100"
                                    />
                                    {errors.proposedValue && <span className="error-message">{errors.proposedValue}</span>}
                                </div>
                            </>
                        )}

                        {formData.proposalType === 'SYSTEM_PARAMETER' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="currentValue">Current Parameter Value <span className="required">*</span></label>
                                    <input
                                        type="number"
                                        id="currentValue"
                                        value={formData.currentValue}
                                        onChange={(e) => handleInputChange('currentValue', e.target.value)}
                                        placeholder="Current value"
                                    />
                                    {errors.currentValue && <span className="error-message">{errors.currentValue}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="proposedValue">Proposed Parameter Value <span className="required">*</span></label>
                                    <input
                                        type="number"
                                        id="proposedValue"
                                        value={formData.proposedValue}
                                        onChange={(e) => handleInputChange('proposedValue', e.target.value)}
                                        placeholder="Proposed value"
                                    />
                                    {errors.proposedValue && <span className="error-message">{errors.proposedValue}</span>}
                                </div>
                            </>
                        )}

                        {(formData.proposalType === 'PATIENT_REMOVAL' || formData.proposalType === 'EMERGENCY_OVERRIDE') && (
                            <div className="info-box">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <strong>No additional details required</strong>
                                    <p>You'll provide medical reasoning in the next step.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Reasoning & Evidence */}
                {step === 3 && (
                    <div className="form-step">
                        <h2>Medical Reasoning & Evidence</h2>

                        <div className="form-group">
                            <label htmlFor="reasoning">Medical Reasoning <span className="required">*</span></label>
                            <textarea
                                id="reasoning"
                                value={formData.reasoning}
                                onChange={(e) => handleInputChange('reasoning', e.target.value)}
                                placeholder="Provide detailed medical reasoning for this proposal. This will be publicly visible and must be at least 50 characters. Explain why this change is necessary from a medical perspective."
                                rows={8}
                                maxLength={2000}
                            />
                            <div className="character-count">
                                {formData.reasoning.length}/2000 characters
                                {formData.reasoning.length > 0 && formData.reasoning.length < 50 && (
                                    <span className="warning"> (Min 50 required)</span>
                                )}
                            </div>
                            {errors.reasoning && <span className="error-message">{errors.reasoning}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="evidenceHash">Evidence Hash (Optional)</label>
                            <input
                                type="text"
                                id="evidenceHash"
                                value={formData.evidenceHash}
                                onChange={(e) => handleInputChange('evidenceHash', e.target.value)}
                                placeholder="IPFS hash or document reference (e.g., QmX...)"
                            />
                            <small className="field-help">
                                Upload supporting medical documents to IPFS and provide the hash here
                            </small>
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="form-step review-step">
                        <h2>Review Your Proposal</h2>

                        <div className="review-section">
                            <h3>Proposal Type</h3>
                            <p className="review-value">{formData.proposalType.replace(/_/g, ' ')}</p>
                        </div>

                        <div className="review-section">
                            <h3>Urgency Level</h3>
                            <span className={`urgency-badge ${formData.urgencyLevel.toLowerCase()}`}>
                                {formData.urgencyLevel}
                            </span>
                        </div>

                        {formData.patientHash && (
                            <div className="review-section">
                                <h3>Patient Hash</h3>
                                <p className="review-value mono">{formData.patientHash}</p>
                            </div>
                        )}

                        {formData.currentValue && (
                            <div className="review-section">
                                <h3>Value Change</h3>
                                <div className="value-change-display">
                                    <span className="value-current">{formData.currentValue}</span>
                                    <span className="arrow">→</span>
                                    <span className="value-proposed">{formData.proposedValue}</span>
                                </div>
                            </div>
                        )}

                        <div className="review-section">
                            <h3>Medical Reasoning</h3>
                            <div className="review-reasoning">{formData.reasoning}</div>
                        </div>

                        {formData.evidenceHash && (
                            <div className="review-section">
                                <h3>Evidence</h3>
                                <p className="review-value mono">{formData.evidenceHash}</p>
                            </div>
                        )}

                        {submitError && (
                            <div className="error-box">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{submitError}</span>
                            </div>
                        )}

                        <div className="final-warning">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <strong>This proposal will be permanently recorded on the blockchain</strong>
                                <p>Once submitted, it cannot be edited or deleted. All details will be publicly visible.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
                {step > 1 && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="btn-secondary"
                        disabled={isSubmitting}
                    >
                        Back
                    </button>
                )}

                {step < 4 && (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="btn-primary"
                    >
                        Next
                    </button>
                )}

                {step === 4 && (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="btn-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner"></span>
                                Submitting to Blockchain...
                            </>
                        ) : (
                            <>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Submit Proposal
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Success Modal */}
            <AlertModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate(`/proposals/${createdProposalId}`);
                }}
                title="Proposal Created Successfully!"
                message={`Your proposal #${createdProposalId} has been submitted to the blockchain and is now open for voting.`}
                variant="success"
                buttonText="View Proposal"
            />
        </div>
    );
}

export default CreateProposal;
