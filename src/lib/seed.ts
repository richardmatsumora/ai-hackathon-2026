import type { Attendee } from './types';

export const TEAM: Attendee[] = [
  { name: 'Priya Shah', role: 'VP Product', rate: 180, essential: true, reason: '' },
  { name: 'Marcus Reed', role: 'Engineering Lead', rate: 140, essential: true, reason: '' },
  { name: 'Elena Rossi', role: 'Senior PM', rate: 120, essential: true, reason: '' },
  { name: 'Dan Owusu', role: 'Staff Engineer', rate: 150, essential: false, reason: '' },
  { name: 'Mei Lin', role: 'Product Designer', rate: 110, essential: false, reason: '' },
  { name: 'Jordan Blake', role: 'Data Analyst', rate: 95, essential: false, reason: '' },
  { name: 'Sam Patel', role: 'Customer Success', rate: 80, essential: false, reason: '' },
  { name: 'Nora Kim', role: 'Marketing Manager', rate: 100, essential: false, reason: '' },
  { name: 'Luis Alvarez', role: 'Frontend Engineer', rate: 120, essential: false, reason: '' },
  { name: 'Ada Njoku', role: 'QA Engineer', rate: 90, essential: false, reason: '' },
];

export const SAMPLE_MEETINGS = [
  { title: 'Q3 roadmap sync', suggested: 'decision', attendees: 8, duration: 60 },
  { title: 'Weekly team standup', suggested: 'update', attendees: 9, duration: 30 },
  { title: 'Pricing page ideas', suggested: 'brainstorm', attendees: 7, duration: 45 },
];
