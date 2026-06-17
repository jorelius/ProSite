---
title: "What AWS Cost Explorer Actually Hides From You"
date: "2026-03-28T10:00:00.000Z"
draft: false
slug: "what-aws-cost-explorer-actually-hides-from-you"
category: "Cloud Cost"
tags:
  - "AWS"
  - "Cloud Cost"
  - "Cost Explorer"
  - "CCA"
description: "AWS Cost Explorer shows you what you spent. It doesn't show you what you wasted. Here's what its default grouping logic obscures."
---

AWS Cost Explorer is free, built-in, and the first place most people go when the bill looks wrong. It's also designed to answer "what did I spend?" -- not "what am I wasting?"

That distinction matters more than you'd think.

## The GroupBy problem

Cost Explorer lets you group costs by Service, Linked Account, Region, Usage Type, or Tag. Most people group by Service because that's the default. You get a stacked bar chart: EC2 is the big block, RDS is the next one, then S3, then everything else in a thin sliver.

This tells you EC2 costs a lot. It doesn't tell you that $96 of your EC2 bill is three NAT Gateways you don't need. That's buried inside the "EC2-Other" category, which is itself a grab bag of:

- NAT Gateway hours and data processing
- Elastic IP charges
- EBS volume and snapshot storage
- Data transfer (cross-AZ, cross-region, internet egress)
- CloudWatch charges attributed to EC2

To see NAT Gateway costs specifically, you'd need to filter by Usage Type and look for `NatGateway-Hours` and `NatGateway-Bytes`. Most people don't know that usage type exists.

## What the Cost and Usage Report reveals

The CUR (Cost and Usage Report) is the raw data behind Cost Explorer. It's a CSV (or Parquet) dump to S3 with every line item on your bill. It has fields Cost Explorer doesn't expose in its UI:

- `line_item_resource_id` -- the actual resource ARN, so you can see which specific NAT Gateway or EBS volume is costing you money
- `product_usagetype` -- granular usage types like `USE1-NatGateway-Hours` or `USE1-EBS:VolumeUsage.gp2`
- `line_item_usage_amount` -- raw usage quantities before pricing is applied
- `product_transfer_type` -- distinguishes cross-AZ from internet egress from same-region transfer

Cost Explorer aggregates all of this into categories that are useful for high-level budgeting but useless for finding waste. It's the difference between "you spent $400 on EC2-Other" and "you have 14 unattached gp2 volumes in us-east-1 costing $140/month, and here are their volume IDs."

## The five things Cost Explorer obscures

### 1. Idle NAT Gateways

A NAT Gateway costs $0.045/hour ($32.40/month) whether it processes zero bytes or a terabyte. Cost Explorer lumps this into EC2-Other. You need to cross-reference VPC flow logs or the CUR `line_item_resource_id` to see which NAT Gateways are carrying real traffic vs. sitting idle.

### 2. Unattached EBS volumes

When you terminate an EC2 instance, its EBS volumes can persist. Cost Explorer shows you total EBS spend. It doesn't flag that some of those volumes aren't attached to anything. You need to call `ec2:DescribeVolumes` with a filter for `status = available` to find orphans.

### 3. Cross-AZ data transfer

This is the one that surprises people most. AWS charges $0.01/GB for traffic between availability zones in the same region. It shows up in the CUR as `product_transfer_type = IntraRegion`. Cost Explorer's default views don't surface this at all -- it's folded into the general "Data Transfer" category alongside internet egress ($0.09/GB), which has a completely different cost profile and optimization strategy.

At 100 RPS with 10KB average payloads, that's about 86GB/month per direction. $1.72/month round trip. Scale that to 1,000 RPS and it's $17.20. At 10,000 RPS you're looking at $172/month in transfer costs that most teams don't realize exist.

### 4. CloudWatch Logs ingestion vs. storage

Cost Explorer shows you "CloudWatch" as a line item. It doesn't separate ingestion ($0.50/GB) from storage ($0.03/GB/month) in a way that makes the optimization obvious. The fix for ingestion overspend is different from the fix for storage overspend:

- **Ingestion**: reduce log verbosity, filter at the source, use subscription filters to route only what you need
- **Storage**: set retention policies (the default is "Never expire," which means you're paying $0.03/GB/month forever for logs nobody will read after 30 days)

### 5. Elastic IPs not attached to running instances

An Elastic IP attached to a running instance is free. An Elastic IP sitting unattached costs $0.005/hour ($3.60/month). Small number, but I've seen accounts with 15-20 orphaned EIPs from old deployments. That's $54-72/month for IP addresses pointing at nothing.

## What I built instead

Cloud Cost Analyzer's agent collects the data that Cost Explorer aggregates away using a read-only IAM role, sends it to the CCA service, and the dashboard groups findings by waste pattern instead of by service. Instead of "EC2-Other: $400" you get:

- 3 idle NAT Gateways: $96/month -- here are the IDs, here's which VPCs they're in
- 14 unattached EBS volumes: $140/month -- here are the volume IDs, here's when the attached instance was terminated
- CloudWatch Logs with no retention policy: $45/month in storage -- here are the log groups
- Cross-AZ transfer between app tier and database: $26/month -- here's the traffic pattern

Each finding comes with the specific AWS console steps to fix it. Not a link to a docs page. The actual "go to VPC > NAT Gateways > select this ID > Actions > Delete" steps.

That's the gap CCA fills. Cost Explorer answers "how much." CCA answers "where's the waste, and how do I fix it."
