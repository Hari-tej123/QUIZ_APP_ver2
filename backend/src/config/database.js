const { Sequelize } = require('sequelize');
const config = require('./config');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
}

// ─── Import existing models ─────────────────────────────────────────────────
const User = require('../models/User')(sequelize);
const Course = require('../models/Course')(sequelize);
const Enrollment = require('../models/Enrollment')(sequelize);
const Subtopic = require('../models/Subtopic')(sequelize);
const Quiz = require('../models/Quiz')(sequelize);
const Question = require('../models/Question')(sequelize);
const QuizAttempt = require('../models/QuizAttempt')(sequelize);
const AttemptAnswer = require('../models/AttemptAnswer')(sequelize);

// ─── Import exam-hierarchy models ───────────────────────────────────────────
const Exam = require('../models/Exam')(sequelize);
const ExamEdition = require('../models/ExamEdition')(sequelize);
const ExamSubject = require('../models/ExamSubject')(sequelize);
const ExamTopic = require('../models/ExamTopic')(sequelize);
const UserExamPreference = require('../models/UserExamPreference')(sequelize);

// ─── Import Contributor, Marketplace & Learning Flow models ─────────────────
const StudyMaterial = require('../models/StudyMaterial')(sequelize);
const ContentSubmission = require('../models/ContentSubmission')(sequelize);
const Payout = require('../models/Payout')(sequelize);
const PlatformSetting = require('../models/PlatformSetting')(sequelize);
const StudentQuestionRecord = require('../models/StudentQuestionRecord')(sequelize);
const FacultyRequest = require('../models/FacultyRequest')(sequelize);
const AuditLog = require('../models/AuditLog')(sequelize);
const Notification = require('../models/Notification')(sequelize);
const EducatorApplication = require('../models/EducatorApplication')(sequelize);
const EducatorInvite = require('../models/EducatorInvite')(sequelize);

// ─── Course & Faculty Associations ──────────────────────────────────────────
User.hasMany(Course, { foreignKey: 'facultyId', as: 'managedCourses' });
Course.belongsTo(User, { foreignKey: 'facultyId', as: 'faculty' });

