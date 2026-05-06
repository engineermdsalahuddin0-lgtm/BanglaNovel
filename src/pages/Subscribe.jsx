import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/shared/Navbar'

const PLANS = [
  {
    id: 'basic_49',
    name: 'বেসিক',
    price: 49,
    duration: '১ মাস',
    color: '#3451b2',
    bg: '#eef2ff',
    features: [
      'সব premium chapter পড়া',
      'Ad-free reading',
      'Reading history',
      'লেখককে tip দেওয়া',
    ],
  },
  {
    id: 'premium_99',
    name: 'প্রিমিয়াম',
    price: 99,
    duration: '১ মাস',
    color: '#e94560',
    bg: '#fff0f3',
    popular: true,
    features: [
      'বেসিকের সব সুবিধা',
      'Early access (নতুন chapter আগে)',
      'লেখককে বেশি tip',
      'AI writing tools (৫০ token)',
      'Contest এ ছাড়',
    ],
  },
]

const METHODS = [
  { id: 'bkash', label: 'bKash', number: '01XXXXXXXXX', color: '#e2136e', icon: '💳' },
  { id: 'nagad', label: 'Nagad', number: '01XXXXXXXXX', color: '#f6921e', icon: '💸' },
  { id: 'rocket', label: 'Rocket', number: '01XXXXXXXXX', color: '#8b2fc9', icon: '🚀' },
]

