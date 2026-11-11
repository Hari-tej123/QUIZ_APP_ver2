import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge, EmptyState, Modal } from '../../components/UI';
import {
  Search, GraduationCap, CheckCircle, ArrowRight, BookOpen, Layers,
  FileText, Play, CheckCircle2, User, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function BrowseCourses() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [enrollingId, setEnrollingId] = useState(null);

  // Preview syllabus modal state
  const [previewCourse, setPreviewCourse] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get('/student/courses/available');
      setCourses(response.data || []);
    } catch (err) {
      showError('Failed to fetch university course catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await apiClient.post('/student/courses/enroll', { courseId });
      showSuccess('Enrolled successfully! You can now access modules, slide handouts, and quizzes.');
      fetchCourses();
    } catch (err) {
      showError(err.message || 'Enrollment failed.');
    } finally {
      setEnrollingId(null);
    }
  };

  const handlePreviewSyllabus = async (course, e) => {
    if (e) e.stopPropagation();
    setPreviewCourse(course);
    setPreviewModalOpen(true);
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.facultyName && c.facultyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedSubjectFilter === 'all') return matchesSearch;
    return matchesSearch && c.subject.toLowerCase().includes(selectedSubjectFilter.toLowerCase());
  });

  const uniqueSubjects = Array.from(new Set(courses.map(c => c.subject).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-28 bg-white border border-neutral-200/80 rounded-2xl shadow-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-neutral-200/80 rounded-2xl p-6 h-56 shadow-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      
      {/* ─── HEADER BANNER (LIGHT THEME) ─────────────────────────────────── */}
      <div className="bg-white border border-neutral-200/90 p-6 md:p-8 rounded-3xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="trackCollege">
              🏛️ College & University Track
            </Badge>
            <span className="text-xs text-neutral-500 font-semibold">• Course → Unit/Module → Topic</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight font-display">
            University Courses & Curricula
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed font-medium">
            Explore university-level subjects such as <strong className="text-neutral-900 font-semibold">Data Structures & Algorithms, Computer Networks, Linear Algebra, Operating Systems, DBMS, and OOP</strong>. Download lecture notes and take topic-level assessments.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl text-center min-w-[90px]">
            <span className="text-2xl font-black text-amber-800 font-display block">
              {courses.filter(c => c.isEnrolled).length}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Enrolled</span>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-3.5 rounded-2xl text-center min-w-[90px]">
            <span className="text-2xl font-black text-neutral-900 font-display block">{courses.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Available</span>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & SUBJECT FILTER CHIPS ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by course title, subject, or professor..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[42px] text-sm border border-neutral-200/90 bg-white text-neutral-800 placeholder:text-neutral-400 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3.5 py-2 min-h-[36px] text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedSubjectFilter === 'all'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
            }`}
          >
            All Subjects
          </button>
          {uniqueSubjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubjectFilter(subj)}
              className={`px-3.5 py-2 min-h-[36px] text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedSubjectFilter === subj
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* ─── COURSES GRID ─────────────────────────────────────────────────── */}
      {filteredCourses.length === 0 ? (
        <Card className="text-center py-16">
          <EmptyState
            icon={<BookOpen className="w-8 h-8 text-neutral-400" />}
            title="No university courses match your query"
            description="Try changing your search term or selecting a different subject filter."
            actionLabel="Reset Search"
            onAction={() => {
              setSearchTerm('');
              setSelectedSubjectFilter('all');
            }}
            actionVariant="secondary"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:border-amber-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2.5 mb-3">
                  <Badge variant="trackCollege">
                    {course.subject || 'Academic Course'}
                  </Badge>
                  {course.isEnrolled && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-neutral-900 tracking-tight font-display line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-[11px] font-semibold text-neutral-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-neutral-400" /> Instructor: {course.facultyName || 'Faculty Professor'}
                </p>
                <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mt-3 font-medium">
                  {course.description || 'Comprehensive university curriculum covering theory, module slide notes, and topic assessments.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-neutral-400">
                  Units & Quizzes
                </span>

                {course.isEnrolled ? (
                  <Link to={`/student/courses/${course.id}`}>
                    <Button variant="amber" size="sm" className="font-bold gap-1 shadow-amber">
                      Enter Course <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="amber"
                    size="sm"
                    className="font-bold shadow-amber"
                    isLoading={enrollingId === course.id}
                    onClick={() => handleEnroll(course.id)}
                  >
                    Enroll Now
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
