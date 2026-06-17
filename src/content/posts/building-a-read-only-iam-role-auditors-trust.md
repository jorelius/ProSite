---
title: "Building a Read-Only IAM Role That Auditors Actually Trust"
date: "2026-04-15T10:00:00.000Z"
draft: false
slug: "building-a-read-only-iam-role-auditors-trust"
category: "Cloud Cost"
tags:
  - "AWS"
  - "IAM"
  - "Security"
  - "CCA"
description: "How I designed CCA's IAM role to be genuinely least-privilege -- and why that decision matters more than any feature on the roadmap."
---

When you're building a tool that connects to someone else's AWS account, the first question is always: "What access do you need?"

The wrong answer is "just give us AdministratorAccess and we'll figure it out." The right answer takes more work, but it's the only answer that doesn't end your sales conversation immediately.

Here's how I designed the IAM role for Cloud Cost Analyzer, and why every permission is there.

## The trust problem

CCA reads your AWS cost and resource data to find waste. It never modifies anything. But "trust me, it's read-only" isn't good enough. Security teams and auditors want to see the actual IAM policy, verify it themselves, and confirm there's no path to escalation.

This meant the role needed to be:

1. **Explicitly scoped** -- only the permissions CCA actually uses, nothing more
2. **Auditable** -- the policy is public, not hidden behind a "connect your account" button
3. **Cross-account via AssumeRole** -- CCA never touches your credentials, just assumes a role you create in your account
4. **No write permissions** -- not even `s3:PutObject` for "temporary storage" or `logs:CreateLogGroup` for "diagnostics"

## The role architecture

CCA uses the standard cross-account AssumeRole pattern:

```
Your AWS Account                    CCA Service Account
+-------------------+              +-------------------+
|                   |              |                   |
| CCA-ReadOnly-Role | <-- STS --> | CCA Service Role  |
| (you create this) | AssumeRole  | (we control this) |
|                   |              |                   |
+-------------------+              +-------------------+
```

You create a role in your account with a trust policy that allows CCA's service account to assume it. CCA calls `sts:AssumeRole`, gets temporary credentials (valid for 1 hour), and uses those to read your cost data. When the session expires, access is gone.

The trust policy looks like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "<your-unique-external-id>"
        }
      }
    }
  ]
}
```

The `ExternalId` condition prevents the confused deputy problem -- another AWS customer can't trick CCA into assuming your role because they don't know your external ID.

## The permission policy

Here's what CCA actually needs, and why:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CostAndBillingRead",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "cur:DescribeReportDefinitions"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ResourceDiscovery",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeNatGateways",
        "ec2:DescribeVolumes",
        "ec2:DescribeAddresses",
        "ec2:DescribeNetworkInterfaces",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:DescribeTargetHealth"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LogGroupDiscovery",
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TagRead",
      "Effect": "Allow",
      "Action": [
        "tag:GetResources"
      ],
      "Resource": "*"
    }
  ]
}
```

Let me walk through each statement.

**CostAndBillingRead**: `ce:GetCostAndUsage` pulls the cost data grouped by usage type and resource. `ce:GetCostForecast` provides the trend line. `cur:DescribeReportDefinitions` checks if you have a CUR set up (if not, CCA tells you how to enable it for deeper analysis).

**ResourceDiscovery**: These are all `Describe*` actions -- read-only by definition. `DescribeVolumes` lets CCA find unattached EBS volumes (status = available). `DescribeNatGateways` finds idle NAT Gateways. `DescribeAddresses` finds unattached Elastic IPs. The ELB actions check for load balancers with empty target groups.

**LogGroupDiscovery**: `logs:DescribeLogGroups` returns metadata including retention settings. CCA flags log groups with no retention policy or retention set to "Never expire."

**TagRead**: `tag:GetResources` lets CCA correlate resources with their tags, so findings can include context like "this unattached volume was tagged `env:dev, team:backend`."

## What's not in the policy

No `s3:*` actions. CCA doesn't read your S3 buckets.

No `iam:*` actions. CCA doesn't enumerate your users, roles, or policies.

No `lambda:*`, `ecs:*`, `rds:*` in the initial version. These will come as CCA adds detection rules for those services, and each one will be a specific `Describe*` action, not a wildcard.

No write actions of any kind. Zero `Create*`, `Delete*`, `Put*`, `Update*`, or `Modify*` permissions.

## Why this matters more than features

I could have shipped faster with `ReadOnlyAccess` -- the AWS managed policy that grants read access to almost everything. It's a single line to attach and it covers all the APIs CCA needs.

But `ReadOnlyAccess` also grants `s3:GetObject` (read any file in any bucket), `secretsmanager:GetSecretValue` (read your secrets), `dynamodb:GetItem` (read your database), and hundreds of other permissions CCA has no business having.

When an engineer evaluates CCA, the first thing they'll look at is the IAM policy. If it says `ReadOnlyAccess`, the conversation is over for anyone who takes security seriously. If it says exactly the 13 actions listed above -- all `Describe*`, `Get*` on cost data, and nothing else -- that's a conversation that continues.

Security isn't a feature you add later. It's the reason someone does or doesn't connect their account in the first five minutes.
