---
title: "Silicon Photonics란 무엇인가｜AI 네트워크에서 빛을 칩으로 가져오는 기술"
description: "Silicon Photonics가 무엇인지, AI 데이터센터 네트워크에서 왜 전기 신호를 광신호로 바꾸는 기술이 중요해지는지 CPO·200G/400G lane·광엔진 관점에서 설명합니다."
cardTitle: "Silicon Photonics란 무엇인가"
cardDescription: "광신호를 실리콘 칩 위에서 다루는 기술이 AI 네트워크의 전력·대역폭 병목을 어떻게 바꾸는지 봅니다."
category: "AI·생산성"
tags:
  - SiliconPhotonics
  - 실리콘포토닉스
  - CPO
  - AI데이터센터
  - 광통신
publishedAt: 2026-09-25
updatedAt: 2026-09-25
author: "JoyLab"
featured: true
draft: false
seoTitle: "Silicon Photonics란 무엇인가｜AI 데이터센터 광네트워크 핵심 기술"
series: "AI 데이터센터 네트워크"
seriesOrder: 3
heroImage: "/images/research/ai-data-center-network/silicon-photonics-ai-network-hero.svg"
heroAlt: "실리콘 칩 위의 광도파로와 광학 엔진이 스위치 ASIC과 광섬유를 연결하는 Silicon Photonics 구조를 보여주는 JoyLab 대표 이미지"
ogImage: "/images/research/ai-data-center-network/silicon-photonics-ai-network-hero.svg"
readingTime: "약 10분"
---

Silicon Photonics는 **실리콘 기반 칩 위에서 빛을 만들고, 변조하고, 전달하고, 검출하는 광학 기능을 구현하는 기술**입니다.

AI 데이터센터에서 이 기술이 중요해지는 이유는 간단합니다. GPU와 스위치가 빨라질수록 전기 신호를 멀리 보내는 비용과 손실이 커지고, 더 많은 데이터를 더 적은 전력으로 이동시키기 위해 **빛을 칩 가까이 가져오는 구조**가 필요해지기 때문입니다.

NVIDIA는 Spectrum-X Ethernet Photonics를 200G SerDes 기반의 co-packaged silicon photonics 구조로 설명하며 최대 409.6Tb/s 스위치 대역폭을 제시합니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

## 30초 핵심 답변

**Silicon Photonics는 전기 신호와 광신호를 칩 수준에서 연결하는 기술입니다.**

전통적인 네트워크는 ASIC에서 전기 신호를 보드 위로 보내고, 별도 광모듈에서 빛으로 바꾸는 구조가 많았습니다.

Silicon Photonics는 waveguide, modulator, photodetector 같은 광학 기능을 실리콘 기반 공정과 결합해 광학 엔진을 더 작고 집적도 높게 만들 수 있게 합니다.

NVIDIA의 현재 Spectrum-X Ethernet Photonics는 co-packaged silicon photonics를 사용하고 있으며 200G SerDes 기술을 기반으로 합니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

관계를 단순화하면 다음과 같습니다.

**CPO = 광학 엔진을 어디에 둘 것인가**  
**Silicon Photonics = 그 광학 엔진을 어떤 기술로 구현할 것인가**

## Silicon Photonics는 칩 위에서 무엇을 하나

Silicon Photonics는 전기 회로와 동일하지 않습니다.

핵심은 실리콘 기반 플랫폼에서 광신호를 처리하는 구성요소를 구현하는 것입니다.

대표 요소는 다음과 같습니다.

- **Waveguide**: 빛이 이동하는 경로
- **Modulator**: 전기 신호를 빛의 변화로 변환
- **Photodetector**: 들어온 빛을 전기 신호로 변환
- **Coupler**: 칩과 광섬유를 연결
- **Laser Interface**: 외부 또는 통합 광원과 연결

실제 제품은 레이저를 외부에 둘 수도 있고 패키지 안에 포함할 수도 있습니다. 따라서 Silicon Photonics를 곧바로 '레이저까지 모두 실리콘으로 만든다'고 이해하면 안 됩니다.

NVIDIA의 Spectrum-X Ethernet Photonics는 integrated silicon photonics와 external laser array를 함께 사용한다고 설명합니다. https://developer.nvidia.com/blog/?p=111036

## 왜 AI 네트워크에서 중요해지나

AI 클러스터가 커질수록 네트워크 스위치가 처리해야 하는 대역폭도 커집니다.

