---
title: "The $6,000/mo AWS Bill That Started Everything"
date: "2026-03-10T10:00:00.000Z"
draft: false
slug: "the-6000-aws-bill-that-started-everything"
category: "Cloud Cost"
tags:
  - "AWS"
  - "Cloud Cost"
  - "Dragon Fractal"
  - "CCA"
description: "How a single consulting engagement with a $6,000/mo AWS bill revealed the same waste patterns hiding in every account I looked at."
---

Last year I left AWS and started consulting on cloud cost optimization. My first real engagement was a startup running about $6,000/month on AWS. They knew the number was too high but couldn't figure out where the money was going. AWS Cost Explorer showed them a stacked bar chart that basically said "EC2 is expensive." Not exactly actionable.

I spent a week inside their account. Here's what I found.

## The usual suspects

**Three NAT Gateways nobody needed.** They'd set up a VPC with three availability zones during initial setup -- reasonable for production. But their staging and dev environments were running through the same NAT Gateways. Each one costs roughly $32/month in fixed charges plus $0.045/GB for data processing. They were pushing 200GB/month through NAT Gateways that existed because a Terraform module defaulted to `one_per_az = true`. That's $96/month in base charges plus $27 in processing for traffic that could have gone through a single NAT Gateway or, for the dev environment, no NAT Gateway at all.

**14 unattached EBS volumes.** These are the ghosts of EC2 instances past. Someone terminates an instance but the EBS volume sticks around because `delete_on_termination` was set to `false` (the old default). Each one was a gp2 volume averaging 100GB. At $0.10/GB/month, that's $140/month sitting there doing literally nothing.

**CloudWatch Logs nobody reads.** They had verbose application logging going to CloudWatch at about 15GB/month of ingestion. CloudWatch Logs charges $0.50/GB for ingestion. That's $7.50/month -- not huge on its own, but nobody had opened these log groups in months. The retention was set to "Never expire," so they were also paying $0.03/GB/month for storage that kept growing.

**Cross-AZ data transfer.** This was the sneaky one. Their application servers in us-east-1a were talking to their database in us-east-1b. AWS charges $0.01/GB for cross-AZ traffic in each direction. At their request volume -- roughly 100 RPS with moderate payload sizes -- this added up to about $26/month. Not a budget-breaker, but completely invisible unless you know to look for it.

## The pattern

I took on three more engagements over the next few months. Different companies, different architectures, different scales. The same four categories showed up every single time:

1. Idle networking resources (NAT Gateways, Elastic IPs, load balancers with no targets)
2. Orphaned storage (unattached EBS, old snapshots, forgotten S3 buckets)
3. Log overspend (CloudWatch ingestion nobody configured retention on)
4. Cross-AZ and cross-region data transfer (invisible in Cost Explorer's default groupings)

AWS Cost Explorer technically shows you all of this. But it groups by service, not by waste pattern. You have to know what you're looking for, navigate to the right filters, and do the math yourself. Most teams don't.

## Why I started building

After the fourth engagement I realized I was doing the same detective work each time. Same queries against the Cost and Usage Report. Same checks for unattached volumes. Same NAT Gateway audit. Same cross-AZ transfer calculation.

So I started automating it. That automation became Cloud Cost Analyzer. That side project became Dragon Fractal.

The first version was me manually compiling graphs and metrics, then analyzing them against rules and best practices I'd learned from years of running services on cloud infrastructure. It worked, but it took days per account. I kept thinking: every check I'm doing is repeatable. Every rule I'm applying is codifiable. Why am I doing this by hand?

So I started writing detection rules. One for idle NAT Gateways. One for unattached EBS volumes. One for CloudWatch log groups with no retention policy. Each rule takes a piece of what I was doing manually and makes it automatic. That collection of rules became Cloud Cost Analyzer, and the project became Dragon Fractal.

More on the technical details in upcoming posts. For now: if you've ever looked at an AWS bill and thought "this seems high but I don't know where to start" -- that's exactly the problem I'm building for.
