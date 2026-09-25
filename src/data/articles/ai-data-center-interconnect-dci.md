---
title: "AI 데이터센터 DCI란 무엇인가｜랙에서 캠퍼스·리전까지 광네트워크가 이어지는 방법"
description: "AI 데이터센터의 DCI(Data Center Interconnect)가 무엇인지, Rack·Data Center·Campus·Metro·Region·Global Backbone으로 이어지는 광네트워크 구조를 설명합니다."
cardTitle: "AI 데이터센터 DCI란 무엇인가"
cardDescription: "랙 안의 AI Fabric이 캠퍼스·리전·글로벌 백본으로 확장되는 구조를 거리와 광기술 기준으로 봅니다."
category: "AI·생산성"
tags:
  - DCI
  - DataCenterInterconnect
  - CoherentLite
  - AI데이터센터
  - 광통신
publishedAt: 2026-09-25
updatedAt: 2026-09-25
author: "JoyLab"
featured: true
draft: false
seoTitle: "AI 데이터센터 DCI란 무엇인가｜Rack·Campus·Region 광네트워크 구조"
series: "AI 데이터센터 네트워크"
seriesOrder: 5
heroImage: "/images/research/ai-data-center-network/ai-data-center-interconnect-dci-hero.svg"
heroAlt: "AI 데이터센터의 Rack에서 Campus, Metro DCI, Region, Global Backbone까지 광네트워크가 이어지는 구조를 보여주는 JoyLab 대표 이미지"
ogImage: "/images/research/ai-data-center-network/ai-data-center-interconnect-dci-hero.svg"
readingTime: "약 11분"
---

AI 데이터센터의 네트워크는 랙 안에서 끝나지 않습니다.

GPU와 스위치를 연결한 뒤에도 **같은 건물, 같은 캠퍼스, 다른 데이터센터, 다른 리전, 다른 대륙**으로 연결해야 합니다.

이때 등장하는 개념이 DCI(Data Center Interconnect)입니다.

DCI는 단순히 데이터센터 두 곳을 잇는 전용선이 아니라, AI 인프라가 **한 건물의 컴퓨팅 자원에서 여러 사이트에 분산된 하나의 AI Factory**로 확장되기 위한 네트워크 계층입니다.

NVIDIA는 AI 네트워킹을 scale-up, scale-out, scale-across로 구분하며, Spectrum-XGS Ethernet을 geographically separated data centers를 하나의 AI factory로 묶는 scale-across 기술로 설명합니다. https://developer.nvidia.com/blog/how-to-connect-distributed-data-centers-into-large-ai-factories-with-scale-across-networking/ https://www.nvidia.com/en-us/networking/

## 30초 핵심 답변

DCI는 데이터센터와 데이터센터를 연결하는 광네트워크입니다.

거리 기준으로 보면 다음처럼 이해할 수 있습니다.

**Rack**  
→ **Data Center**  
→ **Campus 2~20km**  
→ **Metro / DCI**  
→ **Region**  
→ **Global Backbone**  
→ **Submarine Cable**

Marvell은 coherent-lite를 **2km~20km campus 연결**을 위한 기술로 설명하며, 기존 PAM4 데이터센터 링크와 장거리 coherent DCI 사이의 간극을 메우는 역할로 정의합니다. https://www.marvell.com/products/coherent-lite-dsp.html

즉 핵심은 거리마다 같은 광기술을 쓰는 것이 아니라는 점입니다.

## Rack 안에서는 어떤 네트워크를 쓰나

랙 내부는 가장 짧은 거리이지만 가장 낮은 지연과 높은 대역폭이 요구됩니다.

NVIDIA의 데이터센터 구조에서는 NVLink가 rack-scale scale-up 네트워크를 담당하고, 여러 GPU 랙 사이에서는 Cluster Interconnect Network가 scale-out 통신을 담당합니다. https://docs.nvidia.com/dsx/ncp/software-reference-guide/data-center-architecture

이 구간에서는 다음 기술이 중심입니다.

- NVLink / NVSwitch
- InfiniBand
- Spectrum-X Ethernet
- DAC / AEC
- short-reach optical links

Rack 안에서는 거리보다 **latency와 bandwidth density**가 더 중요합니다.

## Data Center 안에서는 800G·1.6T가 왜 중요한가

랙과 랙, 스위치와 스위치 사이의 거리가 늘어나면 구리만으로 처리하기 어려운 구간이 늘어납니다.

