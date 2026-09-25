---
title: "Optical DSP·LPO·LRO는 무엇이 다른가｜1.6T 광모듈의 전력 전쟁"
description: "1.6T AI 데이터센터 광모듈에서 DSP 기반 pluggable, LPO, LRO/TRO가 어떻게 다른지 전력·신호무결성·지연·도달거리·서비스성 기준으로 비교합니다."
cardTitle: "Optical DSP·LPO·LRO 차이"
cardDescription: "1.6T 광모듈의 전력·신호처리 구조를 DSP, LPO, LRO/TRO 기준으로 비교합니다."
category: "AI·생산성"
tags:
  - OpticalDSP
  - LPO
  - LRO
  - 1.6T
  - 광통신
publishedAt: 2026-09-25
updatedAt: 2026-09-25
author: "JoyLab"
featured: true
draft: false
seoTitle: "Optical DSP·LPO·LRO 차이｜1.6T 광모듈의 전력 전쟁"
series: "AI 데이터센터 네트워크"
seriesOrder: 4
heroImage: "/images/research/ai-data-center-network/optical-dsp-lpo-lro-1-6t-hero.svg"
heroAlt: "1.6T AI 데이터센터 광모듈에서 DSP 기반 플러거블과 LPO, LRO/TRO의 신호처리 구조를 비교한 JoyLab 대표 이미지"
ogImage: "/images/research/ai-data-center-network/optical-dsp-lpo-lro-1-6t-hero.svg"
readingTime: "약 11분"
---

1.6T 광모듈 경쟁은 단순히 **더 빠른 광모듈을 만드는 경쟁**이 아닙니다.

핵심은 고속 신호를 어디서 보정하고, 어디서 retiming하며, 어느 구간까지 DSP를 남길 것인가입니다.

그래서 같은 1.6T라도 구조가 달라집니다.

**Full DSP Pluggable → LPO → LRO/TRO → CPO**

Marvell은 AI 데이터센터 광연결에서 PAM4 DSP, coherent-lite, LPO, TRO 등 서로 다른 아키텍처를 거리와 전력, 신뢰성 요구에 맞춰 구분하고 있습니다. https://www.marvell.com/solutions/data-center/optical-dsp.html https://www.marvell.com/company/newsroom/marvell-1-6t-optical-dsp-ai-data-center-connectivity.html

## 30초 핵심 답변

세 구조의 차이는 **신호 보정을 어디까지 광모듈 안에서 수행하느냐**입니다.

| 구조 | 모듈 내부 고속 DSP | 핵심 장점 | 핵심 부담 |
|---|---:|---|---|
| DSP 기반 Pluggable | 있음 | 신호무결성·호환성·거리 | 전력·열 |
| LPO | 거의 없음 | 낮은 전력·낮은 지연 | 시스템 공동설계·채널 품질 |
| LRO/TRO | 일부 retiming 유지 | 전력과 신뢰성의 절충 | 구조 복잡성·용도 최적화 |

Broadcom은 현재 플러거블 광모듈의 고전력 DSP가 ASIC에서 모듈까지의 전기 경로 손실을 보상하는 역할을 한다고 설명합니다. LPO와 LRO는 이 DSP 부담을 줄이려는 접근입니다. https://www.broadcom.com/info/optics/cpo

JoyLab 관점에서 비교 기준은 다음입니다.

> **Power → Signal Integrity → Latency → Reach → Interoperability → Serviceability**

## Optical DSP는 왜 들어가나

고속 전기 신호와 광신호는 케이블과 PCB, 커넥터, 레이저, 수신기 등을 지나며 왜곡과 잡음이 생깁니다.

Optical DSP는 이 신호를 보정하고 retime해 링크 신뢰성을 높입니다.

Marvell은 optical DSP가 전기 데이터를 광신호로 변환하는 과정에서 왜곡을 보정하고, 데이터 무결성을 유지하는 핵심 부품이라고 설명합니다. https://www.marvell.com/solutions/data-center/optical-dsp.html

특히 400G·800G·1.6T로 갈수록 lane 속도가 높아지면서 신호 보정의 중요성도 커집니다.

이 방식의 장점은 다음과 같습니다.

- 비교적 높은 신호 안정성
- 다양한 채널 조건 대응
- 시스템 간 상호운용성 확보 용이
- 더 긴 reach 대응 가능

대신 DSP 자체의 전력과 열이 커집니다.

## LPO는 무엇을 없애는가

LPO는 **Linear Pluggable Optics**입니다.

