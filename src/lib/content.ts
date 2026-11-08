export interface RoleEntry {
  title: string;
  duration: string;
  what: string;
  why: string;
  impact: string;
}

export interface WorkEntry {
  company: string;
  url: string;
  duration: string;
  roles: RoleEntry[];
}

export const workExperience: WorkEntry[] = [
  {
    company: "Feeble",
    url: "https://feeble.io/",
    duration: "Apr 2025 – Nov 2026",
    roles: [
      {
        title: "Senior Software Engineer",
        duration: "Jul 2025 – Nov 2026",
        what: "Built Coop’s messaging service and CaseFlow’s security, court-filing, and migration pipelines.",
        why: "Give teams controlled access to messages and protect sensitive legal data during processing and recovery.",
        impact:
          "Made eight-stage migrations resumable across thousands of files per case, with encrypted backups and verified restores.",
      },
      {
        title: "Senior Consulting Engineer",
        duration: "Apr 2025 – Jun 2025",
        what: "Rebuilt an internal scheduling platform’s admin experience and availability engine.",
        why: "Support multi-person bookings across time zones without calendar conflicts.",
        impact: "Shipped live conflict checks and load-balanced team assignment.",
      },
    ],
  },
  {
    company: "Flexprice",
    url: "https://flexprice.io",
    duration: "Feb 2025 – Jul 2025",
    roles: [
      {
        title: "Senior Consulting Engineer",
        duration: "Feb 2025 – Jul 2025",
        what: "Built subscription billing, PDF invoicing, and a shared Go error framework.",
        why: "Handle subscription changes accurately and make invoices and API failures consistent.",
        impact:
          "Delivered calendar-aligned billing and proration, and standardized safe error responses across more than 500 files.",
      },
    ],
  },
  {
    company: "Zomato",
    url: "https://zomato.com",
    duration: "Jul 2022 – Dec 2024",
    roles: [
      {
        title: "Software Engineer II",
        duration: "Jul 2024 – Dec 2024",
        what: "Led the Near and Fast homepage feature and its delivery-time estimation pipeline.",
        why: "Surface restaurants with shorter delivery times on the homepage.",
        impact: "Added ₹20 lakh in monthly incremental net margin.",
      },
      {
        title: "Software Engineer I",
        duration: "Jul 2022 – Jun 2024",
        what: "Improved dish-search ranking and built catalog search indexing more than 100 million SKUs.",
        why: "Prioritize closer restaurants and make large catalogs searchable.",
        impact: "Added ₹1.8 crore in monthly incremental net margin through dish-search ranking.",
      },
    ],
  },
  {
    company: "Groww",
    url: "https://groww.in",
    duration: "Jan 2022 – Jul 2022",
    roles: [
      {
        title: "Software Engineering Intern",
        duration: "Jan 2022 – Jul 2022",
        what: "Redesigned Help and Support, built chatbot APIs, and shipped a Kafka/Go event-ingestion service.",
        why: "Accelerate query resolution and track user activity.",
        impact: "Delivered modular support services and user-activity data for analysis.",
      },
    ],
  },
];

export interface ProjectEntry {
  name: string;
  description: string;
  url: string;
  tech: string[];
  stars?: number;
  highlight?: string;
}

export const projects: ProjectEntry[] = [
  {
    name: "Romp",
    description:
      "A CLI and interactive TUI that runs coding agents in isolated worktrees, verifies changes, enforces review gates, and opens pull requests from GitHub issues.",
    url: "https://github.com/BRO3886/romp",
    tech: ["Go", "Git", "TUI"],
    stars: 1,
  },
  {
    name: "rem",
    description:
      "A native macOS Reminders CLI for managing lists and tasks from the terminal, with embedded agent skills and direct EventKit access through Go.",
    url: "https://github.com/BRO3886/rem",
    tech: ["Go", "EventKit", "macOS"],
    stars: 157,
  },
  {
    name: "ical",
    description:
      "A fast macOS Calendar CLI for managing calendars and events from the terminal. Built on go-eventkit, with embedded skills for coding agents.",
    url: "https://github.com/BRO3886/ical",
    tech: ["Go", "EventKit", "macOS"],
    stars: 97,
  },
  {
    name: "gtasks",
    description:
      "A Google Tasks CLI built before the coding-agent era. Manage task lists and tasks from the terminal, with embedded skills for Claude Code, Codex, and OpenClaw.",
    url: "https://github.com/BRO3886/gtasks",
    tech: ["Go", "Google Tasks", "CLI"],
    stars: 173,
  },
  {
    name: "healthsync",
    description:
      "Parse Apple Health exports into a local SQLite database. Explore health data through the CLI, SQL queries, or embedded skills for coding agents.",
    url: "https://github.com/BRO3886/healthsync",
    tech: ["Go", "SQLite", "Apple Health"],
    stars: 74,
  },
  {
    name: "go-eventkit",
    description:
      "Native macOS Calendar and Reminders bindings for Go via cgo. The EventKit bridge behind rem and ical, with direct access to Apple's calendar and task APIs.",
    url: "https://github.com/BRO3886/go-eventkit",
    tech: ["Go", "cgo", "EventKit"],
    stars: 23,
  },
];

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export const socialLinks: SocialLink[] = [
  {
    name: "GitHub",
    url: "https://github.com/BRO3886",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`,
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/siddharthav22/",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
  },
  {
    name: "Twitter",
    url: "https://twitter.com/sidposting",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>`,
  },
  {
    name: "Email",
    url: "mailto:me@sidv.dev",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  },
  {
    name: "Telegram",
    url: "https://t.me/vaerma",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  },
];
