// Sample data used across the whole prototype. Replace with real API calls later.
// Portraits: drop image files into /public/avatars (layla.jpg, karim.jpg ...) and they show up automatically.

export const fields = ['Design', 'Engineering', 'Business', 'Data', 'Medicine', 'Architecture'];
export const languages = ['Arabic', 'English', 'French'];

export const mentors = [
  {
    id: 'layla', name: 'Layla Haddad', headline: 'Senior Product Designer', company: 'Murex', field: 'Design',
    languages: ['Arabic', 'English', 'French'], rating: 4.9, reviews: 48, sessions: 112, years: 9, location: 'Beirut',
    response: 'Replies within 24 hours', tags: ['Portfolio review', 'UX research', 'Career switch'],
    photo: '/avatars/layla.jpg',
    bio: 'I have spent nine years designing products for banks, startups and regional teams. I enjoy helping students turn scattered projects into a portfolio that tells a clear story.',
    approach: 'Expect honest feedback, practical exercises and a plan you can actually use. Bring a project, a question or just your doubts.',
    experience: [
      { role: 'Senior Product Designer', place: 'Murex', period: '2020 – Present' },
      { role: 'UX Designer', place: 'Beirut digital agency', period: '2017 – 2020' },
      { role: 'BA Graphic Design', place: 'LAU', period: '2013 – 2017' },
    ],
  },
  {
    id: 'karim', name: 'Karim Nasr', headline: 'Senior Software Engineer', company: 'Beirut fintech', field: 'Engineering',
    languages: ['Arabic', 'English'], rating: 4.8, reviews: 36, sessions: 84, years: 8, location: 'Beirut',
    response: 'Replies within a day', tags: ['Web development', 'System design', 'Interview prep'], photo: '/avatars/karim.jpg',
    bio: 'Backend and web engineer. I help students pick a first stack, build real projects and prepare for technical interviews.',
    approach: 'We review your code together, set small weekly goals and practise interview questions out loud.',
    experience: [
      { role: 'Senior Software Engineer', place: 'Beirut fintech', period: '2019 – Present' },
      { role: 'Software Engineer', place: 'Local software house', period: '2016 – 2019' },
      { role: 'BS Computer Science', place: 'AUB', period: '2012 – 2016' },
    ],
  },
  {
    id: 'nour', name: 'Nour Khoury', headline: 'Strategy & Growth Consultant', company: 'Independent', field: 'Business',
    languages: ['Arabic', 'English', 'French'], rating: 4.9, reviews: 41, sessions: 97, years: 10, location: 'Beirut',
    response: 'Replies within a day', tags: ['Consulting', 'Interview prep', 'Networking'], photo: '/avatars/nour.jpg',
    bio: 'I advise companies across the region on growth strategy and coach graduates entering consulting.',
    approach: 'Case practice, CV reviews and honest feedback on how you come across.',
    experience: [
      { role: 'Strategy & Growth Consultant', place: 'Independent', period: '2018 – Present' },
      { role: 'Business Analyst', place: 'Regional consultancy', period: '2014 – 2018' },
      { role: 'MBA', place: 'USJ', period: '2012 – 2014' },
    ],
  },
  {
    id: 'rami', name: 'Rami Mansour', headline: 'Data Scientist', company: 'CME', field: 'Data',
    languages: ['Arabic', 'English'], rating: 4.7, reviews: 29, sessions: 61, years: 6, location: 'Beirut',
    response: 'Replies within 2 days', tags: ['Python', 'Machine learning', 'Analytics'], photo: '/avatars/rami.jpg',
    bio: 'I turn messy data into decisions. Happy to guide you from first Python script to your first portfolio project.',
    approach: 'Short project-based sessions with clear homework between calls.',
    experience: [
      { role: 'Data Scientist', place: 'CME', period: '2020 – Present' },
      { role: 'Data Analyst', place: 'Retail group', period: '2018 – 2020' },
      { role: 'BS Statistics', place: 'LIU', period: '2014 – 2018' },
    ],
  },
  {
    id: 'mira', name: 'Mira Saad', headline: 'Resident Physician', company: 'Beirut hospital', field: 'Medicine',
    languages: ['Arabic', 'English', 'French'], rating: 5.0, reviews: 22, sessions: 48, years: 5, location: 'Beirut',
    response: 'Replies within a day', tags: ['Study planning', 'Medical school', 'Residency'], photo: '/avatars/mira.jpg',
    bio: 'Currently in residency. I help pre-med and medical students plan their studies and avoid burnout.',
    approach: 'We build a realistic study schedule and talk openly about the hard parts.',
    experience: [
      { role: 'Resident Physician', place: 'Beirut hospital', period: '2023 – Present' },
      { role: 'Doctor of Medicine', place: 'AUB', period: '2016 – 2023' },
    ],
  },
  {
    id: 'jad', name: 'Jad Farah', headline: 'Architect & Studio Founder', company: 'Studio Farah', field: 'Architecture',
    languages: ['Arabic', 'English', 'French'], rating: 4.8, reviews: 24, sessions: 55, years: 12, location: 'Beirut',
    response: 'Replies within a day', tags: ['Portfolio', 'Licensing', 'Studio life'], photo: '/avatars/jad.jpg',
    bio: 'I run a small architecture studio and mentor graduates on portfolios, licensing and finding their first job.',
    approach: 'Portfolio reviews, mock interviews and honest advice about starting out in Lebanon.',
    experience: [
      { role: 'Founder', place: 'Studio Farah', period: '2016 – Present' },
      { role: 'Architect', place: 'Architecture firm', period: '2011 – 2016' },
      { role: 'Bachelor of Architecture', place: 'AUB', period: '2006 – 2011' },
    ],
  },
];

