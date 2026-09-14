
import React, { useEffect, useState } from 'react'
import { api } from '../config/api.js'

function formatBytes(bytes) {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unit = 0

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }

  return `${size.toFixed(2)} ${units[unit]}`
}

function formatDate(value) {
  if (!value) return 'N/A'

  return new Date(value).toLocaleString()
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('doctors')

  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [doctorError, setDoctorError] = useState('')

  const [aiStatus, setAiStatus] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiError, setAiError] = useState('')

  const [dataset, setDataset] = useState(null)
  const [loadingDataset, setLoadingDataset] = useState(false)
  const [datasetError, setDatasetError] = useState('')

  const [testQuestion, setTestQuestion] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testingAI, setTestingAI] = useState(false)

  const [retraining, setRetraining] = useState(false)
  const [retrainMessage, setRetrainMessage] = useState('')

  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || '{}')
    } catch {
      return {}
    }
  })()

  // ---------------------------------------------------------------------------
  // Doctors
  // ---------------------------------------------------------------------------

  async function loadDoctors() {
    try {
      setLoadingDoctors(true)
      setDoctorError('')

      const response = await api.get('/api/doctors/admin/all')

      setDoctors(response.doctors || [])
    } catch (error) {
      console.error(error)
      setDoctorError(error.message || 'Failed to load doctors.')
    } finally {
      setLoadingDoctors(false)
    }
  }

  async function handleVerify(doctorId, verified) {
    try {
      await api.patch(
        `/api/doctors/admin/${doctorId}/verify`,
        { verified }
      )

      await loadDoctors()
    } catch (error) {
      alert(error.message || 'Failed to update doctor verification.')
    }
  }

  // ---------------------------------------------------------------------------
  // AI Model
  // ---------------------------------------------------------------------------

  async function loadAIStatus() {
    try {
      setLoadingAI(true)
      setAiError('')

      const response = await api.get('/api/admin/ai/status')

      setAiStatus(response)
    } catch (error) {
      console.error(error)
      setAiError(error.message || 'Failed to load AI model status.')
      setAiStatus(null)
    } finally {
      setLoadingAI(false)
    }
  }

  async function testAI() {
    if (!testQuestion.trim()) return

    try {
      setTestingAI(true)
      setTestResult(null)

      const response = await api.post(
        '/api/admin/ai/test',
        {
          message: testQuestion.trim(),
        }
      )

      setTestResult(response)
    } catch (error) {
      setTestResult({
        error: error.message || 'AI test failed.',
      })
    } finally {
      setTestingAI(false)
    }
  }

  async function retrainModel() {
    const confirmed = window.confirm(
      'Are you sure you want to retrain the AI model using the current dataset?'
    )

    if (!confirmed) return

    try {
      setRetraining(true)
      setRetrainMessage('')

      const response = await api.post('/api/admin/ai/retrain', {})

      setRetrainMessage(
        response.message || 'Model retraining started.'
      )
    } catch (error) {
      setRetrainMessage(
        error.message || 'Failed to start model retraining.'
      )
    } finally {
      setRetraining(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Dataset
  // ---------------------------------------------------------------------------

  async function loadDataset() {
    try {
      setLoadingDataset(true)
      setDatasetError('')

      const response = await api.get('/api/admin/ai/dataset')

      setDataset(response)
    } catch (error) {
      console.error(error)
      setDatasetError(error.message || 'Failed to load dataset.')
      setDataset(null)
    } finally {
      setLoadingDataset(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadDoctors()
    loadAIStatus()
    loadDataset()
  }, [])

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('admin_user')

    window.location.href = '/admin-login'
  }

  const verifiedCount = doctors.filter(
    doctor => doctor.verified
  ).length

  const pendingCount = doctors.filter(
    doctor => !doctor.verified
  ).length

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        fontFamily: 'Arial, sans-serif',
        color: '#1f2937',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
            }}
          >
            Admin Dashboard
          </h1>

          <p
            style={{
              margin: '6px 0 0',
              color: '#6b7280',
            }}
          >
            Welcome, {adminUser.username || 'admin'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span
            style={{
              padding: '7px 12px',
              background: '#eef2ff',
              color: '#4338ca',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Role: {adminUser.role || 'admin'}
          </span>

          <button
            onClick={handleLogout}
            style={{
              padding: '9px 16px',
              border: '1px solid #dc2626',
              background: '#ffffff',
              color: '#dc2626',
              borderRadius: '7px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 32px',
          display: 'flex',
          gap: '8px',
        }}
      >
        {[
          ['doctors', '👨‍⚕️ Doctors'],
          ['ai', '🤖 AI Model'],
          ['dataset', '📊 Dataset'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '16px 20px',
              border: 'none',
              borderBottom:
                activeTab === key
                  ? '3px solid #2563eb'
                  : '3px solid transparent',
              background: 'transparent',
              color:
                activeTab === key
                  ? '#2563eb'
                  : '#6b7280',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <main
        style={{
          padding: '32px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* ================================================================ */}
        {/* DOCTORS */}
        {/* ================================================================ */}

        {activeTab === 'doctors' && (
          <>
            <h2>Doctor Verification</h2>

            <p style={{ color: '#6b7280' }}>
              Review doctor accounts and verify or remove verification.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                margin: '24px 0',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  padding: '24px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ color: '#6b7280' }}>
                  Total Doctors
                </div>

                <strong
                  style={{
                    fontSize: '32px',
                    display: 'block',
                    marginTop: '8px',
                  }}
                >
                  {doctors.length}
                </strong>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  padding: '24px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ color: '#6b7280' }}>
                  Verified
                </div>

                <strong
                  style={{
                    fontSize: '32px',
                    display: 'block',
                    marginTop: '8px',
                  }}
                >
                  {verifiedCount}
                </strong>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  padding: '24px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ color: '#6b7280' }}>
                  Pending
                </div>

                <strong
                  style={{
                    fontSize: '32px',
                    display: 'block',
                    marginTop: '8px',
                  }}
                >
                  {pendingCount}
                </strong>
              </div>
            </div>

            {loadingDoctors && <p>Loading doctors...</p>}

            {doctorError && (
              <p style={{ color: '#dc2626' }}>
                {doctorError}
              </p>
            )}

            {!loadingDoctors &&
              !doctorError &&
              doctors.length === 0 && (
                <p>No doctor accounts found.</p>
              )}

            <div
              style={{
                display: 'grid',
                gap: '16px',
              }}
            >
              {doctors.map(doctor => (
                <div
                  key={doctor.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '20px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0 }}>
                        {doctor.full_name || doctor.username}
                      </h3>

                      <p>
                        <strong>Username:</strong>{' '}
                        {doctor.username}
                      </p>

                      <p>
                        <strong>Degree:</strong>{' '}
                        {doctor.degree || 'N/A'}
                      </p>

                      <p>
                        <strong>Specialization:</strong>{' '}
                        {doctor.specialization || 'N/A'}
                      </p>

                      <p>
                        <strong>Hospital:</strong>{' '}
                        {doctor.hospital || 'N/A'}
                      </p>

                      <p>
                        <strong>City:</strong>{' '}
                        {doctor.city || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: doctor.verified
                            ? '#dcfce7'
                            : '#fef3c7',
                          color: doctor.verified
                            ? '#166534'
                            : '#92400e',
                          fontWeight: 700,
                          fontSize: '13px',
                        }}
                      >
                        {doctor.verified
                          ? 'Verified'
                          : 'Pending'}
                      </span>

                      <div style={{ marginTop: '16px' }}>
                        <button
                          onClick={() =>
                            handleVerify(
                              doctor.id,
                              !doctor.verified
                            )
                          }
                          style={{
                            padding: '9px 14px',
                            border: 'none',
                            borderRadius: '7px',
                            background: doctor.verified
                              ? '#dc2626'
                              : '#16a34a',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {doctor.verified
                            ? 'Remove Verification'
                            : 'Verify Doctor'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* AI MODEL */}
        {/* ================================================================ */}

        {activeTab === 'ai' && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2>AI Model Management</h2>

                <p style={{ color: '#6b7280' }}>
                  Monitor, test and retrain the MediPredict medical
                  Q&A model.
                </p>
              </div>

              <button
                onClick={loadAIStatus}
                disabled={loadingAI}
                style={{
                  padding: '9px 16px',
                  border: '1px solid #2563eb',
                  background: '#ffffff',
                  color: '#2563eb',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {loadingAI ? 'Refreshing...' : 'Refresh Status'}
              </button>
            </div>

            {aiError && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '8px',
                }}
              >
                {aiError}
              </div>
            )}

            {aiStatus && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                    margin: '24px 0',
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '22px',
                    }}
                  >
                    <div style={{ color: '#6b7280' }}>
                      AI Service
                    </div>

                    <strong
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '24px',
                        color: aiStatus.aiOnline
                          ? '#16a34a'
                          : '#dc2626',
                      }}
                    >
                      {aiStatus.aiOnline
                        ? '● Online'
                        : '● Offline'}
                    </strong>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '22px',
                    }}
                  >
                    <div style={{ color: '#6b7280' }}>
                      Q&A Pairs
                    </div>

                    <strong
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '30px',
                      }}
                    >
                      {aiStatus.pairsLoaded || 0}
                    </strong>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '22px',
                    }}
                  >
                    <div style={{ color: '#6b7280' }}>
                      Confidence Threshold
                    </div>

                    <strong
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '30px',
                      }}
                    >
                      {aiStatus.confidenceThreshold}
                    </strong>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '22px',
                    }}
                  >
                    <div style={{ color: '#6b7280' }}>
                      Model Status
                    </div>

                    <strong
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '24px',
                        color: aiStatus.modelReady
                          ? '#16a34a'
                          : '#dc2626',
                      }}
                    >
                      {aiStatus.modelReady
                        ? 'Ready'
                        : 'Incomplete'}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '24px',
                    marginBottom: '24px',
                  }}
                >
                  <h3>Model Information</h3>

                  <p>
                    <strong>Algorithm:</strong>{' '}
                    {aiStatus.modelType}
                  </p>

                  <p>
                    <strong>Service:</strong>{' '}
                    Flask / Python
                  </p>

                  <p>
                    <strong>Port:</strong> 8000
                  </p>

                  <p>
                    <strong>Training Dataset:</strong>{' '}
                    MedQuAD
                  </p>

                  <h4>Model Artifacts</h4>

                  {aiStatus.modelFiles?.map(file => (
                    <div
                      key={file.name}
                      style={{
                        padding: '12px 0',
                        borderBottom:
                          '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        gap: '15px',
                      }}
                    >
                      <span>{file.name}</span>

                      <span
                        style={{
                          color: file.exists
                            ? '#16a34a'
                            : '#dc2626',
                          fontWeight: 600,
                        }}
                      >
                        {file.exists
                          ? `Loaded • ${formatBytes(
                              file.size
                            )}`
                          : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '24px',
                    marginBottom: '24px',
                  }}
                >
                  <h3>Test AI Model</h3>

                  <p style={{ color: '#6b7280' }}>
                    Ask a sample medical question and inspect
                    the model's matched question and confidence.
                  </p>

                  <textarea
                    value={testQuestion}
                    onChange={e =>
                      setTestQuestion(e.target.value)
                    }
                    placeholder="Example: What are the symptoms of diabetes?"
                    rows={4}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '7px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />

                  <button
                    onClick={testAI}
                    disabled={
                      testingAI || !testQuestion.trim()
                    }
                    style={{
                      marginTop: '12px',
                      padding: '10px 18px',
                      border: 'none',
                      borderRadius: '7px',
                      background: '#2563eb',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {testingAI
                      ? 'Testing...'
                      : 'Test Model'}
                  </button>

                  {testResult && (
                    <div
                      style={{
                        marginTop: '20px',
                        padding: '18px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      {testResult.error ? (
                        <p
                          style={{
                            color: '#dc2626',
                          }}
                        >
                          {testResult.error}
                        </p>
                      ) : (
                        <>
                          <p>
                            <strong>Confidence:</strong>{' '}
                            {testResult.confidence}
                          </p>

                          <p>
                            <strong>
                              Matched Question:
                            </strong>{' '}
                            {testResult.matched_question ||
                              'No confident match'}
                          </p>

                          <p>
                            <strong>Answer:</strong>
                          </p>

                          <div
                            style={{
                              padding: '14px',
                              background: '#ffffff',
                              borderRadius: '7px',
                              lineHeight: 1.6,
                            }}
                          >
                            {testResult.reply}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '24px',
                  }}
                >
                  <h3>Retrain AI Model</h3>

                  <p style={{ color: '#6b7280' }}>
                    Retraining rebuilds the TF-IDF vectorizer and
                    question vectors using the current
                    <strong> medquad_enhanced.csv</strong> dataset.
                  </p>

                  <button
                    onClick={retrainModel}
                    disabled={retraining}
                    style={{
                      padding: '11px 20px',
                      border: 'none',
                      borderRadius: '7px',
                      background: '#7c3aed',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {retraining
                      ? 'Starting...'
                      : 'Retrain Model'}
                  </button>

                  {retrainMessage && (
                    <p
                      style={{
                        marginTop: '15px',
                        color: '#166534',
                      }}
                    >
                      {retrainMessage}
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ================================================================ */}
        {/* DATASET */}
        {/* ================================================================ */}

        {activeTab === 'dataset' && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2>Dataset Management</h2>

                <p style={{ color: '#6b7280' }}>
                  Inspect the dataset currently used to train the
                  medical Q&A model.
                </p>
              </div>

              <button
                onClick={loadDataset}
                disabled={loadingDataset}
                style={{
                  padding: '9px 16px',
                  border: '1px solid #2563eb',
                  background: '#ffffff',
                  color: '#2563eb',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {loadingDataset
                  ? 'Refreshing...'
                  : 'Refresh Dataset'}
              </button>
            </div>

            {datasetError && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '8px',
                }}
              >
                {datasetError}
              </div>
            )}

            {dataset && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                    margin: '24px 0',
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '22px',
                    }}
                  >
                    <div style={{ color: '#6b7280' }}>
                      Dataset
                    </div>

                    <strong
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '20px',
                      }}
                    >
                      {dataset.name}
                    </strong>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '22px',
                    }}
                  >
                    <div style={{ color: '#6b7280' }}>
                      File Size
                    </div>

                    <strong
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '24px',
                      }}
                    >
                      {formatBytes(dataset.size)}
                    </strong>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '22px',
                    }}
                  >
                    <div style={{ color: '#6b7280' }}>
                      Last Modified
                    </div>

                    <strong
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '16px',
                      }}
                    >
                      {formatDate(dataset.modifiedAt)}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '24px',
                  }}
                >
                  <h3>Dataset Preview</h3>

                  <p style={{ color: '#6b7280' }}>
                    First few rows of the CSV file:
                  </p>

                  <div
                    style={{
                      overflowX: 'auto',
                      background: '#f8fafc',
                      padding: '15px',
                      borderRadius: '8px',
                    }}
                  >
                    {dataset.preview?.map(
                      (line, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px 0',
                            borderBottom:
                              index <
                              dataset.preview.length - 1
                                ? '1px solid #e5e7eb'
                                : 'none',
                            whiteSpace: 'pre-wrap',
                            fontSize: '13px',
                          }}
                        >
                          {line}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
