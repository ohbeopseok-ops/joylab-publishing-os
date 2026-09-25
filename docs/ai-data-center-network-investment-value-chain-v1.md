# AI Data Center Network Investment Value Chain V1

기준일: 2026-09-25

## 목적

JoyLab의 `AI Data Center Network` 5부작을 투자 관점의 밸류체인 지도로 확장한다.

핵심 질문은 “AI 네트워크에서 어떤 종목이 가장 좋은가”가 아니라 다음이다.

> **어느 레이어에서 병목이 생기고, 누가 그 병목을 해결하는 제품을 팔며, 어떤 숫자가 실제 매출·마진으로 연결되는가**

이 지도는 기업을 추천·순위화하지 않는다. 제품 노출도와 검증 지표를 분리해 본다.

---

## 1. 전체 투자 밸류체인

```
GPU / XPU
  ↓
Switch ASIC / Ethernet Fabric
  ↓
SerDes / Retimer / Optical DSP
  ↓
1.6T Pluggable Optics
  ↓
CPO / Silicon Photonics
  ↓
Laser / Optical Engine / Transceiver
  ↓
Fiber / Connector / Cabling
  ↓
Campus / DCI / Coherent Transport
  ↓
Metro / Regional Backbone
  ↓
Global Backbone / Submarine Cable
```

JoyLab 해석:

- **Switch ASIC**은 네트워크 처리량의 시작점
- **DSP / Retimer**는 고속 신호 품질과 전력의 병목
- **Optical Module**은 800G→1.6T 전환의 직접 출하 단위
- **CPO / Silicon Photonics**는 광학 위치와 집적도 변화
- **Fiber / Connectivity**는 물리 밀도와 설치 속도 병목
- **DCI / Coherent**는 여러 AI 데이터센터를 하나의 AI Factory로 묶는 구간

---

## 2. Layer Map

| Layer | 대표 상장사 | 실제 제품/역할 | 투자자가 볼 숫자 | 핵심 리스크 |
|---|---|---|---|---|
| Switch ASIC / Ethernet | Broadcom (NASDAQ: AVGO), NVIDIA (NASDAQ: NVDA), Marvell (NASDAQ: MRVL) | AI Ethernet switch, switch silicon, CPO switch, interconnect | Switch bandwidth, 200G/400G SerDes 전환, hyperscaler 채택, networking revenue | 고객 집중, ASIC 세대 교체, 자체 설계 |
| Optical DSP / Retimer | Marvell (NASDAQ: MRVL), Broadcom (NASDAQ: AVGO) | PAM4 DSP, coherent-lite, TRO/LRO, gearbox | 1.6T 출하, DSP attach rate, power/bit, 400G/lane roadmap | LPO/CPO로 DSP 역할 축소 가능성 |
| CPO / Silicon Photonics | Broadcom (NASDAQ: AVGO), NVIDIA (NASDAQ: NVDA), Marvell (NASDAQ: MRVL) | CPO switch, silicon photonics optical engine | CPO 양산 시점, optical engine yield, port power, customer qualification | 수율, 서비스성, 패키징 복잡성 |
| Optical Module / Laser | Coherent (NYSE: COHR), Lumentum (NASDAQ: LITE) | 1.6T transceiver, SiPh/InP/VCSEL, laser source | 800G→1.6T mix, module ASP, laser attach, capacity utilization | ASP 하락, 중국 경쟁, 고객 내재화 |
| Contract Manufacturing / Assembly | Fabrinet (NYSE: FN) | 광통신·고정밀 optical manufacturing | optical communications revenue, capacity, customer concentration | 고객 집중, 단가 압력 |
| Fiber / Connector / Cabling | Corning (NYSE: GLW) | fiber, cable, high-density connectivity, CPO/NPO passive connectivity | data center fiber demand, cable density, capacity expansion | capex cycle, fiber pricing |
| DCI / Coherent Transport | Ciena (NYSE: CIEN), Nokia (NYSE: NOK), Marvell (NASDAQ: MRVL) | coherent optics, WaveLogic, optical DCI, ZR/ZR+ DSP | 800G/1.6T coherent shipments, DCI orders, backlog, gross margin | carrier spending cycle, project timing |

---

## 3. Switch ASIC / Ethernet