export const reviews = [
  { name: 'Sarah M.', role: 'Design student · LAU', text: 'My mentor helped me turn my portfolio into a story I was proud to share. The feedback was honest and practical.', rating: 5 },
  { name: 'Omar A.', role: 'Computer science student · AUB', text: 'One conversation saved me months of guessing. I finally knew what to learn next.', rating: 5 },
  { name: 'Lina K.', role: 'Business student · USJ', text: 'Warm, direct and very well prepared. I left with a clear plan.', rating: 4 },
];

export const slotDays = ['Tue, Oct 20', 'Wed, Oct 21', 'Thu, Oct 22', 'Fri, Oct 23', 'Sat, Oct 24'];
export const slotTimes = ['17:00', '18:00', '19:00', '20:00'];
export const goals = ['Portfolio review', 'Career advice', 'Interview prep', 'Study planning', 'Technical question'];

export const mentorById = (id) => mentors.find((m) => m.id === id) || mentors[0];

/* ---------------- Student ---------------- */
export const student = { name: 'Sarah Mansour', school: 'LAU', photo: '/avatars/sarah.jpg' };

export const studentSessions = [
  { id: 1, mentor: 'karim', topic: 'Web development · first steps', month: 'OCT', day: '21', time: '18:00 – 18:45 · Video call', status: 'Confirmed' },
  { id: 2, mentor: 'nour', topic: 'Interview prep · consulting', month: 'OCT', day: '23', time: '16:00 – 16:45 · Video call', status: 'Confirmed' },
  { id: 3, mentor: 'jad', topic: 'Architecture portfolio review', month: 'OCT', day: '26', time: '17:00 – 17:45 · Video call', status: 'Accepted' },
  { id: 4, mentor: 'layla', topic: 'Portfolio review', month: '—', day: '?', time: 'Requested Oct 20 · Awaiting reply', status: 'Pending' },
  { id: 5, mentor: 'rami', topic: 'Python for data analysis', month: 'OCT', day: '14', time: 'Completed · 45 minutes', status: 'Completed', rated: false },
  { id: 6, mentor: 'mira', topic: 'Study planning', month: 'OCT', day: '07', time: 'Completed · 45 minutes', status: 'Completed', rated: true },
];

export const conversations = [
  {
    id: 'karim', mentor: 'karim', unread: true, time: '18:02',
    messages: [
      { mine: false, text: 'Hi Sarah! Thanks for your request. I’d be glad to help you get started with web development.', time: '17:54' },
      { mine: true, text: 'Thank you, Karim! I just started learning JavaScript and would love feedback on my first projects.', time: '17:58' },
      { mine: false, text: 'Great. Share your GitHub link before our session and we’ll pick one project to review together.', time: '18:02' },
    ],
  },
  { id: 'layla', mentor: 'layla', unread: true, time: 'Yesterday', messages: [{ mine: false, text: 'Thanks for your request! I’ll review it today.', time: 'Yesterday' }] },
  { id: 'nour', mentor: 'nour', unread: false, time: 'Mon', messages: [{ mine: false, text: 'See you on Friday, Sarah.', time: 'Mon' }] },
  { id: 'rami', mentor: 'rami', unread: false, time: 'Oct 14', messages: [{ mine: false, text: 'Glad it helped. Good luck with the project!', time: 'Oct 14' }] },
  { id: 'mira', mentor: 'mira', unread: false, time: 'Oct 7', messages: [{ mine: false, text: 'Happy to help any time.', time: 'Oct 7' }] },
];

