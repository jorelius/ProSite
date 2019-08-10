---
title: Benchmark Testing Services with Fenrir
date: "2019-05-25T22:12:03.284Z"
template: "post"
draft: false
slug: "/posts/service-testing-with-fenrir/"
category: "Tools"
tags:
  - "Service Testing"
  - "Fenrir"
  - "Web Development"
  - "Open source"
description: "Benchmark testing service and how that relates to software stability with Fenrir."
---

![magnifying-glass.jpg](/media/magnifying-glass.jpg)

- [Benchmark Testing](#benchmark-testing)
- [Fenrir](#fenrir)

As APIs evolve, internal architecture is updated and refactored, we as good stuarts of our services take every reasonable step to maintain backwards compatibility, behavior and performance parity. To do so we employ various techniques and tools to verify our are stable and performant. They may range from unit, module, and integration tests. Those are important tools and practices but you may be missing and important litmus of service health, Benchmark Testing.

## Benchmark Testing

Benchmark testing, reference testing, or baseline testing takes a snapshot of current behavior and uses it as a basis of comparison against which service performance can be deemed broken if it performs below that Benchmark. At its core Benchmark Testing is about taking a reasonable measurement and comparing your service, api, or system against it.

For APIs we build our benchmark test from logged request data or requests generated to mimic natural request patterns. From this test we extract benchmark statistics and test conditions so we can replicate the test conditions in the future and measure service performance.

+ Total Test Run Time
+ Concurrency
+ Requests per second
+ Latency

## Fenrir

Fenrir is a service testing framework and tool that load tests, stresses, and compares results of micro-services. Requests are generated from data sources (web-service, database, flat file, etc.) or predefined in json following [comparable request format](https://github.com/jorelius/Fenrir#comparison-request-json). It supports image, json, xml, and text comparison targets. It is meant to be flexible and to be integrated into development pipelines.



*[github](https://github.com/jorelius/Fenrir)*