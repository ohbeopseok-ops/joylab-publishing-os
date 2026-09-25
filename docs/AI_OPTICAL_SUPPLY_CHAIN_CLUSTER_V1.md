# AI Optical Networking Supply Chain Cluster V1

기준일: 2026-09-25  
상태: Research Spec / Not Yet Published  
목표: 기존 `AI 데이터센터 네트워크` 기술 클러스터를 기업·매출 연결고리·검증 지표 중심의 투자 리서치 클러스터로 확장한다.

## 1. Core Question

AI 데이터센터 네트워크가 800G → 1.6T → CPO → Silicon Photonics → DCI로 확장될 때,
어떤 기업이 어느 레이어에서 실제 제품·매출·CAPEX 노출을 갖는가?

핵심 원칙은 “관련주”가 아니라 다음 5단계를 연결하는 것이다.

**Technology Layer → Product → Customer Use Case → Revenue Exposure → Verify/Kill KPI**

## 2. Value Chain Map

| Layer | Core Technology | Anchor Companies | Exposure Proof | What To Verify |
|---|---|---|---|---|
| AI Fabric / Switch | Spectrum-X, Ethernet Switch ASIC, NIC | NVIDIA, Broadcom | NVIDIA LinkX/CPO + Spectrum-X, Broadcom Tomahawk 6 / Jericho / Thor | AI network revenue, switch ramp, port speed mix |
| CPO / Optical Engine | Co-Packaged Optics, Silicon Photonics | Broadcom, NVIDIA, Marvell | Broadcom 102.4T CPO, NVIDIA CPO switches, Marvell 102.4T CPO platform | CPO production ramp, yield, power/bit, customer deployment |
| Optical DSP / SerDes | PAM4 DSP, 200G/400G lane, LPO/TRO | Broadcom, Marvell | Broadcom Taurus 400G/lane DSP, Marvell Ara/Ara T/LPO | 1.6T attach rate, 400G/lane adoption, DSP mix |
| Campus / DCI | Coherent-Lite, ZR/ZR+, Scale-Across | Marvell, Ciena, NVIDIA | Marvell 1.6T ZR/ZR+, Ciena 1.6T coherent, NVIDIA Scale-Across | DCI demand, coherent port growth, metro/campus mix |
| Optical Transport | Coherent transport, line systems, photonic layer | Ciena | 6500 RLS, 1600ZR+, hyper/multi-rail photonics | orders, backlog, service-provider/hyperscaler mix |
| Optical Components | Laser, EML, PD, TIA, optical engine | Broadcom, Marvell; expansion candidates to validate separately | Broadcom EML/PD, Marvell TIA/laser driver + silicon photonics | component attach, supply constraints, margin capture |

## 3. Company Lens

### NVIDIA
**Role:** AI networking platform / switch / NIC / CPO system integrator  
**Value-chain position:** GPU cluster → Spectrum-X / InfiniBand → LinkX → CPO / silicon photonics → scale-across

Evidence:
- NVIDIA LinkX integrates optical transceivers, cables and CPO with Spectrum-X and Quantum networking.
- Current CPO architecture uses 200G PAM4 and targets 1.6T+ interconnects.

Primary source:
- https://www.nvidia.com/en-us/networking/interconnect/

Verify:
- Spectrum-X deployment growth
- CPO switch production ramp
- networking revenue mix versus GPU compute
- multi-site scale-across adoption

First rejection risk:
- optical networking value capture may remain smaller than compute value capture even if the technology is strategically important.

### Broadcom
**Role:** switch silicon + CPO + optical DSP + SerDes + optical components  
**Value-chain position:** one of the broadest silicon exposure stacks across AI Ethernet networking.

Evidence:
- 102.4T Tomahawk 6 production portfolio
- Tomahawk 6 Davisson CPO
- Taurus 400G/lane optical DSP
- 200G/lane retimers/AEC
- EML/PD/VCSEL and CPO technologies

Primary source:
- https://www.broadcom.com/company/news/product-releases/64036

Verify:
- Tomahawk 6 volume ramp
- CPO adoption versus pluggable optics
- 400G/lane DSP sampling → production conversion
- custom XPU and networking revenue contribution

First rejection risk:
- AI networking growth can be obscured by the much larger custom accelerator and software mix; exposure attribution must be quantified.

### Marvell
**Role:** PAM4/coherent DSP + LPO/TRO + silicon photonics + coherent-lite + ZR/ZR+  
**Value-chain position:** broad optical semiconductor exposure from intra-DC to DCI.

Evidence:
- Ara 1.6T PAM4 DSP
- Ara T transmit-retimed optics
- LPO chipset
- Aquila coherent-lite 2–20 km
- COLORZ 1600 + 2nm coherent DSP
- 102.4T CPO platform demonstrations

Primary sources:
- https://www.marvell.com/company/newsroom/marvell-1-6t-optical-dsp-ai-data-center-connectivity.html
- https://www.marvell.com/company/newsroom/marvell-1-6t-zr-zr-plus-pluggable-2nm-coherent-dsp-ai-interconnects.html
- https://www.marvell.com/products/coherent-lite-dsp.html

Verify:
- optical DSP revenue growth
- 1.6T adoption timing
- coherent-lite customer qualification
- custom silicon versus optical mix
- 2nm product commercialization

First rejection risk:
- technology breadth does not automatically translate into near-term revenue concentration; product-to-revenue attribution is required.

### Ciena
**Role:** coherent optical transport / DCI / photonic line systems / scale-across transport  
**Value-chain position:** data center outside-the-box transport layer, from metro DCI to regional/global optical networks.

Evidence:
- 1.6T coherent optics
- 1600ZR/ZR+
- 6500 Reconfigurable Line System
- hyper/multi-rail photonics
- CPO/NPO exposure via Vesta 200 6.4T CPX optical engine

