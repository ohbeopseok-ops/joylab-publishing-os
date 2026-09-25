---
title: "800G에서 1.6T로｜AI 데이터센터 네트워크는 왜 두 배 빨라져야 하나"
description: "AI 데이터센터 네트워크가 800G에서 1.6T로 이동하는 이유를 200G/lane, 포트 대역폭, 전력/bit, 광모듈과 CPO 전환 관점에서 설명합니다."
cardTitle: "800G에서 1.6T로"
cardDescription: "AI 데이터센터 네트워크가 1.6T로 넘어가는 이유를 대역폭·전력·광학 구조로 봅니다."
category: "AI·생산성"
tags:
  - 1.6T
  - 800G
  - AI데이터센터
  - 광통신
  - 네트워크인프라
publishedAt: 2026-09-25
updatedAt: 2026-09-25
author: "JoyLab"
featured: true
draft: false
seoTitle: "800G에서 1.6T로｜AI 데이터센터 네트워크가 빨라지는 이유"
series: "AI 데이터센터 네트워크"
seriesOrder: 1
heroImage: "/images/research/ai-data-center-network/ai-network-800g-1-6t-hero.svg"
heroAlt: "800G에서 1.6T로 전환되는 AI 데이터센터 광네트워크와 200G PAM4 링크 구조를 보여주는 JoyLab 대표 이미지"
ogImage: "/images/research/ai-data-center-network/ai-network-800g-1-6t-hero.svg"
readingTime: "약 10분"
---

AI 데이터센터 네트워크는 400G에서 800G를 거쳐 **1.6T(1.6Tb/s)**로 이동하고 있습니다.

핵심은 단순히 링크 속도가 두 배가 된다는 데 있지 않습니다. GPU와 가속기 수가 늘어날수록 스위치와 서버 사이에서 이동해야 하는 데이터가 커지고, 동시에 **포트 밀도·전력/bit·신호 손실·광학 부품의 열과 비용**을 함께 해결해야 하기 때문입니다.

NVIDIA는 현재 1.6T/800G OSFP 세대에서 200G PAM4를 사용하고 있으며, 1.6T 링크를 8개의 200G 고속 채널로 구성하는 제품을 공개하고 있습니다. https://www.nvidia.com/en-us/networking/interconnect/ https://networking-docs.nvidia.com/mca4k00hw

## 30초 핵심 답변

**800G → 1.6T 전환의 본질은 GPU가 많아질수록 필요한 네트워크 대역폭을 늘리면서도 전력과 포트 수를 감당하기 위한 것입니다.**

1.6T는 대표적으로 **8×200G PAM4** 구조를 사용합니다. Marvell Ara T는 8개의 200Gb/s 호스트 전기 인터페이스와 8개의 200Gb/s 광 인터페이스로 1.6Tb/s를 구현합니다. https://www.marvell.com/content/dam/marvell/en/public-collateral/dsp/marvell-ara-t-1-6t-transmit-retimed-pam4-product-brief.pdf

즉 다음 변화가 동시에 일어납니다.

**800G 링크 → 1.6T 링크**  
**100G/lane 세대 → 200G/lane 세대**  
**대역폭 확대 → 전력/bit와 신호 무결성 문제 확대**  
**Pluggable Optics → CPO·Silicon Photonics 검토 확대**

## 왜 AI 데이터센터는 800G만으로 부족해질까

AI 학습과 추론은 한 GPU가 혼자 처리하는 작업이 아닙니다.

대규모 AI 클러스터에서는 GPU·가속기·스토리지·스위치 사이에서 계속 데이터를 교환합니다. GPU 수가 늘어날수록 개별 GPU 성능뿐 아니라 **GPU가 기다리지 않도록 네트워크가 데이터를 공급하는 능력**이 중요해집니다.

NVIDIA는 AI Factory 네트워크를 NVLink 기반 Scale-up, InfiniBand 또는 Spectrum-X Ethernet 기반 Scale-out, 여러 데이터센터를 잇는 Scale-across로 구분합니다. https://perspectives.nvidia.com/networking/

이 구조에서 1.6T는 주로 스위치·NIC·광트랜시버 사이의 더 높은 포트 대역폭을 제공하는 방향입니다.

