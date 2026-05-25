import { useState, useEffect } from 'react';
import { getStudents, getStudentProgress, getClassOverview, getStudentHistory } from '../api';
import { Users, FileText, X, CheckCircle, BarChart3, TrendingUp, AlertTriangle, Calendar, ChevronDown, ChevronUp, Award, BookOpen, Activity } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'history'
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [studentsData, overviewData] = await Promise.all([
          getStudents(),
          getClassOverview()
        ]);
        setStudents(studentsData);
        setOverview(overviewData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setLoadingDetail(true);
    setActiveTab('report');
    setExpandedHistoryId(null);
    try {
      const [progress, history] = await Promise.all([
        getStudentProgress(student.id),
        getStudentHistory(student.id)
      ]);
      setProgressData(progress);
      setStudentHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text-secondary)' }}>
        <Activity size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p>학급 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* ═══════════ 상단: 학급 전체 통계 요약 ═══════════ */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard icon={<Users size={22} />} label="총 학생 수" value={`${overview.total_students}명`} color="#2563eb" />
          <StatCard icon={<BookOpen size={22} />} label="총 작성 글 수" value={`${overview.total_entries}편`} color="#7c3aed" />
          <StatCard icon={<BarChart3 size={22} />} label="학급 평균 점수" value={`${overview.class_avg_score}점`} color="#059669" />
          <StatCard icon={<Activity size={22} />} label="이번 주 활동 학생" value={`${overview.active_this_week}명`} color="#d97706" />
        </div>
      )}

      {/* ═══════════ 학급 인사이트 (우수 학생 + 공통 취약점) ═══════════ */}
      {overview && (overview.top_students.length > 0 || overview.common_weaknesses.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* 우수 학생 */}
          {overview.top_students.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1.05rem' }}>
                <Award size={20} color="#d97706" /> 우수 학생 Top 5
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {overview.top_students.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: idx === 0 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(0,0,0,0.02)', borderRadius: '8px', border: idx === 0 ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid var(--surface-border)' }}>
                    <span style={{ fontWeight: idx < 3 ? '600' : '400' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`} {s.username}
                    </span>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{s.score}점</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 학급 공통 취약점 */}
          {overview.common_weaknesses.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1.05rem' }}>
                <AlertTriangle size={20} color="var(--error)" /> 학급 공통 취약점
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {overview.common_weaknesses.map((w, idx) => (
                  <div key={idx} style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#b91c1c', fontSize: '0.95rem' }}>⚠️ {w.category}</strong>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(239,68,68,0.15)', color: '#b91c1c', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        {w.count}건
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{w.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ 메인 영역: 학생 목록 + 상세 리포트 ═══════════ */}
      <div style={{ display: 'flex', gap: '24px' }}>
        
        {/* 좌측: 학생 목록 */}
        <div className="glass-card" style={{ flex: '0 0 320px', maxHeight: '700px', overflowY: 'auto', padding: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', marginBottom: '20px' }}>
            <Users color="var(--primary)" size={22} />
            학생 목록 ({students.length})
          </h2>
          
          {students.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>가입한 학생이 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {students.map(st => {
                const isSelected = selectedStudent?.id === st.id;
                const lastDate = st.last_active ? new Date(st.last_active).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-';
                return (
                  <div 
                    key={st.id} 
                    onClick={() => handleStudentClick(st)}
                    style={{ 
                      padding: '14px 16px', 
                      borderRadius: '10px', 
                      background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                      color: isSelected ? '#fff' : 'inherit',
                      border: isSelected ? 'none' : '1px solid var(--surface-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{st.username}</span>
                      {st.avg_score !== null && (
                        <span style={{ 
                          fontSize: '0.82rem', 
                          fontWeight: 'bold',
                          background: isSelected ? 'rgba(255,255,255,0.25)' : (st.avg_score >= 70 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'),
                          color: isSelected ? '#fff' : (st.avg_score >= 70 ? '#059669' : '#b91c1c'),
                          padding: '3px 8px',
                          borderRadius: '10px'
                        }}>
                          평균 {st.avg_score}점
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '8px', opacity: 0.85 }}>
                      <span>📝 {st.total_entries}편</span>
                      <span>🕐 {lastDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 우측: 선택한 학생의 상세 리포트 */}
        <div style={{ flex: '1', minWidth: 0 }}>
          {selectedStudent ? (
            <div className="glass-card" style={{ padding: '24px' }}>
              {/* 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                  <FileText color="var(--accent)" size={22} />
                  {selectedStudent.username} 학생
                </h2>
                <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={22} />
                </button>
              </div>

              {/* 탭 전환 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--surface-border)', paddingBottom: '12px' }}>
                <TabButton active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={<BarChart3 size={16} />} label="성장 분석 리포트" />
                <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<BookOpen size={16} />} label={`작성 이력 (${studentHistory.length})`} />
              </div>

              {loadingDetail ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>분석 데이터를 가져오는 중...</p>
              ) : activeTab === 'report' ? (
                /* ── 리포트 탭 ── */
                progressData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* 차트 2개 나란히 */}
                    {(progressData.radar_data?.length > 0 || progressData.trend_data?.length > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* 레이더 차트 */}
                        {progressData.radar_data?.length > 0 && (
                          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>📊 역량별 분석</h4>
                            <ResponsiveContainer width="100%" height={220}>
                              <RadarChart data={progressData.radar_data}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                                <Radar name="점수" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* 트렌드 라인 차트 */}
                        {progressData.trend_data?.length > 0 && (
                          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>📈 성장 추이</h4>
                            <ResponsiveContainer width="100%" height={220}>
                              <LineChart data={progressData.trend_data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 4 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 보완점 카드 */}
                    {progressData.improvements_needed?.length > 0 && (
                      <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', marginBottom: '12px' }}>
                          <AlertTriangle size={18} color="var(--error)" /> 집중 보완 영역
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                          {progressData.improvements_needed.map((item, idx) => {
                            const isPraise = item.category === '완벽해요!';
                            return (
                              <div key={idx} style={{ 
                                background: isPraise ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.05)', 
                                border: `1px solid ${isPraise ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`, 
                                borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' 
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ color: isPraise ? '#059669' : '#b91c1c', fontSize: '0.95rem' }}>
                                    {isPraise ? '🎉' : '⚠️'} {item.category}
                                  </strong>
                                  {!isPraise && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.15)', color: '#b91c1c', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
                                      {item.count}회
                                    </span>
                                  )}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{item.advice}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 최근 피드백 */}
                    {progressData.recent_feedback && (
                      <div style={{ padding: '16px', background: 'rgba(37,99,235,0.05)', border: '1px solid var(--primary)', borderRadius: '10px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px 0', color: 'var(--primary)', fontSize: '0.95rem' }}>
                          <CheckCircle size={18} /> 가장 최근 작성한 글
                        </h4>
                        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', margin: '0 0 10px 0', fontSize: '0.95rem' }}>
                          "{progressData.recent_feedback.raw_sentence}"
                        </p>
                        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px' }}>
                          <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--accent)', fontSize: '0.9rem' }}>✨ 전문가 교정:</strong>
                          <span style={{ fontSize: '0.93rem' }}>{progressData.recent_feedback.translated_expert_sentence}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>이 학생의 분석 데이터가 아직 없습니다.</p>
                )
              ) : (
                /* ── 이력 탭 ── */
                studentHistory.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>이 학생의 작성 이력이 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {studentHistory.map((item) => {
                      const isExpanded = expandedHistoryId === item.id;
                      const dateStr = new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={item.id} style={{ border: '1px solid var(--surface-border)', borderRadius: '10px', background: 'rgba(255,255,255,0.8)', overflow: 'hidden' }}>
                          <div 
                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                            style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                                <Calendar size={13} /> {dateStr}
                              </span>
                              {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                            </div>
                            <p style={{ margin: 0, fontWeight: '500', fontSize: '0.98rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                              "{item.raw_sentence}"
                            </p>
                          </div>
                          {isExpanded && (
                            <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid var(--surface-border)' }}>
                              {item.translated_sentence && (
                                <div style={{ background: 'rgba(37,99,235,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                                  <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--accent)', fontSize: '0.9rem' }}>✨ 전문가 교정:</strong>
                                  {item.translated_sentence}
                                </div>
                              )}
                              <div className="markdown-body" style={{ fontSize: '0.92rem', lineHeight: '1.7' }}>
                                <ReactMarkdown>{item.educational_feedback}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: 'var(--text-secondary)', gap: '12px' }}>
              <Users size={48} strokeWidth={1} />
              <p style={{ fontSize: '1.05rem' }}>좌측에서 학생을 선택하면 상세 리포트가 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 재사용 하위 컴포넌트 ── */

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontWeight: active ? '600' : '400',
        fontSize: '0.92rem',
        transition: 'all 0.2s'
      }}
    >
      {icon} {label}
    </button>
  );
}
