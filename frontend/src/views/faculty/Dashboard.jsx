import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge } from '../../components/UI';
import { BookOpen, HelpCircle, FileSpreadsheet, PlusCircle, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { showError } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await apiClient.get('/faculty/courses');
        setCourses(response.data);
      } catch (err) {
        showError('Failed to fetch faculty stats.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [showError]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-premium h-40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-premium h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalCourses = courses.length;
  const totalSubtopics = courses.reduce((acc, c) => acc + (c.subtopics?.length || 0), 0);
  const totalQuizzes = courses.reduce((acc, c) => acc + (c.quizzes?.length || 0), 0);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-neutral-800 tracking-tight">Faculty Dashboard</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Configure courses, attach subtopic study materials, build quiz assessments, and review student grades.
        </p>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">My Courses</span>
            <h3 className="text-3xl font-extrabold text-neutral-900 mt-2 font-display">{totalCourses}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-primary-600" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Subtopic Lessons</span>
            <h3 className="text-3xl font-extrabold text-neutral-900 mt-2 font-display">{totalSubtopics}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-info-50 border border-info-100 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-info-600" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Quizzes</span>
            <h3 className="text-3xl font-extrabold text-neutral-900 mt-2 font-display">{totalQuizzes}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-success-50 border border-success-100 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-success-600" />
          </div>
        </div>
      </div>

      {/* Primary Action Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 rounded-2xl p-6 md:p-8 shadow-premium text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute w-80 h-80 bg-primary-700/20 rounded-full blur-3xl -top-20 -right-20 pointer-events-none" />
        <div className="flex flex-col max-w-xl gap-2 z-10">
          <h3 className="text-xl font-bold tracking-tight">Curriculum Design Workspace</h3>
          <p className="text-xs text-primary-200 leading-relaxed mt-1">
            Access your course listings to organize lectures, upload PDF/PPT slides, config exam countdown constraints, and import question sheets via Excel templates.
          </p>
        </div>
        <div className="shrink-0 z-10">
          <Link to="/faculty/courses">
            <Button className="bg-white hover:bg-neutral-100 text-primary-900 flex items-center gap-1.5 font-bold shadow-premium">
              Manage Courses <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Courses quick-list preview */}
      <div className="mt-2">
        <h3 className="text-base font-semibold text-neutral-800 mb-4">Course Curriculums Summary</h3>
        {courses.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-xs font-semibold text-neutral-400">No courses created yet.</p>
            <Link to="/faculty/courses" className="inline-block mt-3">
              <Button size="sm" className="flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" /> Initialize Course
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                title={course.title}
                subtitle={course.subject}
                hoverEffect={true}
                footer={
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-400">
                      {course.subtopics?.length || 0} Subtopics &bull; {course.quizzes?.length || 0} Quizzes
                    </span>
                    <Link to="/faculty/courses" className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1">
                      Manage <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                }
              >
                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
