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

CCA connects to your AWS account via a read-only IAM role and finds the waste that Cost Explorer buries in aggregated categories. Specifically:

**Idle networking resources.** NAT Gateways with no meaningful traffic ($32/mo each). Elastic IPs not attached to running instances ($3.60/mo each). Load balancers with empty target groups.

**Orphaned storage.** Unattached EBS volumes from terminated instances. Old EBS snapshots past any reasonable retention window. These add up quietly -- I've seen accounts with $200+/month in storage that serves no purpose.

**Log overspend.** CloudWatch Log groups with no retention policy, accruing $0.03/GB/month in storage forever. Log groups with high ingestion ($0.50/GB) that nobody queries.

**Cross-AZ data transfer.** The invisible cost -- $0.01/GB between availability zones, buried in Cost Explorer's "Data Transfer" category alongside internet egress. CCA quantifies the cross-AZ portion separately so you can see whether co-locating services would save money.

Each finding includes:

- The specific resource (ID, ARN, region, tags)
- The estimated monthly cost
- A plain-English explanation of why it's waste
- The exact AWS console steps to fix it

No 50-page PDF. No "schedule a call with our solutions team." Findings with dollar amounts and fix instructions.

## How to try it

### Option A: Hosted version

Sign up at [www.dragonfractal.com](https://www.dragonfractal.com/). Create the read-only IAM role in your account (CCA provides a CloudFormation template that does this in one click). Connect your account. See findings within minutes.

### Option B: CLI (run locally)

```bash
# Direct
cca analyze --role-arn arn:aws:iam::role/CCA-ReadOnly

# Or via Docker
docker pull dragonfractal/cca
docker run \
  -e CCA_ROLE_ARN=arn:aws:iam::role/CCA-ReadOnly \
  dragonfractal/cca analyze
```

Same detection engine, your machine. Billing data never leaves your network.

## Pricing

| Tier | Price | What you get |
|------|-------|-------------|
| **Community** | Free, forever | Waste detection, recommendations, CLI + Docker image. No credit card. |
| **Pro** | $99/mo | Everything in Community + historical trends, alerts when new waste appears, email reports. |
| **Enterprise** | $499/mo | Everything in Pro + team access controls, SSO, multi-account management. |

The Community tier is a real product, not a crippled demo with a "upgrade to see your results" wall. You get the full detection engine, all finding categories, and plain-English recommendations. If Community is all you need, use it forever. I'd rather have 1,000 teams finding waste with the free tier than 10 teams on Enterprise.

Pro and Enterprise exist for teams that want the workflow around the findings -- alerts so you catch new waste before it runs for three months, history so you can show your CFO the savings trend, team features so the whole engineering org has visibility.

## What's next

CCA currently covers the four waste categories I kept finding in every account I audited: idle networking, orphaned storage, log overspend, and cross-AZ transfer. The roadmap includes:

- **RDS idle instance detection** -- reserved instances running at 5% CPU with no connections
- **S3 lifecycle policy analysis** -- buckets with no lifecycle rules on infrequently accessed data
- **Savings Plan and Reserved Instance coverage gaps** -- on-demand spend that could be committed
- **Azure support** -- same detection patterns, different cloud (coming soon)

Each new detection rule follows the same pattern: find the waste, quantify it in dollars, explain it in plain English, and give you the steps to fix it.

## The short version

I spent a year consulting on AWS bills. The same waste patterns showed up in every account. I automated finding them. That automation is now Cloud Cost Analyzer.

Try it: [www.dragonfractal.com](https://www.dragonfractal.com/)

Pull it: `docker pull dragonfractal/cca`

Community tier: free, forever, no credit card.