/* ---------------- Admin ---------------- */
export const applicants = [
  { id: 1, name: 'Dana Haddad', headline: 'Product Manager · Beirut', field: 'Product', submitted: '2 hours ago', status: 'Pending', experience: '9 years', education: 'BA Business, AUB', languages: 'Arabic · English · French', linkedin: 'linkedin.com/in/dana-haddad', docs: [['Resume.pdf', '240 KB'], ['National ID.jpg', '1.1 MB']] },
  { id: 2, name: 'Elie Abou Jaoude', headline: 'Mechanical Engineer · Zahle', field: 'Engineering', submitted: '5 hours ago', status: 'Pending', experience: '7 years', education: 'BE Mechanical, USEK', languages: 'Arabic · English', linkedin: 'linkedin.com/in/elie-aj', docs: [['Resume.pdf', '198 KB'], ['National ID.jpg', '980 KB']] },
  { id: 3, name: 'Hiba Sleiman', headline: 'Pharmacist · Tripoli', field: 'Healthcare', submitted: 'Yesterday', status: 'Pending', experience: '6 years', education: 'PharmD, LU', languages: 'Arabic · English', linkedin: 'linkedin.com/in/hiba-sleiman', docs: [['Resume.pdf', '210 KB'], ['National ID.jpg', '1.0 MB']] },
  { id: 4, name: 'Georges Rahme', headline: 'Financial Analyst · Beirut', field: 'Finance', submitted: 'Yesterday', status: 'Pending', experience: '5 years', education: 'BS Finance, LAU', languages: 'Arabic · English · French', linkedin: 'linkedin.com/in/georges-rahme', docs: [['Resume.pdf', '175 KB'], ['National ID.jpg', '900 KB']] },
  { id: 5, name: 'Yara Karam', headline: 'Lawyer · Jounieh', field: 'Law', submitted: '2 days ago', status: 'Pending', experience: '8 years', education: 'LLB, USJ', languages: 'Arabic · French', linkedin: 'linkedin.com/in/yara-karam', docs: [['Resume.pdf', '260 KB'], ['National ID.jpg', '1.2 MB']] },
  { id: 6, name: 'Omar Itani', headline: 'Cybersecurity Engineer · Saida', field: 'Technology', submitted: '3 days ago', status: 'Pending', experience: '6 years', education: 'BS CS, BAU', languages: 'Arabic · English', linkedin: 'linkedin.com/in/omar-itani', docs: [['Resume.pdf', '220 KB'], ['National ID.jpg', '1.0 MB']] },
];

export const reports = [
  { id: 1045, user: 'Hassan Yazbek', role: 'Student', joined: 'Sep 2026', previous: 0, reason: 'Inappropriate messages', by: 'Mira Saad (mentor)', date: 'Today, 11:42', priority: 'High', status: 'Open', description: 'The student sent several off-topic and disrespectful messages after I declined the session request.', evidence: '3 flagged messages' },
  { id: 1044, user: 'Fadi Aoun', role: 'Mentor', joined: 'Aug 2026', previous: 1, reason: 'No-show to session', by: 'Sarah Mansour (student)', date: 'Today, 09:05', priority: 'Medium', status: 'Open', description: 'I waited 20 minutes and the mentor never joined the video call.', evidence: 'Session log' },
  { id: 1043, user: 'Lina Bitar', role: 'Mentor', joined: 'Sep 2026', previous: 0, reason: 'Fake credentials', by: 'Karim Nasr (mentor)', date: 'Yesterday', priority: 'High', status: 'Open', description: 'The profile claims a position at a company I know she never worked at.', evidence: 'Profile screenshots' },
  { id: 1041, user: 'Ziad Ghosn', role: 'Student', joined: 'Oct 2026', previous: 0, reason: 'Spam requests', by: 'Nour Khoury (mentor)', date: 'Oct 18', priority: 'Low', status: 'Open', description: 'Sent the same request to dozens of mentors with a link.', evidence: '12 requests' },
];

