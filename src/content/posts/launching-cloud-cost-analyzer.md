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

If you've been following along -- the [$6,000 AWS bill](/posts/the-6000-aws-bill-that-started-everything) that started everything, the [Cost Explorer gaps](/posts/what-aws-cost-explorer-actually-hides-from-you) it fills, the [IAM role design](/posts/building-a-read-only-iam-role-auditors-trust) that makes it safe, the [agent architecture](/posts/why-i-ship-an-agent-you-run-in-your-environment) that keeps your credentials local -- this is where those threads come together.

## How it works

1. Sign up at [www.dragonfractal.com](https://www.dragonfractal.com/) (free, no credit card)
2. Create the read-only IAM role in your account (one-command CloudFormation deploy)
3. Run the CCA agent in your environment
4. The agent collects resource, cost, and utilization data using your AWS credentials (credentials stay on your machine)
5. The agent sends collected metrics to the CCA service, which runs 89 detection rules
6. See findings on the dashboard and in the CLI output

```bash
# Install the agent
curl -sSL https://releases.dragonfractal.com/install.sh | sh

# Or pull the Docker image
docker pull ghcr.io/dragonfractal/cca:latest

# Set up the IAM role
cloud-cost-analyzer setup --provider aws --deploy

# Run a scan
cloud-cost-analyzer scan --api-key <your-key> --regions us-east-1
```

## What CCA finds

89 detection rules across 9 categories:

**Compute.** Idle EC2 instances (<5% CPU). Stopped instances still paying for EBS. Previous-generation instance types. Graviton migration opportunities. Burstable instances exhausting CPU credits. EKS nodes at 20% utilization.

**Storage.** Unattached EBS volumes. Old snapshots (>90 days). gp2 volumes that should be gp3 (20% savings). S3 buckets with no lifecycle policies. Unused ECR repositories. Underutilized EFS and FSx.

**Networking.** Idle NAT Gateways ($32-45/mo each). Unattached Elastic IPs ($3.60/mo). Load balancers with no targets ($16-27/mo). Idle VPN connections. Unused VPC endpoints ($7.20/mo per AZ). Low-throughput Transit Gateways.

**Database.** Underutilized RDS (<20% CPU). Over-provisioned DynamoDB. ElastiCache clusters with zero cache hits. Idle Redshift, Neptune, and DocumentDB. Non-Graviton RDS. Multi-AZ on non-production databases (50% savings).

**Serverless.** Oversized Lambda functions (<30% memory utilization, 30-80% savings). Lambda high error rates. Idle Step Functions and API Gateways. CodePipeline pipelines that never execute.

**Analytics.** Idle OpenSearch domains. Low-throughput Kinesis streams. Idle EMR clusters. Athena queries missing partition pruning.

**Monitoring.** CloudWatch Log groups with no retention policy. Unused CloudWatch dashboards ($3/dashboard/mo).

**Security.** Secrets Manager secrets never accessed ($0.40/secret/mo). Unused ACM certificates. Idle KMS keys ($1/key/mo).

**ML.** Idle SageMaker notebooks ($50-700/mo). SageMaker endpoints with low traffic ($100-5,000/mo).

Each finding includes the specific resource (ID, ARN, region, tags), the estimated monthly cost, a plain-English explanation, and the steps to fix it.

## Pricing

| Tier | Monthly | Yearly | What you get |
|------|---------|--------|-------------|
| **Community** | Free forever | Free forever | Executive summary, savings totals, finding categories. 20 core rules. No credit card. |
| **Pro** | $99/mo | $990/yr | All 89 rules, full findings with resource IDs and recommendations, historical trends, alerts, PDF/JSON export. |
| **Enterprise** | $499/mo | $4,990/yr | Everything in Pro + team access controls, SSO, multi-account management. |

The Community tier gives you the executive summary on every scan -- total savings potential, severity breakdown, optimization score, and finding categories with estimated savings. You can see how much you're wasting and in what categories. To see the specific resource IDs and fix-it recommendations, that's Pro.

Here's the thing: even the Community tier executive summary is worth more than what most people get from Cost Explorer. If you scan your account and CCA tells you there's $800/month in waste across 12 idle resources, 8 storage orphans, and 3 networking issues -- that's enough signal to go hunting manually. Pro just makes the hunting automatic.

## For regulated environments: air-gapped mode

Some teams can't send data to an external service. CCA supports an air-gapped mode where all 89 rules run locally on your machine with a license file. No data leaves your environment. Same rules, same recommendations, fully offline.

## What's next

CCA currently covers AWS with 89 detection rules. The roadmap includes:

- **More rules** -- reserved instance coverage gaps, savings plan optimization, S3 intelligent tiering
- **Azure support** -- same detection patterns, different cloud (coming soon)
- **GCP support** -- planned after Azure

New rules take effect immediately for all users in managed mode -- the rules run server-side, so your agent doesn't need an update when new rules ship.

## The short version

I spent a year consulting on AWS bills. The same waste patterns showed up in every account. I automated finding them. That collection of rules is now Cloud Cost Analyzer -- 89 detection rules, built in Rust, with an agent that runs in your environment and a dashboard that shows you exactly where you're wasting money.

Sign up: [www.dragonfractal.com](https://www.dragonfractal.com/)

Pull the agent: `docker pull ghcr.io/dragonfractal/cca:latest`

Community tier: free, forever, no credit card.