Broadcom은 2026년 OFC에서 102.4T Ethernet switch with CPO, 400G/lane optical DSP, 200G/lane Ethernet retimer를 공개하며 AI 인프라의 광학 전환을 강조했습니다. https://www.broadcom.com/company/news/product-releases/64036

Marvell도 2026년 ECOC에서 400G/lane optical PAM4와 102.4T CPO 플랫폼을 공개하면서 3.2T 데이터센터 연결로 이어지는 경로를 제시했습니다. https://www.marvell.com/company/newsroom/marvell-industry-first-2nm-optical-technology-ai-data-center-infrastructure-ecoc-2026.html

이 흐름에서 Silicon Photonics가 중요한 이유는 다음 세 가지입니다.

1. **Bandwidth Density**를 높일 수 있습니다.
2. 긴 전기 SerDes 구간을 줄여 **Power per Bit**를 낮추는 데 유리합니다.
3. CPO처럼 광학 엔진을 ASIC 가까이 배치하는 구조를 현실화하는 핵심 구현 기술이 됩니다.

즉 AI 네트워크의 문제는 '광모듈 속도가 느리다'보다 **전기 I/O가 고속·고밀도 환경에서 얼마나 오래 버틸 수 있느냐**에 가깝습니다.

## CPO와 Silicon Photonics는 어떻게 연결되나

CPO와 Silicon Photonics는 자주 함께 언급되지만 같은 개념은 아닙니다.

**CPO(Co-Packaged Optics)**는 switch ASIC 가까이에 optical engine을 배치하는 패키징·시스템 아키텍처입니다.

**Silicon Photonics**는 optical engine 내부의 광기능을 실리콘 기반으로 구현하는 기술입니다.

NVIDIA Spectrum-X Ethernet Photonics는 이 둘을 결합한 대표 사례입니다. NVIDIA는 해당 시스템이 co-packaged optics를 이용하고, integrated silicon photonics 기반으로 최대 409.6Tb/s 스위치 대역폭을 지원한다고 설명합니다. https://www.nvidia.com/en-us/networking/products/silicon-photonics/

Broadcom Tomahawk 6 Davisson도 102.4Tb/s CPO Ethernet switch로 광학 엔진을 switch ASIC 가까이에 통합하는 방향을 보여줍니다. https://investors.broadcom.com/news-releases/news-release-details/broadcom-announces-tomahawkr-6-davisson-industrys-first-1024

따라서 구조는 다음처럼 볼 수 있습니다.

**1.6T Link**  
→ **200G SerDes**  
→ **CPO Architecture**  
→ **Silicon Photonics Optical Engine**

## Silicon Photonics가 해결해야 할 실제 병목은 무엇인가

Silicon Photonics가 모든 문제를 자동으로 해결하는 것은 아닙니다.

광학 엔진이 ASIC 가까이 올수록 다음 문제들이 더 중요해집니다.

- 패키징 정밀도
- fiber attach
- 광원 안정성
- 열 관리
- 수율
- 테스트
- 서비스성과 교체성

NVIDIA는 Spectrum-X Ethernet Photonics에서 solder-reflow compatible optical engine과 pre-assembly testing을 사용해 광학 엔진을 조립 전에 검사하는 구조를 설명합니다. https://developer.nvidia.com/blog/?p=110971

Broadcom도 CPO switch에서 direct optical I/O를 고대역폭 switch ASIC에 통합하고 있으며 102.4Tb/s, 200G SerDes 기반 제품을 공개하고 있습니다. https://www.broadcom.com/products/fiber-optic-modules-components/co-packaged-optics/switches

즉 다음 세대 경쟁은 단순히 '빛을 쓴다'가 아니라 다음 조건을 동시에 만족하는가에 달려 있습니다.

> **Bandwidth Density → Power/bit → Yield → Thermal → Fiber Attach → Serviceability**

## 400G/lane과 3.2T는 왜 다음 단계인가

현재 1.6T는 대표적으로 8×200G PAM4 구성으로 구현됩니다.

그다음 세대에서는 lane 속도를 400G까지 높여 더 높은 총 대역폭을 만들려는 방향이 진행되고 있습니다.

Broadcom은 2026년 OFC에서 400G/lane optical DSP를 공개하며 1.6T뿐 아니라 향후 3.2T optical transceiver를 위한 경로라고 설명했습니다. https://www.broadcom.com/company/news/product-releases/64036