export const users = [
  { id: 1, name: 'Sarah Mansour', email: 'sarah.m@lau.edu.lb', role: 'Student', joined: 'Sep 3, 2026', sessions: 5, status: 'Active', photo: '/avatars/sarah.jpg' },
  { id: 2, name: 'Karim Nasr', email: 'karim.nasr@mail.com', role: 'Mentor', joined: 'Aug 12, 2026', sessions: 36, status: 'Active', photo: '/avatars/karim.jpg' },
  { id: 3, name: 'Layla Haddad', email: 'layla.haddad@mail.com', role: 'Mentor', joined: 'Aug 2, 2026', sessions: 48, status: 'Active', photo: '/avatars/layla.jpg' },
  { id: 4, name: 'Hassan Yazbek', email: 'hassan.y@aub.edu.lb', role: 'Student', joined: 'Sep 20, 2026', sessions: 1, status: 'Active' },
  { id: 5, name: 'Tony Saliba', email: 'tony.saliba@mail.com', role: 'Student', joined: 'Sep 9, 2026', sessions: 0, status: 'Banned' },
  { id: 6, name: 'Jad Farah', email: 'jad@studiofarah.com', role: 'Mentor', joined: 'Aug 28, 2026', sessions: 24, status: 'Active', photo: '/avatars/jad.jpg' },
  { id: 7, name: 'Rim Hamdan', email: 'rim.hamdan@liu.edu.lb', role: 'Student', joined: 'Oct 2, 2026', sessions: 2, status: 'Active' },
];

export const announcements = [
  { id: 1, title: 'New mentors in Tripoli', audience: 'All users', date: 'Yesterday', delivered: '2,418 delivered' },
  { id: 2, title: 'Scheduled maintenance · Oct 25', audience: 'All users', date: 'Oct 17', delivered: '2,392 delivered' },
  { id: 3, title: 'Tips for your first session', audience: 'Students', date: 'Oct 10', delivered: '1,980 delivered' },
  { id: 4, title: 'Mentor guidelines updated', audience: 'Mentors', date: 'Oct 3', delivered: '186 delivered' },
];

export const weeklySessions = [
  ['Sep 1', 96], ['Sep 8', 118], ['Sep 15', 131], ['Sep 22', 150], ['Sep 29', 162], ['Oct 6', 171], ['Oct 13', 189], ['Oct 20', 204],
];

export const recentActivity = [
  { id: 1, event: 'Mentor Dana Haddad verified and published', admin: 'Rana Khalil', when: '12 minutes ago' },
  { id: 2, event: 'Report #1042 resolved · user warned', admin: 'Rana Khalil', when: '1 hour ago' },
  { id: 3, event: 'Announcement “New mentors in Tripoli” sent', admin: 'Nadine Saab', when: 'Yesterday, 10:30' },
  { id: 4, event: 'User tony.saliba banned for 30 days', admin: 'Nadine Saab', when: 'Yesterday, 09:12' },
];

/* ---------------- Super admin ---------------- */
// Logging in with this email opens the super admin dashboard.
export const superAdmin = { name: 'Mr. Omar Kitmitto', email: 'kitmittofam@gmail.com' };

export const admins = [
  { id: 1, name: superAdmin.name, email: superAdmin.email, role: 'Super admin', status: 'Active' },
  { id: 2, name: 'Rana Khalil', email: 'rana.khalil@m3allim.com', role: 'Admin', status: 'Active' },
  { id: 3, name: 'Nadine Saab', email: 'nadine.saab@m3allim.com', role: 'Admin', status: 'Active' },
  { id: 4, name: 'Maya Chahine', email: 'maya.chahine@m3allim.com', role: 'Admin', status: 'Invited' },
  { id: 5, name: 'Ali Hamdan', email: 'ali.hamdan@m3allim.com', role: 'Admin', status: 'Suspended' },
];

export const auditLog = [
  { id: 1, time: 'Oct 20 · 11:58', admin: 'Rana Khalil', action: 'Verified mentor', target: 'Dana Haddad' },
  { id: 2, time: 'Oct 20 · 11:42', admin: 'Nadine Saab', action: 'Banned user for 30 days', target: 'Tony Saliba' },
  { id: 3, time: 'Oct 20 · 10:15', admin: superAdmin.name, action: 'Changed cancellation window', target: 'Platform' },
  { id: 4, time: 'Oct 19 · 17:02', admin: superAdmin.name, action: 'Invited admin', target: 'Maya Chahine' },
  { id: 5, time: 'Oct 19 · 15:20', admin: 'Rana Khalil', action: 'Resolved report #1042', target: 'Tony Saliba' },
  { id: 6, time: 'Oct 19 · 09:31', admin: superAdmin.name, action: 'Exported users data', target: 'Platform' },
  { id: 7, time: 'Oct 18 · 14:05', admin: 'Nadine Saab', action: 'Sent announcement', target: 'All users' },
  { id: 8, time: 'Oct 18 · 08:44', admin: superAdmin.name, action: 'Suspended admin', target: 'Ali Hamdan' },
];

export const services = ['Web application', 'MySQL database', 'Email notifications', 'Video session links'];
