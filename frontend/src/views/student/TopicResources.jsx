import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Video,
  FileQuestion,
  BookOpen,
  Clock,
  Award,
  Sparkles,
  ShieldCheck,
  Download,
  Play,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function TopicResources() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const track = searchParams.get('track') || 'competitive'; // 'competitive' | 'college'
  const navigate = useNavigate();
  const { showError } = useToast();

  const [topic, setTopic] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' | 'quizzes'

  // Video / Notes Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState(null);

  // Quiz Mode Selection Modal
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [modeModalOpen, setModeModalOpen] = useState(false);

  useEffect(() => {
    fetchTopicData();
  }, [topicId, track]);

  const fetchTopicData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/student/topics/${topicId}/resources?track=${track}`);
      const data = res?.data || res || {};
      setTopic(data.topic);
      setMaterials(data.materials || []);
      setQuizzes(data.quizzes || []);

    } catch (err) {
      showError('Failed to load topic resources.');
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
  };

  const handleStartQuiz = (quiz, mode) => {
    setModeModalOpen(false);
    navigate(`/student/quizzes/${quiz.id}/attempt?mode=${mode}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const topicTitle = topic?.name || topic?.title || 'Topic Resources';
  const parentName = topic?.subject?.name || topic?.course?.title || '';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* ─── BREADCRUMBS & NAVIGATION ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
        <Link to={track === 'competitive' ? '/student/exams' : '/student/courses'} className="hover:text-primary-600 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {track === 'competitive' ? 'Exams' : 'Courses'}
        </Link>
        <span>/</span>
        {parentName && (
          <>
            <span className="text-neutral-700">{parentName}</span>
            <span>/</span>
          </>
        )}
        <span className="text-primary-600 font-bold">{topicTitle}</span>
      </div>

      {/* ─── TOPIC BANNER ──────────────────────────────────────────────────── */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-indigo-950 to-primary-950 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-primary-500/20 text-primary-300 border border-primary-500/30">
            {track === 'competitive' ? '🎯 Competitive Topic' : '🏛️ College Unit'}
          </span>
          {parentName && (
            <span className="text-xs text-neutral-300 font-semibold">• {parentName}</span>
          )}
        </div>

        <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
          {topicTitle}
        </h1>

        <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Master this topic with expert-authored study handouts, lecture formulas, video walkthroughs, and practice quizzes.
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resources'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Study Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quizzes'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white/10 text-neutral-300 hover:bg-white/20'
            }`}
          >
            <FileQuestion className="w-4 h-4" /> Practice & Mock Quizzes ({quizzes.length})
          </button>
        </div>
      </div>

      {/* ─── TAB 1: STUDY MATERIALS ────────────────────────────────────────── */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {materials.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <FileText className="w-16 h-16 mx-auto text-neutral-300" />
              <h3 className="text-lg font-bold text-neutral-800">No study materials uploaded for this topic yet</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Our educators are currently creating lecture handouts and video walkthroughs for this topic. Check out the practice quizzes in the meantime!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((m) => {
                const author = m.author || {};
                return (
                  <Card key={m.id} className="p-6 space-y-4 flex flex-col justify-between hover:shadow-card-hover transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                          m.type === 'video' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          m.type === 'pdf' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {m.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          {m.type.toUpperCase()}
                        </span>

                        <span className="text-[11px] font-semibold text-neutral-400">
                          {m.downloadsCount || 0} views
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-neutral-900 line-clamp-2">{m.title}</h3>
                      <p className="text-xs text-neutral-500 line-clamp-3">{m.description || 'Comprehensive notes and formulas.'}</p>

                      {/* Author Attribution */}
                      <div className="pt-2 border-t border-neutral-100 flex items-center gap-2 text-xs">
                        <span className="font-bold text-neutral-800 truncate">{author.name || 'Educator'}</span>
                        {author.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 shrink-0">
                            ✓ {author.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => setPreviewMaterial(m)}
                        className="w-full font-bold"
                      >
                        {m.type === 'video' ? <Play className="w-3.5 h-3.5 mr-1" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
                        {m.type === 'video' ? 'Watch Video Lesson' : 'Open Resource'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: QUIZZES ────────────────────────────────────────────────── */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {quizzes.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <FileQuestion className="w-16 h-16 mx-auto text-neutral-300" />
              <h3 className="text-lg font-bold text-neutral-800">No quizzes available for this topic yet</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Educator submissions for this topic are currently undergoing review.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => {
                const author = quiz.author || {};
                return (
                  <Card key={quiz.id} className="p-6 space-y-4 flex flex-col justify-between hover:shadow-card-hover transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 text-primary-700">
                          🎯 Topic Assessment
                        </span>
                        <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {quiz.duration} mins
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-neutral-900">{quiz.title}</h3>
                      <p className="text-xs text-neutral-500 line-clamp-2">{quiz.description || 'Test your knowledge on key topic concepts.'}</p>

                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900">{author.name || 'Faculty Instructor'}</span>
                          {author.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800">
                              ✓ {author.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-neutral-400 font-medium">{quiz.totalAttempts || 0} attempts</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedQuiz(quiz);
                          handleStartQuiz(quiz, 'practice');
                        }}
                        className="flex-1 font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                      >
                        📖 Practice Mode
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedQuiz(quiz);
                          handleStartQuiz(quiz, 'mock');
                        }}
                        className="flex-1 font-bold shadow-xs"
                      >
                        ⏱️ Timed Mock Test
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── PREVIEW RESOURCE MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial?.title || 'Resource Preview'}
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto">
          {previewMaterial?.type === 'video' && previewMaterial?.videoUrl && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-md">
              <iframe
                src={getYoutubeEmbed(previewMaterial.videoUrl)}
                title={previewMaterial.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {previewMaterial?.type === 'pdf' && (
            <div className="p-8 rounded-2xl bg-neutral-100 text-center space-y-4">
              <FileText className="w-16 h-16 text-primary-600 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-neutral-900">{previewMaterial.title}</h4>
                <p className="text-xs text-neutral-500 mt-1">Downloadable PDF Lecture Notes</p>
              </div>
              {previewMaterial.fileUrl && (
                <a
                  href={`${api.defaults.baseURL.replace('/api', '')}${previewMaterial.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download / View PDF Handout
                </a>
              )}
            </div>
          )}

          {previewMaterial?.content && (
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
              {previewMaterial.content}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