export default function Subscribe() {
  const { user, profile, isSubscribed } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: plan, 2: payment, 3: confirm, 4: success
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [transactionId, setTransactionId] = useState('')
  const [paymentNumber, setPaymentNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submitPayment() {
    if (!transactionId.trim()) { setError('Transaction ID দাও'); return }
    if (!paymentNumber.trim()) { setError('তোমার নম্বর দাও'); return }
    setError('')
    setSubmitting(true)

    const { error } = await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: selectedPlan.id,
      amount: selectedPlan.price,
      payment_method: selectedMethod.id,
      payment_number: paymentNumber,
      transaction_id: transactionId,
      status: 'pending',
    })

    if (error) {
      setError('সমস্যা হয়েছে, আবার চেষ্টা করো।')
      setSubmitting(false)
      return
    }

    setStep(4)
    setSubmitting(false)
  }

  // Already subscribed
  if (isSubscribed) {
    return (
      <div style={s.page}>
        <Navbar />
        <div style={s.center}>
          <div style={s.successCard}>
            <div style={s.successIcon}>✅</div>
            <h2 style={s.successTitle}>তুমি ইতিমধ্যে সাবস্ক্রাইবড!</h2>
            <p style={s.successSub}>
              মেয়াদ: {new Date(profile?.subscription_expires_at).toLocaleDateString('bn-BD')} পর্যন্ত
            </p>
            <button onClick={() => navigate('/')} style={s.primaryBtn}>হোমে ফিরে যাও</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <Navbar />

      {/* Step indicator */}
      <div style={s.stepBar}>
        <div style={s.stepInner}>
          {['প্ল্যান বেছে নাও', 'Payment করো', 'Confirm করো'].map((label, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{
                ...s.stepCircle,
                background: step > i + 1 ? '#2e7d32' : step === i + 1 ? '#11181c' : '#e8eaed',
                color: step >= i + 1 ? '#fff' : '#687076',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ ...s.stepLabel, color: step === i + 1 ? '#11181c' : '#687076' }}>{label}</span>
              {i < 2 && <div style={{ ...s.stepLine, background: step > i + 1 ? '#2e7d32' : '#e8eaed' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={s.content}>

        {/* STEP 1 — Plan select */}
        {step === 1 && (
          <div>
            <h2 style={s.stepTitle}>প্ল্যান বেছে নাও</h2>
            <p style={s.stepSub}>যেকোনো প্ল্যানে বাংলাদেশের সেরা বাংলা উপন্যাস পড়ো।</p>

            <div style={s.planGrid}>
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    ...s.planCard,
                    borderColor: selectedPlan?.id === plan.id ? plan.color : '#e8eaed',
                    background: selectedPlan?.id === plan.id ? plan.bg : '#fff',
                  }}
                >
                  {plan.popular && <div style={s.popularBadge}>🔥 সবচেয়ে জনপ্রিয়</div>}
                  <h3 style={{ ...s.planName, color: plan.color }}>{plan.name}</h3>
                  <div style={s.planPrice}>
                    <span style={s.planAmount}>৳{plan.price}</span>
                    <span style={s.planDuration}>/{plan.duration}</span>
                  </div>
                  <ul style={s.featureList}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={s.featureItem}>
                        <span style={{ color: plan.color }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div style={{
                    ...s.selectIndicator,
                    borderColor: plan.color,
                    background: selectedPlan?.id === plan.id ? plan.color : 'transparent',
                  }}>
                    {selectedPlan?.id === plan.id && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={s.stepActions}>
              <button
                onClick={() => { if (selectedPlan) setStep(2) }}
                style={{ ...s.primaryBtn, opacity: selectedPlan ? 1 : .5 }}
                disabled={!selectedPlan}
              >
                পরের ধাপ →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Payment */}
        {step === 2 && (
          <div style={s.paymentWrap}>
            <h2 style={s.stepTitle}>Payment করো</h2>
            <p style={s.stepSub}>নিচের যেকোনো পদ্ধতিতে payment করো।</p>

            {/* Selected plan summary */}
            <div style={s.planSummary}>
              <span>নির্বাচিত প্ল্যান: <strong>{selectedPlan.name}</strong></span>
              <span style={s.planSummaryPrice}>৳{selectedPlan.price}</span>
            </div>

            {/* Payment methods */}
            <div style={s.methodGrid}>
              {METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method)}
                  style={{
                    ...s.methodCard,
                    borderColor: selectedMethod?.id === method.id ? method.color : '#e8eaed',
                    background: selectedMethod?.id === method.id ? '#fff' : '#fafafa',
                  }}
                >
                  <span style={s.methodIcon}>{method.icon}</span>
                  <span style={{ ...s.methodLabel, color: method.color }}>{method.label}</span>
                  {selectedMethod?.id === method.id && (
                    <span style={{ ...s.methodCheck, background: method.color }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Payment instructions */}
            {selectedMethod && (
              <div style={s.instructionCard}>
                <h3 style={s.instructionTitle}>Payment Instructions</h3>
                <div style={s.instructionSteps}>
                  <div style={s.instructionStep}>
                    <span style={s.instructionNum}>১</span>
                    <p style={s.instructionText}>
                      তোমার {selectedMethod.label} app খোলো এবং <strong>Send Money</strong> অপশনে যাও
                    </p>
                  </div>
                  <div style={s.instructionStep}>
                    <span style={s.instructionNum}>২</span>
                    <p style={s.instructionText}>
                      এই নম্বরে <strong>৳{selectedPlan.price}</strong> পাঠাও:
                      <span style={{ ...s.copyNumber, color: selectedMethod.color }}>
                        {selectedMethod.number}
                      </span>
                    </p>
                  </div>
                  <div style={s.instructionStep}>
                    <span style={s.instructionNum}>৩</span>
                    <p style={s.instructionText}>
                      Payment সফল হলে <strong>Transaction ID</strong> কপি করো
                    </p>
                  </div>
                  <div style={s.instructionStep}>
                    <span style={s.instructionNum}>৪</span>
                    <p style={s.instructionText}>
                      নিচের ফর্মে Transaction ID ও তোমার নম্বর দিয়ে submit করো
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={s.stepActions}>
              <button onClick={() => setStep(1)} style={s.secondaryBtn}>← আগে</button>
              <button
                onClick={() => { if (selectedMethod) setStep(3) }}
                style={{ ...s.primaryBtn, opacity: selectedMethod ? 1 : .5 }}
                disabled={!selectedMethod}
              >
                Payment করেছি →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 3 && (
          <div style={s.confirmWrap}>
            <h2 style={s.stepTitle}>Payment Confirm করো</h2>
            <p style={s.stepSub}>Transaction ID দিয়ে আমাদের জানাও। Admin verify করার পর সাবস্ক্রিপশন চালু হবে।</p>

            <div style={s.confirmCard}>
              <div style={s.confirmSummary}>
                <div style={s.confirmRow}>
                  <span style={s.confirmLabel}>প্ল্যান</span>
                  <span style={s.confirmValue}>{selectedPlan.name} — ৳{selectedPlan.price}</span>
                </div>
                <div style={s.confirmRow}>
                  <span style={s.confirmLabel}>Payment Method</span>
                  <span style={s.confirmValue}>{selectedMethod.label}</span>
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Transaction ID *</label>
                <input
                  style={s.input}
                  placeholder="যেমন: 8N7A2K3P1Q"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                />
                <p style={s.hint}>Payment সফল হলে {selectedMethod.label} থেকে যে Transaction ID পেয়েছ সেটা দাও</p>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>তোমার {selectedMethod.label} নম্বর *</label>
                <input
                  style={s.input}
                  placeholder="01XXXXXXXXX"
                  value={paymentNumber}
                  onChange={e => setPaymentNumber(e.target.value)}
                />
              </div>

              {error && <p style={s.error}>{error}</p>}

              <div style={s.stepActions}>
                <button onClick={() => setStep(2)} style={s.secondaryBtn}>← আগে</button>
                <button onClick={submitPayment} disabled={submitting} style={s.primaryBtn}>
                  {submitting ? 'Submit হচ্ছে...' : 'Submit করো ✓'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Success */}
        {step === 4 && (
          <div style={s.center}>
            <div style={s.successCard}>
              <div style={s.successIcon}>🎉</div>
              <h2 style={s.successTitle}>Payment Submit হয়েছে!</h2>
              <p style={s.successSub}>
                তোমার payment verify করা হচ্ছে। সাধারণত <strong>১-৬ ঘণ্টার</strong> মধ্যে সাবস্ক্রিপশন চালু হবে।
              </p>
              <div style={s.successInfo}>
                <div style={s.successRow}>
                  <span>প্ল্যান</span>
                  <strong>{selectedPlan.name}</strong>
                </div>
                <div style={s.successRow}>
                  <span>পরিমাণ</span>
                  <strong>৳{selectedPlan.price}</strong>
                </div>
                <div style={s.successRow}>
                  <span>Transaction ID</span>
                  <strong>{transactionId}</strong>
                </div>
              </div>
              <p style={s.successNote}>
                ⚠️ যদি ২৪ ঘণ্টার মধ্যে চালু না হয়, Transaction ID সহ আমাদের সাথে যোগাযোগ করো।
              </p>
              <button onClick={() => navigate('/')} style={s.primaryBtn}>হোমে ফিরে যাও</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f8f9fa' },
  center: { display: 'flex', justifyContent: 'center', padding: '3rem 1.5rem' },

  // Steps
  stepBar: { background: '#fff', borderBottom: '1px solid #e8eaed', padding: '1rem 0' },
  stepInner: { maxWidth: 600, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepItem: { display: 'flex', alignItems: 'center', gap: 8 },
  stepCircle: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 },
  stepLabel: { fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' },
  stepLine: { width: 40, height: 2, margin: '0 8px' },

  // Content
  content: { maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' },
  stepTitle: { fontSize: 22, fontWeight: 600, color: '#11181c', marginBottom: 6 },
  stepSub: { fontSize: 14, color: '#687076', marginBottom: '1.5rem', lineHeight: 1.6 },

  // Plans
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: '1.5rem' },
  planCard: { position: 'relative', borderRadius: 12, border: '2px solid', padding: '1.5rem', cursor: 'pointer', transition: 'all .15s' },
  popularBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#e94560', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' },
  planName: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  planPrice: { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: '1.25rem' },
  planAmount: { fontSize: 36, fontWeight: 700, color: '#11181c' },
  planDuration: { fontSize: 14, color: '#687076' },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: 8 },
  featureItem: { fontSize: 13, color: '#11181c', display: 'flex', gap: 8, alignItems: 'flex-start' },
  selectIndicator: { width: 20, height: 20, borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 },

  // Payment
  paymentWrap: {},
  planSummary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '12px 16px', marginBottom: '1.25rem', fontSize: 14, color: '#11181c' },
  planSummaryPrice: { fontWeight: 700, fontSize: 16, color: '#11181c' },
  methodGrid: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.25rem' },
  methodCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 10, border: '2px solid', cursor: 'pointer', position: 'relative', transition: 'all .15s' },
  methodIcon: { fontSize: 20 },
  methodLabel: { fontSize: 15, fontWeight: 600 },
  methodCheck: { width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, marginLeft: 6 },
  instructionCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: '1.25rem', marginBottom: '1.5rem' },
  instructionTitle: { fontSize: 15, fontWeight: 600, color: '#11181c', marginBottom: '1rem' },
  instructionSteps: { display: 'flex', flexDirection: 'column', gap: 12 },
  instructionStep: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  instructionNum: { width: 24, height: 24, borderRadius: '50%', background: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#11181c', flexShrink: 0 },
  instructionText: { fontSize: 13, color: '#11181c', lineHeight: 1.6, margin: 0 },
  copyNumber: { fontWeight: 700, fontSize: 15, marginLeft: 8, fontFamily: 'monospace' },

  // Confirm
  confirmWrap: {},
  confirmCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: '1.5rem' },
  confirmSummary: { background: '#f8f9fa', borderRadius: 8, padding: '12px 16px', marginBottom: '1.25rem' },
  confirmRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' },
  confirmLabel: { color: '#687076' },
  confirmValue: { fontWeight: 500, color: '#11181c' },
  formGroup: { marginBottom: '1rem' },
  label: { fontSize: 13, fontWeight: 500, color: '#11181c', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e8eaed', fontSize: 14, outline: 'none', color: '#11181c', boxSizing: 'border-box' },
  hint: { fontSize: 12, color: '#687076', marginTop: 4 },
  error: { color: '#e24b4a', fontSize: 13, marginBottom: 12 },

  // Success
  successCard: { background: '#fff', borderRadius: 16, border: '1px solid #e8eaed', padding: '2.5rem', maxWidth: 480, width: '100%', textAlign: 'center' },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 600, color: '#11181c', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#687076', lineHeight: 1.6, marginBottom: '1.5rem' },
  successInfo: { background: '#f8f9fa', borderRadius: 10, padding: '1rem', marginBottom: '1rem', textAlign: 'left' },
  successRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #e8eaed' },
  successNote: { fontSize: 12, color: '#f57c00', background: '#fff8e1', borderRadius: 8, padding: '10px 12px', marginBottom: '1.5rem', textAlign: 'left', lineHeight: 1.6 },

  // Buttons
  stepActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.5rem' },
  primaryBtn: { padding: '10px 24px', borderRadius: 8, background: '#11181c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  secondaryBtn: { padding: '10px 20px', borderRadius: 8, background: '#fff', color: '#11181c', border: '1px solid #e8eaed', cursor: 'pointer', fontSize: 14 },
}
