---
title: "CPO란 무엇인가｜플러거블 광모듈 대신 스위치 옆에 광학을 붙이는 이유"
description: "CPO(Co-Packaged Optics)가 무엇인지, 왜 AI 데이터센터에서 플러거블 광모듈 대신 스위치 ASIC 가까이에 광학 엔진을 배치하는지 전력·대역폭 밀도·지연·서비스성 관점에서 설명합니다."
cardTitle: "CPO란 무엇인가"
cardDescription: "광학 엔진을 스위치 ASIC 옆으로 가져오는 이유를 전력·대역폭 밀도·서비스성 관점에서 봅니다."
category: "AI·생산성"
tags:
  - CPO
  - CoPackagedOptics
  - 실리콘포토닉스
  - AI데이터센터
  - 광통신
publishedAt: 2026-09-25
updatedAt: 2026-09-25
author: "JoyLab"
featured: true
draft: false
seoTitle: "CPO란 무엇인가｜AI 데이터센터가 플러거블 광모듈을 바꾸는 이유"
series: "AI 데이터센터 네트워크"
seriesOrder: 2
heroImage: "/images/research/ai-data-center-network/what-is-co-packaged-optics-hero.svg"
heroAlt: "AI 데이터센터 스위치 ASIC 옆에 광학 엔진을 통합한 CPO 구조와 플러거블 광모듈 차이를 보여주는 JoyLab 대표 이미지"
ogImage: "/images/research/ai-data-center-network/what-is-co-packaged-optics-hero.svg"
readingTime: "약 10분"
---

CPO(Co-Packaged Optics)는 **광학 엔진을 스위치 ASIC 가까이에 함께 패키징하는 네트워크 아키텍처**입니다.

기존 플러거블 광모듈은 스위치 전면 포트에 꽂히고, ASIC에서 모듈까지 전기 SerDes 신호가 보드 위를 이동합니다. CPO는 이 전기 구간을 크게 줄이고 광학을 ASIC 옆으로 가져와 **전력 소모·신호 손실·대역폭 밀도 한계**를 줄이는 방향입니다. NVIDIA는 CPO가 optical engine을 switch ASIC 바로 옆에 통합해 electrical SerDes loss를 없애고, 기존 optics보다 낮은 전력·지연·높은 bandwidth density를 제공한다고 설명합니다. https://www.nvidia.com/en-us/networking/interconnect/

## 30초 핵심 답변

**CPO의 핵심은 더 빠른 광모듈 하나가 아니라, 광학의 위치를 바꾸는 것입니다.**

기존 구조:

**Switch ASIC → PCB 전기 신호 → Pluggable Optical Module → Fiber**

CPO 구조:

**Switch ASIC ↔ Co-Packaged Optical Engine → Fiber**

NVIDIA는 silicon photonics 기반 CPO 스위치에서 플러거블 트랜시버를 ASIC과 같은 패키지의 실리콘 포토닉스로 대체한다고 설명합니다. 또한 자사 CPO 아키텍처가 200G SerDes 기술을 기반으로 Quantum-X와 Spectrum-X 플랫폼에 적용된다고 밝히고 있습니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

즉 CPO는 **Bandwidth Density × Power Efficiency × Reach** 문제를 동시에 해결하려는 구조입니다.

## 왜 플러거블 광모듈이 한계에 부딪히나

플러거블 광모듈은 오랫동안 데이터센터 광연결의 표준 구조였습니다.

장점은 명확합니다.

- 모듈 교체가 쉽습니다.
- 여러 공급업체 제품을 사용할 수 있습니다.
- 포트 단위 유지보수가 쉽습니다.
- 네트워크 설계가 유연합니다.

하지만 링크 속도가 800G에서 1.6T로 올라가고 SerDes lane 속도가 100G/lane에서 200G/lane으로 올라가면 ASIC에서 전면 광모듈까지 이어지는 전기 경로의 손실과 전력 부담이 커집니다. NVIDIA의 최신 interconnect 사양은 CPO와 1.6T/800G OSFP 세대가 모두 200G PAM4를 사용한다고 제시합니다. https://www.nvidia.com/en-us/networking/interconnect/

이때 단순히 광모듈만 더 빠르게 만드는 방식보다 **전기 구간 자체를 줄이는 구조**가 중요해집니다.

## CPO는 무엇을 개선하려고 하나

NVIDIA는 CPO의 핵심 이점을 다음처럼 제시합니다.

- 전력 효율 개선
- 네트워크 복원력 향상
- DSP retimer 감소에 따른 지연시간 축소
- 더 높은 bandwidth density
- 플러거블 광모듈 BOM 단순화
- 설치·서비스성 개선

NVIDIA는 자사 CPO 솔루션이 플러거블 트랜시버 대비 최대 5배 높은 전력 효율을 제공한다고 설명합니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

다만 이 수치는 NVIDIA 자사 구현과 비교 기준에 따른 제품 주장으로 보는 것이 안전합니다. CPO 자체가 모든 환경에서 자동으로 동일한 효율 개선을 보장한다는 뜻은 아닙니다.

JoyLab 관점에서 더 중요한 질문은 다음입니다.

> **한 포트가 얼마나 빠른가보다, 스위치 전체가 얼마나 많은 대역폭을 얼마나 적은 전력으로 안정적으로 처리할 수 있는가**

## CPO와 Silicon Photonics는 같은 기술인가

같지 않습니다.

**CPO는 아키텍처**이고, **Silicon Photonics는 광학 구현 기술**입니다.

CPO는 optical engine을 ASIC 가까이에 배치하는 구조를 뜻합니다.

Silicon Photonics는 실리콘 기반 공정과 광소자를 결합해 waveguide, modulator, detector 등 광기능을 칩 수준에서 구현하는 기술입니다.

