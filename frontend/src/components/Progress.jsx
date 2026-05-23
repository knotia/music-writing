import { useState, useEffect } from 'react';
import { getProgress } from '../api';
import { TrendingUp, Activity, PenTool, CheckCircle, Target, AlertTriangle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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

  if (data.total_entries === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>성장 리포트 데이터가 없습니다.</h2>
        <p style={{ color: 'var(--text-secondary)' }}>새로운 감상평을 작성하고 분석을 받아보세요!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Activity color="var(--primary)" />
          나의 다차원적 성장 대시보드
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          지금까지 기록한 총 <strong>{data.total_entries}</strong>개의 감상평을 실시간으로 분석한 지표입니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
          
          {/* 레이더 차트 (역량 밸런스) */}
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px' }}>
              <Target size={20} color="var(--accent)" />
              작문 역량 밸런스 (평균 점수)
            </h3>
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer>
                <RadarChart data={data.radar_data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} />
                  <Radar name="내 역량" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 꺾은선 차트 (성장 추이) */}
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px' }}>
              <TrendingUp size={20} color="var(--primary)" />
              시간에 따른 종합 점수 추이
            </h3>
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer>
                <LineChart data={data.trend_data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>

        {/* 개선점 요약 (Bullet Points) */}
        <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--error)', marginBottom: '16px' }}>
            <AlertTriangle size={20} />
            집중 보완이 필요한 부분 (최근 지적 사항)
          </h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.improvements_needed.map((item, idx) => (
              <li key={idx} style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 가장 최근의 피드백 (하이라이트) */}
        {data.recent_feedback && (
          <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid var(--primary)', borderRadius: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--primary)' }}>
              <CheckCircle size={20} />
              가장 최근에 작성한 글과 모범 교정
            </h3>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '12px', marginTop: '12px' }}>
              "{data.recent_feedback.raw_sentence}"
            </p>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--accent)' }}>✨ 전문가의 학술적 교정:</strong>
              {data.recent_feedback.translated_expert_sentence}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