Marvell은 2026년 ECOC에서 2nm 기반 400G/lane optical PAM4 시연을 공개하고 이것이 3.2T 데이터센터 연결로 이어진다고 설명했습니다. https://www.marvell.com/company/newsroom/marvell-industry-first-2nm-optical-technology-ai-data-center-infrastructure-ecoc-2026.html

따라서 JoyLab Network Layer의 기술 흐름은 이렇게 정리할 수 있습니다.

**800G**  
→ **1.6T**  
→ **CPO**  
→ **Silicon Photonics**  
→ **400G/lane**  
→ **3.2T**

## AI Data Center Network에서 어디에 위치하나

전체 Network Layer는 다음 순서로 연결됩니다.

**GPU / Accelerator**  
→ **Scale-up Fabric**  
→ **Scale-out Ethernet / InfiniBand**  
→ **800G / 1.6T**  
→ **CPO**  
→ **Silicon Photonics**  
→ **Optical DSP / LPO / LRO**  
→ **Campus / DCI**  
→ **Global Backbone**

전체 흐름은 [AI 데이터센터 네트워크 Guide](/guides/ai-data-center-network)에서 볼 수 있습니다.

앞 단계는 [800G에서 1.6T로｜AI 데이터센터 네트워크는 왜 두 배 빨라져야 하나](/articles/ai-network-800g-1-6t)입니다.

패키징 구조는 [CPO란 무엇인가｜플러거블 광모듈 대신 스위치 옆에 광학을 붙이는 이유](/articles/what-is-co-packaged-optics)에서 이어집니다.

다음 단계인 신호처리 아키텍처 비교는 [Optical DSP·LPO·LRO는 무엇이 다른가｜1.6T 광모듈의 전력 전쟁](/articles/optical-dsp-lpo-lro-1-6t)에서 이어집니다.

데이터센터 밖의 글로벌 연결은 [AI 시대 글로벌 네트워크와 해저 광케이블](/articles/submarine-cables-ai-infrastructure)에서 이어집니다.

## FAQ

### Silicon Photonics는 무엇인가요?
실리콘 기반 칩 위에서 빛을 전달하고 변조하고 검출하는 광학 기능을 구현하는 기술입니다.

### Silicon Photonics와 CPO는 같은 기술인가요?
아닙니다. CPO는 광학 엔진의 배치 아키텍처이고, Silicon Photonics는 광학 엔진을 구현하는 핵심 기술 중 하나입니다.

### Silicon Photonics는 왜 AI 데이터센터에서 중요해지나요?
GPU와 스위치의 대역폭이 커질수록 전기 I/O의 전력과 손실이 커지기 때문에 광학을 ASIC 가까이 가져와 대역폭 밀도와 전력 효율을 개선할 필요가 있기 때문입니다.

### Silicon Photonics가 플러거블 광모듈을 모두 대체하나요?
아닙니다. 거리, 비용, 유지보수성, 수율, 광원 구조에 따라 플러거블·CPO·coherent 계열이 공존할 수 있습니다.

### 400G/lane과 3.2T는 어떤 관계인가요?
lane당 전송 속도를 400G로 높이면 더 높은 총 링크 대역폭을 구현할 수 있습니다. Broadcom과 Marvell은 400G/lane을 향후 3.2T 연결로 이어지는 기술 경로로 제시하고 있습니다. https://www.broadcom.com/company/news/product-releases/64036 https://www.marvell.com/company/newsroom/marvell-industry-first-2nm-optical-technology-ai-data-center-infrastructure-ecoc-2026.html

## Sources

- NVIDIA Silicon Photonics: https://www.nvidia.com/en-us/networking/products/silicon-photonics/
- NVIDIA Spectrum-X Ethernet Photonics Technical Blog: https://developer.nvidia.com/blog/?p=110971
- NVIDIA Vera Rubin Networking: https://developer.nvidia.com/blog/?p=111036
- Broadcom OFC 2026: https://www.broadcom.com/company/news/product-releases/64036
- Broadcom Ethernet CPO Switches: https://www.broadcom.com/products/fiber-optic-modules-components/co-packaged-optics/switches
- Marvell ECOC 2026: https://www.marvell.com/company/newsroom/marvell-industry-first-2nm-optical-technology-ai-data-center-infrastructure-ecoc-2026.html