중요한 점은 **1.6T가 모든 케이블과 모든 연결을 즉시 대체한다는 뜻이 아니라는 것**입니다. 거리와 비용, 전력 예산에 따라 구리·플러거블 광모듈·CPO·Coherent 계열이 서로 다른 구간을 담당합니다.

## 1.6T는 어떻게 두 배의 대역폭을 만들까

대표적인 1.6T 링크는 **200Gb/s 채널 8개**를 묶어 1.6Tb/s를 만듭니다.

NVIDIA의 1.6T Active Copper Cable도 8개의 200G-PAM4 채널로 1,600Gb/s를 구성합니다. https://networking-docs.nvidia.com/mca4k00hw

Marvell Ara T 역시 8×200G PAM4 구조를 사용하며 기존 OSFP/QSFP-DD 계열 폼팩터에서 1.6T를 지원하도록 설계됐습니다. https://www.marvell.com/content/dam/marvell/en/public-collateral/dsp/marvell-ara-t-1-6t-transmit-retimed-pam4-product-brief.pdf

속도를 올리는 방법을 단순화하면 다음과 같습니다.

| 구분 | 800G 세대 | 1.6T 세대 |
|---|---|---|
| 대표 총 대역폭 | 800Gb/s | 1.6Tb/s |
| 대표 lane 구조 | 8×100G 등 | 8×200G |
| 대표 변조 | PAM4 | PAM4 |
| 핵심 과제 | 800G 대역폭 확보 | 200G/lane 신호 무결성·전력·열 |
| 다음 이슈 | 더 높은 port density | CPO·Silicon Photonics·400G/lane |

Broadcom은 2026년 OFC에서 400G/lane optical DSP를 공개하며 이 기술이 저전력 1.6T 트랜시버뿐 아니라 향후 3.2T 광트랜시버 경로까지 연결된다고 설명했습니다. https://investors.broadcom.com/news-releases/news-release-details/broadcom-showcases-industry-leading-solutions-scaling-ai

## 속도보다 전력/bit가 더 중요한 이유는 무엇일까

네트워크 속도가 두 배가 된다고 전력과 열을 무한히 늘릴 수는 없습니다.

AI 데이터센터는 이미 GPU 자체가 막대한 전력과 냉각을 요구합니다. 여기에 네트워크 포트와 광모듈 전력까지 급격히 증가하면 전체 시스템 효율이 떨어집니다.

그래서 네트워크 업체는 단순 Tb/s보다 **Power per Bit**, 즉 1비트를 이동시키는 데 필요한 에너지를 중요하게 봅니다.

NVIDIA는 CPO가 광학 엔진을 스위치 ASIC 옆에 통합해 전기 SerDes 구간의 손실을 줄이고, 전통적인 플러거블 방식보다 높은 대역폭 밀도와 전력 효율을 목표로 한다고 설명합니다. https://www.nvidia.com/en-us/networking/interconnect/

Spectrum-X Ethernet Photonics는 최대 409.6Tb/s 스위치 대역폭을 제공하며 1.6Tb/s 포트당 전력 효율 개선을 주요 가치로 제시합니다. https://developer.nvidia.com/blog/?p=110971

따라서 JoyLab에서는 네트워크 세대 전환을 다음 순서로 봅니다.

> **Bandwidth → Lane Speed → Port Density → Power/bit → Reach → Thermal → Serviceability**

## 800G 다음에는 왜 CPO와 Silicon Photonics가 등장할까

데이터율이 높아질수록 전기 신호는 짧은 거리에서도 손실 관리가 어려워집니다.

그래서 플러거블 광모듈을 계속 고속화하는 방식과 함께 **광학 엔진을 스위치 ASIC 가까이 가져오는 CPO(Co-Packaged Optics)**가 중요한 대안으로 부상합니다.

NVIDIA는 CPO 기반 1.6T 인터커넥트와 200G PAM4를 AI Factory 네트워크 포트폴리오에 포함하고 있습니다. https://www.nvidia.com/en-us/networking/interconnect/

또한 Silicon Photonics 기반 Spectrum-X는 광학을 스위치 패키지에 더 가깝게 통합해 전력과 대역폭 밀도를 개선하는 방향입니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

이 흐름을 단순화하면 다음과 같습니다.