### Broadcom (AVGO)

Broadcom은 2026년 Tomahawk 6를 production volume으로 출하하고 있으며, 102.4Tb/s Ethernet switch와 200G SerDes를 AI scale-up/scale-out에 공급한다.

Tomahawk 6 Davisson은 102.4Tb/s CPO Ethernet switch로 200Gb/s per channel을 사용한다.

**확인할 숫자**
- Tomahawk 6 production ramp
- 102.4T switch 채택
- 200G SerDes / 400G lane 전환
- CPO attach rate
- hyperscaler networking revenue 기여

Sources:
- https://www.broadcom.com/company/news/product-releases/64031
- https://investors.broadcom.com/news-releases/news-release-details/broadcom-announces-tomahawkr-6-davisson-industrys-first-1024
- https://www.broadcom.com/solutions/ai-solutions/ai-infrastructure

### NVIDIA (NVDA)

NVIDIA는 Spectrum-X Ethernet과 Spectrum-X Ethernet Photonics를 통해 GPU 외부의 networking layer까지 수직 통합 범위를 넓히고 있다.

Spectrum-X Ethernet Photonics는 최대 409.6Tb/s switch bandwidth를 제시한다.

**확인할 숫자**
- Networking revenue
- Spectrum-X adoption
- Spectrum-XGS scale-across adoption
- Photonics switch availability / shipment
- GPU platform과 networking attach

Sources:
- https://www.nvidia.com/en-us/networking/products/silicon-photonics/
- https://www.nvidia.com/en-us/networking/

### Marvell (MRVL)

Marvell은 switch silicon보다 optical DSP·SerDes·coherent 쪽 노출이 더 직접적이지만 end-to-end connectivity portfolio를 확대하고 있다.

**확인할 숫자**
- Data Center revenue
- 1.6T optical DSP mass production
- coherent-lite / ZR+ 신규 ramp
- hyperscaler custom silicon + connectivity 동시 성장

Sources:
- https://www.marvell.com/company/newsroom/marvell-1-6t-optical-dsp-ai-data-center-connectivity.html
- https://www.marvell.com/solutions/data-center/optical-dsp.html

---

## 4. Optical DSP / Retimer

이 레이어의 본질은 **속도보다 signal integrity와 power per bit**다.

Marvell은 1.6T 포트폴리오를 PAM4 DSP, TRO, coherent-lite, ZR/ZR+로 세분화한다.

### 핵심 투자 변수

```
800G → 1.6T
      ↓
200G/lane
      ↓
Signal loss 증가
      ↓
DSP / Retiming 수요
      ↓
Power 부담
      ↓
LPO / TRO / CPO로 구조 분화
```

**확인할 숫자**
- 1.6T DSP 출하량
- 800G → 1.6T mix
- port당 DSP 수
- 200G/lane → 400G/lane 전환
- DSP power 감소 속도
- LPO/CPO가 full DSP attach rate에 미치는 영향

Marvell은 2026년 Ara를 1.6T pluggable용으로 mass volume shipping 중이라고 밝혔다.

Source:
- https://www.marvell.com/company/newsroom/marvell-1-6t-optical-dsp-ai-data-center-connectivity.html

---

## 5. CPO / Silicon Photonics

CPO는 투자 관점에서 **광모듈 TAM이 사라지는가**가 아니라 가치가 어디로 이동하는지를 봐야 한다.

기존:
```
Switch ASIC
→ PCB
→ Pluggable Module
→ Fiber
```

CPO:
```
Switch ASIC
↔ Optical Engine
→ Fiber
```

가치 이동 후보:
- switch ASIC
- silicon photonics die
- external laser
- fiber attach
- optical packaging
- connector
- test / assembly

Broadcom은 Tomahawk 6 Davisson으로 102.4Tb/s CPO switch를 제시하고 있고, NVIDIA는 Spectrum-X Ethernet Photonics를 최대 409.6Tb/s로 제시한다.

**확인할 숫자**
- 실제 production shipment
- optical engine yield
- port당 power
- field replaceability
- external laser architecture
- hyperscaler qualification
- pluggable 대비 BOM 변화

Sources:
- https://investors.broadcom.com/news-releases/news-release-details/broadcom-announces-tomahawkr-6-davisson-industrys-first-1024
- https://www.nvidia.com/en-us/networking/products/silicon-photonics/