이때 800G와 1.6T pluggable optics가 사용됩니다.

대표적인 1.6T 구조는 8×200G PAM4이며, 링크 속도가 높아질수록 전력/bit와 신호무결성 문제가 커집니다. https://www.marvell.com/content/dam/marvell/en/public-collateral/dsp/marvell-ara-t-1-6t-transmit-retimed-pam4-product-brief.pdf

이 구간의 핵심은 다음입니다.

> **Port Bandwidth → Lane Speed → Power/bit → Reach**

관련 구조는 [800G에서 1.6T로｜AI 데이터센터 네트워크는 왜 두 배 빨라져야 하나](/articles/ai-network-800g-1-6t)에서 설명합니다.

## Campus 2~20km에서는 왜 coherent-lite가 등장하나

데이터센터가 한 건물에서 여러 건물로 확장되면 2~20km 정도의 campus 연결이 필요해질 수 있습니다.

Marvell은 Aquila coherent-lite를 **2km~20km** AI cloud data center campus 연결용으로 설명합니다. 이 기술은 intra-data-center PAM4와 장거리 coherent DCI 사이의 간극을 메우는 역할입니다. https://www.marvell.com/products/coherent-lite-dsp.html

coherent-lite가 중요한 이유는 다음과 같습니다.

- PAM4보다 더 긴 거리 지원
- 전통적인 장거리 coherent보다 낮은 전력·비용 목표
- 800G/1.6T campus 연결 지원
- 다수 건물로 분산된 AI 데이터센터를 연결

즉 campus 구간의 핵심은 **short-reach optics의 경제성과 coherent의 reach 사이에서 균형을 잡는 것**입니다.

## Metro와 Region DCI는 무엇이 달라지나

거리가 더 길어지면 coherent DSP의 역할이 커집니다.

DCI는 같은 도시의 여러 데이터센터를 연결하는 metro 구간부터 수십·수백 km 떨어진 리전을 연결하는 구간까지 포함할 수 있습니다.

장거리가 될수록 다음 조건이 중요해집니다.

- 광신호 도달거리
- dispersion 보정
- signal integrity
- wavelength 효율
- 경로 이중화
- latency와 jitter

NVIDIA는 multi-data-center AI 환경에서 거리가 길어질수록 latency, jitter, congestion이 AI workload 성능에 직접 영향을 준다고 설명합니다. Spectrum-XGS Ethernet은 distance-aware congestion control과 adaptive routing을 통해 분산된 데이터센터를 scale-across로 연결합니다. https://developer.nvidia.com/blog/how-to-connect-distributed-data-centers-into-large-ai-factories-with-scale-across-networking/

2025년 NVIDIA 테스트에서는 10km 거리에서 Spectrum-XGS가 off-the-shelf Ethernet 대비 NCCL all-reduce bandwidth를 최대 1.9배 높였다고 발표했습니다. https://developer.nvidia.com/blog/how-to-connect-distributed-data-centers-into-large-ai-factories-with-scale-across-networking/

이 수치는 NVIDIA 자사 테스트 결과이므로 업계 일반 성능으로 확대해 해석하기보다, **AI traffic이 일반 Ethernet과 다른 latency/jitter 요구를 가진다는 사례**로 보는 편이 안전합니다.

## DCI는 왜 AI 시대에 더 중요해지나

AI 데이터센터는 전력과 부지 제약 때문에 한 건물 안에서 무한히 커질 수 없습니다.

NVIDIA도 개별 데이터센터가 전력과 물리적 capacity 한계에 도달하면서 여러 데이터센터를 하나의 AI super-factory처럼 연결하는 scale-across 구조가 필요하다고 설명합니다. https://nvidianews.nvidia.com/news/nvidia-introduces-spectrum-xgs-ethernet-to-connect-distributed-data-centers-into-giga-scale-ai-super-factories

즉 AI 인프라가 커질수록 병목이 이동합니다.

**GPU 부족**  
→ **HBM 부족**  
→ **전력·냉각 부족**  
→ **Rack Network 부족**  
→ **Campus / DCI 부족**

JoyLab에서는 DCI를 AI Network Layer의 마지막 데이터센터 내부·근거리 단계이자 Global Connectivity로 넘어가는 Bridge로 봅니다.

## DCI와 해저 광케이블은 어떻게 연결되나

DCI는 글로벌 인터넷 백본과 별개의 개념이지만 실제 네트워크에서는 이어집니다.

