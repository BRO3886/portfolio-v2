---
title: "Software Engineering In The Agentic Era"
description: "Thoughts on using AI as an amplifier, not a replacement, and how AI tools create opportunities for engineers who understand them"
pubDate: 2025-09-21
tags: ["ai", "software engineering", "opinion"]
author: "Siddhartha Varma"
---

![header image](/images/seae/featured.webp)

# When Prompting Becomes Programming

Prompt in, app out. The code fails, but too many builders cannot tell you why.

My feed is full of "vibe coders" shipping apps with prompts, accepting whatever the AI generates without understanding it. People who once struggled with basic CSS now call themselves "AI engineers".

In two years, we've jumped from awkward tab completions from Copilot to it raising PRs directly on GitHub. This feels like developers' Excel moment: coding agents remove the tedium of typing, but fundamentals still matter, just like we still teach math without calculators.

  <figure>                                                                                                                                                               
    <img src="/images/seae/twt.webp" alt="andrej karpathy's tweet" />                                                                                                    
    <figcaption>Andrej Karpathy's very popular tweet</figcaption>                                                                                                                     
  </figure>

We've had many shifts — from punch cards to high-level languages — but this one changes the relationship, not just the medium. More and more, prompting is treated as programming. That's the difference, and it's why I'm concerned about where we're headed.

## Tesla vs Mumbai Traffic

A good chunk of people believe AI agents like Claude Code, Codex, and Copilot are like Tesla Autopilot — smooth and predictable, hands-off coding. You just prompt and magic happens.

On the other hand, my experience has been more like navigating rush hour traffic in Mumbai. It's so chaotic. A Tesla would just give up, and you, a driver well-versed with Mumbai traffic, would want to grab the wheel to avoid crashing into someone.

  <figure>                                                                                                                                                               
    <img src="/images/seae/congestion.webp" alt="congestion in mumbai traffic" />                                                                                                    
    <figcaption>a chaotic congestion in Mumbai, modified with nano 🍌</figcaption>                                                                                                                     
  </figure>

Vibe coders just prompt their way through their problems, riding on AI confidence and ✨ vibes ✨. They feel fast, they look productive, they feel productive.

But I have seen their code, it is unmaintainable garbage.

## Garbage In, Garbage Stays

I've been writing code for a while now, and I have seen good code countless times. Human written code isn't perfect. Sometimes the variable names are cryptic, sometimes there are bugs. But there is surgical precision there. Every line has a reason. When humans write code, less is more. Less code means fewer bugs. Less code is more performant.

LLMs are like the friend who never shuts up. Claude gives you 50 lines when 5 would do. It over-engineers solutions and adds backward compatibility for features you have not even released. It will create 5 utility functions doing the same thing in different files. It creates abstractions that sometimes make no sense at all. I recently worked on a codebase where the AI had imported two different google libraries just to fetch some calendar data.

The thing that worries me most is garbage code has a persistence problem. Unlike regular refactoring where you gradually improve a system, AI-generated bloat tends to compound. Before you know it, the codebase has become a nested mess of dependencies and abstractions that nobody fully understands.

Sure you can rewrite garbage code, but it requires recognizing it as garbage first. If you do not understand a domain/library/framework well enough to spot the BS, you are stuck maintaining an increasingly complex system that becomes increasingly harder to debug with each iteration.

## The Fake Dopamine of Speed

The other thing that has been a bother is a fake dopamine rush from vibe coding. You start to feel like speed is your friend. You prompt something and it works. Instant gratification.

I don't think this speed is real. Yes, speed matters when you're building software in a highly competitive and ever-changing landscape, but at what cost?

When you're moving fast, prompting your way through the problems, you're not actually understanding what you're building. You're not learning the patterns. You don't form mental models. You're not developing the intuition to understand where things might break, and they will, and when they do, you're stuck — **because you can't debug what you don't understand**.

  <figure>                                                                                                                                                               
    <img src="/images/seae/bobthebuilder.png" alt="bob the confused builder" />                                                                                                    
    <figcaption>bob the confused builder</figcaption>                                                                                                                     
  </figure>

That fake speed you get from vibe coding? It disappears the moment something goes wrong. Suddenly you're slower than everyone else because you have to reverse figure out what's happening. I've faced this too. I spent a day debugging Claude generated cross-timezone slot booking flow with google calendar conflict mitigation, finally gave up and started handrolling the implementation.

