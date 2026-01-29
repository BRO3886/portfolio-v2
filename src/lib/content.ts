export interface RoleEntry {
  title: string;
  duration: string;
  description?: string;
}

export interface WorkEntry {
  company: string;
  url: string;
  duration: string;
  description?: string;
  roles: RoleEntry[];
}

export const workExperience: WorkEntry[] = [
  {
    company: "Feeble",
    url: "https://feeble.io/",
    duration: "Apr 2025 - Present",
    roles: [
      {
        title: "SeniorSoftware Engineer",
        duration: "Jul 2025 - Present",
        description:
          "AI-powered task management, Slack bots with Temporal workflows, and a Calendly alternative with multi-tenant scheduling.",
      },
      {
        title: "Freelance Consultant",
        duration: "Apr 2025 - Jun 2025",
        description:
          "Podcast studio management UI in Next.js and automated thumbnail generation via Supabase functions.",
      },
    ],
  },
  {
    company: "Flexprice",
    url: "https://flexprice.io",
    duration: "Feb 2025 - July 2025",
    description:
      "Error handling redesign in Go, PDF invoice generation with Typst, calendar billing, Stripe sync workflows, and an MCP server for AI agent integrations.",
    roles: [
      { title: "Freelance Consultant", duration: "Feb 2025 - July 2025" },
    ],
  },
  {
    company: "Zomato",
    url: "https://zomato.com",
    duration: "Jul 2022 - Dec 2024",
    roles: [
      {
        title: "Software Engineer II",
        duration: "Jul 2024 - Dec 2024",
        description:
          "Led homepage features and autosuggest improvements using Redis, Kafka, and DynamoDB. Built partnerships integration serving 2500+ corporate employees.",
      },
      {
        title: "Software Engineer I",
        duration: "Jul 2022 - Jun 2024",
        description:
          "Search re-ranking and distributed catalog search indexing 100M+ SKUs on Solr.",
      },
    ],
  },
  {
    company: "Groww",
    url: "https://groww.in",
    duration: "Jan 2022 - Jun 2022",
    description:
      "Core platform services, Help & Support microservice redesign, and event ingestion with Kafka and Go.",
    roles: [
      { title: "Software Engineering Intern", duration: "Jan 2022 - Jun 2022" },
    ],
  },
  {
    company: "Nearcast",
    url: "https://nearcast.com",
    duration: "Apr 2021 - Aug 2021",
    description:
      "Flutter app development with native modules for video capture and processing.",
    roles: [{ title: "Flutter Developer", duration: "Apr 2021 - Aug 2021" }],
  },
  {
    company: "Winuall",
    url: "https://winuall.com",
    duration: "Jan 2021 - Apr 2021",
    description:
      "Marketplace backend, Jitsi integration, and deployment automation.",
    roles: [{ title: "Backend Dev Intern", duration: "Jan 2021 - Apr 2021" }],
  },
  {
    company: "Nirmitee.io",
    url: "https://www.nirmitee.io/",
    duration: "Sep 2020 - Nov 2020",
    description:
      "Built the Byteseal mobile app for this Pune-based product studio.",
    roles: [{ title: "Flutter Intern", duration: "Sep 2020 - Nov 2020" }],
  },
  {
    company: "OYO Rooms",
    url: "https://www.oyorooms.com/",
    duration: "Jun 2019 - Jul 2019",
    description:
      "Internal tech support portal with Django and Freshdesk API integration.",
    roles: [{ title: "Intern - Technology", duration: "Jun 2019 - Jul 2019" }],
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
    name: "gtasks",
    description:
      "A full-featured CLI client for Google Tasks. Manage task lists, create and complete tasks, all from the terminal.",
    url: "https://github.com/BRO3886/gtasks",
    tech: ["Go", "Google API", "CLI"],
    stars: 126,
  },
  {
    name: "mcp-memory-custom",
    description:
      "An MCP server that gives AI agents persistent memory with configurable storage locations. Works with Claude and other MCP-compatible clients.",
    url: "https://github.com/BRO3886/mcp-memory-custom",
    tech: ["JavaScript", "MCP", "AI Tooling"],
  },
  {
    name: "QwikScan",
    description:
      "Document scanner app built with Flutter and BLoC. Won first place at Apptitude 2020 hackathon by ACM VIT.",
    url: "https://github.com/BRO3886/qwikscan",
    tech: ["Dart", "Flutter", "BLoC"],
    highlight: "Hackathon Winner",
  },
  {
    name: "genlookup",
    description:
      "Chrome extension for instant LLM-powered explanations. Select any text, right-click, and get a contextual breakdown.",
    url: "https://github.com/BRO3886/genlookup",
    tech: ["JavaScript", "Chrome Extension", "LLM"],
  },
  {
    name: "portfolio-v2",
    description:
      "This site. Static Astro build with dual-theme system, editorial blog layout, and Cloudflare edge deployment.",
    url: "https://github.com/BRO3886/portfolio-v2",
    tech: ["Astro", "TypeScript", "Cloudflare"],
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
    url: "https://twitter.com/sidv_22",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>`,
  },
  {
    name: "Email",
    url: "mailto:siddverma1999@gmail.com",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  },
  {
    name: "Telegram",
    url: "https://t.me/vaerma",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  },
];