한 국가 안에서 여러 데이터센터를 DCI로 연결한 뒤, 국제 트래픽은 통신사업자 백본·IX·육양국을 거쳐 해저 광케이블로 이어질 수 있습니다.

전체 구조는 다음과 같습니다.

**Rack**  
→ **Data Center Fabric**  
→ **Campus DCI**  
→ **Metro / Regional DCI**  
→ **National Backbone**  
→ **International Backbone**  
→ **Cable Landing Station**  
→ **Submarine Cable**

이 다음 단계는 [인터넷은 어떻게 세계를 연결하는가](/guides/how-internet-connects-the-world)에서 이어집니다.

AI 글로벌 연결 관점은 [AI 시대에 해저 광케이블이 더 중요해지는 이유](/articles/submarine-cables-ai-infrastructure)에서 확인할 수 있습니다.

## 거리별 기술을 한 번에 정리하면

| 거리 / 영역 | 대표 연결 기술 | 핵심 기준 |
|---|---|---|
| Rack | NVLink·DAC·AEC | 최소 지연·최대 대역폭 |
| Data Center | 800G·1.6T PAM4 | 포트 밀도·전력/bit |
| Campus 2~20km | Coherent-lite | Reach·전력·비용 균형 |
| Metro / DCI | Coherent DSP | 거리·신호무결성 |
| Region / Backbone | Coherent Transport | 대용량·복원력 |
| International | Submarine Fiber | 대륙 간 초대용량 |

Marvell은 coherent-lite를 2~20km campus에, coherent DSP를 더 긴 DCI와 transport 구간에 배치하는 포트폴리오를 운영합니다. https://www.marvell.com/solutions/data-center/optical-dsp.html https://www.marvell.com/products/coherent-lite-dsp.html

## AI Data Center Network 5부작 완성

이번 글로 Network Layer 5부작이 완성됩니다.

1. [800G에서 1.6T로](/articles/ai-network-800g-1-6t)
2. [CPO란 무엇인가](/articles/what-is-co-packaged-optics)
3. [Silicon Photonics란 무엇인가](/articles/silicon-photonics-ai-network)
4. [Optical DSP·LPO·LRO 차이](/articles/optical-dsp-lpo-lro-1-6t)
5. **AI 데이터센터 DCI란 무엇인가**

전체 구조는 [AI 데이터센터 네트워크 Guide](/guides/ai-data-center-network)에서 한 번에 볼 수 있습니다.

## FAQ

### DCI는 무엇의 약자인가요?
Data Center Interconnect의 약자이며 데이터센터와 데이터센터를 연결하는 네트워크를 뜻합니다.

### Campus DCI는 몇 km 정도인가요?
고정된 정의는 아니지만 Marvell의 coherent-lite 제품은 2~20km campus 연결을 주요 대상으로 제시합니다. https://www.marvell.com/products/coherent-lite-dsp.html

### DCI와 일반 인터넷 연결은 같은가요?
같지 않습니다. DCI는 데이터센터 간 연결을 뜻하며, 일반 인터넷 백본과 통신사업자망은 더 넓은 네트워크 계층입니다.

### DCI와 해저 광케이블은 어떻게 연결되나요?
DCI가 지역·리전 데이터센터를 연결한 뒤 국제 트래픽은 백본·육양국을 거쳐 해저 광케이블로 이어질 수 있습니다.

### AI에서 DCI가 중요한 이유는 무엇인가요?
전력·부지·용량 한계로 AI 컴퓨팅 자원이 여러 데이터센터에 분산될수록 이들을 하나의 시스템처럼 연결할 수 있는 네트워크가 중요해지기 때문입니다.

## Sources

- NVIDIA Networking for AI: https://www.nvidia.com/en-us/networking/
- NVIDIA Scale-Across Networking: https://developer.nvidia.com/blog/how-to-connect-distributed-data-centers-into-large-ai-factories-with-scale-across-networking/
- NVIDIA Spectrum-XGS announcement: https://nvidianews.nvidia.com/news/nvidia-introduces-spectrum-xgs-ethernet-to-connect-distributed-data-centers-into-giga-scale-ai-super-factories
- NVIDIA Data Center Architecture: https://docs.nvidia.com/dsx/ncp/software-reference-guide/data-center-architecture
- Marvell Coherent-lite DSP: https://www.marvell.com/products/coherent-lite-dsp.html
- Marvell Optical DSP Portfolio: https://www.marvell.com/solutions/data-center/optical-dsp.html
