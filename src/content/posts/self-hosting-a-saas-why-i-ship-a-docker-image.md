---
title: "Why I Ship a CLI Alongside the Service"
date: "2026-05-05T10:00:00.000Z"
draft: false
slug: "why-i-ship-a-cli-alongside-the-service"
category: "Cloud Cost"
tags:
  - "Docker"
  - "CLI"
  - "Architecture"
  - "CCA"
  - "Dragon Fractal"
description: "Cloud Cost Analyzer is a hosted service. It's also a CLI you can run locally. Here's why I ship both."
---

Cloud Cost Analyzer is a hosted service. You sign up, connect your AWS account, and CCA finds your waste. Standard model.

It's also a CLI tool. Run it directly or pull the Docker image, point it at your AWS account, and your billing data never leaves your machine.

Shipping both adds real engineering complexity. Here's why I do it anyway.

## The data sensitivity problem

CCA reads your AWS cost data. That data tells a story about your infrastructure: what services you use, how much traffic you handle, what regions you operate in, how your spending trends over time. For some teams, that's sensitive enough that sending it to a third-party service is a non-starter.

I've had this conversation three times during early user research:

> "The tool looks useful, but our security policy doesn't allow billing data to leave our network."

If CCA only existed as a hosted service, that conversation ends with "sorry, can't help you." With a CLI, the answer is "run it locally -- same detection engine, your machine, your data stays put."

## How it works

The CLI runs the same detection logic as the hosted service. Same waste-pattern rules, same recommendation engine, same IAM role pattern. The difference is where the analysis happens.

```bash
# Run directly
cca analyze --role-arn arn:aws:iam::role/CCA-ReadOnly

# Or via Docker
docker pull dragonfractal/cca
docker run \
  -e CCA_ROLE_ARN=arn:aws:iam::role/CCA-ReadOnly \
  dragonfractal/cca analyze
```

The CLI assumes the read-only IAM role in the customer's account (the same role described in my [previous post](/posts/building-a-read-only-iam-role-auditors-trust)), runs the detection rules locally, and outputs findings to the terminal. No data sent anywhere. No account creation required.

If you're running on an EC2 instance or in an ECS task, the CLI can use the instance/task role directly. Running it on your laptop? Pass credentials via environment variables or your AWS config.

## The engineering tradeoff

Shipping a CLI means the core detection engine can't depend on anything that only exists in the hosted infrastructure. No proprietary message queues. No managed database for intermediate state. No service-to-service calls during analysis.

This constraint is actually useful. It forces a clean separation between the detection engine (waste pattern rules, IAM role management, recommendation generation) and the platform (auth, billing, dashboards, multi-tenancy, history). The hosted service wraps the detection engine with the platform layer. The CLI ships the detection engine only.

The tradeoff is that some features only make sense in the hosted service:

| Feature | CLI | Hosted Service |
|---------|-----|---------------|
| Waste detection | Yes | Yes |
| Plain-English recommendations | Yes | Yes |
| Read-only IAM role | Yes | Yes |
| Historical trends | No | Pro tier |
| Alerts on new waste | No | Pro tier |
| Team access controls | No | Enterprise tier |
| Dashboard UI | No (terminal output) | Yes |

This is honest. The CLI is the Community tier -- fully functional for finding and fixing waste right now, but it's a point-in-time scan with terminal output. If you want a dashboard, historical trends, and alerts when a new idle NAT Gateway shows up next month, that's the hosted service.

## Why Docker?

The CLI is a single binary. You can download it and run it directly. So why also ship a Docker image?

Two reasons:

1. **CI/CD integration.** Teams that want to run CCA as a scheduled job in their pipeline don't want to manage binary versions and OS compatibility. `docker pull dragonfractal/cca` works the same in GitHub Actions, GitLab CI, Jenkins, and any other runner that supports containers.

2. **No install friction.** Some engineers can't (or won't) install arbitrary binaries on their work machines. Docker is already approved in most environments. Pulling an image and running it in a container is a lower trust bar than downloading and executing a binary.

## The business case

CLI users on the Community tier don't pay me anything. So why spend engineering time supporting them?

Three reasons:

1. **Top of funnel.** Someone who runs the CLI and finds $500/month in waste becomes a champion for CCA inside their organization. When their team needs a dashboard, alerts, and history, they already trust the detection engine.

2. **Security-conscious orgs are the best customers.** The companies that won't send billing data to a SaaS are often the ones with the biggest cloud bills. If I can earn their trust with a local CLI, the hosted service conversation happens naturally once they see the value.

3. **It keeps me honest.** If the CLI finds the same waste for free, the hosted service has to be meaningfully better to justify the price. Dashboard, history, alerts, team features -- that's the value of the platform, and it has to stand on its own.

Try it:

```bash
docker pull dragonfractal/cca
```
