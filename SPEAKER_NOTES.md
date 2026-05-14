# ZIONS DEVKICK — SPEAKER NOTES
## 5-Minute Demo Script (Read slide-by-slide while recording)

---

## SLIDE 1 — TITLE (0:00 - 0:30)

> "Hey everyone, I'm Abhinav Akey, and I'm excited to present Zions DevKick — the Centralized Developer Assistant.
>
> I built this as a Chrome and Edge side panel extension that eliminates the biggest productivity killer in a developer's day: context-switching between disconnected tools.
>
> Let me show you what problem we're solving."

**[Arrow key → next slide]**

---

## SLIDE 2 — THE PROBLEM (0:30 - 1:30)

> "Here's the reality for developers at Zions today.
>
> Picture this: It's Tuesday morning. You run terraform apply and get hit with a GCP 403 Forbidden error. What happens? You spend 30 to 60 minutes searching through Confluence and Slack trying to find the answer.
>
> Then you realize you need IAM access. So you stop everything, open ServiceNow, navigate the portal, fill out a form — another 15 to 30 minutes gone.
>
> Your teammate asks for a code review. You context-switch to ADO, parse hundreds of lines of Terraform YAML, try to remember which security standards apply — another 20 to 40 minutes.
>
> And throughout the day, you're constantly hunting for the right ADO template repo, the right Confluence runbook, the right link.
>
> Add it all up: over 2 hours per day per developer, lost to tool-hopping and searching. For a team of 50 developers, that's 25,000 engineering hours wasted per year — over half a million dollars in lost productivity."

**[Pause. Let the number land. Arrow key → next slide]**

---

## SLIDE 3 — THE SOLUTION: 4 TABS (1:30 - 2:15)

> "That's why I built Zions DevKick. It's a Chrome and Edge side panel extension — four tabs, four bottlenecks solved, all without leaving your browser.
>
> The Chat tab gives you an AI-powered chatbot backed by a RAG pipeline against our internal knowledge base. Ask about a 403 error and get the exact IAM role and resolution steps instantly.
>
> The Review tab does one-click AI code review against Zions security standards — checks for public IPs, overly permissive firewalls, missing encryption, hardcoded secrets.
>
> The Tickets tab lets you create ServiceNow tickets without leaving your browser — including Goalie escalations with a live queue dashboard.
>
> And the Actions tab is your developer command center — quick links, standards checklists, sprint reminders, and repo bootstrapping from approved templates.
>
> Let me show you this live."

**[Arrow key → skip to SLIDE 5 (Demo Flow) OR Command+Tab to Chrome for live demo]**

---

## SLIDE 4 — ARCHITECTURE (skip during recording or briefly mention)

> "Under the hood, we have a React TypeScript frontend built with Vite and Tailwind, talking to a Python FastAPI backend with a LangChain RAG pipeline and ChromaDB vector store."

**[Arrow key → next slide]**

---

## SLIDE 5 — LIVE DEMO (2:15 - 4:15)

**[Command+Tab to Chrome. Make sure side panel is open with green dot.]**

> "Here's DevKick running live in my browser right now. This is not a mockup — this is a real, working extension.
>
> **CHAT TAB:** I'll click the 'Terraform 403 Error' quick prompt..."

**[Click it. Wait 3-5 seconds for response.]**

> "Look at that — instant answer from the RAG pipeline. It tells me the exact IAM role I need, the service account name, and gives me the gcloud command to fix it. And notice the source documents it retrieved from our knowledge base at the bottom.
>
> Now watch this — I hover over this response and click 'Escalate to Goalie'..."

**[Hover over the AI response. Click 'Escalate to Goalie'. Wait for confirmation.]**

> "A ServiceNow ticket was just created, pre-filled with my conversation context, and queued for the Goalie review team. I didn't fill out a single form.
>
> **TICKETS TAB:** Let me switch to the Tickets tab..."

**[Click Tickets tab. Click 'Goalie Queue' toggle.]**

> "Here's the Goalie Queue dashboard — I can see active escalations, their priority, status, who's assigned, and how long they've been open.
>
> **REVIEW TAB:** Now let's review a PR..."

