# JoyLab Books · Interactive Workbook Standard V1

## 1. 목적

AI·생산성·업무실무형 도서는 단순히 읽는 전자책이 아니라 **읽기 → 복사 → 실습 → 검증 → 완료**까지 한 화면에서 이어지는 Interactive Workbook을 기본 경험으로 한다.

- 웹 워크북: 주력 읽기 제품
- PDF: 휴대·보관·인쇄용 보조 자산
- 마인드맵: 복습용 보조 자산
- 프롬프트 팩: 현장 재사용 도구
- Reader Pack: 소장·배포용 묶음

## 2. 표준 정보 구조

```text
/books/{slug}/
/books/{slug}/interactive.html
/books/{slug}/chapters/cover.html
/books/{slug}/chapters/publication-info.html
/books/{slug}/chapters/prologue.html
/books/{slug}/chapters/ch1.html ... chN.html
/books/{slug}/chapters/appendix.html
/books/{slug}/chapters/epilogue.html
/books/{slug}/resources.html
/books/{slug}/mindmap.html
/books/{slug}/prompts-10.txt
```

도서 메타데이터는 다음 CTA를 기본으로 한다.

```yaml
readerPath: "/books/{slug}/interactive.html"
readerCta: "인터랙티브 웹 전자책 읽기"
```

## 3. 핵심 UX 계약

각 실무 장은 다음 5단계 경험을 제공한다.

1. **READ** — 장 본문과 사례를 읽는다.
2. **COPY** — 해당 장의 대표 프롬프트를 복사한다.
3. **PRACTICE** — 독자가 직접 실습 메모를 작성한다.
4. **VERIFY** — 정확성·보안·업무 적용 체크리스트를 확인한다.
5. **COMPLETE** — 장 완료 상태를 기록하고 전체 진척도를 확인한다.

## 4. 필수 기능

- 전체 목차 사이드바
- 현재 장 강조
- 전체 읽기 진행률
- 장별 완료율 및 전체 완료율
- 라이트·세피아·다크 모드
- 프롬프트 원클릭 복사
- 장별 실습 메모
- 장별 검증 체크리스트
- 이어읽기용 스크롤 위치 저장
- 장 기록 초기화
- 모바일 사이드바 대응
- Reader Resources 연결
- 책 상세 페이지 복귀

## 5. 데이터·개인정보 원칙

워크북 실습 데이터는 **브라우저 localStorage에만 저장**하는 것을 기본값으로 한다.

- 서버로 실습 내용을 전송하지 않는다.
- 분석 이벤트에 실습 메모·프롬프트 내용·개인정보를 포함하지 않는다.
- 실습 영역에는 실제 고객 식별정보 입력 금지 안내를 제공한다.
- 저장 키는 `joylab-{slug}-workbook-v{n}` 형식으로 버전별 분리한다.
- 초기화 기능으로 사용자가 로컬 기록을 직접 지울 수 있어야 한다.

## 6. SEO 원칙

- `/books/{slug}/` 상세 페이지: `index,follow`
- `/interactive.html`: `noindex,follow`
- interactive canonical: 도서 상세 페이지
- 도서 상세의 메인 CTA는 Interactive Workbook으로 연결
- 마인드맵·프롬프트·PDF는 보조 CTA로 배치

## 7. 콘텐츠 모듈 원칙

본문은 한 개의 초대형 HTML 파일에 넣지 않고 장별 fragment로 분리한다.

장점:

- 특정 장만 수정 가능
- 향후 책별 공통 워크북 엔진 재사용 가능
- Git diff와 검수 범위 축소
- 장 단위 QA 가능
- 향후 콘텐츠 CMS 연동에 유리

## 8. QA 완료 조건

출간 전 아래 항목을 모두 확인한다.

- [ ] Astro 전체 Build 성공
- [ ] Books Domain Core 성공
- [ ] Book SEO Analytics Gate 성공
- [ ] Books Visual QA 성공
- [ ] 모든 chapter fragment HTTP 200
- [ ] 목차 이동 정상
- [ ] 프롬프트 복사 정상
- [ ] 실습 메모 저장·새로고침 복원 정상
- [ ] 체크리스트 저장 정상
- [ ] 장 완료율 갱신 정상
- [ ] 기록 초기화 정상
- [ ] 라이트·세피아·다크 모드 정상
- [ ] 모바일 360~430px 레이아웃 정상
- [ ] 책 상세 → 워크북 → 리소스 → 책 상세 순환 링크 정상
- [ ] 콘솔 오류 없음
- [ ] 실제 고객정보를 입력하도록 유도하는 문구 없음

## 9. Analytics 원칙

측정 가능한 이벤트 예시:

- workbook_start
- workbook_chapter_view
- workbook_prompt_copy
- workbook_chapter_complete
- workbook_25 / 50 / 75 / 100
- workbook_resource_click

**절대 수집하지 않는 것:**

- 실습 textarea 내용
- 사용자가 복사한 실제 프롬프트 값
- 체크리스트의 업무 원문
- 고객정보·상담 메모·개인정보

## 10. 첫 GOLD CASE

`콜센터 AI 생존기`를 JoyLab Interactive Workbook V1의 첫 GOLD CASE로 사용한다.

기준 경험:

> 책을 읽는 데서 끝나지 않고, 각 장에서 프롬프트를 복사하고 직접 실습한 뒤 사람의 검증 포인트를 체크하고 완료 상태를 남긴다.

이 구조를 AI 실무형 도서의 기본 템플릿으로 확장한다.
