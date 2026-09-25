# Internal Link Gate V1

반도체 신규/수정 기사에 대해 다음을 자동 검사합니다.

1. `/guides/ai-inference-memory` Pillar 링크가 있어야 합니다.
2. 다른 Article 내부링크가 최소 2개 있어야 합니다.
3. 신규/수정 Article로 가는 역링크가 AI Memory Pillar에 있어야 합니다.
4. 변경된 Article 내부의 `/articles/*`, `/guides/*` 링크가 실제 라우트로 존재해야 합니다.

현재 반도체 판정 태그:
HBM, HBM4, DRAM, NAND, CXMT, YMTC, 삼성전자, SK하이닉스, 반도체, AI메모리, EnterpriseSSD

신규 반도체 글은 위 태그 중 하나 이상을 지정하면 Gate 대상이 됩니다.