**[Click Review tab. Click 'Analyze Current PR'. Wait for the animated steps to complete.]**

> "Watch the analysis steps — fetching the PR diff, analyzing Terraform config, checking IAM policies, evaluating security compliance...
>
> And here are the results. Score: 2 out of 10. It found critical issues — public IP on the compute instance, overly permissive firewall allowing traffic from the entire internet, a hardcoded password, and SSH keys in metadata. Each one mapped to a specific Zions security policy.
>
> I can copy this entire review to my clipboard and paste it straight into an ADO PR comment. A 30-minute review done in 30 seconds.
>
> **ACTIONS TAB:** And finally..."

**[Click Actions tab. Quickly scroll through.]**

> "Quick links to 12 essential tools, developer standards checklists that expand on click, sprint reminders, and repo bootstrapping from approved templates.
>
> Everything a developer needs. One side panel. Zero context-switching."

**[Command+Tab back to PowerPoint slides. Arrow to Slide 6.]**

---

## SLIDE 6 — BUSINESS VALUE & ROI (4:15 - 4:30)

> "The numbers speak for themselves:
>
> Two plus hours per day saved per developer. Over $500K in annual cost savings for a 50-person team. 80% faster error resolution — from 30 minutes to 2 minutes. And 5x faster ticket creation.
>
> Beyond productivity — automated security reviews reduce risk, the RAG pipeline retains institutional knowledge, and the unified interface improves developer experience and retention."

**[Arrow key → next slide]**

---

## SLIDE 7 — INNOVATION (briefly, 2-3 seconds)

**[Arrow key → skip or quick mention]**

---

## SLIDE 8 — FUNCTIONAL SOLUTION (briefly, 2-3 seconds)

> "Everything I just showed you is a live, working prototype — not mockups. And the architecture is designed so we can swap mocks for live integrations with zero code changes."

**[Arrow key → next slide]**

---

## SLIDE 9 — LESSONS LEARNED (4:30 - 4:50)

> "Three quick lessons:
>
> First — start with the pain, not the technology. The 4-tab structure came directly from real developer frustrations.
>
> Second — RAG quality depends on document quality. I spent real time curating the knowledge base with specific role names, project IDs, and resolution steps.
>
> Third — integration beats isolation. The real magic isn't any single feature — it's the seamless flow between them. Chat to Escalation to Goalie Queue is one connected journey."

**[Arrow key → next slide]**

---

## SLIDE 10 — ROADMAP (skip or 5 seconds)

> "The prototype is built for incremental production readiness — the Confluence connector is already built, and every mock layer is designed as a drop-in replacement for live APIs."

**[Arrow key → next slide]**

---

## SLIDE 11 — CLOSING (4:50 - 5:00)

> "Zions DevKick. Four tabs. Four bottlenecks solved. From a 1-hour context-switching nightmare to a 2-minute seamless workflow.
>
> Thank you!"

**[End recording]**

---

# PRE-RECORDING CHECKLIST

- [ ] Backend running (check green dot in extension)
- [ ] Extension loaded in Chrome — side panel opens on click
- [ ] Chat history CLEARED (fresh start)
- [ ] PowerPoint open in Slide Show mode
- [ ] Browser zoomed to ~110% so side panel text is readable
- [ ] Close all other tabs and notifications
- [ ] QuickTime screen recording ready with microphone selected
- [ ] Test the full flow ONCE before recording
- [ ] Water nearby — 5 minutes of talking

# TIMING GUIDE

| Section | Time | What's on screen |
|---------|------|-----------------|
| Title + Intro | 0:00 - 0:30 | Slide 1 |
| The Problem | 0:30 - 1:30 | Slide 2 |
| Solution Overview | 1:30 - 2:15 | Slide 3 |
| LIVE DEMO | 2:15 - 4:15 | Chrome + DevKick side panel |
| Business Value | 4:15 - 4:30 | Slide 6 |
| Lessons Learned | 4:30 - 4:50 | Slide 9 |
| Closing | 4:50 - 5:00 | Slide 11 |