NVIDIA의 현재 CPO 스위치는 integrated silicon photonics를 사용합니다. Spectrum-X Ethernet Photonics는 CPO를 ASIC에 직접 통합해 최대 409.6Tb/s 스위치 대역폭을 제시하고 있으며, 2026년 하반기 공급을 명시하고 있습니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

따라서 관계를 단순화하면 다음과 같습니다.

**CPO = 광학을 어디에 둘 것인가**  
**Silicon Photonics = 그 광학을 어떻게 구현할 것인가**

## 그렇다면 플러거블 광모듈은 사라질까

당장 그렇다고 보기 어렵습니다.

CPO는 높은 대역폭 밀도와 전력 효율 측면에서 강점이 있지만 실제 배포에서는 유지보수성과 제조 복잡성, 수율, 광원 배치, 냉각, 공급망이 함께 중요합니다.

플러거블 모듈은 장애가 발생했을 때 포트 단위로 쉽게 교체할 수 있다는 장점이 큽니다.

반대로 CPO는 광학 엔진이 스위치 패키지와 훨씬 가까워지기 때문에 **서비스성과 교체 방식 자체를 새로 설계해야 합니다.**

NVIDIA는 자사 CPO 설계가 부품 수를 줄이고 설치·교체를 단순화한다고 설명하지만, 업계 전체 관점에서는 서비스성·현장 교체성·수율이 여전히 핵심 평가 항목입니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

그래서 향후 데이터센터에서는 거리와 비용, 전력 예산에 따라 여러 방식이 공존할 가능성이 높습니다.

**Copper / AEC → Pluggable Optics → CPO → Coherent DCI**

## 102.4T·409.6T 시대에 CPO가 중요해지는 이유

스위치 전체 용량이 커질수록 포트 수와 광학 엔진의 전력도 빠르게 증가합니다.

Marvell은 2026년 ECOC에서 **102.4T CPO 플랫폼**을 전시한다고 발표했고, 동시에 2nm 기반 400G/lane optical PAM4와 1.6T ZR, coherent-lite 기술을 공개했습니다. https://www.marvell.com/company/newsroom/marvell-industry-first-2nm-optical-technology-ai-data-center-infrastructure-ecoc-2026.html

NVIDIA Spectrum-X Ethernet Photonics는 최대 **409.6Tb/s** 스위치 대역폭을 제시합니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

이 단계에서는 네트워크를 단순히 '포트 속도'로 보면 안 됩니다.

JoyLab은 다음 순서로 봅니다.

> **Switch Capacity → Lane Speed → Optical Engine Density → Power/bit → Cooling → Serviceability**

CPO는 이 가운데 **Optical Engine Density와 Power/bit**를 동시에 바꾸는 기술입니다.

## AI Data Center Network에서 어디에 위치하나

CPO는 다음 구조의 가운데에 위치합니다.

**GPU / Accelerator**  
→ **Scale-up Fabric**  
→ **Scale-out Ethernet / InfiniBand**  
→ **800G / 1.6T Pluggable Optics**  
→ **CPO**  
→ **Silicon Photonics**  
→ **Campus / DCI**  
→ **Global Backbone**

이 흐름은 [AI 데이터센터 네트워크 Guide](/guides/ai-data-center-network)에서 전체 구조로 볼 수 있습니다.

바로 앞 단계인 링크 속도 전환은 [800G에서 1.6T로｜AI 데이터센터 네트워크는 왜 두 배 빨라져야 하나](/articles/ai-network-800g-1-6t)에서 확인할 수 있습니다.

구현 기술은 [Silicon Photonics란 무엇인가｜AI 네트워크에서 빛을 칩으로 가져오는 기술](/articles/silicon-photonics-ai-network)에서 이어집니다.

거리 축의 다음 단계는 [AI 데이터센터 DCI란 무엇인가｜랙에서 캠퍼스·리전까지 광네트워크가 이어지는 방법](/articles/ai-data-center-interconnect-dci)에서 연결됩니다.

데이터센터 밖의 장거리 글로벌 연결은 [AI 시대 글로벌 네트워크와 해저 광케이블](/articles/submarine-cables-ai-infrastructure)에서 이어집니다.

## FAQ

### CPO는 무엇의 약자인가요?
Co-Packaged Optics의 약자입니다. 광학 엔진을 스위치 ASIC 가까이에 함께 패키징하는 구조를 뜻합니다.

### CPO와 1.6T는 같은 개념인가요?
아닙니다. 1.6T는 링크 대역폭이고 CPO는 광학 엔진의 배치 구조입니다. 1.6T 이상의 네트워크에서도 CPO를 사용할 수 있습니다.

### CPO와 Silicon Photonics는 같은 기술인가요?
아닙니다. CPO는 패키징·아키텍처 개념이고 Silicon Photonics는 광신호를 실리콘 기반 칩에서 구현하는 기술입니다.

### CPO가 플러거블 광모듈을 완전히 대체하나요?
현재는 완전 대체보다 공존 가능성이 높습니다. 거리, 비용, 전력, 서비스성과 교체성에 따라 여러 방식이 사용될 수 있습니다.

### CPO 다음 핵심 기술은 무엇인가요?
Silicon Photonics, 400G/lane, LPO·LRO, coherent-lite, DCI 등이 다음 연결 기술로 이어집니다.

## Sources

- NVIDIA LinkX / CPO: https://www.nvidia.com/en-us/networking/interconnect/
- NVIDIA Silicon Photonics: https://www.nvidia.com/en-us/networking/products/silicon-photonics/
- Marvell ECOC 2026 Optical Technology: https://www.marvell.com/company/newsroom/marvell-industry-first-2nm-optical-technology-ai-data-center-infrastructure-ecoc-2026.html