Teams move lightning fast in the beginning, then hit a wall when they need to maintain or extend what they built. The technical debt compounds. The bugs multiply. And all that speed you thought you had? It vanishes.

This speed trap is particularly seductive because it feels so different from traditional development bottlenecks. But recognizing it is crucial for using AI tools effectively.

## Where AI Actually Shines

Don't get me wrong: I'm not anti-AI. These tools are genuinely powerful when used properly. I've found AI incredibly helpful for specific tasks: generating test cases, writing boilerplate code, explaining unfamiliar APIs, and handling tedious migrations. Claude is excellent at walking through complex codebases and explaining implementation. I recently used it to handle a complex merge conflict as well!

The difference is in how you use them. For example, instead of asking it to "create X", I spend time with it understanding the existing codebase, often creating markdown documents for things that are important. In this process, I build a mental model, I understand the context. Then I ask Claude to implement the task specifically how I want. I use the documents to steer it, I ask it to write code like I want. I control the architecture. I know what good output looks like. I can spot when something's wrong. The AI is amplifying my existing knowledge, not replacing it.

This is the crucial distinction that vibe coders miss. They're trying to use AI as a replacement for understanding rather than as an accelerator for understanding. That's where the problems start.

So what does responsible AI-assisted development actually look like in practice?

## What I Think We Should Be Doing

I've been using AI as a learning accelerator rather than a replacement for thinking. As I suggested with the last example, the key is maintaining agency over the process while leveraging AI's strengths. I keep drilling down until I understand the fundamentals. The AI can follow my curiosity as far as the context window allows, and it'll find creative ways to explain concepts that would take me hours to research manually.

When I'm using Claude Code for development, I've developed a process that keeps me in control:

- **Plan what you want first** — don't just throw problems at the AI
- **Read Claude's plan before accepting anything** — prompt it to tell what exactly it is going to change and where
- **Question every decision** — just because it sounds smart doesn't mean it is
- **Research the concepts I don't understand**
- **Rarely auto-accept changes**

I've also been trying to solve problems from first principles more often. When I land on something I don't know how to implement, I use Claude as a brainstorming partner, not the author.

## Why I Think This Moment Matters

Here's what I've noticed: everyone's struggling with this transition. Senior engineers who spent decades building mental models are watching them get disrupted. Junior developers are questioning whether they should even learn fundamentals. Mid-level engineers are wondering if their experience still matters.

But I think this disruption creates opportunity for anyone willing to adapt. We can learn to see AI tools for what they really are — powerful but (currently) dumb assistants that need supervision. We can develop the skills to prompt effectively while understanding the fundamentals deeply enough to know when the AI is leading us astray. I've seen this work out very well for engineers with experience and early adoption of AI tools.

The companies that figure this out first are going to dominate. They need engineers who can move fast with AI without sacrificing quality, engineers who can debug AI-generated code and engineers who have enough context to make correct architectural decisions.

While everyone's panicking about AI replacing jobs, I think they're missing the biggest opportunity in first principles thinking. This agentic era actually creates more room for this approach because you're not constrained by "this is how it has always been done".

## Bottom Line

I don't think developer jobs are disappearing. I think they're evolving into something more important. We're not just writing code anymore. We're steering intelligent systems, maintaining quality, and making sure the software that gets built is actually worth building.

The vibe coders will flame out when their lack of fundamentals catches up to them. The booking flows with race conditions? The bloated abstractions? The security vulnerabilities hidden in AI-generated code? They'll all surface eventually, and someone will have to clean up the mess.

The engineers who take this opportunity to deeply understand both AI capabilities and software fundamentals will be invaluable. They'll be the ones who can move fast without breaking things. Who can debug the un-debuggable. Who can make the hard architectural decisions that determine whether a system scales or not.

This isn't about replacing developers. It's about separating the engineers who understand what they're building from the ones who were just going through the motions.

The Agentic Era doesn't scare me. It excites me, because I think it's going to make the difference between good and great engineers more obvious than ever.

The question isn't whether AI will change how we build software — it already has. The question is whether you'll use it as a crutch or as a catalyst for becoming a better engineer.

  <figure>                                                                                                                                                               
    <img src="/images/seae/architect.png" alt="You're the architect, not the builder" />                                                                                                    
    <figcaption>Humans set the blueprint. AI follows it.</figcaption>                                                                                                                     
  </figure>

---

_This article is also AI-assisted, but as always, the thoughts, ideas and examples are original._