// Student enrolls in Course (Many-to-Many via Enrollment)
User.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Course has Subtopics
Course.hasMany(Subtopic, { foreignKey: 'courseId', as: 'subtopics', onDelete: 'CASCADE' });
Subtopic.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Course has Quizzes
Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Subtopic has Quizzes
Subtopic.hasMany(Quiz, { foreignKey: 'subtopicId', as: 'quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Subtopic, { foreignKey: 'subtopicId', as: 'subtopic' });

// Quiz has Questions
Quiz.hasMany(Question, { foreignKey: 'quizId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// Student has QuizAttempts
User.hasMany(QuizAttempt, { foreignKey: 'studentId', as: 'attempts' });
QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Quiz has QuizAttempts
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// QuizAttempt has AttemptAnswers
QuizAttempt.hasMany(AttemptAnswer, { foreignKey: 'attemptId', as: 'answers', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(QuizAttempt, { foreignKey: 'attemptId', as: 'attempt' });

// Question has AttemptAnswers
Question.hasMany(AttemptAnswer, { foreignKey: 'questionId', as: 'answers', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// ─── Exam Hierarchy Associations ────────────────────────────────────────────
Exam.hasMany(ExamEdition, { foreignKey: 'examId', as: 'editions', onDelete: 'CASCADE' });
ExamEdition.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

ExamEdition.hasMany(ExamSubject, { foreignKey: 'examEditionId', as: 'subjects', onDelete: 'CASCADE' });
ExamSubject.belongsTo(ExamEdition, { foreignKey: 'examEditionId', as: 'edition' });

ExamSubject.hasMany(ExamTopic, { foreignKey: 'subjectId', as: 'topics', onDelete: 'CASCADE' });
ExamTopic.belongsTo(ExamSubject, { foreignKey: 'subjectId', as: 'subject' });

ExamEdition.hasMany(Quiz, { foreignKey: 'examEditionId', as: 'quizzes' });
Quiz.belongsTo(ExamEdition, { foreignKey: 'examEditionId', as: 'examEdition' });

ExamSubject.hasMany(Quiz, { foreignKey: 'examSubjectId', as: 'quizzes' });
Quiz.belongsTo(ExamSubject, { foreignKey: 'examSubjectId', as: 'examSubject' });

ExamTopic.hasMany(Quiz, { foreignKey: 'examTopicId', as: 'quizzes' });
Quiz.belongsTo(ExamTopic, { foreignKey: 'examTopicId', as: 'examTopic' });

User.hasMany(UserExamPreference, { foreignKey: 'userId', as: 'examPreferences' });
UserExamPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Exam.hasMany(UserExamPreference, { foreignKey: 'examId', as: 'userPreferences' });
UserExamPreference.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

User.belongsToMany(Exam, { through: UserExamPreference, foreignKey: 'userId', otherKey: 'examId', as: 'preparedExams' });
Exam.belongsToMany(User, { through: UserExamPreference, foreignKey: 'examId', otherKey: 'userId', as: 'preparingStudents' });

// ─── Contributor & Marketplace Associations ─────────────────────────────────

// Contributor / Educator authored quizzes & materials
User.hasMany(Quiz, { foreignKey: 'authorId', as: 'authoredQuizzes' });
Quiz.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(StudyMaterial, { foreignKey: 'authorId', as: 'authoredMaterials' });
StudyMaterial.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// StudyMaterial associations with College & Competitive hierarchies
Course.hasMany(StudyMaterial, { foreignKey: 'courseId', as: 'materials', onDelete: 'CASCADE' });
StudyMaterial.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Subtopic.hasMany(StudyMaterial, { foreignKey: 'subtopicId', as: 'materials', onDelete: 'CASCADE' });
StudyMaterial.belongsTo(Subtopic, { foreignKey: 'subtopicId', as: 'subtopic' });

Exam.hasMany(StudyMaterial, { foreignKey: 'examId', as: 'materials', onDelete: 'CASCADE' });
StudyMaterial.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

ExamEdition.hasMany(StudyMaterial, { foreignKey: 'examEditionId', as: 'materials', onDelete: 'CASCADE' });
StudyMaterial.belongsTo(ExamEdition, { foreignKey: 'examEditionId', as: 'examEdition' });

ExamSubject.hasMany(StudyMaterial, { foreignKey: 'examSubjectId', as: 'materials', onDelete: 'CASCADE' });
StudyMaterial.belongsTo(ExamSubject, { foreignKey: 'examSubjectId', as: 'examSubject' });

ExamTopic.hasMany(StudyMaterial, { foreignKey: 'examTopicId', as: 'materials', onDelete: 'CASCADE' });
StudyMaterial.belongsTo(ExamTopic, { foreignKey: 'examTopicId', as: 'examTopic' });

// ContentSubmissions
User.hasMany(ContentSubmission, { foreignKey: 'contributorId', as: 'submissions' });
ContentSubmission.belongsTo(User, { foreignKey: 'contributorId', as: 'contributor' });

User.hasMany(ContentSubmission, { foreignKey: 'reviewedBy', as: 'reviewedSubmissions' });
ContentSubmission.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

Quiz.hasOne(ContentSubmission, { foreignKey: 'quizId', as: 'submission' });
ContentSubmission.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

StudyMaterial.hasOne(ContentSubmission, { foreignKey: 'materialId', as: 'submission' });
ContentSubmission.belongsTo(StudyMaterial, { foreignKey: 'materialId', as: 'material' });

// Payouts
User.hasMany(Payout, { foreignKey: 'contributorId', as: 'payouts' });
Payout.belongsTo(User, { foreignKey: 'contributorId', as: 'contributor' });

// Student Question Records (Bookmarks, Mistakes & Revision)
User.hasMany(StudentQuestionRecord, { foreignKey: 'studentId', as: 'questionRecords' });
StudentQuestionRecord.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

User.hasMany(FacultyRequest, { foreignKey: 'userId', as: 'accessRequests' });
FacultyRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(FacultyRequest, { foreignKey: 'reviewedBy', as: 'reviewedAccessRequests' });
FacultyRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(AuditLog, { foreignKey: 'actorId', as: 'auditEntries' });
AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Question, { foreignKey: 'createdBy', as: 'createdQuestions' });
Question.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(EducatorApplication, { foreignKey: 'userId', as: 'educatorApplications' });
EducatorApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
User.hasMany(EducatorApplication, { foreignKey: 'reviewedBy', as: 'reviewedEducatorApplications' });
EducatorApplication.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(EducatorInvite, { foreignKey: 'invitedBy', as: 'sentEducatorInvites' });
EducatorInvite.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' });
User.hasMany(Quiz, { foreignKey: 'ownerId', as: 'ownedQuizzes' });
Quiz.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Quiz, { foreignKey: 'publishedBy', as: 'publishedQuizzes' });
Quiz.belongsTo(User, { foreignKey: 'publishedBy', as: 'publisher' });

Question.hasMany(StudentQuestionRecord, { foreignKey: 'questionId', as: 'records', onDelete: 'CASCADE' });
StudentQuestionRecord.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

Quiz.hasMany(StudentQuestionRecord, { foreignKey: 'quizId', as: 'questionRecords', onDelete: 'SET NULL' });
StudentQuestionRecord.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

module.exports = {
  sequelize,
  User,
  Course,
  Enrollment,
  Subtopic,
  Quiz,
  Question,
  QuizAttempt,
  AttemptAnswer,
  Exam,
  ExamEdition,
  ExamSubject,
  ExamTopic,
  UserExamPreference,
  StudyMaterial,
  ContentSubmission,
  Payout,
  PlatformSetting,
  StudentQuestionRecord,
  FacultyRequest,
  AuditLog,
  Notification,
  EducatorApplication,
  EducatorInvite
};
