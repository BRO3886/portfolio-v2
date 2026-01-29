---
title: "Green Tea GC: How Go Stopped Wasting 35% of Your CPU Cycles"
description: "How Go 1.25's experimental garbage collector stops CPU stalls by organizing memory into neighborhoods instead of random object jumping"
pubDate: 2025-07-13
tags: ["go", "garbage collection", "performance"]
author: "Siddhartha Varma"
image: "/images/green-tea-gc/featured.webp"
---

![Green Tea GC: How Go Stopped Wasting 35% of Your CPU Cycles](/images/green-tea-gc/featured.webp)

## Introduction

Your Go application is performing well, handling requests efficiently. But there's a performance issue you might not be aware of— the garbage collector **is wasting 35% of CPU cycles waiting for memory access**. Every time the GC jumps between objects scattered across RAM, your CPU sits idle while data is retrieved from memory.

Green Tea GC, Go's experimental new garbage collector reduces this waste by upto 50%. The garbage collector is available as an experiment in the upcoming Go 1.25, expected to be released in [August 2025](https://tip.golang.org/doc/go1.25).

## Revisiting Garbage Collection

Before we dive into how Green Tea works, here's a quick refresher on Garbage Collectors:

Any program typically allocates objects on two types of memories, Stack and Heap. Stack memory is generally easy to manage and clean (references are dropped along with frames after the work is done), while some other objects like constants live on the Heap.

In the early days of programming, programmers used to manage memory on their own (remember malloc from C?). This meant that if the memory wasn't freed after use, it lead to memory leaks and if you freed twice, a crash.

Then came Garbage Collectors, popularized by languages like Java, JS (V8). The idea was novel, instead of allocating and deallocating by hand, the runtime would manage the memory instead.

<figure>
  <img src="/images/green-tea-gc/gc-visualized.png" alt="Garbage Collection visualized by ChatGPT" />
  <figcaption>Garbage Collection visualized by ChatGPT</figcaption>
</figure>

> The compiler can also figure out which objects go to the heap, which objects stay on the stack. This is called [Escape Analysis](https://en.wikipedia.org/wiki/Escape_analysis).

### Stop The World

Early Garbage Collection algorithms were quite naive like "Stop The World". STW completely halts the execution of the program to run a collection cycle. This guarantees that new objects are not allocated or the references are not changed when the collector is running.

But this meant that the program pauses for long duration, sometimes even for seconds(!) when the GC is running. This was a cause for concern in high availability applications like web servers.

### Concurrent Garbage Collection

Concurrent Garbage Collectors allow for garbage collection to occur at the same time when the application is running, minimizing pauses and improving performance, especially in real-time systems. They are designed to reduce "stop-the-world" pauses, where the application is halted entirely for garbage collection.

But these have a higher CPU overhead and implementation complexity — if this runs for a longer duration one cannot guarantee prohibition of new object allocations or reference changes.

## Go's Garbage Collector

Go's Garbage Collector has gone through various transitions, starting from a simple STW mark-sweep to what we have now: **A concurrent, Tri-Colour Mark and Sweep Garbage Collector**.

### How does the current GC work

The current GC runs in two phases — Mark and Sweep. In the Mark phase, we assume all objects to be *white* (unreachable). We start at the root objects (constants etc), mark them as *grey.* All grey objects are added to a queue to be processed. We pick a grey object from the queue and start processing it's children. As soon as a child is marked grey, it's added to the queue and the parent is marked *black.* At the end, we have a mix of black and grey *accessible* objects. In the Sweep phase, we find all the *inaccessible* white objects (garbage) and clean it.

<figure>
  <img src="/images/green-tea-gc/tri-colour-mark-sweep.png" alt="Tri-Colour Mark and Sweep" />
  <figcaption>Tri-Colour Mark and Sweep</figcaption>
</figure>

This algorithm is brilliant because it can run while your program continues executing. Go adopted this approach and refined it into one of the best garbage collectors in the industry, with pause times under a few milliseconds. But there is still a problem lurking beneath the surface.

### Performance Bottlenecks in current GC

Modern CPUs process instructions at gigahertz speeds, but accessing main memory (DRAM) requires 200–400 CPU cycles compared to just 1 cycle for L1 cache access. To bridge this performance gap, CPUs use a hierarchy of caches (L1, L2, L3) — each level larger but slower than the previous.

The current garbage collector creates poor **spatial locality** by following object references randomly across memory. When the GC jumps from object A (at memory address 0x1000) to object B (at 0x5000), it likely causes a cache miss. The CPU must then wait hundreds of cycles to fetch the new data from DRAM.

<figure>
  <img src="/images/green-tea-gc/cache-misses.png" alt="Cache misses cause wastage of CPU cycles" />
  <figcaption>Cache misses causes wastage of CPU cycles</figcaption>
</figure>

This memory access pattern is where Go's current GC becomes a performance bottleneck. Studies show that **approximately 35% of GC CPU cycles are spent stalled on memory accesses**, excluding knock-on effects.

## Green Tea Garbage Collector

Enter Green Tea. Instead of frantically jumping between objects and causing cache misses left and right, Green Tea groups memory into blocks called **spans**. It processes entire spans together. By this method, on a cache miss, you load the entire span into the cache. This reduces the CPU cycle wastage and improves the GC performance.

But that's not all. What if the span has only one marked object? Processing the entire span would be inefficient. The algorithm takes this into account and behaves in an adaptive manner. Green Tea solves this with **representative object** optimization.

It tracks the object which caused the span to be queued and uses a *hit flag* to detect if more objects get marked while the span is waiting. If more objects get marked, the hit flag is true and we process the entire span for *maximum locality.* If the hit flag is false, just process the representative object.

<figure>
  <img src="/images/green-tea-gc/green-tea-vs-existing.png" alt="Existing GC vs Green Tea" />
  <figcaption>Existing GC vs Green Tea</figcaption>
</figure>

## Results

The results speak for themselves. In GC-heavy benchmarks, Green Tea shows 10 to 50% reduction in garbage collection CPU cost. On multi-core systems, the benefits are even greater. Green Tea includes work-stealing mechanisms similar to Go's scheduler, and there are even prototype SIMD-accelerated scanning kernels showing additional improvements.

Green Tea is available as an experimental feature in Go 1.25. Enable it with the following flag when building, after downloading Go 1.25.

```
$ GOEXPERIMENT=greenteagc go build
```

### References

- Green Tea Discussion — [https://github.com/golang/go/issues/73581](https://github.com/golang/go/issues/73581)
- Tracing GC — [https://en.wikipedia.org/wiki/Tracing_garbage_collection](https://en.wikipedia.org/wiki/Tracing_garbage_collection)
- Getting to Go: The Journey of Go's Garbage Collector — [https://go.dev/blog/ismmkeynote](https://go.dev/blog/ismmkeynote)
- Go GC: Prioritizing low latency and simplicity — [https://go.dev/blog/go15gc](https://go.dev/blog/go15gc)