**800G Pluggable → 1.6T Pluggable → CPO → Silicon Photonics → 더 높은 lane speed**

다만 CPO가 모든 플러거블 모듈을 즉시 대체한다고 보는 것은 과도합니다. 유지보수성, 생산 수율, 광원 구조, 비용, 거리별 요구조건 때문에 여러 방식이 상당 기간 공존할 가능성이 높습니다.

## JoyLab Network Layer에서 어디에 위치하나

이 글은 AI Infrastructure의 **Data Center Network** 구간을 다룹니다.

전체 구조는 다음과 같습니다.

**GPU / Accelerator**  
→ **Scale-up Fabric**  
→ **Scale-out Ethernet / InfiniBand**  
→ **800G / 1.6T Optics**  
→ **CPO / Silicon Photonics**  
→ **Campus DCI**  
→ **Metro / Region**  
→ **Global Backbone**  
→ **Submarine Cable**

전체 Network Layer는 [AI 데이터센터 네트워크 Guide](/guides/ai-data-center-network)에서 연결해서 볼 수 있습니다.

AI 인프라 전체 병목 구조는 [AI Infrastructure Research Hub](/guides/ai-infrastructure)에서 확인할 수 있습니다.

관련 리서치:
- [GPU Compute Economics｜GPU가 많아질수록 네트워크가 병목이 되는 이유](/articles/gpu-compute-economics-rubin-2026)
- [AI Data Center Capacity Stack｜서버를 사도 바로 돌릴 수 없는 이유](/articles/ai-data-center-capacity-stack-2026)
- [AI 시대 글로벌 네트워크와 해저 광케이블](/articles/submarine-cables-ai-infrastructure)

## FAQ

### 1.6T는 800G보다 정확히 두 배 빠른가요?
총 링크 대역폭 기준으로 1.6Tb/s는 800Gb/s의 두 배입니다. 다만 실제 애플리케이션 성능은 네트워크 구조, 혼잡, GPU 통신 패턴, 프로토콜과 소프트웨어 영향을 함께 받습니다.

### 1.6T 광모듈은 몇 개의 lane을 사용하나요?
대표적인 구조는 8개의 200Gb/s PAM4 lane을 묶어 1.6Tb/s를 구현합니다. 제품과 인터페이스 구조에 따라 세부 구성은 달라질 수 있습니다.

### 1.6T가 나오면 800G는 바로 사라지나요?
아닙니다. 서버 세대, 거리, 비용, 스위치와 NIC 지원 여부에 따라 400G·800G·1.6T가 일정 기간 함께 사용될 수 있습니다.

### CPO는 1.6T 광모듈과 같은 기술인가요?
같지 않습니다. 1.6T는 링크 대역폭을 나타내고, CPO는 광학 엔진을 스위치 ASIC 가까이에 배치하는 아키텍처입니다. 1.6T 이상의 연결에서 CPO가 사용될 수 있습니다.

### 1.6T 다음은 무엇인가요?
업계는 400G/lane과 3.2T 광연결 방향을 개발하고 있습니다. Broadcom과 Marvell은 2026년 400G/lane 또는 3.2T로 이어지는 기술 경로를 공개했습니다. https://investors.broadcom.com/news-releases/news-release-details/broadcom-showcases-industry-leading-solutions-scaling-ai https://www.marvell.com/company/newsroom/marvell-industry-first-2nm-optical-technology-ai-data-center-infrastructure-ecoc-2026.html

## Sources

- NVIDIA LinkX Interconnect: https://www.nvidia.com/en-us/networking/interconnect/
- NVIDIA Silicon Photonics: https://www.nvidia.com/en-us/networking/products/silicon-photonics/
- NVIDIA 1.6T OSFP/AEC specification: https://networking-docs.nvidia.com/mca4k00hw
- Broadcom OFC 2026: https://investors.broadcom.com/news-releases/news-release-details/broadcom-showcases-industry-leading-solutions-scaling-ai
- Marvell Ara T 1.6T: https://www.marvell.com/content/dam/marvell/en/public-collateral/dsp/marvell-ara-t-1-6t-transmit-retimed-pam4-product-brief.pdf
- Marvell 1.6T Optical DSP: https://www.marvell.com/company/newsroom/marvell-1-6t-optical-dsp-ai-data-center-connectivity.html
