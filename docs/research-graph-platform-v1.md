# Research Graph Platform V1

JoyLab의 투자 Vertical을 동일한 **Contract → Map → CI → Production** 구조로 운영하기 위한 공용 플랫폼입니다.

## Reference implementation

- AI Power Infrastructure: `active`
- Semiconductor Investing: `template_ready`
- Financials & Value-up: `template_ready`
- Shipbuilding & Defense: `template_ready`

## Shared runtime

1. Graph SSOT: `JoyLab.ResearchGraph`
2. Registry: `config/research-graph-platform-v1.json`
3. Template: `config/research-graph-template-v1.json`
4. Shared Map: `src/components/ResearchGraphMap.astro`
5. Shared Style: `src/styles/research-graph-map-v3.css`
6. Platform Gate: `npm run research-graph:platform:check`

## Map V3 interaction contract

- 실제 노드 DOM 좌표로 SVG path를 계산합니다.
- resize / horizontal scroll 시 Edge를 재계산합니다.
- 선택 Node의 incoming/outgoing Edge만 강조합니다.
- Company Node는 연결된 KPI 버튼을 Detail Panel에 노출합니다.
- `covered_by`, `belongs_to`, `previous`, `next`는 탐색용 계약 Edge이며 시각 Canvas에서는 제외합니다.

## New vertical onboarding

1. `config/research-graph-template-v1.json`을 복사합니다.
2. Pillar id/title/url을 확정합니다.
3. Node → Edge → Article 순서로 SSOT를 채웁니다.
4. Pillar에서 `ResearchGraphMap`에 graph와 primaryFlow를 전달합니다. Shared stylesheet는 공용 Map 컴포넌트가 직접 import하므로 Vertical별 CSS 연결은 필요하지 않습니다.
5. Platform registry의 status를 `template_ready → active`로 바꾸고 graph 경로를 등록합니다.
6. 기존 vertical 전용 integrity gate와 Platform V1 gate를 모두 GREEN으로 만듭니다.

## Expansion order

`Semiconductor → Financials → Shipbuilding`

각 Vertical은 기존 발행 글을 먼저 Node/Article로 매핑하고, 새 글을 만들기 전에 Coverage Gap을 Graph에서 확인합니다.
