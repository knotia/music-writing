import { useState } from 'react';
import { analyzeThoughtStream } from '../api';
import { Send, Music, AlertCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 대화형 꼬리질문 관련 상태
  const [chatReply, setChatReply] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [assignmentQuestion, setAssignmentQuestion] = useState('');
  // 세션 ID 고정 (컴포넌트 단위)
  const [sessionId] = useState(`sess_${Date.now()}`);

  const parseStreamingMarkdown = (text) => {
    const feedbackObj = {
      guiding_question: '',
      marked_sentence: '',
      musical_writing_tip: '',
      translated_expert_sentence: '',
      evaluations: []
    };
    
    const extractSection = (header) => {
      const regex = new RegExp(`^#\\s*${header}\\s*\\n([\\s\\S]*?)(?=\\n#|$)`, 'im');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    feedbackObj.guiding_question = extractSection('guiding_question');
    feedbackObj.marked_sentence = extractSection('marked_sentence');
    feedbackObj.musical_writing_tip = extractSection('tip');
    feedbackObj.translated_expert_sentence = extractSection('translation');
    
    const evalsText = extractSection('evaluations');
    if (evalsText) {
      const evalLines = evalsText.split('\n').filter(line => line.trim().startsWith('-'));
      feedbackObj.evaluations = evalLines.map(line => {
        const match = line.match(/-\s*\*\*(.*?)(?:\s*\((\d)\/5\))?\*\*\s*:\s*(.*)/);
        if (match) {
          return {
            category: match[1].trim(),
            score: parseInt(match[2]) || 3,
            problem_and_advice: match[3].trim()
          };
        }
        return { category: '분석 중...', score: 0, problem_and_advice: line.replace(/^-/, '').replace(/\*\*/g, '').trim() };
      });
    }
    
    return feedbackObj;
  };

  const processStream = async (response, originalText, newHistoryItem = null) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    
    // 빈 피드백 객체로 초기화하여 UI 즉시 노출
    setFeedback({
      guiding_question: '생각 중...',
      marked_sentence: '',
      musical_writing_tip: '',
      translated_expert_sentence: '',
      evaluations: []
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
      setFeedback(parseStreamingMarkdown(fullText));
    }
    
    const finalFeedback = parseStreamingMarkdown(fullText);
    if (newHistoryItem) {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: finalFeedback.guiding_question },
        newHistoryItem
      ]);
    } else {
      setChatHistory([
        { role: 'user', content: originalText },
        { role: 'assistant', content: finalFeedback.guiding_question }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    setError('');
    setFeedback(null);
    
    try {
      const response = await analyzeThoughtStream(text, sessionId, [], assignmentQuestion);
      await processStream(response, text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatReply.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const separator = text.trim().endsWith('.') ? ' ' : '. ';
      const newText = text.trim() + separator + chatReply.trim();
      
      setText(newText);
      
      const response = await analyzeThoughtStream(newText, sessionId, chatHistory, assignmentQuestion);
      await processStream(response, newText, { role: 'user', content: `[본문에 내용 추가됨] ${chatReply}` });
      
      setChatReply('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMarkedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(~~.*?~~|\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return <del key={i} style={{ color: '#ef4444', textDecoration: 'line-through', marginRight: '4px', background: 'rgba(239, 68, 68, 0.1)', padding: '0 2px', borderRadius: '4px' }}>{part.slice(2, -2)}</del>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#10b981', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '0 2px', borderRadius: '4px' }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
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
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              과제 질문 / 논제 (선택)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 이 곡의 1~4마디 화성 진행에 대해 설명하시오."
              value={assignmentQuestion}
              onChange={(e) => setAssignmentQuestion(e.target.value)}
              style={{ padding: '12px', fontSize: '0.95rem' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              본문 작성
            </label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '150px', resize: 'vertical' }}
              placeholder="예: 이 멜로디는 갑자기 조용해지면서 어두운 분위기를 만듭니다..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
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
            
            {/* 1. 소크라테스식 꼬리 질문 (대화형) */}
            {feedback.guiding_question && (
              <div style={{ padding: '20px', background: 'var(--primary)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🤔 한 걸음 더 나아가 볼까요?
                </h3>
                <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500', marginBottom: '16px' }}>
                  {feedback.guiding_question}
                </p>
                <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={chatReply}
                    onChange={(e) => setChatReply(e.target.value)}
                    placeholder="위 질문에 대한 답을 자유롭게 적어보세요..."
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontSize: '1rem' }}
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading || !chatReply.trim()} style={{ padding: '0 20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? '...' : '답변하기'}
                  </button>
                </form>
              </div>
            )}

            {/* 2. 작문 및 문장 교정 섹션 */}
            {feedback.marked_sentence && (
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--error)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--error)' }}>📝 작문 및 문장력 교정</h4>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '1rem', lineHeight: '1.8' }}>
                  {renderMarkedText(feedback.marked_sentence)}
                </div>
              </div>
            )}

            {/* 3. 음악적 글쓰기 Tip */}
            {feedback.musical_writing_tip && (
              <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>💡 음악적 글쓰기 Tip</h4>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{feedback.musical_writing_tip}</p>
              </div>
            )}

            {/* 4. 종합 평가 점수표 */}
            {feedback.evaluations && feedback.evaluations.length > 0 && (
              <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>📊 종합 평가</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {feedback.evaluations.map((ev, idx) => (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--primary)' }}>{ev.category}</strong>
                        <div style={{ color: '#fbbf24', letterSpacing: '2px', fontSize: '1.1rem' }}>
                          {'★'.repeat(ev.score)}{'☆'.repeat(5 - ev.score)}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {ev.problem_and_advice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. 전문가 수준 번역 (클릭 시 노출) */}
            {feedback.translated_expert_sentence && (
              <details style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <summary style={{ padding: '16px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary)' }}>
                  🌐 전문가 수준 번역 보기 (Click!)
                </summary>
                <div style={{ padding: '0 16px 16px 16px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {feedback.translated_expert_sentence}
                </div>
              </details>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
