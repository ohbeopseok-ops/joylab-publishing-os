# CONTENT TRUST CONTRACT V1

Status: Migration
Scope: JoyLab Articles

## Purpose
Google의 people-first 및 Who · How · Why 원칙을 JoyLab 발행 데이터 계약으로 구현한다.

## Trust metadata
- author: WHO
- reviewer: 최종 인간 검토 책임
- aiUsed: AI 사용 여부
- aiUsage: AI 사용 범위 (aiUsed=true일 때)
- humanVerified: 사람이 검증한 항목
- primarySources: EVIDENCE
- contentPurpose: WHY
- lastReviewed: 최종 검토일
- contentHow/contentWhy: 글별 보강 설명(선택)

## Date contract
lastReviewed는 검토일이며 updatedAt이 아니다.
실질적 수정이 없으면 updatedAt을 갱신하지 않는다.
Article JSON-LD dateModified는 기존 CONTENT_DATE_CONTRACT_V1에 따라 updatedAt ?? publishedAt을 유지한다.

## Rollout
V1:
- 기존 corpus: report-only
- PR에서 새로 추가/수정하는 article: changed gate
- Trust metadata가 완성되지 않은 기존 글은 Disclosure UI 미출력

V2:
- 123/123 migration 완료 후 핵심 Trust metadata required 승격
- full corpus strict gate
- Release Gate 편입

## Status
READY: 필수 Trust metadata 완비
MIGRATE: 기존 글 누락
BLOCK: 신규/수정 article 누락
