import React, { useState, useEffect } from 'react';
import './MedicalScoreCalculator.css';

function MedicalScoreCalculator({ isOpen, onClose, onSaveScore, patientData }) {
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState({});
    const [calculatedScore, setCalculatedScore] = useState(null);

    // Calculate BMI from patient data
    const calculateBMI = () => {
        if (patientData?.weight && patientData?.height) {
            const heightInMeters = patientData.height / 100;
            return (patientData.weight / (heightInMeters * heightInMeters)).toFixed(1);
        }
        return null;
    };

    // Calculate age from date of birth
    const calculateAge = () => {
        if (patientData?.dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(patientData.dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        }
        return null;
    };

    const questions = [
        {
            id: 'diagnosis',
            title: 'Primary Diagnosis Severity',
            subtitle: 'What is the severity of the condition requiring transplant?',
            type: 'radio',
            options: [
                { value: 25, label: 'Mild Condition', description: 'Manageable with medication, stable' },
                { value: 15, label: 'Moderate Condition', description: 'Regular monitoring required' },
                { value: 5, label: 'Severe Condition', description: 'Hospitalization needed' },
                { value: 0, label: 'Critical Condition', description: 'Life-threatening, ICU care' }
            ]
        },
        {
            id: 'complications',
            title: 'Co-morbidities & Complications',
            subtitle: 'How many additional medical conditions does the patient have?',
            type: 'radio',
            options: [
                { value: 20, label: 'No Complications', description: 'No other significant conditions' },
                { value: 15, label: '1-2 Complications', description: 'Minor additional conditions' },
                { value: 10, label: '3-4 Complications', description: 'Multiple conditions managed' },
                { value: 5, label: '5+ Complications', description: 'Complex medical history' }
            ]
        },
        {
            id: 'healthStatus',
            title: 'Current Health Status',
            subtitle: 'What is the patient\'s current overall health status?',
            type: 'radio',
            options: [
                { value: 20, label: 'Stable', description: 'Outpatient, managing at home' },
                { value: 15, label: 'Moderately Stable', description: 'Regular hospital visits' },
                { value: 10, label: 'Unstable', description: 'Frequent hospitalization' },
                { value: 5, label: 'Critical/ICU', description: 'Intensive care required' }
            ]
        },
        {
            id: 'ageScore',
            title: 'Age Factor',
            subtitle: calculateAge() ? `Patient Age: ${calculateAge()} years` : 'Age not provided',
            type: 'auto',
            calculate: () => {
                const age = calculateAge();
                if (age === null) return 10; // Default if age not provided
                if (age < 18) return 10;
                if (age <= 40) return 15;
                if (age <= 60) return 12;
                return 8;
            }
        },
        {
            id: 'bmiScore',
            title: 'Body Mass Index (BMI)',
            subtitle: calculateBMI() ? `Patient BMI: ${calculateBMI()}` : 'BMI not provided',
            type: 'auto',
            calculate: () => {
                const bmi = parseFloat(calculateBMI());
                if (isNaN(bmi)) return 8; // Default if BMI not provided
                if (bmi >= 18.5 && bmi < 25) return 10; // Normal
                if (bmi < 18.5) return 7; // Underweight
                if (bmi >= 25 && bmi < 30) return 8; // Overweight
                return 5; // Obese
            }
        },
        {
            id: 'surgeryHistory',
            title: 'Previous Major Surgeries',
            subtitle: 'How many major surgeries has the patient undergone?',
            type: 'radio',
            options: [
                { value: 10, label: 'No Previous Surgeries', description: 'No major surgical history' },
                { value: 8, label: '1-2 Surgeries', description: 'Minimal surgical history' },
                { value: 5, label: '3+ Surgeries', description: 'Extensive surgical history' }
            ]
        }
    ];

    const currentQuestion = questions[step - 1];

    useEffect(() => {
        // Auto-calculate scores for auto-type questions
        if (currentQuestion?.type === 'auto' && currentQuestion.calculate) {
            const autoScore = currentQuestion.calculate();
            setAnswers(prev => ({ ...prev, [currentQuestion.id]: autoScore }));
            // Auto-advance after showing auto-calculated score
            setTimeout(() => {
                if (step < questions.length) {
                    setStep(step + 1);
                } else {
                    calculateFinalScore();
                }
            }, 1500);
        }
    }, [step]);

    const handleAnswer = (value) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    };

    const handleNext = () => {
        if (answers[currentQuestion.id] !== undefined) {
            if (step < questions.length) {
                setStep(step + 1);
            } else {
                calculateFinalScore();
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const calculateFinalScore = () => {
        const total = Object.values(answers).reduce((sum, val) => sum + val, 0);
        setCalculatedScore(total);
    };

    const handleSave = () => {
        onSaveScore(calculatedScore);
        handleClose();
    };

    const handleClose = () => {
        setStep(1);
        setAnswers({});
        setCalculatedScore(null);
        onClose();
    };

    const handleRecalculate = () => {
        setStep(1);
        setAnswers({});
        setCalculatedScore(null);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-fair';
        return 'score-poor';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent Candidate';
        if (score >= 60) return 'Good Candidate';
        if (score >= 40) return 'Fair Candidate';
        return 'High Risk Candidate';
    };

    if (!isOpen) return null;

    return (
        <div className="medical-calculator-overlay" onClick={handleClose}>
            <div className="medical-calculator-modal" onClick={(e) => e.stopPropagation()}>
                {calculatedScore === null ? (
                    // Question Steps
                    <>
                        <div className="calculator-header">
                            <h2>🩺 Medical Score Calculator</h2>
                            <button className="close-btn" onClick={handleClose}>✕</button>
                        </div>

                        <div className="progress-bar">
                            <div className="progress-text">Step {step} of {questions.length}</div>
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${(step / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="question-card">
                            <h3 className="question-title">{currentQuestion.title}</h3>
                            <p className="question-subtitle">{currentQuestion.subtitle}</p>

                            {currentQuestion.type === 'radio' && (
                                <div className="options-list">
                                    {currentQuestion.options.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`option-card ${answers[currentQuestion.id] === option.value ? 'selected' : ''
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={currentQuestion.id}
                                                value={option.value}
                                                checked={answers[currentQuestion.id] === option.value}
                                                onChange={() => handleAnswer(option.value)}
                                            />
                                            <div className="option-content">
                                                <div className="option-label">{option.label}</div>
                                                <div className="option-description">{option.description}</div>
                                                <div className="option-points">{option.value} points</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {currentQuestion.type === 'auto' && (
                                <div className="auto-calculated">
                                    <div className="auto-icon">✓</div>
                                    <div className="auto-text">Automatically calculated</div>
                                    <div className="auto-score">{answers[currentQuestion.id] || 0} points</div>
                                </div>
                            )}
                        </div>

                        <div className="calculator-actions">
                            <button
                                className="btn-secondary"
                                onClick={handleBack}
                                disabled={step === 1}
                            >
                                ← Back
                            </button>
                            {currentQuestion.type === 'radio' && (
                                <button
                                    className="btn-primary"
                                    onClick={handleNext}
                                    disabled={answers[currentQuestion.id] === undefined}
                                >
                                    {step === questions.length ? 'Calculate Score' : 'Next →'}
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    // Results Screen
                    <>
                        <div className="calculator-header">
                            <h2>Medical Score Calculated</h2>
                            <button className="close-btn" onClick={handleClose}>✕</button>
                        </div>

                        <div className="results-screen">
                            <div className={`score-display ${getScoreColor(calculatedScore)}`}>
                                <div className="score-number">{calculatedScore}</div>
                                <div className="score-total">/ 100</div>
                            </div>
                            <div className="score-label">{getScoreLabel(calculatedScore)}</div>

                            <div className="score-breakdown">
                                <h3>Score Breakdown:</h3>
                                <div className="breakdown-list">
                                    <div className="breakdown-item">
                                        <span>Primary Diagnosis:</span>
                                        <span>{answers.diagnosis || 0} / 25</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span>Co-morbidities:</span>
                                        <span>{answers.complications || 0} / 20</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span>Health Status:</span>
                                        <span>{answers.healthStatus || 0} / 20</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span>Age Factor:</span>
                                        <span>{answers.ageScore || 0} / 15</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span>BMI:</span>
                                        <span>{answers.bmiScore || 0} / 10</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span>Surgery History:</span>
                                        <span>{answers.surgeryHistory || 0} / 10</span>
                                    </div>
                                    <div className="breakdown-total">
                                        <span>Total Score:</span>
                                        <span>{calculatedScore} / 100</span>
                                    </div>
                                </div>
                            </div>

                            <div className="results-actions">
                                <button className="btn-secondary" onClick={handleRecalculate}>
                                    🔄 Recalculate
                                </button>
                                <button className="btn-primary" onClick={handleSave}>
                                    ✓ Save Score
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default MedicalScoreCalculator;
