import { useEffect, useState } from 'react';
import api from '../services/api';

function QASection({ productId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const loadQuestions = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/${productId}/questions?page=${pageNum}&limit=20`);
      setQuestions(data.questions || []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(page);
  }, [productId, page]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/questions`, { question: questionText.trim() });
      setQuestionText('');
      loadQuestions(1);
      setPage(1);
    } catch (err) {
      // handled by toast
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (questionId) => {
    if (!answerText.trim()) return;
    try {
      await api.post(`/questions/${questionId}/answer`, { answer: answerText.trim() });
      setAnswerText('');
      setReplyingTo(null);
      loadQuestions(page);
    } catch (err) {
      // handled by toast
    }
  };

  const handleHelpful = async (questionId) => {
    try {
      await api.post(`/questions/${questionId}/helpful`);
      loadQuestions(page);
    } catch (err) {
      // handled by toast
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="skeleton-card" style={{ height: '200px' }} />
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Questions & Answers</h3>

      <form onSubmit={handleAsk} style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Ask a question about this product..."
          className="form-input"
          style={{ flex: 1, minWidth: '240px' }}
          required
        />
        <Button type="submit" size="md" disabled={submitting || !questionText.trim()}>
          {submitting ? 'Posting...' : 'Ask Question'}
        </Button>
      </form>

      {!questions.length ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>💬</p>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>No questions yet</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Be the first to ask about this product</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q) => (
            <div key={q._id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{q.question}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    Asked by {q.user?.name || 'User'} · {new Date(q.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                </div>
                <button onClick={() => handleHelpful(q._id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  👍 Helpful ({q.helpful || 0})
                </button>
              </div>

              {q.answer ? (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary)' }}>
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{q.answer}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    Answered by {q.answeredBy?.name || 'Seller'} · {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  {replyingTo === q._id ? (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your answer..."
                        className="form-input"
                        style={{ flex: 1, minWidth: '200px' }}
                      />
                      <Button size="sm" onClick={() => handleAnswer(q._id)}>Submit</Button>
                      <Button variant="secondary" size="sm" onClick={() => { setReplyingTo(null); setAnswerText(''); }}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setReplyingTo(q._id)}>Answer</Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QASection;
