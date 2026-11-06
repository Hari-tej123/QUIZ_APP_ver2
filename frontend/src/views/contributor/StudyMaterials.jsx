import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Upload,
  Video,
  BookOpen,
  PlusCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Download,
  ExternalLink,
  Layers,
  Sparkles,
  Eye
} from 'lucide-react';
import { Button, Card, Input, Badge, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function StudyMaterials() {
  const { showSuccess, showError } = useToast();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [hierarchy, setHierarchy] = useState({ competitiveExams: [], collegeCourses: [] });

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('pdf'); // 'pdf' | 'note' | 'video'
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [trackType, setTrackType] = useState('competitive');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState(null);

  useEffect(() => {
    fetchMaterials();
    fetchHierarchy();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contributor/materials');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setMaterials(list);
    } catch (err) {
      showError('Failed to fetch study materials.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchy = async () => {
    try {
      const res = await api.get('/contributor/hierarchy');
      const data = res?.data || res || { competitiveExams: [], collegeCourses: [] };
      setHierarchy({
        competitiveExams: data.competitiveExams || [],
        collegeCourses: data.collegeCourses || []
      });
      if (data.competitiveExams?.[0]) {
        setSelectedExamId(data.competitiveExams[0].id);
        const top = data.competitiveExams[0].editions?.[0]?.subjects?.[0]?.topics?.[0];
        if (top) setSelectedTopicId(top.id);
      }
      if (data.collegeCourses?.[0]) {
        setSelectedCourseId(data.collegeCourses[0].id);
        if (data.collegeCourses[0].subtopics?.[0]) {
          setSelectedSubtopicId(data.collegeCourses[0].subtopics[0].id);
        }
      }
    } catch (err) {}
  };


  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!title) return showError('Please enter material title.');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('trackType', trackType);

    if (type === 'video') formData.append('videoUrl', videoUrl);
    if (type === 'note' || content) formData.append('content', content);
    if (type === 'pdf' && file) formData.append('file', file);

    if (trackType === 'competitive') {
      formData.append('examId', selectedExamId);
      formData.append('examTopicId', selectedTopicId);
    } else {
      formData.append('courseId', selectedCourseId);
      formData.append('subtopicId', selectedSubtopicId);
    }

    setSubmitting(true);
    try {
      await api.post('/contributor/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSuccess('Study material submitted for review!');
      setUploadModalOpen(false);
      resetForm();
      fetchMaterials();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to upload study material.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('pdf');
    setVideoUrl('');
    setContent('');
    setFile(null);
  };

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">Learning Resources</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Topic Study Materials Hub
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Provide downloadable PDFs, structured formula notes, or embedded video explanations tied to topics.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setUploadModalOpen(true)} className="font-bold">
          <PlusCircle className="w-4.5 h-4.5 mr-2" />
          Upload Study Material
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : materials.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <FileText className="w-16 h-16 mx-auto text-neutral-300" />
          <h3 className="text-lg font-bold text-neutral-800">No study materials uploaded yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Upload high-yield lecture notes or attach video lessons to help students master challenging concepts.
          </p>
          <Button variant="primary" size="md" onClick={() => setUploadModalOpen(true)}>
            Upload First Material
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => {
            const topicName = m.examTopic?.name || m.subtopic?.title || 'General Topic';
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
                    <Badge variant={m.status === 'approved' ? 'success' : 'warning'}>
                      {m.status === 'approved' ? 'Approved' : 'In Review'}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 line-clamp-2">{m.title}</h3>
                  <p className="text-xs text-neutral-500 line-clamp-2">{m.description || 'No description provided.'}</p>

                  <div className="pt-2 border-t border-neutral-100 text-xs text-neutral-600 font-semibold">
                    🏷️ {topicName}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-medium">
                    {m.downloadsCount || 0} views
                  </span>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setPreviewMaterial(m)}
                    className="font-bold"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* UPLOAD MATERIAL MODAL */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Topic Study Material"
      >
        <form onSubmit={handleCreateMaterial} className="space-y-4">
          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('pdf')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'pdf' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
              }`}
            >
              📄 PDF Handout
            </button>
            <button
              type="button"
              onClick={() => setType('note')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'note' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
              }`}
            >
              📝 Rich Notes
            </button>
            <button
              type="button"
              onClick={() => setType('video')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'video' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
              }`}
            >
              🎥 Video Link
            </button>
          </div>

          <Input
            label="Material Title"
            placeholder="e.g. 15 Solved Recurrence Problems & Master Theorem Cheat Sheet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Brief Description</label>
            <textarea
              rows="2"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="What topics does this material cover?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Target Track */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Track</label>
              <select
                value={trackType}
                onChange={(e) => setTrackType(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-neutral-300 bg-white"
              >
                <option value="competitive">🎯 Competitive Exam</option>
                <option value="college">🏛️ College Course</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Topic</label>
              {trackType === 'competitive' ? (
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                >
                  {hierarchy.competitiveExams.flatMap(e =>
                    e.editions?.flatMap(ed =>
                      ed.subjects?.flatMap(s => s.topics || [])
                    ) || []
                  ).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedSubtopicId}
                  onChange={(e) => setSelectedSubtopicId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                >
                  {hierarchy.collegeCourses.flatMap(c => c.subtopics || []).map(st => (
                    <option key={st.id} value={st.id}>{st.title}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Specific Inputs based on type */}
          {type === 'pdf' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary-50 file:text-primary-700 file:font-bold cursor-pointer"
                required
              />
            </div>
          )}

          {type === 'video' && (
            <Input
              label="YouTube Video URL"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />
          )}

          {(type === 'note' || type === 'video') && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                {type === 'note' ? 'Study Handout & Formula Content (Markdown)' : 'Accompanying Notes'}
              </label>
              <textarea
                rows="4"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Enter summary notes, formulas, theorems..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting} className="font-bold">
              Submit Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* PREVIEW MATERIAL MODAL */}
      <Modal
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial?.title || 'Material Preview'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
            <div className="p-6 rounded-2xl bg-neutral-100 text-center space-y-3">
              <FileText className="w-12 h-12 text-primary-600 mx-auto" />
              <p className="text-sm font-bold text-neutral-800">PDF Document Attachment</p>
              {previewMaterial.fileUrl && (
                <a
                  href={`${api.defaults.baseURL.replace('/api', '')}${previewMaterial.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700"
                >
                  <Download className="w-4 h-4" /> Download / View PDF
                </a>
              )}
            </div>
          )}

          {previewMaterial?.content && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
              {previewMaterial.content}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