Primary sources:
- https://www.ciena.com/about/newsroom/press-releases/ciena-brings-ai-networking-expertise-to-ofc-2026
- https://www.ciena.com/about/newsroom/press-releases/ciena-highlights-high-performance-ai-networking-at-ecoc-2026
- https://www.ciena.com/insights/blog/2026/delivering-on-the-promise-of-cpo-npo-at-hyperscale-with-vesta-200-6-4t-cpx-light-engine

Verify:
- hyperscaler DCI orders
- 1.6T coherent attach
- backlog and revenue conversion
- photonic line-system mix
- Nubis/Vesta contribution

First rejection risk:
- AI traffic growth may benefit transport demand without translating immediately into proportional earnings growth because carrier/hyperscaler spending cycles remain lumpy.

## 4. Planned Content Cluster

### Pillar
`/guides/ai-optical-network-supply-chain`

Working title:
**AI 광통신 공급망｜GPU부터 CPO·Silicon Photonics·1.6T DCI까지 누가 어디서 돈을 버나**

### Article 1
`/articles/ai-optical-network-value-chain`

**AI 광통신 Value Chain｜Switch·DSP·CPO·Silicon Photonics·DCI 한눈에 보기**

Purpose:
- 전체 공급망 지도
- 기술 → 제품 → 기업 → KPI 매핑
- 기존 Network Layer 5부작과 연결

### Article 2
`/articles/broadcom-vs-marvell-ai-optics`

**Broadcom vs Marvell｜AI 광통신에서 누가 무엇을 파는가**

Purpose:
- Switch ASIC / CPO / DSP / LPO / coherent 비교
- 겹치는 영역과 다른 수익 경로 분리

### Article 3
`/articles/nvidia-ai-optical-networking`

**NVIDIA AI 네트워크｜Spectrum-X·LinkX·CPO가 GPU 매출 밖에서 만드는 구조**

Purpose:
- GPU → Network attach
- CPO / silicon photonics의 전략적 의미
- networking monetization 검증 지표

### Article 4
`/articles/ciena-ai-dci-coherent`

**Ciena와 AI DCI｜1.6T Coherent·1600ZR+가 데이터센터 밖에서 만드는 수익**

Purpose:
- Campus → Metro → Regional scale-across
- coherent transport value capture

### Article 5
`/articles/ai-optical-components-ecosystem`

**AI 광부품 생태계｜Laser·EML·PD·TIA·Optical Engine에서 병목은 어디인가**

Purpose:
- 부품 레벨 공급망
- 향후 Coherent/Lumentum/Fabrinet 등 추가 후보는 공식 자료로 노출도를 검증한 뒤 포함
- “AI 관련주”식 확장을 막고 exposure proof가 있는 기업만 등록

## 5. Internal Link Contract

New pillar must link to:
- /guides/ai-data-center-network
- /guides/ai-infrastructure
- /guides/how-internet-connects-the-world

Each company/value-chain article must link to:
- /guides/ai-optical-network-supply-chain
- at least 2 sibling articles once cluster article count >= 3
- at least 1 underlying technology article in the AI Data Center Network cluster

Technology → Company bridge examples:
- /articles/what-is-co-packaged-optics → Broadcom/NVIDIA/Marvell company articles
- /articles/silicon-photonics-ai-network → NVIDIA/Broadcom/Marvell
- /articles/optical-dsp-lpo-lro-1-6t → Broadcom/Marvell
- /articles/ai-data-center-interconnect-dci → Marvell/Ciena/NVIDIA

## 6. Investment Evidence Contract

No company is labeled a beneficiary from product announcements alone.

Minimum proof for “exposure confirmed”:
1. official product or company disclosure,
2. identifiable customer/use-case or shipment/ramp evidence,
3. revenue/backlog/order/KPI connection OR explicit flag `needs exposure attribution`.

Every company article must contain:
- Exposure Proof
- Revenue Bridge
- KPI To Watch
- First Rejection
- What Would Prove It
- What Would Kill It
- Valuation/Expectations section added only after current market data is sourced

## 7. Publication Gate

P0 before publishing:
- primary-source links for every quantitative claim
- title/meta/OG/FAQ/Breadcrumb schema
- Value Chain diagram
- internal links to technology cluster
- no unsourced “관련주/수혜주” language
- no final buy/sell verdict in cluster overview
- mobile + responsive GOLD QA
- Research Evidence Audit
- Search Growth Gate

## 8. Current Source Anchors — 2026-09-25

- NVIDIA LinkX / CPO: https://www.nvidia.com/en-us/networking/interconnect/
- Broadcom OFC 2026 AI optical stack: https://www.broadcom.com/company/news/product-releases/64036
- Marvell 1.6T optical DSP: https://www.marvell.com/company/newsroom/marvell-1-6t-optical-dsp-ai-data-center-connectivity.html
- Marvell 1.6T ZR/ZR+: https://www.marvell.com/company/newsroom/marvell-1-6t-zr-zr-plus-pluggable-2nm-coherent-dsp-ai-interconnects.html
- Marvell Coherent-Lite: https://www.marvell.com/products/coherent-lite-dsp.html
- Ciena OFC 2026: https://www.ciena.com/about/newsroom/press-releases/ciena-brings-ai-networking-expertise-to-ofc-2026
- Ciena ECOC 2026: https://www.ciena.com/about/newsroom/press-releases/ciena-highlights-high-performance-ai-networking-at-ecoc-2026

## 9. Next Build Order

1. Value Chain Pillar skeleton
2. Article 1 — full map
3. Broadcom vs Marvell
4. NVIDIA optical networking
5. Ciena DCI/coherent
6. optical components ecosystem
7. Internal Link CI extension
8. GOLD QA
