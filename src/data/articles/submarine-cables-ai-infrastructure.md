---
title: "AI 시대에 해저 광케이블이 더 중요해지는 이유｜GPU·데이터센터·클라우드를 잇는 숨은 인프라"
description: "GPU와 데이터센터만으로 설명되지 않는 AI 인프라의 글로벌 네트워크 층을 해저 광케이블, 클라우드 리전, 국제 백본 관점에서 분석합니다."
cardTitle: "AI 시대, 왜 해저 광케이블이 더 중요해질까"
cardDescription: "GPU·데이터센터·클라우드 리전을 잇는 Global Network Layer를 봅니다."
category: "AI·생산성"
tags:
  - AI인프라
  - 해저광케이블
  - AI데이터센터
  - 클라우드
  - 글로벌네트워크
publishedAt: 2026-09-25
updatedAt: 2026-09-25
author: "JoyLab"
featured: true
draft: false
seoTitle: "AI 시대 해저 광케이블이 중요한 이유｜GPU·데이터센터·클라우드 연결"
series: "글로벌 인터넷 인프라"
seriesOrder: 4
heroImage: "/images/research/joylab-research-default-hero.svg"
heroAlt: "AI 데이터센터와 클라우드 리전, 해저 광케이블의 글로벌 연결 구조를 설명하는 JoyLab Research 대표 이미지"
ogImage: "/images/research/joylab-research-default-hero.svg"
readingTime: "약 9분"
---

AI 경쟁은 GPU만의 경쟁이 아닙니다.

GPU와 HBM, 전력과 냉각을 확보해도 계산 결과와 데이터를 다른 클라우드 리전과 사용자에게 안정적으로 전달할 수 없다면 글로벌 AI 서비스는 완성되지 않습니다.

대륙 간 장거리 구간에서 이 역할을 맡는 핵심 물리 인프라가 해저 광케이블입니다.

## 30초 핵심 요약

AI 인프라는 다음처럼 볼 수 있습니다.

**전력 → GPU·HBM → 데이터센터 → 데이터센터 네트워크 → 육상 광통신 → 해저 광케이블 → 글로벌 사용자**

여기서 해저 케이블은 GPU 내부 통신을 대신하지 않습니다.

역할은 **국가·대륙·클라우드 리전 사이의 장거리 연결**입니다.

## AI 시대에는 왜 네트워크가 더 중요해질까

AI 서비스는 계산만 하는 시스템이 아닙니다.

데이터를 불러오고 처리하고 결과를 다른 시스템과 사용자에게 전달해야 합니다.

특히 사용자가 있는 지역과 실제 AI 연산이 수행되는 데이터센터가 다른 국가나 대륙에 있을 수 있습니다.

이때 국제 백본망과 해저 광케이블이 글로벌 서비스의 연결성을 결정합니다.

## GPU와 해저 케이블은 어떻게 연결되나

GPU가 해저 케이블에 직접 연결되는 것은 아닙니다.

데이터센터 내부에서는 NVLink, InfiniBand, Ethernet 같은 네트워크가 GPU와 GPU, 랙과 랙을 연결합니다.

데이터센터 밖에서는 육상 광통신망과 국제 백본, 해저 광케이블이 클라우드 리전과 대륙을 연결합니다.

따라서 Network는 두 층으로 보는 것이 좋습니다.

**Inside Data Center: GPU ↔ GPU**

**Outside Data Center: Data Center ↔ Region ↔ Continent ↔ User**

[AI Data Center Capacity Stack](/articles/ai-data-center-capacity-stack-2026)에서는 내부 Capacity를, 이 글에서는 외부 Global Network를 다룹니다.

## 빅테크는 왜 해저 케이블에 투자할까

대형 클라우드와 플랫폼 기업은 자체 데이터센터와 리전을 세계 여러 지역에서 운영합니다.

필요한 국제 용량과 경로를 직접 확보하면 다음 이점이 있습니다.

- 대규모 데이터 전송 용량 확보
- 경로 최적화
- 클라우드 리전 연결
- 장애 시 우회 경로 확보
- 장기적인 네트워크 비용 통제

Google을 비롯한 하이퍼스케일 사업자는 여러 해저 케이블 프로젝트에 직접 참여하거나 대규모 용량을 확보하고 있습니다.

## AI 인프라를 GPU만 보면 안 되는 이유

JoyLab은 AI 인프라를 다음처럼 확장해서 봅니다.

**Compute → Memory → Components → Data Center → Power → Cooling → Network → Global Connectivity**

GPU가 많아질수록 HBM이 필요하고, 서버가 늘수록 전력과 냉각이 필요합니다.

그리고 데이터센터가 여러 지역으로 확장될수록 데이터센터 사이와 사용자까지 연결하는 글로벌 네트워크가 중요해집니다.

관련 구조는 [AI Infrastructure Research Hub](/guides/ai-infrastructure)에서 한 번에 볼 수 있습니다.

## Network가 다음 병목이 될 수 있는 조건

네트워크가 언제나 가장 큰 병목이라는 뜻은 아닙니다.

다음 조건이 겹칠수록 중요도가 커집니다.

- 대규모 AI 서비스의 글로벌 사용자 확대
- 여러 클라우드 리전 간 데이터 이동 증가
- 해저 케이블 경로의 집중
- 특정 육양국 의존
- 신규 데이터센터와 국제 대역폭 증설 속도의 불일치

따라서 투자·산업 분석에서는 'AI 데이터가 증가한다'는 문장보다 실제 국제 대역폭 수요, 신규 케이블 투자, 리전 연결성과 경로 다양성을 확인해야 합니다.

## 이전·다음 글

장애와 복원력은 [해저 케이블이 끊기면 인터넷은 멈출까](/articles/submarine-cable-failure-repair)에서 확인할 수 있습니다.

다음 편은 [위성 인터넷 vs 해저 광케이블](/articles/satellite-vs-submarine-cable)입니다.

전체 구조는 [인터넷은 어떻게 세계를 연결하는가](/guides/how-internet-connects-the-world)에서 볼 수 있습니다.

## FAQ

### GPU가 해저 케이블에 직접 연결되나요?
아닙니다. GPU는 데이터센터 내부망에 연결되고, 해저 케이블은 데이터센터와 클라우드 리전, 국가와 대륙 사이의 장거리 연결을 담당합니다.

### 모든 AI 데이터가 해저 케이블을 지나가나요?
아닙니다. 데이터와 연산이 같은 지역에 있으면 국제망을 이용하지 않을 수 있습니다.

### AI 시대에 해저 케이블 수요가 늘어날 수 있는 이유는 무엇인가요?
글로벌 클라우드와 AI 서비스가 확대되면서 리전 간·대륙 간 데이터 이동이 증가하기 때문입니다.

## Sources

- ITU, Global Connectivity Report 2025: https://www.itu.int/itu-d/reports/statistics/global-connectivity-report-2025/
- Google Cloud, Global Network Infrastructure: https://cloud.google.com/network-connectivity/docs/network-connectivity-center/concepts/google-network
- Google Cloud, Sol transatlantic cable: https://cloud.google.com/blog/products/infrastructure/announcing-sol-transatlantic-cable
