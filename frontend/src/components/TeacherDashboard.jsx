import { useState, useEffect } from 'react';
import { getStudents, getStudentProgress } from '../api';
import { Users, FileText, X, CheckCircle } from 'lucide-react';

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getStudents();
        setStudents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setLoadingProgress(true);
    try {
      const data = await getStudentProgress(student.id);
      setProgressData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProgress(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '40px' }}>학생 데이터를 불러오는 중...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '32px' }}>
      {/* 학생 목록 영역 */}
      <div className="glass-card" style={{ flex: '1', maxWidth: '350px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users color="var(--primary)" />
          학생 목록
        </h2>
        
        {students.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>가입한 학생이 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            {students.map(st => (
              <div 
                key={st.id} 
                onClick={() => handleStudentClick(st)}
                style={{ 
                  padding: '16px', 
                  borderRadius: '8px', 
                  background: selectedStudent?.id === st.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.8)',
                  color: selectedStudent?.id === st.id ? '#fff' : 'inherit',
                  border: '1px solid var(--surface-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{st.username}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '8px', opacity: 0.9 }}>
                  <span>작성 횟수: {st.total_entries}</span>
                  <span style={{ color: selectedStudent?.id === st.id ? '#fef08a' : 'var(--error)' }}>
                    최근 오류: {st.latest_error === 'none' ? '없음' : st.latest_error}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 우측 분석 영역 */}
      <div style={{ flex: '2' }}>
        {selectedStudent ? (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText color="var(--accent)" />
                {selectedStudent.username} 학생의 리포트
              </h2>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X />
              </button>
            </div>

            {loadingProgress ? (
              <p>분석 데이터를 가져오는 중입니다...</p>
            ) : progressData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. 최근 피드백 상단 노출 */}
                {progressData.recent_feedback && (
                  <div style={{ padding: '20px', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '8px', border: '2px solid var(--primary)' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={20} />
                      가장 최근에 쓴 글과 즉각적 피드백
                    </h3>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      "{progressData.recent_feedback.raw_sentence}"
                    </p>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '8px' }}>
                      <strong style={{display: 'block', marginBottom: '4px'}}>전문가 번역:</strong> {progressData.recent_feedback.translated_expert_sentence}
                    </div>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}>
                      <strong style={{display: 'block', marginBottom: '4px'}}>교육적 조언:</strong> {progressData.recent_feedback.educational_feedback}
                    </div>
                  </div>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)' }} />

                {/* 2. 세부 지표 분석 */}
                <h3 style={{ margin: 0 }}>전체 글쓰기 능력 다차원 분석</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>문법 및 어휘력</h4>
                    <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{progressData.grammar_and_spelling}</p>
                  </div>
                  
                  <div style={{ padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>논리성 및 결속력</h4>
                    <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{progressData.coherence_and_flow}</p>
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>음악적 사고의 깊이</h4>
                    <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{progressData.musical_depth}</p>
                  </div>
                </div>

                {/* 3. 종합 코멘트 */}
                <div style={{ padding: '20px', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>종합 코멘트 및 지도 방안</h4>
                  <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{progressData.overall_progress_feedback}</p>
                </div>
              </div>
            ) : (
              <p>데이터가 없습니다.</p>
            )}
          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
            좌측에서 학생을 선택하면 학생의 성장 리포트가 여기에 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
