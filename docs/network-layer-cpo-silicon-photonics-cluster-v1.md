# JoyLab Network Layer Cluster V1

기준일: 2026-09-25

## 목적

기존 AI Infrastructure의 Network Layer를 두 층으로 확장한다.

1. **Inside Data Center** — GPU·Switch·Rack·Cluster를 연결하는 AI Fabric
2. **Outside Data Center** — Campus·DCI·Backbone·Submarine Cable로 이어지는 Global Connectivity

현재 Global Connectivity Cluster가 두 번째 축의 바깥쪽을 담당한다면,
다음 Cluster는 **AI Data Center 내부와 Campus 구간에서 전기 신호가 광신호로 넘어가는 병목**을 다룬다.

## Core Thesis

AI 네트워크의 다음 병목은 단순히 "더 빠른 Ethernet"이 아니다.

> Bandwidth Density → Power per Bit → Reach → Thermal → Serviceability

GPU 수와 스위치 용량이 커질수록 전기 SerDes가 감당해야 하는 거리와 전력 손실이 커지고,
광학 엔진을 스위치 ASIC 가까이 가져오는 CPO와 Silicon Photonics의 경제성이 중요해진다.

## 5-Part Cluster

### 1. 800G에서 1.6T로｜AI 데이터센터 네트워크는 왜 두 배 빨라져야 하나
권장 slug: `ai-network-800g-1-6t`

검색 의도:
- 800G 1.6T 차이
- AI 데이터센터 1.6T Ethernet
- AI 광모듈 속도

핵심:
- 400G → 800G → 1.6T 전환
- 100G/lane → 200G/lane → 400G/lane 로드맵
- Frontend / Backend / Scale-up 네트워크 구분
- 속도보다 power per bit와 port density가 중요한 이유

### 2. CPO란 무엇인가｜플러거블 광모듈 대신 스위치 옆에 광학을 붙이는 이유
권장 slug: `what-is-co-packaged-optics`

검색 의도:
- CPO 뜻
- Co-Packaged Optics란
- AI CPO 수혜 구조

핵심:
- Pluggable optics vs CPO
- Electrical SerDes reach / loss 문제
- ASIC 가까이에 optical engine 배치
- 전력·대역폭 밀도·지연·신뢰성 trade-off
- Serviceability가 실제 도입의 핵심 변수

### 3. Silicon Photonics란 무엇인가｜AI 네트워크에서 빛을 칩으로 가져오는 기술
권장 slug: `silicon-photonics-ai-network`

검색 의도:
- 실리콘 포토닉스
- Silicon Photonics AI
- 광반도체 원리

핵심:
- 전기 → 광 변환
- Modulator / Laser / Photodetector / Waveguide
- Silicon process와 광소자의 결합
- CPO와 Silicon Photonics의 관계
- 광엔진·패키징·광섬유 결합이 새로운 제조 병목이 되는 이유

### 4. Optical DSP·LPO·LRO는 무엇이 다른가｜1.6T 광모듈의 전력 전쟁
권장 slug: `optical-dsp-lpo-lro-1-6t`

검색 의도:
- Optical DSP
- LPO LRO 차이
- 1.6T 광모듈 전력

핵심:
- DSP-based pluggable
- LPO / LRO / TRO 접근
- Power vs signal integrity vs reach
- 5m~500m, campus, DCI 등 거리별 architecture
- 하나의 기술이 모든 reach를 대체하지 않는다는 점

### 5. AI 데이터센터 DCI란 무엇인가｜랙에서 캠퍼스·리전까지 광네트워크가 이어지는 방법
권장 slug: `ai-data-center-interconnect-dci`

검색 의도:
- DCI란
- Data Center Interconnect
- AI 데이터센터 광통신

핵심:
- Intra-rack → Inter-rack → Campus → Metro/DCI → Global Backbone
- PAM4 / coherent-lite / coherent
- 1.6T ZR과 3.2T 방향
- 이 Cluster와 Global Connectivity Pillar를 연결하는 Bridge Article

## Pillar 후보

### AI 데이터센터 네트워크는 어떻게 확장되는가
권장 URL:
`/guides/ai-data-center-network`

권장 구조:

```
GPU / Accelerator
      ↓
Scale-up Fabric
      ↓
Scale-out Ethernet / InfiniBand
      ↓
800G / 1.6T Pluggable Optics
      ↓
CPO / Silicon Photonics
      ↓
Campus DCI
      ↓
Metro / Region
      ↓
Global Backbone
      ↓
Submarine Cable
```

## Existing JoyLab Bridge

### Inbound
- /guides/ai-infrastructure
- /articles/gpu-compute-economics-rubin-2026
- /articles/ai-data-center-capacity-stack-2026
- /articles/submarine-cables-ai-infrastructure

### Outbound
- /guides/how-internet-connects-the-world
- /articles/how-submarine-cables-work
- /articles/submarine-cables-ai-infrastructure

## Publishing Order

1. 800G → 1.6T
2. CPO
3. Silicon Photonics
4. Optical DSP / LPO / LRO
5. DCI
6. Pillar: AI Data Center Network

Pillar는 3편 이상 공개된 뒤 발행한다.

## Internal Link Contract

각 Article은:
- /guides/ai-infrastructure 또는 /guides/ai-data-center-network 중 최소 1개 Hub 링크
- 동일 Cluster 형제 Article 최소 2개
- Global Connectivity로 이어지는 Article은 /guides/how-internet-connects-the-world 링크
- DCI Article은 반드시 Submarine Cable Pillar와 양방향 연결

## 2026 Technical Anchors

- NVIDIA LinkX: CPO와 1.6T/800G OSFP를 AI networking interconnect portfolio에 포함.
- NVIDIA Silicon Photonics: Spectrum-X Ethernet Photonics는 최대 409.6 Tb/s switch bandwidth를 제시하고 2026년 하반기 availability를 명시.
- Broadcom OFC 2026: 102.4T Ethernet switch with CPO, 400G/lane optical DSP, 1.6T transceiver enablement을 공개.
- Marvell 2026: 1.6T silicon photonics light engine, 1.6T PAM4 DSP 및 1.6T ZR/coherent-lite에서 3.2T 방향을 제시.

## Sources

- NVIDIA Optical Interconnect: https://www.nvidia.com/en-us/networking/interconnect/
- NVIDIA Silicon Photonics: https://www.nvidia.com/en-us/networking/products/silicon-photonics/
- NVIDIA Spectrum-X: https://www.nvidia.com/en-us/networking/spectrumx/
- Broadcom CPO: https://www.broadcom.com/topics/what-is-co-packaged-optics
- Broadcom OFC 2026: https://investors.broadcom.com/news-releases/news-release-details/broadcom-showcases-industry-leading-solutions-scaling-ai
- Marvell Optical DSP: https://www.marvell.com/solutions/data-center/optical-dsp.html
- Marvell ECOC 2026: https://www.marvell.com/company/newsroom/marvell-industry-first-2nm-optical-technology-ai-data-center-infrastructure-ecoc-2026.html