핵심은 광모듈 내부의 고속 DSP를 제거하거나 크게 줄이고, host ASIC의 SerDes와 선형 광부품을 직접 연결하는 것입니다.

Marvell은 1.6T LPO용 200G/lane TIA와 laser driver chipset을 제공하며, LPO가 저전력·저지연의 short-reach scale-up compute fabric을 목표로 한다고 설명합니다. https://www.marvell.com/company/newsroom/marvell-introduces-1-6-tbps-lpo-chipset.html

LPO의 장점은 명확합니다.

- 모듈 전력 감소
- DSP latency 감소
- 구조 단순화
- 800G·1.6T short-reach에서 높은 효율

하지만 DSP를 없애면 채널 자체의 품질과 시스템 공동설계 의존도가 커집니다.

Marvell은 LPO가 compute와 switch IC, PCB, connector, fiber, module 전체를 함께 최적화해야 하는 구조라고 설명합니다. https://www.marvell.com/blogs/the-evolution-of-ai-interconnects.html

즉 LPO는 'DSP를 빼면 끝'이 아니라 **시스템 전체를 더 정밀하게 설계해야 하는 방식**입니다.

## LRO와 TRO는 무엇이 다른가

LRO는 일반적으로 **Linear Retimed Optics** 계열을 뜻합니다.

Broadcom은 LRO와 LPO가 플러거블 모듈 내부 DSP 부담을 줄이려는 방식이지만, 전기 인터커넥트 손실의 영향을 계속 받는다고 설명합니다. https://www.broadcom.com/info/optics/cpo

2026년 Marvell은 이 절충 구조를 더 구체화한 **TRO(Transmit-Retimed Optics)**를 발표했습니다. https://www.marvell.com/blogs/ara-t-improving-ai-roi-with-dsps.html

Ara T는 송신 경로에 retiming DSP를 남기고, 수신 경로의 전체 DSP 부담을 줄이는 1.6T 구조입니다. Marvell은 Ara T를 5m~500m 링크용으로 설명하며 기존 full DSP 구조 대비 모듈 전력을 35% 이상 줄일 수 있다고 밝히고 있습니다. https://www.marvell.com/blogs/ara-t-improving-ai-roi-with-dsps.html

따라서 단순화하면 다음과 같습니다.

**Full DSP**  
→ 송신·수신 모두 적극적 신호 보정

**LPO**  
→ 고속 DSP를 크게 제거

**LRO/TRO**  
→ 일부 retiming만 남겨 전력과 신뢰성 절충

중요한 점은 LRO와 TRO가 업계에서 항상 완전히 동일한 용어로 쓰이는 것은 아니라는 것입니다. 제품별로 어느 방향에 retiming을 적용하는지 구조를 직접 확인해야 합니다.

## 왜 1.6T에서 전력 전쟁이 더 심해지나

1.6T는 대표적으로 200G/lane 기반입니다.

lane 속도가 올라갈수록 PCB와 connector, SerDes, optical engine의 손실 관리가 더 어려워집니다.

Broadcom은 400G/lane optical DSP를 1.6T와 향후 3.2T transceiver로 이어지는 기술 경로로 제시하면서 전력과 bandwidth density를 핵심 과제로 강조하고 있습니다. https://www.broadcom.com/company/news/product-releases/64036

Marvell도 1.6T optical DSP 포트폴리오를 용도별로 분화하고 있습니다.

- Ara: full PAM4 DSP
- Ara T: TRO
- LPO chipset: short-reach linear optics
- Aquila: coherent-lite
- Electra/COLORZ: ZR/ZR+ coherent DCI

https://www.marvell.com/company/newsroom/marvell-1-6t-optical-dsp-ai-data-center-connectivity.html

즉 '어떤 기술이 최고인가'보다 **어떤 거리와 링크 조건에서 어떤 아키텍처가 효율적인가**가 핵심입니다.

## 거리별로 보면 더 쉽게 이해된다

AI 데이터센터 광링크는 거리별로 다른 해법이 필요합니다.

Marvell은 대략 다음처럼 제품군을 구분합니다. https://www.marvell.com/solutions/data-center/optical-dsp.html

**수 m~수백 m**  
→ PAM4 DSP / LPO / TRO

**2~20km campus**  
→ coherent-lite

**수십~1,000km+ DCI·backbone**  
→ coherent DSP

따라서 하나의 광기술이 모든 거리를 대체하는 구조가 아닙니다.

JoyLab에서는 이렇게 봅니다.

