const { ForbiddenError, BadRequestError } = require('../utils/errors');
const { Course } = require('../config/database');

/**
 * Validates track permissions for educators and faculty:
 *
 * Faculty (belongs to an Institute, linked via instituteId):
 *   - Can create/manage content in COLLEGE track (courses, modules/subtopics, questions, quizzes)
 *     tied to their own institute's courses.
 *   - Can ALSO create content in COMPETITIVE track.
 *   - Cannot touch other institutes' courses.
 *   - Overwrite/ensure instituteId comes from req.user.instituteId.
 *
 * Educator (independent, no institute):
 *   - Can create content ONLY in COMPETITIVE track.
 *   - Must be blocked (403) from creating or editing college courses, subtopics, or college-track quizzes.
 *
 * Admin:
 *   - Unrestricted.
 */
const validateContributorTrack = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new ForbiddenError('Authentication required.'));
    }

    if (user.role === 'ADMIN') {
      return next();
    }

    // Determine normalized track from body or query
    const rawTrack = req.body?.track || req.body?.trackType || req.query?.track || req.query?.trackType || 'COMPETITIVE';
    const normalizedTrack = String(rawTrack).toUpperCase();

    const educatorType = user.educatorType ? String(user.educatorType).toUpperCase() : null;
    const isFaculty = user.role === 'EDUCATOR' && (educatorType === 'COLLEGE' || educatorType === 'BOTH' || Boolean(user.instituteId));
    const isPureEducator = user.role === 'EDUCATOR' && educatorType === 'COMPETITIVE' && !user.instituteId;

    if (normalizedTrack === 'COLLEGE') {
      // Educator without institute / college educatorType must be blocked
      if (isPureEducator || (!isFaculty && educatorType !== 'BOTH')) {
        return next(new ForbiddenError('Educators are only permitted to manage competitive track content. College content is restricted to faculty.'));
      }

      // If user is faculty, ensure instituteId is enforced from user profile
      if (isFaculty) {
        if (!user.instituteId) {
          // If faculty has no instituteId, reject with 403
          return next(new ForbiddenError('Faculty profile is missing an assigned instituteId.'));
        }

        // Always overwrite instituteId from user session to prevent spoofing
        req.body.instituteId = user.instituteId;

        // If a courseId is provided, verify it belongs to this faculty or their institute
        const courseId = req.body.courseId || req.params.courseId;
        if (courseId) {
          const course = await Course.findByPk(courseId);
          if (course) {
            if (course.instituteId && course.instituteId !== user.instituteId) {
              return next(new ForbiddenError('You cannot create or manage content for another institute.'));
            }
            if (course.facultyId && course.facultyId !== user.id && course.instituteId !== user.instituteId) {
              return next(new ForbiddenError('You do not have permission to manage content for this course.'));
            }
          }
        }
      }
    } else if (normalizedTrack === 'COMPETITIVE') {
      // Both faculty and competitive educators are allowed
      // If college-only educator tries competitive track:
      if (educatorType === 'COLLEGE' && !user.instituteId) {
        return next(new ForbiddenError('College educators cannot create competitive exam content.'));
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateContributorTrack
};

