+++
title = "A small piece in handling complex ads programs in $50B organization"
date = "2024-11-13T15:47:34-08:00"
author = "hanknguyen"
authorTwitter = "" #do not include @
cover = ""
tags = ["microservice", "advertising", "amazon"]
keywords = ["", ""]
description = ""
showFullContent = false
hideComments = false
color = ""
+++


> *"Alongside our Stores business, Amazon’s Advertising progress remains strong, growing 24% YoY from
$38B in 2022 to $47B in 2023, primarily driven by our sponsored ads. We’ve added Sponsored TV to this
offering, a self-service solution for brands to create campaigns that can appear on up to 30+ streaming
TV services, including Amazon Freevee and Twitch, and have no minimum spend. Recently, we’ve expanded
our streaming TV advertising by introducing ads into Prime Video shows and movies, where brands can
reach over 200 million monthly viewers in our most popular entertainment offerings, across hit movies and
shows, award-winning Amazon MGM Originals, and live sports like Thursday Night Football. Streaming
TV advertising is growing quickly and off to a strong start."*
> https://s2.q4cdn.com/299287126/files/doc_financials/2024/ar/Amazon-com-Inc-2023-Annual-Report.pdf

## Background

Amazon Advertising is large in both revenue and structure. One way to look at the structure is through the different ads program the company offers, e.g. Sponsored display, kindle, etc. Any business or finance details in this writing are public information, e.g. Amazon 2023 Annual report above. The rest of the writing I will describe a small piece in architecture solution which *can be* used to support Amazon Advertising, or more specifically, the demand side platform.

Ads is a popular business model for internet companies, and also the backbone of some  ["Senator, we run ads"](https://www.youtube.com/watch?v=n2H8wx1aBiQ). There are a few parties involved in the advertising world, namely the demand side, supply side, adexchange. To represent the demand side, there are advertisers, they can be a seller of a particular products or a marketing agency, want to work with Amazon Advertising. Supply side consists of entities that have advertising real estate, capability. They can be a blogger, a popular website. Individuals will work with a ads program to monetize their content. One major player is [Google AdSense](https://adsense.google.com/start/) by Google. Adexchange is where the 2 sides connect and make deals and bids on ads. 

For advertisers, they want to manage their campaign, e.g. “Just Do It” (1988). In each campaign, there are smaller units, Amazon call them adgroup. Adgroups are then associated with media files. As for managing campaigning, they want to be able to track the performance of their campaigns, set budget, set targeting, bid price etc.

```yaml
advertiser
  - campaign
    - adgroup
    - adgroup
  - campaign
  ...
```

## Situation

There are many ad programs at Amazon ads. One example is sponsored display on the e-commerce website.
![amazon sponsored ads](/imgs/2024-11-19-14-47-48.png)
Another is ads on kindle reader. Each ads program have their set of requirements. Kindle ads media files need to follow a certain size. There are other more generic requirements are, for instance, maximum number of adgroups per campaign, etc.

## Task 

Now I will describe one small piece of the demand side platform. They need a portal for advertisers to manage the campaign data. Whenever there's an update, the adserver should be communicated to update the campaign data. 
```yaml
sequenceDiagram
Portal->>AdServer: Create/Update
AdServer->>Portal: Ack!
```
![](/imgs/2024-11-19-15-57-54.png)

Let's also call the create/update/delete request as mutation. Other than the validation, management logic complexity, mutation request to the adserver sometimes failed. Oncall from multiple team needed to be involved to debug. 

# Action | Solution

Now there's a problem, let's hire some good engineers to deal with it!

```yaml
sequenceDiagram
Portal->>Campaign Service: mutation
Campaign Service->>Rulebook Service: validate
Rulebook Service->>Campaign Service: ok!
Campaign Service->>Campaign Service: persist
Campaign Service->>Dispatcher: message
Dispatcher->>Campaign Service: ok!
Campaign Service->>Portal: ok!
Dispatcher->>AdServer: mutation
```

![breakdown](/imgs/2024-11-19-18-54-50.png)

Naturally, as we adopt the microservice spirit, we want to break service down into smaller logical units. As shown in the above diagram, we divided the problem into 3 major responsibilities. 
1. Rulebook Service: Validate the mutation request
2. Campaign Service: Persist the mutation request
3. Dispatcher: Send the mutation request to the adserver

Teams can now tackle the problem independently and have the own charters and goals. Team can also independently evaluate the tech stacks and choose the best stack for their needs.

### Rulebook Service
Define a contract and interface for ad program administrator to define the rules to apply to their respective ad programs and experiments. DynamoDB, Redis.

### Campaign Service
Persisting the mutation request and provide devops toolings for the team and partners. Collecting data for data science team. This has dependency on Rulebook Service, and features a in-mem rulebook cache as well. 

### Dispatcher
Sending the mutation request to the adserver. AWS Kinesis, SQS.

### Scaling

#### Scaling up
Scaling up is straightforward. However, we can only do so up until a point, it gets marginally too expensive or if we hit bandwidth constraint.

#### Scaling out
Naturally, advertisers' data are independent from each other, and there are no interactions between them. We can shard the data on advertiser ID, add more machines to each component on the path. This statement is over-simplified! Reach me if you want to know more.

## Result
The team to maintain this 'small' piece is around 20 engineers. We were able to solve real and hard technical problems with designing and scaling systems. The aim was to have integrate this system into the existing ad platform. That was 2022!