---

## 6. Optical Module / Laser

### Coherent (COHR)

Coherent는 2026년 OFC에서 1.6T·3.2T pluggable optics와 Silicon Photonics, InP, VCSEL 기반 포트폴리오를 공개했다.

**확인할 숫자**
- Datacom revenue
- 1.6T mix
- SiPh / InP / VCSEL별 제품 ramp
- 3.2T qualification
- gross margin
- capacity utilization

Source:
- https://www.coherent.com/news/press-releases/coherent-demonstrates-next-gen-pluggable-transceiver-ofc-2026

### Lumentum (LITE)

Lumentum은 1.6T 2×DR4 OSFP와 TRO OSFP를 공급하고 있으며 full-retimed와 transmit-retimed 구조를 모두 제공한다.

1.6T 2×DR4 OSFP:
- 8 electrical + 8 optical channels
- 212.5Gb/s PAM4/lane
- up to 500m
- typical 22W

TRO version:
- transmit-side retiming
- up to 500m
- typical 16W

이 차이는 **DSP 구조가 module power를 어떻게 바꾸는지**를 보여주는 직접 사례다.

Sources:
- https://www.lumentum.com/en/products/16t-2dr4-osfp-transceiver-module
- https://www.lumentum.com/products/16t-2dr4-tro-osfp-transceiver-module

---

## 7. Fiber / Connector / Cabling

### Corning (GLW)

AI network가 scale-up에서 scale-across로 이동하면 GPU·switch만 늘어나는 것이 아니라 물리 fiber count도 증가한다.

Corning은 2026년 AI network growth에서 rack, campus, long-distance DCI까지 fiber density와 deployment 속도가 핵심이라고 설명한다.

2026년 8월 Zayo는 Corning과 장기 fiber 공급 계약을 체결해 2030년까지 15,000 route miles 확장을 지원하기로 했다.

**확인할 숫자**
- Optical Communications revenue
- hyperscale / data center mix
- high-density cable adoption
- manufacturing capacity expansion
- fiber pricing / volume

Sources:
- https://www.corning.com/optical-communications/worldwide/en/home/the-signal-network-blog/2026-data-center-predictions.html
- https://www.corning.com/worldwide/en/about-us/news-events/news-releases/2026/08/zayo-stays-ahead-of-ai-infrastructure-demand-through-long-term-fiber-supply-agreement-with-corning.html
- https://www.corning.com/worldwide/en/about-us/news-events/news-releases/2026/09/corning-to-showcase-new-cable-and-connectivity-innovations-to-accelerate-and-streamline-ai-network-growth-at-ecoc-2026.html

---

## 8. DCI / Coherent Transport

### Ciena (CIEN)

Ciena는 WaveLogic coherent optics와 DCI transport에 직접 노출된다.

2026년 Spark New Zealand는 Ciena WaveLogic 6 Extreme 1.6Tb/s coherent 기술을 사용한 DCI 서비스를 발표했다.

**확인할 숫자**
- Cloud provider / DCI orders
- WaveLogic 6 ramp
- 800G / 1.6T coherent port shipments
- backlog
- gross margin

Sources:
- https://www.ciena.com/about/newsroom/press-releases/spark-taps-ciena-to-scale-data-centre-connectivity-across-auckland
- https://www.ciena.com/about/newsroom/press-releases/ciena-highlights-high-performance-ai-networking-at-ecoc-2026

### Nokia (NOK)

Nokia는 campus·metro·regional·long-haul·subsea까지 DCI optical portfolio를 제공한다.

Nokia는 자사 optical DCI가 세계 top 10 hyperscalers 중 9곳의 인프라를 지원한다고 설명한다.

**확인할 숫자**
- Optical Networks revenue
- DCI wins
- coherent engine generation
- hyperscaler exposure
- margin / mix

Sources:
- https://www.nokia.com/optical-networks/data-center-interconnect/
- https://www.nokia.com/optical-networks/

### Marvell (MRVL)

Marvell은 1.6T ZR/ZR+ pluggable과 2nm coherent DSP를 통해 DCI silicon layer에 노출된다.

