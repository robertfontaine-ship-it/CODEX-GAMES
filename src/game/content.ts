export type SkillCategory =
  | 'Professionalism'
  | 'People Skills'
  | 'Problem Solving'
  | 'Operations';

export type InboxAction =
  | 'Respond Now'
  | 'Schedule'
  | 'Escalate'
  | 'Delete'
  | 'Report Phishing';

export interface ChoiceEffect {
  xp?: number;
  trust?: number;
  credits?: number;
  time?: number;
  ally?: string;
  modifier?: string;
}

export interface EncounterChoice {
  id: string;
  label: string;
  detail: string;
  outcome: string;
  effect: ChoiceEffect;
  skills: string[];
  category: SkillCategory;
}

export interface Encounter {
  id: string;
  location: string;
  speaker: string;
  role: string;
  title: string;
  situation: string;
  alert: string;
  choices: EncounterChoice[];
}

export interface InboxMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  correctAction: InboxAction;
  rationale: string;
  skills: string[];
  category: SkillCategory;
}

export interface ElevatorChoice {
  label: string;
  correct: boolean;
  feedback: string;
  skill: string;
  category: SkillCategory;
}

export interface ElevatorPrompt {
  id: string;
  threat: string;
  context: string;
  choices: ElevatorChoice[];
}

export const encounters: Encounter[] = [
  {
    id: 'brief-unclear',
    location: 'Orientation Bay',
    speaker: 'Ms. Vale',
    role: 'Acting Floor Manager',
    title: 'The Vague Assignment',
    alert: 'The emergency alarms are active and your manager is moving fast.',
    situation:
      'Ms. Vale tells you to “handle the customer files before lunch,” but she does not explain which files, what finished work looks like, or who needs the results.',
    choices: [
      {
        id: 'clarify',
        label: 'Clarify the mission',
        detail: 'Ask which files matter most, confirm the deadline, and repeat the instructions back.',
        outcome:
          'Ms. Vale gives you a priority list and marks you as someone who can be trusted under pressure.',
        effect: { xp: 18, trust: 2, time: 1, ally: 'Ms. Vale', modifier: 'clearBrief' },
        skills: ['Communication', 'Responsibility', 'Critical Thinking'],
        category: 'People Skills',
      },
      {
        id: 'guess',
        label: 'Guess and get moving',
        detail: 'Start opening random customer files so you look busy.',
        outcome:
          'You make progress quickly, but half the files are from last quarter and must be redone.',
        effect: { xp: 4, trust: -1, time: -2, modifier: 'inboxNoise' },
        skills: ['Responsibility', 'Time Management'],
        category: 'Professionalism',
      },
      {
        id: 'complain',
        label: 'Call out the bad directions',
        detail: 'Tell the other interns the manager has no idea what she is doing.',
        outcome:
          'The interns laugh, but Ms. Vale hears you over the emergency intercom.',
        effect: { xp: -4, trust: -3, credits: -5, modifier: 'managerDistrust' },
        skills: ['Professionalism', 'Integrity'],
        category: 'Professionalism',
      },
    ],
  },
  {
    id: 'data-exposed',
    location: 'Records Corridor',
    speaker: 'System Alert',
    role: 'OmniCorp Security Network',
    title: 'Confidential Data Exposed',
    alert: 'An infected employee abandoned an unlocked workstation.',
    situation:
      'Customer records, payroll information, and employee passwords are visible on the screen. People are running through the corridor toward the elevators.',
    choices: [
      {
        id: 'secure-report',
        label: 'Secure and report it',
        detail: 'Lock the workstation, block access to the area, and notify IT security.',
        outcome:
          'IT contains the breach and sends a technician to support you during the next system challenge.',
        effect: { xp: 20, trust: 2, credits: 8, ally: 'IT Technician', modifier: 'securityShield' },
        skills: ['Information Security', 'Integrity', 'Responsibility'],
        category: 'Operations',
      },
      {
        id: 'ignore-data',
        label: 'Keep moving',
        detail: 'The outbreak is bigger than one unlocked computer. Leave it alone.',
        outcome:
          'Someone uses the exposed account to flood the company inbox with fake emergency messages.',
        effect: { xp: -2, trust: -2, time: -1, modifier: 'phishingFlood' },
        skills: ['Information Security', 'Responsibility'],
        category: 'Operations',
      },
      {
        id: 'take-photo',
        label: 'Photograph the evidence',
        detail: 'Take a picture with your phone so you can prove what happened later.',
        outcome:
          'The evidence is useful, but you have now copied private data onto a personal device.',
        effect: { xp: 2, trust: -3, credits: -4, modifier: 'privacyViolation' },
        skills: ['Information Security', 'Integrity'],
        category: 'Professionalism',
      },
    ],
  },
  {
    id: 'intern-conflict',
    location: 'Project War Room',
    speaker: 'Jules and Micah',
    role: 'Fellow Interns',
    title: 'Team Meltdown',
    alert: 'A supply request must be finished before the emergency doors lock.',
    situation:
      'Jules says Micah failed to update the inventory count. Micah says Jules changed the spreadsheet without telling anyone. They are arguing while the timer continues to run.',
    choices: [
      {
        id: 'mediate',
        label: 'Reset the team',
        detail: 'Move the conversation private, identify what changed, and divide the remaining work clearly.',
        outcome:
          'The team stops blaming each other, finishes the request, and agrees to back you up at the elevator.',
        effect: { xp: 20, trust: 3, time: 2, ally: 'Intern Team', modifier: 'teamAssist' },
        skills: ['Conflict Resolution', 'Teamwork', 'Communication'],
        category: 'People Skills',
      },
      {
        id: 'do-it-all',
        label: 'Take over the assignment',
        detail: 'Tell both interns to step aside and finish the spreadsheet yourself.',
        outcome:
          'The request gets submitted, but you lose time and the team learns nothing.',
        effect: { xp: 8, trust: -1, time: -3, modifier: 'overloaded' },
        skills: ['Responsibility', 'Time Management'],
        category: 'Professionalism',
      },
      {
        id: 'choose-side',
        label: 'Choose who is right',
        detail: 'Publicly blame the person whose mistake seems worse.',
        outcome:
          'One intern feels supported. The other walks out and takes the access badge needed for the fastest route.',
        effect: { xp: 1, trust: -3, time: -2, modifier: 'lostBadge' },
        skills: ['Conflict Resolution', 'Teamwork'],
        category: 'People Skills',
      },
    ],
  },
  {
    id: 'phishing-email',
    location: 'Communications Hub',
    speaker: 'Unknown Sender',
    role: 'Email: CEO Emergency Office',
    title: 'Password Required Immediately',
    alert: 'The sender claims the CEO needs your password to unlock the evacuation system.',
    situation:
      'The message uses urgent language, contains a strange link, and asks you to bypass normal security rules. The display says the request expires in 60 seconds.',
    choices: [
      {
        id: 'report-phish',
        label: 'Report the phishing attempt',
        detail: 'Do not click. Verify the request through an official channel and report the message.',
        outcome:
          'Security confirms the CEO never requested a password. The fake sender is blocked from your Inbox Zero round.',
        effect: { xp: 22, trust: 2, credits: 10, ally: 'Security Bot', modifier: 'phishHint' },
        skills: ['Information Security', 'Critical Thinking', 'Professionalism'],
        category: 'Problem Solving',
      },
      {
        id: 'reply-email',
        label: 'Reply for verification',
        detail: 'Ask the sender to prove they work for the CEO.',
        outcome:
          'You avoid giving up the password, but replying confirms your account is active and triggers more spam.',
        effect: { xp: 5, trust: 0, time: -2, modifier: 'extraSpam' },
        skills: ['Critical Thinking', 'Communication'],
        category: 'Problem Solving',
      },
      {
        id: 'click-link',
        label: 'Use the emergency link',
        detail: 'The evacuation system might depend on you. Enter the password quickly.',
        outcome:
          'The link launches a fake login screen and compromises the communication hub.',
        effect: { xp: -8, trust: -4, credits: -8, time: -3, modifier: 'systemCompromised' },
        skills: ['Information Security', 'Critical Thinking'],
        category: 'Operations',
      },
    ],
  },
];

