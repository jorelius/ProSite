---
title: "Why I Ship an Agent You Run in Your Environment"
date: "2026-05-05T10:00:00.000Z"
draft: false
slug: "why-i-ship-an-agent-you-run-in-your-environment"
category: "Cloud Cost"
tags:
  - "Docker"
  - "CLI"
  - "Architecture"
  - "CCA"
  - "Dragon Fractal"
description: "Cloud Cost Analyzer's agent runs in your environment, collects metrics with your credentials, and sends them to the CCA service for analysis. Here's why I designed it this way."
---

Cloud Cost Analyzer has two parts: an agent that runs in your environment, and a service that processes the data.

The agent collects resource and cost metrics from your AWS account using your credentials. It sends those metrics to the CCA service, where 80+ detection rules identify waste and generate recommendations. You see the results on the CCA dashboard.

I could have built CCA as a fully hosted service that assumes a role in your account and pulls data directly. Some competitors work that way. Here's why I went with the agent model instead.

## Credentials never leave your environment

This is the big one. The CCA agent runs on your machine, your EC2 instance, or your container. It uses your AWS credentials to call `Describe*`, `List*`, and `Get*` APIs. The credentials -- access keys, session tokens, role ARNs -- stay in your environment. Dragon Fractal never sees them.

What does leave your environment: the collected metrics. Resource metadata, utilization data, cost figures. This is what the CCA service needs to run the detection rules. It's sensitive data (it tells a story about your infrastructure), but it's not credentials. You can't use it to access your account.

```
Your Environment                    CCA Service
+--------------------+             +--------------------+
| CCA Agent          |             | Rules Engine       |
| - uses YOUR creds  | -- sends -> | - 80+ rules        |
| - calls AWS APIs   |   metrics   | - recommendations  |
| - credentials stay  |             | - dashboard        |
|   here             |             |                    |
+--------------------+             +--------------------+
```

Compare this to the alternative: a hosted service that holds a cross-account role with access to your AWS account 24/7. With the agent model, nothing in Dragon Fractal's infrastructure can call your AWS APIs. If CCA's service were compromised tomorrow, attackers would have collected metrics -- not access to your account.

## How to run it

The agent is a single binary or a Docker image. Run it however fits your environment:

```bash
# Run directly
cloud-cost-analyzer scan --regions us-east-1

# Or via Docker
docker pull dragonfractal/cca
docker run dragonfractal/cca scan --regions us-east-1
```

If you're running on EC2 or ECS, the agent uses the instance/task role directly. On your laptop, it picks up credentials from your AWS config or environment variables. In CI/CD, pull the Docker image and let the runner's IAM role handle auth.

The agent collects data, sends it to the CCA service, and the results show up on your dashboard. No manual export/import. No copying files around.

## Why Docker?

The agent is a single Rust binary. You can download it and run it directly. So why also ship a Docker image?

Two reasons:

1. **CI/CD integration.** Teams that want to run the agent on a schedule in their pipeline don't want to manage binary versions and OS compatibility. `docker pull dragonfractal/cca` works the same in GitHub Actions, GitLab CI, Jenkins, and any other runner that supports containers.

2. **No install friction.** Some engineers can't (or won't) install arbitrary binaries on their work machines. Docker is already approved in most environments. Pulling an image and running it in a container is a lower trust bar than downloading and executing a binary.

## The engineering tradeoff

The agent model means CCA's collection layer has to be lightweight, reliable, and work across different environments. It can't assume a specific OS, container runtime, or network configuration. The agent needs to handle credential discovery, API pagination, rate limiting, and data serialization -- then ship the results reliably to the CCA service.

The upside is a clean separation of concerns: the agent knows how to collect data, the service knows how to analyze it. The agent is simple enough to audit (it makes read-only AWS API calls and sends the results over HTTPS). The rules engine, dashboard, and recommendation logic live server-side where I can update them without requiring agent upgrades for every new detection rule.

This also means new rules take effect immediately for all customers. When I add a detection rule for, say, idle SageMaker endpoints, the next time your agent sends data, the service applies the new rule automatically. No agent update needed.

## The trust model

I want to be explicit about what CCA sees and doesn't see:

| Data | Where it lives |
|------|---------------|
| Your AWS credentials (access keys, role ARN, session tokens) | Your environment only. Never sent to Dragon Fractal. |
| Collected metrics (resource metadata, utilization, costs) | Sent to CCA service over HTTPS. Stored for analysis and history. |
| Detection results and recommendations | CCA service and dashboard. |

If you're evaluating CCA: the IAM policy is [public and documented](/posts/building-a-read-only-iam-role-auditors-trust). The agent is a single binary you can monitor with any network inspection tool. Every outbound call goes to either AWS APIs (data collection) or the CCA service endpoint (metric delivery). No other destinations.

Try it:

```bash
docker pull dragonfractal/cca
```
