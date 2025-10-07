import React, { useState } from 'react';
import axios from 'axios';
import './PatientRegistration.css';

function PatientRegistration() {
    const [formData, setFormData] = useState({
        nationalId: '',
        organType: 'KIDNEY',
        bloodType: 'O+',
        urgencyScore: 50,
        location: '',
        hospitalId: ''
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await axios.post(
                'http://localhost:3001/api/patients/register',
                formData
            );

            setResult({
                success: true,
                patientHash: response.data.data.patientHash,
                transactionId: response.data.data.transactionId,
                status: response.data.data.status
            });

            // Generate QR code for patient
            generateQRCode(response.data.data.patientHash);

            // Reset form
            setFormData({
                nationalId: '',
                organType: 'KIDNEY',
                bloodType: 'O+',
                urgencyScore: 50,
                location: '',
                hospitalId: ''
            });

        } catch (error) {
            setResult({
                success: false,
                error: error.response?.data?.error || 'Registration failed. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async (patientHash) => {
        try {
            // Create QR code data
            const qrData = {
                patientHash,
                checkUrl: `http://localhost:3000/check-position/${patientHash}`,
                timestamp: new Date().toISOString()
            };

            // Display QR code (using text representation for now)
            // In production, use a QR code library like qrcode.react
            const qrElement = document.getElementById('qrcode');
            if (qrElement) {
                qrElement.innerHTML = `
                    <div class="qr-placeholder">
                        <p>📱 QR Code</p>
                        <p class="qr-data">${patientHash}</p>
                        <p class="qr-note">Scan to check your position</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    const handleChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    return (
        <div className="registration-container">
            <h2>Patient Registration</h2>
            <p className="subtitle">Register for organ transplant waitlist</p>

            <form onSubmit={handleSubmit} className="registration-form">
                <div className="form-group">
                    <label>National ID / Patient ID *</label>
                    <input
                        type="text"
                        placeholder="Enter patient identification number"
                        value={formData.nationalId}
                        onChange={(e) => handleChange('nationalId', e.target.value)}
                        required
                        disabled={loading}
                    />
                    <small>This will be hashed for privacy</small>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Organ Type *</label>
                        <select
                            value={formData.organType}
                            onChange={(e) => handleChange('organType', e.target.value)}
                            disabled={loading}
                        >
                            <option value="KIDNEY">Kidney</option>
                            <option value="LIVER">Liver</option>
                            <option value="HEART">Heart</option>
                            <option value="LUNGS">Lungs</option>
                            <option value="PANCREAS">Pancreas</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Blood Type *</label>
                        <select
                            value={formData.bloodType}
                            onChange={(e) => handleChange('bloodType', e.target.value)}
                            disabled={loading}
                        >
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Urgency Score (0-100) *</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.urgencyScore}
                        onChange={(e) => handleChange('urgencyScore', parseInt(e.target.value))}
                        disabled={loading}
                    />
                    <div className="urgency-display">
                        <span>Current: {formData.urgencyScore}</span>
                        <span className={`urgency-badge ${
                            formData.urgencyScore >= 75 ? 'high' :
                            formData.urgencyScore >= 50 ? 'medium' : 'low'
                        }`}>
                            {formData.urgencyScore >= 75 ? 'High' :
                             formData.urgencyScore >= 50 ? 'Medium' : 'Low'}
                        </span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Location *</label>
                    <input
                        type="text"
                        placeholder="City or Region"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Hospital ID</label>
                    <input
                        type="text"
                        placeholder="Hospital identification code"
                        value={formData.hospitalId}
                        onChange={(e) => handleChange('hospitalId', e.target.value)}
                        disabled={loading}
                    />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Registering on Blockchain...
                        </>
                    ) : (
                        'Register Patient'
                    )}
                </button>
            </form>

            {result && (
                <div className={`result ${result.success ? 'success' : 'error'}`}>
                    {result.success ? (
                        <div className="success-content">
                            <div className="success-icon">✅</div>
                            <h3>Registration Successful!</h3>

                            <div className="result-details">
                                <div className="detail-item">
                                    <strong>Patient Hash:</strong>
                                    <code>{result.patientHash}</code>
                                </div>
                                <div className="detail-item">
                                    <strong>Transaction ID:</strong>
                                    <code>{result.transactionId}</code>
                                </div>
                                <div className="detail-item">
                                    <strong>Status:</strong>
                                    <span className="badge badge-success">{result.status}</span>
                                </div>
                            </div>

                            <div id="qrcode" className="qr-container"></div>

                            <div className="next-steps">
                                <h4>Next Steps:</h4>
                                <ol>
                                    <li>Save your Patient Hash (shown above)</li>
                                    <li>Use the QR code to check your queue position</li>
                                    <li>You will be notified when a match is found</li>
                                </ol>
                            </div>
                        </div>
                    ) : (
                        <div className="error-content">
                            <div className="error-icon">❌</div>
                            <h3>Registration Failed</h3>
                            <p>{result.error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PatientRegistration;
