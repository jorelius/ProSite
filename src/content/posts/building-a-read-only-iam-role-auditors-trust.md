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

CCA's agent runs in your environment and collects resource and cost metrics from your AWS account. Those metrics get sent to the CCA service, where 80+ detection rules identify waste and generate recommendations you can see on the dashboard.

That means two trust boundaries:

1. **What can the agent read from your AWS account?** (the IAM policy)
2. **What data leaves your environment?** (collected metrics -- not credentials)

For the first boundary, security teams and auditors want to see the actual IAM policy, verify it themselves, and confirm there's no path to escalation. For the second, the critical point is: **your AWS credentials never leave your environment.** The CCA agent uses your credentials locally to collect data, then sends the collected metrics to the CCA service. The service never sees your IAM role, access keys, or session tokens.

## How it works

```
Your Environment                 Your AWS Account              CCA Service
+----------------+              +----------------+            +----------------+
| CCA Agent      | -- direct -> | AWS APIs       |            |                |
| (your machine) |   API calls  | (Describe/List)|            |                |
|                |   using YOUR |                |            |                |
|                |   credentials|                |            |                |
|                |              +----------------+            |                |
|                |                                            |                |
|                | -- sends collected metrics ---------------> | Rules Engine   |
|                |   (resource data, cost data,               | (80+ rules)    |
|                |    utilization metrics)                     |                |
+----------------+                                            +----------------+
                                                                     |
                                                              +----------------+
                                                              | Dashboard      |
                                                              | (your findings)|
                                                              +----------------+

Your credentials: never leave your environment.
Your metrics: sent to CCA service for analysis.
```

The CCA agent assumes or uses the IAM role you configure in your environment. It calls the AWS APIs to collect resource, cost, and utilization data, then sends that data to the CCA service for processing. The service runs the detection rules and surfaces findings on the dashboard.

CCA ships a CloudFormation template that creates the IAM role with one deploy. The template accepts an optional `ExternalId` for confused deputy prevention and a `TrustedAccountId` for cross-account setups.

## The permission policy -- what CCA actually needs

CCA has 80+ detection rules spanning compute, storage, networking, databases, serverless, analytics, and more. Each rule needs specific `Describe*`, `List*`, or `Get*` permissions for the agent to collect the right data. Here's the minimum policy for basic scanning:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudCostAnalyzerMinimum",
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity",
        "ec2:DescribeRegions",
        "ec2:DescribeInstances",
        "ec2:DescribeVolumes",
        "ec2:DescribeSnapshots",
        "ec2:DescribeAddresses",
        "ec2:DescribeNatGateways",
        "ec2:DescribeNetworkInterfaces",
        "rds:DescribeDBInstances",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    }
  ]
}
```

That's 13 actions. It covers the core waste patterns: idle EC2 instances, unattached EBS volumes, old snapshots, orphaned Elastic IPs, idle NAT Gateways, underutilized RDS instances, and S3 bucket discovery. Combined with CloudWatch metrics, CCA can determine whether resources are actually being used or just burning money.

## The full policy -- all 80+ rules

The full policy enables every detection rule CCA has. It's bigger -- organized by service category:

| Category | Services | Sample Rules |
|----------|----------|-------------|
| **Compute** | EC2, ECS, EKS, Auto Scaling | Idle VMs, stopped instances, Graviton migration, burstable overuse |
| **Storage** | EBS, S3, EFS, FSx, ECR | Unattached volumes, old snapshots, gp2-to-gp3, storage class optimization |
| **Database** | RDS, DynamoDB, ElastiCache, Redshift, Neptune, DocumentDB | Underutilized RDS, over-provisioned DynamoDB, zero-hit caches |
| **Networking** | VPC, ELB, Route 53, CloudFront, Direct Connect | Idle NAT Gateways, unused EIPs, idle load balancers, VPN connections |
| **Serverless** | Lambda, Step Functions, API Gateway, AppSync | Oversized Lambda, high error rates, idle APIs |
| **Analytics** | OpenSearch, Kinesis, EMR, Glue | Idle clusters, low-throughput streams |
| **Monitoring** | CloudWatch Logs, Dashboards | Missing retention policies, unused dashboards |
| **Security** | Secrets Manager, ACM, KMS | Never-accessed secrets, unused certificates, idle KMS keys |
| **Cost** | Cost Explorer | Cost data enrichment for dollar-amount estimates |

Every action is a `Describe*`, `List*`, or `Get*` call. The full policy is about 100 actions across 30+ services. It's documented service-by-service so you can strip out categories you don't care about -- if you don't run SageMaker, remove the ML permissions. The minimum policy still catches the highest-value waste patterns.

## What's explicitly NOT in the policy

CCA never requests:

- **`s3:GetObject`** -- CCA lists your buckets and checks lifecycle policies, but never reads objects inside them
- **`secretsmanager:GetSecretValue`** -- CCA checks if secrets exist and when they were last accessed, but never reads secret values
- **`dynamodb:GetItem`** -- CCA checks table provisioning, not your data
- **`iam:*` (almost)** -- the only IAM action is `iam:SimulatePrincipalPolicy` for optional permission validation. No user, role, or policy enumeration
- **Any write action** -- zero `Create*`, `Delete*`, `Put*`, `Update*`, or `Modify*` permissions across the entire policy

## Why not just use ReadOnlyAccess?

I could have shipped faster with `ReadOnlyAccess` -- the AWS managed policy that grants read access to almost everything. It's a single line to attach and it covers all the APIs CCA needs.

But `ReadOnlyAccess` also grants `s3:GetObject` (read any file in any bucket), `secretsmanager:GetSecretValue` (read your secrets), `dynamodb:GetItem` (read your database rows), and hundreds of other permissions CCA has no business having.

When an engineer evaluates CCA, the first thing they'll look at is the IAM policy. If it says `ReadOnlyAccess`, the conversation is over for anyone who takes security seriously. If the policy is explicitly scoped to the exact `Describe*` and `List*` actions the tool needs -- and nothing else -- that's a conversation that continues.

## One-command setup

The CloudFormation template handles everything:

```bash
cloud-cost-analyzer setup --provider aws --deploy
```

This deploys the stack, creates the role with the full policy, and outputs the role ARN. For cross-account setups, add `--external-id` and `--trusted-account-id`. For teams that prefer to review the template first:

```bash
cloud-cost-analyzer setup --provider aws --output-template
```

This prints the CloudFormation YAML to stdout so your security team can audit it before deployment.

Security isn't a feature you add later. It's the reason someone does or doesn't connect their account in the first five minutes.
