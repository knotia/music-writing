import { useState } from 'react';
import { analyzeThoughtStream } from '../api';
import { Send, Music, CheckCircle } from 'lucide-react';

export default function Dashboard({ ageGroup = 'middle' }) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 대화형 꼬리질문 관련 상태
  const [chatReply, setChatReply] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [assignmentQuestion, setAssignmentQuestion] = useState('');
  const [writingStyle, setWritingStyle] = useState('academic');
  // 세션 ID 고정 (컴포넌트 단위)
  const [sessionId] = useState(`sess_${Date.now()}`);

  const uiTexts = {
    elementary: {
      title: '나의 음악 이야기 쓰기',
      desc: '음악을 듣고 느낀 점이나 생각나는 것을 자유롭게 적어보세요!',
      assignmentLabel: '학교 숙제나 질문 (선택)',
      assignmentPlaceholder: '예: 1~4마디에서 어떤 느낌이 드나요?',
      styleLabel: '어떤 말투로 쓸까요?',
      academicLabel: '🎓 멋진 박사님처럼 (단호하게)',
      generalLabel: '📝 편안한 일기처럼 (자유롭게)',
      styleHint: '* 박사님 말투를 고르면 "저는 ~라고 생각해요"라는 말을 덜 쓰도록 도와줘요.',
      textLabel: '내 생각 적기',
      textPlaceholder: '예: 이 멜로디를 들으니까 갑자기 슬픈 기분이 들어요...',
      submitBtn: '선생님께 물어보기',
      loadingBtn: '선생님이 읽고 계셔요...',
      feedbackTitle: '🌟 선생님의 친절한 피드백',
      chatTitle: '🤔 조금만 더 생각해 볼까요?',
      chatPlaceholder: '질문에 대한 내 생각을 편하게 적어봐요...',
      chatSubmit: '대답하기',
      writingCorrection: '📝 이렇게 쓰면 더 멋져요',
      writingTip: '💡 글쓰기 꿀팁',
      evaluation: '📊 나의 점수표',
      expertTranslation: '🌐 멋진 어른들의 말로 바꾸면? (Click!)'
    },
    middle: {
      title: '음악적 글쓰기 작성',
      desc: '음악적 구조나 이론을 바탕으로 본인의 생각과 논리를 자유롭고 깊이 있게 작성해 보세요.',
      assignmentLabel: '과제 질문 / 논제 (선택)',
      assignmentPlaceholder: '예: 이 곡의 1~4마디 화성 진행에 대해 설명하시오.',
      styleLabel: '목표 문체 (어조)',
      academicLabel: '🎓 학술적 (논문/리포트)',
      generalLabel: '📝 일반적 (에세이/리뷰)',
      styleHint: '* 학술적 문체를 선택하면 "저는 ~라고 생각합니다" 같은 주관적인 표현을 엄격하게 감점하고 교정해 줍니다.',
      textLabel: '본문 작성',
      textPlaceholder: '예: 이 멜로디는 갑자기 조용해지면서 어두운 분위기를 만듭니다...',
      submitBtn: '전문가 분석 받기',
      loadingBtn: '분석 중...',
      feedbackTitle: 'AI 음악 전문가 피드백',
      chatTitle: '🤔 한 걸음 더 나아가 볼까요?',
      chatPlaceholder: '위 질문에 대한 답을 자유롭게 적어보세요...',
      chatSubmit: '답변하기',
      writingCorrection: '📝 작문 및 문장력 교정',
      writingTip: '💡 음악적 글쓰기 Tip',
      evaluation: '📊 종합 평가',
      expertTranslation: '🌐 전문가 수준 번역 보기 (Click!)'
    },
    adult: {
      title: '음악 논평 및 학술 에세이 작성',
      desc: '음악적 근거와 논리를 바탕으로 전문적인 수준의 텍스트를 작성해 주십시오.',
      assignmentLabel: '연구 주제 / 논제 (선택)',
      assignmentPlaceholder: '예: 베토벤 피아노 소나타 8번 1악장의 도입부 화성 분석',
      styleLabel: '목표 문체 (Tone & Manner)',
      academicLabel: '🎓 학술적 (Academic)',
      generalLabel: '📝 비평적 (Review/Essay)',
      styleHint: '* 학술적 문체를 선택 시 1인칭 주관적 표현의 사용을 제한하고 객관적 톤으로 강제 교정합니다.',
      textLabel: '에세이 본문',
      textPlaceholder: '예: 이 구간의 화성적 긴장감은 일시적인 전조를 통해 극대화되며...',
      submitBtn: '분석 및 평가 요청',
      loadingBtn: 'AI 평가 진행 중...',
      feedbackTitle: 'AI 학술 평가 리포트',
      chatTitle: '🤔 심층 논의 (Deep Dive)',
      chatPlaceholder: '제시된 질문에 대해 학술적인 논거를 덧붙여 주십시오.',
      chatSubmit: '논거 제출',
      writingCorrection: '📝 문장 구조 및 학술적 톤 교정',
      writingTip: '💡 전문적 작문 제언',
      evaluation: '📊 항목별 성취도 평가',
      expertTranslation: '🌐 학술지 수준의 모범 텍스트 보기 (Click!)'
    }
  };

  const t = uiTexts[ageGroup] || uiTexts.middle;

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
      const response = await analyzeThoughtStream(text, sessionId, [], assignmentQuestion, writingStyle, ageGroup);
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
      
      const response = await analyzeThoughtStream(newText, sessionId, chatHistory, assignmentQuestion, writingStyle, ageGroup);
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
          {t.title}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {t.desc}
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {t.assignmentLabel}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={t.assignmentPlaceholder}
              value={assignmentQuestion}
              onChange={(e) => setAssignmentQuestion(e.target.value)}
              style={{ padding: '12px', fontSize: '0.95rem' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {t.styleLabel}
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="writingStyle" 
                  value="academic" 
                  checked={writingStyle === 'academic'} 
                  onChange={(e) => setWritingStyle(e.target.value)} 
                />
                {t.academicLabel}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="writingStyle" 
                  value="general" 
                  checked={writingStyle === 'general'} 
                  onChange={(e) => setWritingStyle(e.target.value)} 
                />
                {t.generalLabel}
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {t.styleHint}
            </p>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {t.textLabel}
            </label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '150px', resize: 'vertical' }}
              placeholder={t.textPlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} disabled={loading || !text.trim()}>
              <Send size={18} />
              {loading ? t.loadingBtn : t.submitBtn}
            </button>
          </div>
        </form>
        {error && <div className="error-text" style={{ marginTop: '16px' }}>{error}</div>}
      </div>

      {feedback && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
            <CheckCircle color="var(--accent)" />
            {t.feedbackTitle}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            
            {/* 1. 소크라테스식 꼬리 질문 (대화형) */}
            {feedback.guiding_question && (
              <div style={{ padding: '20px', background: 'var(--primary)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {t.chatTitle}
                </h3>
                <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500', marginBottom: '16px' }}>
                  {feedback.guiding_question}
                </p>
                <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={chatReply}
                    onChange={(e) => setChatReply(e.target.value)}
                    placeholder={t.chatPlaceholder}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontSize: '1rem' }}
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading || !chatReply.trim()} style={{ padding: '0 20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? '...' : t.chatSubmit}
                  </button>
                </form>
              </div>
            )}

            {/* 2. 작문 및 문장 교정 섹션 */}
            {feedback.marked_sentence && (
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--error)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--error)' }}>{t.writingCorrection}</h4>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '1rem', lineHeight: '1.8' }}>
                  {renderMarkedText(feedback.marked_sentence)}
                </div>
              </div>
            )}

            {/* 3. 음악적 글쓰기 Tip */}
            {feedback.musical_writing_tip && (
              <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{t.writingTip}</h4>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{feedback.musical_writing_tip}</p>
              </div>
            )}

            {/* 4. 종합 평가 점수표 */}
            {feedback.evaluations && feedback.evaluations.length > 0 && (
              <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>{t.evaluation}</h4>
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
                  {t.expertTranslation}
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
