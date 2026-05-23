import { useState } from 'react';
import { analyzeThought } from '../api';
import { Send, Music, AlertCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    setError('');
    setFeedback(null);
    
    try {
      // session_id is auto generated per component mount for simplicity, or just a timestamp
      const sessionId = `sess_${Date.now()}`;
      const result = await analyzeThought(text, sessionId);
      setFeedback(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Music color="var(--primary)" />
          음악적 글쓰기 작성
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          음악적 구조나 이론을 바탕으로 본인의 생각과 논리를 자유롭고 깊이 있게 작성해 보세요.
        </p>
        
        <form onSubmit={handleSubmit}>
          <textarea 
            className="input-field" 
            style={{ minHeight: '150px', resize: 'vertical' }}
            placeholder="예: 이 멜로디는 갑자기 조용해지면서 어두운 분위기를 만듭니다..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} disabled={loading || !text.trim()}>
              <Send size={18} />
              {loading ? '분석 중...' : '전문가 분석 받기'}
            </button>
          </div>
        </form>
        {error && <div className="error-text" style={{ marginTop: '16px' }}>{error}</div>}
      </div>

      {feedback && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
            <CheckCircle color="var(--accent)" />
            AI 음악 전문가 피드백
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            {/* 소크라테스식 꼬리 질문 (가장 먼저 노출되어 생각 유도) */}
            {feedback.guiding_question && (
              <div style={{ padding: '20px', background: 'var(--primary)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🤔 한 걸음 더 나아가 볼까요?
                </h3>
                <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500' }}>
                  {feedback.guiding_question}
                </p>
                <div style={{ marginTop: '16px', fontSize: '0.9rem', opacity: 0.9 }}>
                  위 질문에 대한 답을 떠올려보고, 위의 글쓰기 칸에 내용을 덧붙여 다시 분석을 받아보세요!
                </div>
              </div>
            )}

            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>전문가 수준 번역</h4>
              <p style={{ margin: 0, lineHeight: '1.6' }}>{feedback.translated_expert_sentence}</p>
            </div>
            
            <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>교육적 조언</h4>
              <p style={{ margin: 0, lineHeight: '1.6' }}>{feedback.educational_feedback}</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>논리성 평가</div>
                <div style={{ fontWeight: '500' }}>{feedback.logic_evaluation.is_accurate ? '🟢 타당함' : '🔴 보완 필요'}</div>
                <div style={{ fontSize: '0.9rem', marginTop: '8px', color: 'var(--text-secondary)' }}>{feedback.logic_evaluation.rationale}</div>
              </div>
              <div style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>발견된 오류 유형</div>
                <div style={{ fontWeight: '500' }}>{feedback.logic_evaluation.error_type === 'none' ? '✅ 오류 없음' : `⚠️ ${feedback.logic_evaluation.error_type}`}</div>
              </div>
            </div>

            {/* 문법 및 오타 교정 섹션 */}
            {feedback.grammar_evaluation && feedback.grammar_evaluation.has_errors && (
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--error)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--error)' }}>📝 맞춤법 및 문장 교정</h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>{feedback.grammar_evaluation.feedback}</p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {feedback.grammar_evaluation.corrections.map((corr, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{corr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