export const inboxActions: InboxAction[] = [
  'Respond Now',
  'Schedule',
  'Escalate',
  'Delete',
  'Report Phishing',
];

export const inboxMessages: InboxMessage[] = [
  {
    id: 'customer-locked-out',
    sender: 'Front Desk',
    subject: 'Customer trapped behind security gate',
    preview: 'A customer is waiting now and the gate override is not responding.',
    correctAction: 'Escalate',
    rationale: 'The issue is urgent, affects safety, and requires authorized technical help.',
    skills: ['Customer Service', 'Workplace Safety', 'Communication'],
    category: 'People Skills',
  },
  {
    id: 'weekly-report',
    sender: 'Ms. Vale',
    subject: 'Weekly activity report due Friday',
    preview: 'Please add your notes before the end of the week. No action is needed today.',
    correctAction: 'Schedule',
    rationale: 'The task matters but is not urgent. Scheduling protects current priorities.',
    skills: ['Time Management', 'Responsibility'],
    category: 'Professionalism',
  },
  {
    id: 'password-reset',
    sender: 'omn1corp-security.biz',
    subject: 'FINAL WARNING: Password expires in 3 minutes',
    preview: 'Use this external link and enter your current password to prevent account deletion.',
    correctAction: 'Report Phishing',
    rationale: 'The sender, urgency, external link, and password request are phishing indicators.',
    skills: ['Information Security', 'Critical Thinking'],
    category: 'Operations',
  },
  {
    id: 'customer-followup',
    sender: 'Customer Care',
    subject: 'Customer requested a call back this morning',
    preview: 'The customer says the replacement order arrived damaged and is waiting for an update.',
    correctAction: 'Respond Now',
    rationale: 'A promised customer follow-up is time-sensitive and affects trust.',
    skills: ['Customer Service', 'Professionalism', 'Communication'],
    category: 'People Skills',
  },
  {
    id: 'coupon-spam',
    sender: 'Office Mega Deals',
    subject: 'BUY 4 TONERS GET 19 FREE!!!',
    preview: 'Unrequested advertisement with no connection to current work.',
    correctAction: 'Delete',
    rationale: 'This is low-value unsolicited advertising and does not require work time.',
    skills: ['Time Management', 'Information Literacy'],
    category: 'Problem Solving',
  },
  {
    id: 'chemical-spill',
    sender: 'Facilities',
    subject: 'Cleaning chemical spill near stairwell B',
    preview: 'The area is not blocked off and employees are still using the stairwell.',
    correctAction: 'Escalate',
    rationale: 'The situation presents an immediate safety hazard and requires facilities leadership.',
    skills: ['Workplace Safety', 'Responsibility'],
    category: 'Operations',
  },
  {
    id: 'meeting-agenda',
    sender: 'Project Team',
    subject: 'Add agenda ideas for next Tuesday',
    preview: 'Please add suggestions before Monday afternoon.',
    correctAction: 'Schedule',
    rationale: 'The request has a future deadline and should be planned without interrupting urgent work.',
    skills: ['Time Management', 'Teamwork'],
    category: 'Professionalism',
  },
  {
    id: 'manager-question',
    sender: 'Ms. Vale',
    subject: 'Need the verified customer count now',
    preview: 'The evacuation supply order cannot be submitted until the count is confirmed.',
    correctAction: 'Respond Now',
    rationale: 'The request blocks current operations and comes from a verified manager.',
    skills: ['Communication', 'Responsibility', 'Mathematics'],
    category: 'Problem Solving',
  },
];

