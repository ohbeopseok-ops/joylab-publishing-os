# JoyLab Ops Plugin V0.1

JoyLab의 **Research → Publish QA → Distribution** 흐름을 3개 Skill로 묶은 Codex 호환 Plugin입니다.

## Structure

```text
plugins/joylab-ops/
├── .codex-plugin/
│   └── plugin.json
├── .mcp.json
├── README.md
└── skills/
    ├── research/
    │   └── SKILL.md
    ├── publish-qa/
    │   └── SKILL.md
    └── distribution/
        └── SKILL.md
```

## V0.1 scope

- **research**: 주제 정의 → 근거 수집 → 사실/해석 분리 → JoyLab Article 초안
- **publish-qa**: frontmatter → image manifest → internal links → build → hero gate → merge readiness
- **distribution**: Article → Threads/X/LinkedIn/Naver review pack → DRAFT 상태 유지

## Guardrails

1. 공개 전 사실과 해석을 분리합니다.
2. 수치·출처를 추측해서 채우지 않습니다.
3. 원본 Article을 canonical source로 유지합니다.
4. Build/QA가 실패하면 Merge 또는 배포를 진행하지 않습니다.
5. Distribution은 기본적으로 DRAFT이며 사람 승인 전 자동 게시하지 않습니다.
6. 위험한 외부 쓰기 작업은 별도 승인 지점을 둡니다.

## Local test

Plugin을 로컬 Plugin 소스로 등록한 뒤 새 Codex 대화에서 아래처럼 호출합니다.

```text
$joylab-ops 새 AI 생산성 주제를 Research Skill로 조사하고 JoyLab 초안을 만들어줘.
```

```text
$joylab-ops codex-goal-mode-guide-2026 Article의 Publish QA를 실행해줘.
```

```text
$joylab-ops codex-goal-mode-guide-2026의 Distribution review pack을 만들어줘.
```

V0.1의 `.mcp.json`은 빈 `mcpServers` 객체를 유지합니다. Research/Publish/Distribution의 로컬 계약이 안정화된 뒤 외부 MCP를 최소 권한으로 추가합니다.
