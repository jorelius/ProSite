---
title: Benchmark Testing Services with Fenrir
date: "2019-05-25T22:12:03.284Z"
template: "post"
draft: false
slug: "/posts/service-testing-with-fenrir/"
category: "Service Testing"
tags:
  - "Service Testing"
  - "Fenrir"
  - "Web Development"
  - "Open source"
description: "Benchmark testing service and how that relates to software stability with Fenrir."
---

- [Benchmark Testing](#benchmark-testing)

As APIs evolve, internal architecture is updated and refactored, we as good stuarts of our services take every reasonable step to maintain backwards compatibility, behavior and performance parity. To do so we employ various techniques and tools to verify our are stable and performant. They may range from unit, module, and integration tests. Those are important tools and practices but you may be missing and important litmus of service health, Benchmark Testing.

## Benchmark Testing

Benchmark testing, reference testing, or baseline testing takes a snapshot of current behavior and uses it as a basis of comparison against which service performance can be deemed broken if it performs below that Benchmark. At its core Benchmark Testing is about taking a reasonable measurement and comparing your service, api, or system against it.

![magnifying-glass.jpg](/media/magnifying-glass.jpg)




*[Fenrir](https://github.com/jorelius/Fenrir).*