> **Short Reach = Power/Latency 최적화**  
> **Campus = Reach/Power 균형**  
> **DCI = Reach/Signal Integrity 우선**

## LPO가 CPO보다 먼저 사라질 기술인가

그렇게 단정하기 어렵습니다.

LPO는 플러거블 폼팩터를 유지하면서 전력을 낮추는 장점이 있습니다.

CPO는 광학 엔진을 ASIC 가까이에 붙여 전기 경로를 더 줄일 수 있지만, 패키징·냉각·serviceability가 더 복잡해질 수 있습니다.

Broadcom은 LPO와 LRO가 interconnect loss의 영향을 계속 받는 반면, CPO는 optics를 ASIC 옆에 배치해 path loss와 전력을 더 낮추는 방향이라고 설명합니다. https://www.broadcom.com/info/optics/cpo

따라서 실제 전환은 다음처럼 병행될 가능성이 높습니다.

**Pluggable DSP**  
↘  
**LPO / LRO / TRO**  
↘  
**CPO**

이들은 일직선으로 한 번에 교체되기보다 거리·비용·서비스성에 따라 공존할 수 있습니다.

## AI Data Center Network에서 어디에 위치하나

전체 구조는 다음과 같습니다.

**GPU / Accelerator**  
→ **Scale-up Fabric**  
→ **800G / 1.6T**  
→ **DSP / LPO / LRO-TRO**  
→ **CPO / Silicon Photonics**  
→ **Campus / DCI**  
→ **Global Backbone**

전체 흐름은 [AI 데이터센터 네트워크 Guide](/guides/ai-data-center-network)에서 볼 수 있습니다.

앞 단계는 [800G에서 1.6T로｜AI 데이터센터 네트워크는 왜 두 배 빨라져야 하나](/articles/ai-network-800g-1-6t)입니다.

광학 패키징 구조는 [CPO란 무엇인가｜플러거블 광모듈 대신 스위치 옆에 광학을 붙이는 이유](/articles/what-is-co-packaged-optics)에서 이어집니다.

광학 구현 기술은 [Silicon Photonics란 무엇인가｜AI 네트워크에서 빛을 칩으로 가져오는 기술](/articles/silicon-photonics-ai-network)에서 확인할 수 있습니다.

다음 단계는 [AI 데이터센터 DCI란 무엇인가｜랙에서 캠퍼스·리전까지 광네트워크가 이어지는 방법](/articles/ai-data-center-interconnect-dci)입니다.

## FAQ

### Optical DSP는 왜 필요한가요?
고속 신호의 왜곡과 잡음을 보정하고 retiming해 링크 신뢰성을 높이기 위해 필요합니다.

### LPO는 왜 전력을 줄일 수 있나요?
플러거블 광모듈 내부의 고속 DSP를 제거하거나 크게 줄이기 때문에 모듈 전력과 지연을 낮출 수 있습니다.

### LRO와 TRO는 같은 기술인가요?
완전히 같은 용어로 쓰인다고 보기는 어렵습니다. 둘 다 일부 retiming을 남기는 절충 구조지만, 제품에 따라 송신 또는 수신 경로의 처리 방식이 달라질 수 있습니다.

### LPO가 항상 DSP 기반 광모듈보다 좋은가요?
아닙니다. LPO는 낮은 전력과 지연이 장점이지만 시스템 공동설계와 채널 품질 요구가 더 높을 수 있습니다.

### 어떤 구조가 DCI에 적합한가요?
수 km 이상의 campus와 장거리 DCI에서는 coherent-lite 또는 coherent DSP가 더 적합한 경우가 많습니다. Marvell은 coherent-lite를 2~20km campus 연결에, coherent를 더 긴 DCI 구간에 사용한다고 설명합니다. https://www.marvell.com/products/coherent-lite-dsp.html

## Sources

- Marvell Optical DSP overview: https://www.marvell.com/solutions/data-center/optical-dsp.html
- Marvell 1.6T Optical DSP portfolio: https://www.marvell.com/company/newsroom/marvell-1-6t-optical-dsp-ai-data-center-connectivity.html
- Marvell Ara T TRO: https://www.marvell.com/blogs/ara-t-improving-ai-roi-with-dsps.html
- Marvell 1.6T LPO chipset: https://www.marvell.com/company/newsroom/marvell-introduces-1-6-tbps-lpo-chipset.html
- Broadcom CPO/LPO/LRO architecture: https://www.broadcom.com/info/optics/cpo
- Broadcom OFC 2026: https://www.broadcom.com/company/news/product-releases/64036
