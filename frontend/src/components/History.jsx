import { useState, useEffect } from 'react';
import { getHistory } from '../api';
import { Archive, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function History({ ageGroup = 'middle' }) {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const uiTexts = {
    elementary: {
      title: '나의 글 보관함',
      desc: '지금까지 내가 쓴 멋진 글들을 다시 볼 수 있어요!',
      noData: '아직 쓴 글이 없어요. 새로운 글을 작성해보세요!',
      readMore: '선생님 피드백 자세히 보기',
      readLess: '접기',
      expertLabel: '✨ 멋진 글로 바꾸면 이렇게 돼요:'
    },
    middle: {
      title: '나의 글 보관함',
      desc: '과거에 작성한 감상평과 피드백을 다시 열람할 수 있습니다.',
      noData: '작성한 이력이 없습니다.',
      readMore: '피드백 상세 보기',
      readLess: '상세 보기 닫기',
      expertLabel: '✨ 전문가의 학술적 교정:'
    },
    adult: {
      title: '작성 이력 아카이브',
      desc: '이전 작성 내용 및 AI 평가 리포트를 열람합니다.',
      noData: '조회할 데이터가 존재하지 않습니다.',
      readMore: '상세 평가 리포트 열람',
      readLess: '상세 평가 접기',
      expertLabel: '✨ 모범 교정안 (전문가 수준):'
    }
  };

  const t = uiTexts[ageGroup] || uiTexts.middle;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await getHistory();
        setHistories(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '40px' }}>기록을 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="error-text" style={{ textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Archive color="var(--primary)" />
          {t.title}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>{t.desc}</p>
        
        {histories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', marginTop: '24px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
            {t.noData}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>
            {histories.map((item) => {
              const isExpanded = expandedId === item.id;
              const dateObj = new Date(item.created_at);
              const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={item.id} style={{ border: '1px solid var(--surface-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.7)', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                  {/* Summary Header */}
                  <div 
                    onClick={() => toggleExpand(item.id)}
                    style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} />
                        {dateStr}
                      </span>
                      {isExpanded ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                    </div>
                    <p style={{ margin: 0, fontWeight: '500', fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                      "{item.raw_sentence}"
                    </p>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,1)', borderTop: '1px solid var(--surface-border)' }}>
                      <div style={{ background: 'rgba(37, 99, 235, 0.05)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                        <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--accent)' }}>{t.expertLabel}</strong>
                        {item.translated_sentence || '데이터 없음'}
                      </div>
                      <div className="markdown-body" style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                        <ReactMarkdown>{item.educational_feedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
