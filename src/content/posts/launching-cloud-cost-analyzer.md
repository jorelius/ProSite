---
title: "Launching Cloud Cost Analyzer: Free Tier, Real Product, No Demo Mode"
date: "2026-06-02T10:00:00.000Z"
draft: false
slug: "launching-cloud-cost-analyzer"
category: "Cloud Cost"
tags:
  - "AWS"
  - "Cloud Cost"
  - "CCA"
  - "Dragon Fractal"
  - "Launch"
description: "Cloud Cost Analyzer is live. Here's what it does, what it costs, and how to try it in the next five minutes."
---

Cloud Cost Analyzer is live. This post covers what it does, how it works, and how to try it.

If you've been following along -- the [$6,000 AWS bill](/posts/the-6000-aws-bill-that-started-everything) that started everything, the [Cost Explorer gaps](/posts/what-aws-cost-explorer-actually-hides-from-you) it fills, the [IAM role design](/posts/building-a-read-only-iam-role-auditors-trust) that makes it safe, the [CLI and Docker image](/posts/why-i-ship-a-cli-alongside-the-service) that let you run it locally -- this is where those threads come together.

## What CCA does

CCA connects to your AWS account via a read-only IAM role and runs 80+ detection rules that find the waste Cost Explorer buries in aggregated categories.

**Compute waste.** Idle EC2 instances running at <5% CPU. Stopped instances still paying for EBS. Previous-generation instance types costing more than their Graviton equivalents. EKS nodes running at 20% utilization.

**Storage waste.** Unattached EBS volumes from terminated instances. Old snapshots past any reasonable retention window. gp2 volumes that should be gp3 (same performance, 20% cheaper). S3 buckets with no lifecycle policies. Unused ECR repositories.

**Networking waste.** Idle NAT Gateways ($32/mo each). Unattached Elastic IPs ($3.60/mo each). Load balancers with empty target groups. Idle VPN connections. Unused VPC endpoints.

**Database waste.** Underutilized RDS instances. Over-provisioned DynamoDB tables. ElastiCache clusters with zero cache hits. Idle Redshift, Neptune, and DocumentDB clusters. Non-Graviton RDS instances. Multi-AZ on non-production databases.

**Serverless, analytics, monitoring, security.** Oversized Lambda functions. Idle Step Functions and API Gateways. CloudWatch Log groups with no retention policy. SageMaker notebooks running 24/7. Never-accessed Secrets Manager secrets. Unused KMS keys.

Each finding includes:

- The specific resource (ID, ARN, region, tags)
- The estimated monthly cost
- A plain-English explanation of why it's waste
- The specific steps to fix it

No 50-page PDF. No "schedule a call with our solutions team." Findings with dollar amounts and fix instructions.

## How to try it

### Option A: Hosted service

Sign up at [www.dragonfractal.com](https://www.dragonfractal.com/). Create the read-only IAM role (CCA provides a CloudFormation template -- one command to deploy). Connect your account. See findings in the dashboard.

### Option B: CLI (run locally)

```bash
# Direct
cloud-cost-analyzer scan --regions us-east-1

# Or via Docker
docker pull dragonfractal/cca
docker run dragonfractal/cca scan --regions us-east-1
```

Same detection engine, your machine. Output in table, JSON, YAML, markdown, or PDF. Billing data never leaves your network.

## Pricing

| Tier | Price | What you get |
|------|-------|-------------|
| **Community** | Free, forever | 80+ detection rules, plain-English recommendations, CLI + Docker image. No credit card. |
| **Pro** | $99/mo | Everything in Community + historical trends, alerts when new waste appears, email reports. |
| **Enterprise** | $499/mo | Everything in Pro + team access controls, SSO, multi-account management. |

The Community tier is a real product, not a crippled demo with a "upgrade to see your results" wall. You get every detection rule, every finding category, and plain-English recommendations. If Community is all you need, use it forever. I'd rather have 1,000 teams finding waste with the free tier than 10 teams on Enterprise.

Pro and Enterprise exist for teams that want the workflow around the findings -- alerts so you catch new waste before it runs for three months, history so you can show your CFO the savings trend, team features so the whole engineering org has visibility.

## What's next

CCA currently covers AWS with 80+ detection rules across compute, storage, networking, databases, serverless, analytics, monitoring, and security. The roadmap includes:

- **More detection rules** -- reserved instance coverage gaps, savings plan optimization, S3 intelligent tiering analysis
- **Azure support** -- same detection patterns, different cloud (coming soon)
- **GCP support** -- planned after Azure

Each new detection rule follows the same pattern: find the waste, quantify it in dollars, explain it in plain English, and give you the steps to fix it.

## The short version

I spent a year consulting on AWS bills. The same waste patterns showed up in every account. I automated finding them. That collection of rules is now Cloud Cost Analyzer -- 80+ detection rules, built in Rust, shipped as a hosted service and a CLI.

Try it: [www.dragonfractal.com](https://www.dragonfractal.com/)

Pull it: `docker pull dragonfractal/cca`

Community tier: free, forever, no credit card.