export const elevatorPrompts: ElevatorPrompt[] = [
  {
    id: 'blocked-door',
    threat: 'The elevator lobby door is jammed by fallen office equipment.',
    context: 'Coworkers are gathering behind you while alarms announce a floor lockdown.',
    choices: [
      {
        label: 'Organize a safe team lift and clear a marked path',
        correct: true,
        feedback: 'Clear communication and safe teamwork open the route.',
        skill: 'Teamwork',
        category: 'People Skills',
      },
      {
        label: 'Climb over the equipment and tell everyone to follow',
        correct: false,
        feedback: 'The unstable equipment shifts and costs valuable time.',
        skill: 'Workplace Safety',
        category: 'Operations',
      },
      {
        label: 'Wait silently for someone else to solve it',
        correct: false,
        feedback: 'The lockdown timer continues while nobody takes responsibility.',
        skill: 'Responsibility',
        category: 'Professionalism',
      },
    ],
  },
  {
    id: 'angry-customer',
    threat: 'An angry customer blocks the elevator and demands an immediate refund.',
    context: 'They are frustrated, speaking loudly, and refusing to move.',
    choices: [
      {
        label: 'Acknowledge the concern, explain the emergency, and promise a documented follow-up',
        correct: true,
        feedback: 'The customer feels heard and steps aside without losing trust.',
        skill: 'Customer Service',
        category: 'People Skills',
      },
      {
        label: 'Tell them this is not the time and push past',
        correct: false,
        feedback: 'The conflict escalates and attracts infected employees.',
        skill: 'Conflict Resolution',
        category: 'People Skills',
      },
      {
        label: 'Promise any refund amount they want',
        correct: false,
        feedback: 'Making unauthorized promises creates a larger problem later.',
        skill: 'Integrity',
        category: 'Professionalism',
      },
    ],
  },
  {
    id: 'access-code',
    threat: 'The elevator requests a six-digit access code from the inventory report.',
    context: 'The report shows 128 supply kits, 37 were distributed, and 6 were damaged.',
    choices: [
      {
        label: 'Enter 000085',
        correct: true,
        feedback: '128 − 37 − 6 = 85. The elevator accepts the verified count.',
        skill: 'Mathematics',
        category: 'Problem Solving',
      },
      {
        label: 'Enter 000091',
        correct: false,
        feedback: 'The damaged kits must also be removed from usable inventory.',
        skill: 'Mathematics',
        category: 'Problem Solving',
      },
      {
        label: 'Enter 000165',
        correct: false,
        feedback: 'Adding distributed kits inflates the amount currently available.',
        skill: 'Mathematics',
        category: 'Problem Solving',
      },
    ],
  },
  {
    id: 'final-security',
    threat: 'A message claims the CEO needs your badge number to unlock the elevator.',
    context: 'The request appears in a pop-up with a misspelled OmniCorp logo.',
    choices: [
      {
        label: 'Close the pop-up and use the official elevator security panel',
        correct: true,
        feedback: 'You reject the social-engineering attempt and restore the elevator.',
        skill: 'Information Security',
        category: 'Operations',
      },
      {
        label: 'Enter the badge number because the CEO outranks you',
        correct: false,
        feedback: 'Authority and urgency do not make an unverified request safe.',
        skill: 'Information Security',
        category: 'Operations',
      },
      {
        label: 'Ask a coworker to enter their badge instead',
        correct: false,
        feedback: 'Passing the risk to someone else does not solve the security problem.',
        skill: 'Integrity',
        category: 'Professionalism',
      },
    ],
  },
];
