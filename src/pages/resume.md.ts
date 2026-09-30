import type { APIRoute } from 'astro';

const resumeMarkdown = `# Siddhartha Varma

- URL: https://sidv.dev/resume/
- PDF: https://sidv.dev/documents/Resume_Siddhartha_Varma.pdf
- Phone: [+91 88609 86398](tel:+918860986398)
- Email: [me@sidv.dev](mailto:me@sidv.dev)
- LinkedIn: https://www.linkedin.com/in/siddharthav22
- GitHub: https://github.com/BRO3886

## Summary

Backend engineer with 4+ years of experience owning systems from design through production. Built search and ETA systems at Zomato, billing infrastructure at Flexprice, and legal, messaging, and tenant operations platforms at Feeble. Strongest at turning ambiguous product requirements into systems with clear data ownership, failure recovery, operator controls, and measurable business outcomes. Primarily works in Go across APIs, distributed workflows, search, and infrastructure.

## Experience

### Feeble

Apr 2025 – Present

#### Senior Software Engineer

Jul 2025 – Present

- Built [**Coop**](https://txtcoop.com), a self-hosted service that gives small-business teams secure, permission-gated access to Apple Messages, with durable message sync, encrypted storage, and API and **MCP support** for AI agents
- Designed and shipped [**CaseFlow**](https://case-flow.co)’s **HIPAA**-focused tenant **backup and recovery** platform, with **encrypted** data volumes, per-tenant storage credentials, fail-closed boot guards, and exact database restore verification
- Built an **automated court-filing pipeline** for **CaseFlow** using **Temporal** and confidence-scored **TF-IDF** classification, improving five-fold validation accuracy from **60% to 89% across 657 documents** while supporting operator review and replay-safe reprocessing
- Migrated **CaseFlow**’s irreversible Dropbox cutover stage from **RabbitMQ** to **Temporal**, adding durable execution, progress tracking, single-writer recovery, and shadow-mode validation for migrations spanning **thousands of files per case**
- Built [**Pubity**](https://www.pubitygroup.com/)’s media-planning platform, turning PDF, CSV, and multi-sheet Excel uploads into **web-editable campaign plans** with **automated extraction**, **HubSpot** synchronization, deal search, versioning, and export workflows

#### Senior Consulting Engineer

Apr 2025 – Jun 2025

- Led development of an **internal scheduling platform** - a **conversion focused Calendly alternative**, rebuilding its admin experience and **availability engine** with timezone-safe multi-person booking, real-time calendar conflict detection, and load-balanced team assignment
- Built a POC **AI operations assistant for Slack**, combining **MCP** tools, workspace OAuth, **Redis**-backed conversation memory, and versioned prompts to execute project workflows from chat
- Redesigned podcast studio management **Next.js** application using **Tailwind**, and shipped automated thumbnail generation as a **Supabase Edge Function**

### Flexprice

Feb 2025 – Jul 2025

#### Senior Consulting Engineer

- Built [**Flexprice**](https://flexprice.io/)’s invoice rendering platform using **Typst**, with reusable templates, tenant-aware APIs, and **S3**-backed PDF storage and delivery
- Designed Flexprice’s unified **Go error framework**, standardizing contextual error chains, HTTP status mapping, and safe client responses across more than **500 files**
- Built core **subscription-billing capabilities** for calendar-aligned billing cycles and mid-cycle **proration**, with configurable day and second-based calculation strategies
- Designed and prototyped an end-to-end **Stripe synchronization** architecture using **Temporal**, covering customer, subscription, and usage-event synchronization with batching, webhooks, auditability, and failure recovery

### Zomato

Jul 2022 – Dec 2024

#### Software Engineer II

Jul 2024 – Dec 2024

- Led the “Near and Fast” homepage feature, implementing an ETA approximation pipeline with **Redis**, **Kafka**, and **DynamoDB** that delivered **Rs. 4M/month in incremental net margin**
- Improved the autosuggest **leader-election algorithm**, increasing dish-page **CTR** and generating an additional **Rs. 0.7M/month** in net margin through dish-page **ad conversions**
- Established a search based partnership-integration system serving **2,500+** corporate employees at **CRED** and **MakeMyTrip**
- Built an **internal devtool - an autosuggest debugger** that gave developers granular control over code paths in a web UI used during investigation and testing
- Led a **dish-tabs** based discovery oriented **homepage revamp**, replacing the “What’s on your mind” section

#### Software Engineer I

Jul 2022 – Jun 2024

- Enhanced dish-search **re-ranking**, optimizing distance and raising **Rs. 18M/month incremental net margin**
- Implemented related-restaurant backfill for low-supply dish searches, lifting **historically flat** dish page **order-through rate by 0.5%**
- Implemented a distributed catalog-search system indexing **100M+ SKUs** in **Solr**, with query relevance scoring and integration into the existing search platform
- Developed an internal devtool dish-tagging dashboard in **Go** and **React**, with bulk CSV processing and **DynamoDB** persistence for manual overrides
- Integrated a personalization-model re-ranker with dynamic ad positioning, event logging, and **Grafana** monitoring

### Groww

Jan 2022 – Jul 2022

#### Software Engineering Intern

- Redesigned the Help and Support microservice with a modular Java architecture
- Developed RESTful APIs for the Chatbot microservice to accelerate user-query resolution
- Created a **Kafka** and **Go** event-ingestion service to track and analyze user activity

## Education

### Georgia Institute of Technology

**Master of Science in Computer Science; Specialization: Machine Learning**  
Atlanta, GA (Online) · Jan 2026 – Present

### Vellore Institute of Technology

**Bachelor of Technology in Computer Science and Engineering; CGPA: 9.09/10**  
Vellore, TN, IN · Jul 2018 – Jun 2022

## Projects

### Open Source Developer Tools

Go, cgo, EventKit · 2021 – Present

- Built [**Romp**](https://github.com/BRO3886/romp), a CLI and interactive TUI that runs coding agents in isolated worktrees, independently verifies changes, enforces review gates, and opens pull requests from labelled GitHub issues
- Built [**rem**](https://github.com/BRO3886/rem) (156★) and [**ical**](https://github.com/BRO3886/ical) (88★), native macOS productivity CLIs with full CRUD and sub-200 ms operations, powered by the [**go-eventkit**](https://github.com/BRO3886/go-eventkit) cgo bridge
- Created [**gtasks**](https://github.com/BRO3886/gtasks) (173★) before the AI-agent era, then evolved it with embedded Agent Skills for Claude Code, Codex, and OpenClaw
- Built [**healthsync**](https://github.com/BRO3886/healthsync) (73★) to convert Apple Health exports into a local SQLite database queryable through the CLI, SQL, or embedded AI-agent skills

### [Katagami](https://katagami.dev) *(under development)*

Rust, PostgreSQL, S3, Typst · 2026

- Built a **self-hosted PDF rendering API** with schema-validated, immutable templates and content-addressed S3-compatible storage
- Used a supervised worker pool with hard deadlines and crash isolation; measured **2,151 req/s** with zero failures on a stated invoice workload

## Technical Skills

- **Languages:** Go, TypeScript, Python, JavaScript
- **AI/LLM:** OpenAI API, Gemini API, Claude API, Deepgram (STT/TTS), LLM function calling, model-integrated workflow design
- **Tools/Frameworks:** Temporal, Docker, Git, React, Next.js, Solr, Grafana, Datadog, AWS (ECS, EC2, DynamoDB)
- **Databases/Infra:** PostgreSQL, Redis, MySQL, DynamoDB, Supabase, Kafka, Cloudflare R2
`;

export const GET: APIRoute = async () =>
  new Response(resumeMarkdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