Source:
- https://www.marvell.com/company/newsroom/marvell-1-6t-zr-zr-plus-pluggable-2nm-coherent-dsp-ai-interconnects.html

---

## 9. 투자 분석 프레임

JoyLab은 기업을 단순히 “AI 수혜주”로 묶지 않는다.

### Step 1. 제품 직접성

```
AI Network CAPEX
→ 해당 제품 주문
→ 출하량
→ 매출
```

### Step 2. 단가와 믹스

```
400G
→ 800G
→ 1.6T
→ 3.2T
```

세대 전환이 ASP와 gross margin을 실제로 올리는지 확인한다.

### Step 3. Attach Rate

예:
- GPU 1개당 network port
- switch 1개당 optical engine
- 1.6T port당 DSP
- rack당 fiber count

### Step 4. Capacity

수요가 있어도 생산 capacity가 부족하면 매출 인식이 늦어진다.

확인:
- wafer
- optical engine
- laser
- module assembly
- fiber
- connector

### Step 5. 경쟁과 내재화

AI network는 hyperscaler 자체 설계가 강한 시장이다.

따라서 다음을 확인한다.

- merchant silicon vs custom silicon
- pluggable vs CPO
- external supplier vs vertical integration
- single-source vs multi-source qualification

---

## 10. 분기 실적에서 확인할 공통 숫자

| KPI | 의미 |
|---|---|
| Data Center / Networking revenue growth | AI networking 매출이 실제 증가하는지 |
| 800G → 1.6T product mix | 세대 전환 속도 |
| Units shipped | 가격이 아닌 물량 성장 |
| ASP | 고속 제품 premium 유지 여부 |
| Gross margin | 고부가 제품 믹스 효과 |
| Customer concentration | hyperscaler 의존 위험 |
| Capacity expansion | 공급 병목 해소 속도 |
| Qualification / design win | 향후 매출 선행지표 |
| Power per bit | 기술 경쟁력 |
| Reach | 제품 적용 시장 확대 |

---

## 11. JoyLab Company Exposure Map

```
Switch ASIC
├─ Broadcom
├─ NVIDIA
└─ Marvell

Optical DSP / Retimer
├─ Marvell
└─ Broadcom

CPO / Silicon Photonics
├─ Broadcom
├─ NVIDIA
└─ Marvell

Optical Module / Laser
├─ Coherent
└─ Lumentum

Manufacturing / Assembly
└─ Fabrinet

Fiber / Connectivity
└─ Corning

DCI / Coherent Transport
├─ Ciena
├─ Nokia
└─ Marvell
```

주의:
- 같은 회사가 여러 레이어에 걸쳐 있다.
- “노출 레이어가 많다 = 투자 매력도가 높다”는 뜻은 아니다.
- 실제 투자 판단은 해당 사업이 전체 회사 매출·이익에서 차지하는 비중을 추가로 확인해야 한다.

---

## 12. 다음 콘텐츠 클러스터

### 1편
**AI 데이터센터 네트워크 수혜 밸류체인｜Switch ASIC부터 DCI까지**

### 2편
**Broadcom AI Network 분석｜Tomahawk 6·CPO·DSP가 매출로 연결되는 구조**

### 3편
**Marvell AI Optical 분석｜1.6T DSP·Coherent-lite·ZR+ 밸류체인**

### 4편
**Coherent vs Lumentum｜1.6T 광모듈·레이저 경쟁 구조**

### 5편
**Corning AI Fiber 분석｜GPU가 늘수록 광섬유도 늘어나는 이유**

### 6편
**Ciena vs Nokia DCI｜AI 데이터센터가 여러 지역으로 확장될 때 누가 돈을 버나**

Pillar 후보:
`/guides/ai-network-investing`

---

## 핵심 결론

AI 데이터센터 네트워크의 투자 밸류체인은 하나의 “광통신 테마”가 아니다.

```
Switch Silicon
→ Signal Processing
→ Optical Conversion
→ Physical Fiber
→ DCI Transport
```

각 레이어의 매출 단위와 병목이 다르기 때문에, 기업 분석도 서로 다른 KPI를 사용해야 한다.

JoyLab의 다음 투자형 콘텐츠는 **기술 설명 → 기업 노출 → KPI → 실적 검증** 순서로 전환한다.
