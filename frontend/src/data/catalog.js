export const catalog = {
  Design: ['Poster Design', 'Event Banner Design', 'Instagram Post Design', 'Presentation/PPT Design', 'Logo Design', 'Certificate Design', 'Invitation Design'],
  'Video Editing': ['Instagram Reel Editing', 'Event Video Editing', 'Promotional Video Editing', 'Short Video Editing', 'Subtitle/Caption Addition', 'Video Trimming', 'YouTube Video Editing'],
  Programming: ['Website Development', 'Frontend Development', 'Backend Development', 'Bug Fixing', 'HTML/CSS Help', 'JavaScript Help', 'Python Help', 'C/C++ Help', 'Small Automation Scripts'],
  Writing: ['Social Media Captions', 'Event Announcements', 'Blog Writing', 'Proofreading', 'Resume Editing', 'Content Writing', 'Documentation'],
  Photography: ['Event Photography', 'Campus Photography', 'Product Photography', 'Portrait Photography', 'Photo Editing'],
  Tutoring: ['C Programming', 'C++', 'Java', 'Python', 'JavaScript', 'Mathematics', 'Aptitude', 'Logical Reasoning', 'Other academic subjects'],
  Translation: ['Telugu -> English', 'English -> Telugu', 'Hindi -> English', 'English -> Hindi', 'Other supported languages'],
  Logistics: ['Book Sorting', 'Moving Boxes', 'Event Setup', 'Material Packing']
};

export const categories = Object.keys(catalog);

export const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

export const categoryIcons = {
  Design: '🎨',
  'Video Editing': '🎬',
  Programming: '💻',
  Writing: '✍️',
  Photography: '📸',
  Tutoring: '📚',
  Translation: '🌐',
  Logistics: '📦'
};

export const servicesFor = category => catalog[category] || [];

// Task templates prefill category + service + sensible title/description (§7).
export const templates = [
  { label: '🎨 Create a poster', category: 'Design', service: 'Poster Design', title: 'Need a poster for our college event', description: 'Create a simple promotional poster for the event.', difficulty: 'Beginner' },
  { label: '🎨 Design an Instagram post', category: 'Design', service: 'Instagram Post Design', title: 'Design an Instagram post for Tech Fest', description: 'Square announcement graphic with event copy.', difficulty: 'Beginner' },
  { label: '🎨 Create a presentation', category: 'Design', service: 'Presentation/PPT Design', title: 'Create a short presentation deck', description: '5-slide clean deck for club orientation.', difficulty: 'Beginner' },
  { label: '🎬 Edit a reel', category: 'Video Editing', service: 'Instagram Reel Editing', title: 'Edit a 30-second event reel', description: 'Trim clips and add captions for the event reel.', difficulty: 'Intermediate' },
  { label: '🎬 Edit an event video', category: 'Video Editing', service: 'Event Video Editing', title: 'Edit our event highlight video', description: 'Cut 5 minutes of footage into a 1-minute highlight.', difficulty: 'Intermediate' },
  { label: '🎬 Add subtitles', category: 'Video Editing', service: 'Subtitle/Caption Addition', title: 'Add subtitles to a short video', description: 'Add English captions to a 2-minute clip.', difficulty: 'Beginner' },
  { label: '💻 Fix a small bug', category: 'Programming', service: 'Bug Fixing', title: 'Fix a small bug in our site', description: 'One button is not working on mobile. Quick fix needed.', difficulty: 'Intermediate' },
  { label: '💻 Help with code', category: 'Programming', service: 'JavaScript Help', title: 'Help me debug JavaScript', description: 'Stuck on a small function for 15 minutes of pairing.', difficulty: 'Beginner' },
  { label: '💻 Create a small website', category: 'Programming', service: 'Website Development', title: 'Create a one-page event site', description: 'Simple landing page with event details.', difficulty: 'Advanced' },
  { label: '📚 Help with Python', category: 'Tutoring', service: 'Python', title: 'Help with a Python problem', description: 'Explain one worked example to a first-year student.', difficulty: 'Beginner' },
  { label: '📚 Help with C', category: 'Tutoring', service: 'C Programming', title: 'Help with C pointers', description: '15-minute doubt clearing on pointers.', difficulty: 'Beginner' },
  { label: '📚 Help with Mathematics', category: 'Tutoring', service: 'Mathematics', title: 'Help with aptitude maths', description: 'Quick help with 2-3 aptitude questions.', difficulty: 'Intermediate' }
];
