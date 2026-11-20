// Lists and limits used across the website. The matching database checks are in supabase/schema.sql.

export const FIELDS = ['Design', 'Engineering', 'Business', 'Data', 'Medicine', 'Architecture', 'Law', 'Finance', 'Marketing', 'Education', 'Other'];
export const UNIVERSITIES = ['AUB', 'LAU', 'LIU', 'USJ', 'LU', 'USEK', 'NDU', 'BAU', 'Other'];
export const LANGUAGES = ['Arabic', 'English', 'French', 'Armenian', 'Spanish', 'German'];

/* Mentor applications */
export const ID_TYPES = ['National ID', 'Passport'];
export const DOC_TYPES = '.pdf,.doc,.docx';
export const ID_DOC_TYPES = '.jpg,.jpeg,.png,.webp,.pdf';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB, same limit as the storage bucket

/* Sessions */
export const TIME_ZONE = 'Asia/Beirut'; // every time on the website is shown in Beirut time
export const JOIN_EARLY_MIN = 10;       // the video call opens this many minutes before the start
export const JOIN_LATE_MIN = 15;        // and stays open this long after the planned end
export const BOOKING_DAYS = 21;         // how far ahead students can book
export const SLOT_STEP_MIN = 30;        // start times are offered every 30 minutes
export const DEFAULT_HOURS = { start: '08:00', end: '22:00' }; // used while a mentor hasn't set availability
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* Moderation */
export const REPORT_REASONS = ['Inappropriate behaviour', 'Harassment', 'Spam or scam', 'Didn’t show up', 'Fake profile', 'Other'];
export const BAN_DURATIONS = [
  { label: '24 hours', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'Permanent', days: null },
];
export const AUDIENCES = ['Everyone', 'Students', 'Mentors'];
export const SUPPORT_CATEGORIES = ['Account', 'Sessions', 'Mentor application', 'Technical problem', 'Report follow-up', 'Ban appeal', 'Other'];

/* Platform settings defaults (used until the settings row loads) */
export const DEFAULT_SETTINGS = {
  platform_name: 'M3allim',
  support_email: 'hello@m3allim.com',
  student_signups_open: true,
  mentor_applications_open: true,
  session_length_min: 45,
  max_pending_requests: 3,
  min_notice_hours: 12,
  maintenance_mode: false,
  maintenance_message: 'We’re making M3allim better and will be back shortly. Thank you for your patience.',
};
