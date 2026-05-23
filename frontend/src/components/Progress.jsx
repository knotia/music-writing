import { useState, useEffect } from 'react';
import { getProgress } from '../api';
import { TrendingUp, Award, BookOpen, PenTool, CheckCircle } from 'lucide-react';

export default function Progress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const result = await getProgress();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '40px' }}>데이터를 분석중입니다...</div>;
  }

  if (error) {
    return <div className="error-text" style={{ textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <TrendingUp color="var(--primary)" />
          나의 다차원적 성장 리포트
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          지금까지 기록한 총 <strong>{data.total_entries}</strong>개의 감상평을 바탕으로 세밀하게 분석된 결과입니다.
        </p>
        
        {data.recent_feedback && (
          <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid var(--primary)', borderRadius: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--primary)' }}>
              <CheckCircle size={20} />
              가장 최근의 즉각적 피드백
            </h3>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              내가 쓴 원문: "{data.recent_feedback.raw_sentence}"
            </p>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>전문가 수준 번역:</strong>
              {data.recent_feedback.translated_expert_sentence}
            </div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>교육적 조언:</strong>
              {data.recent_feedback.educational_feedback}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
          
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <PenTool size={20} color="var(--accent)" />
              문법 및 어휘력
            </h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-primary)', marginTop: '16px', whiteSpace: 'pre-wrap' }}>
              {data.grammar_and_spelling}
            </p>
          </div>

          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <TrendingUp size={20} color="var(--primary)" />
              논리성 및 결속력
            </h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-primary)', marginTop: '16px', whiteSpace: 'pre-wrap' }}>
              {data.coherence_and_flow}
            </p>
          </div>

          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <BookOpen size={20} color="var(--accent)" />
              음악적 사고의 깊이
            </h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-primary)', marginTop: '16px', whiteSpace: 'pre-wrap' }}>
              {data.musical_depth}
            </p>
          </div>

          <div style={{ gridColumn: '1 / -1', padding: '24px', background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--accent)' }}>
              <Award size={20} />
              종합 코멘트 및 학습 제안
            </h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-primary)', marginTop: '16px', whiteSpace: 'pre-wrap' }}>
              {data.overall_progress_feedback}
            </p>
          </div>

        </div>

        <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', display: 'inline-block' }}>
          <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>가장 자주 발생했던 이론적 오류:</span>
          <strong style={{ color: 'var(--error)' }}>
            {data.most_frequent_error === 'none' ? '없음 (훌륭합니다!)' : data.most_frequent_error}
          </strong>
        </div>
      </div>
    </div>
  );
}
