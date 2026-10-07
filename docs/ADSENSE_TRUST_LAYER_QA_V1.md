# AdSense Trust Layer QA V1

## 목적
123개 Article에 공통 적용된 Trust Layer가 반복 문구처럼 보이지 않도록 하면서, 출처·조사 방법·위험 요인·반대 시나리오의 신뢰 기준을 유지한다.

## Q1. Release 상태
PR #480은 최신 HEAD의 GitHub Actions 실행 증거가 없으므로 Draft를 유지한다.
Ready/GOLD 전환 조건은 최신 HEAD 기준 필수 검증이 실제 실행되어 모두 GREEN인 경우다.

## Q2. Trust Layer QA
다음 항목을 QA 포인트로 사용한다.

1. **Category fallback 과다 반복 금지**
   - 동일 카테고리에서 fallback 문구가 장기간 그대로 반복되면 개선 대상이다.
   - 고가치/YMYL 글은 가능한 한 article-specific metadata를 우선한다.

2. **우선 고도화 대상**
   - 투자·경제 글
   - 주요 Pillar/Guide 유입 상위 글
   - 검색 유입 상위 글
   - AdSense 심사 관점에서 대표성이 높은 글

3. **Article-specific 권장 필드**
   - authorBio
   - researchMethod
   - sourceList
   - riskFactors
   - counterScenarios

4. **금지**
   - 출처 URL 임의 생성
   - 근거 없는 전문성 문구
   - 모든 글에 동일한 위험 요인/반대 시나리오를 기계적으로 복사
   - CI 통과만을 위한 신뢰 문구 축소

## Q3. GOLD Evidence 4종
PR #480의 GOLD 판정은 아래 4개 증거로 제한한다.

1. **Build**
   - latest HEAD 기준 Astro build PASS
   - Content schema 오류 0
   - Frontmatter duplicate key 0

2. **Mobile**
   - Mobile Experience Contract PASS
   - Research Brief first-entry budget PASS
   - Mobile Lighthouse budget PASS

3. **AdSense**
   - AdSense Content Quality Audit V2에서 P0/HOLD 0
   - Trust Layer가 대표 Article에서 정상 렌더링
   - 출처 링크가 fabricated 되지 않음

4. **Visual**
   - Responsive Visual Gate PASS
   - 모바일/데스크톱에서 Trust Layer가 레이아웃을 과도하게 밀어내지 않음

## 최종 판정
- 4개 모두 GREEN: GOLD 후보
- 하나라도 FAIL 또는 최신 HEAD 증거 없음: BLOCKED
