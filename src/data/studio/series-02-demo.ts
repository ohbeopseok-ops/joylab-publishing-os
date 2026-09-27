import type { InteractiveBookContract } from '../../lib/studio/interactive-block-contract';

export const series02Demo = {
  contract: 'JoyLab Interactive Block Contract V1',
  bookSlug: 'series-02-memory-debt',
  title: 'Series 02 — 기억 부채에서 실행 시스템까지',
  storageKey: 'joylab-series-02-memory-debt-workbook-v1',
  privacy: {
    storage: 'localStorage',
    sendResponsesToServer: false,
    piiWarning: '실습에는 고객명, 전화번호, 계정정보 등 실제 고객 식별정보를 입력하지 마세요.'
  },
  blocks: [
    {
      id: 'memory-debt-self-assessment',
      chapterId: 'chapter-01',
      type: 'self_assessment',
      title: '기억 부채 진단',
      prompt: '지금 머릿속에만 존재하는 업무는 몇 개인가요?',
      description: '기억에 의존하는 업무량과 대표 업무를 기록합니다.',
      required: true,
      saveResponse: true,
      version: 1,
      questions: [
        {
          id: 'memory-count',
          label: '머릿속에만 존재하는 업무 수',
          kind: 'singleChoice',
          required: true,
          options: [
            { value: '0-3', label: '0~3개', score: 1 },
            { value: '4-7', label: '4~7개', score: 2 },
            { value: '8-15', label: '8~15개', score: 3 },
            { value: '16+', label: '16개 이상', score: 4 }
          ]
        },
        {
          id: 'memory-task-1',
          label: '기억에 의존하는 업무 1',
          kind: 'text',
          required: true,
          placeholder: '예: 팀장에게만 전달되는 일일 마감 예외처리'
        },
        {
          id: 'memory-task-2',
          label: '기억에 의존하는 업무 2',
          kind: 'text',
          required: false,
          placeholder: '예: 특정 상담사 재점검 시점'
        },
        {
          id: 'memory-task-3',
          label: '기억에 의존하는 업무 3',
          kind: 'text',
          required: false,
          placeholder: '예: 월말 보고서 수정 규칙'
        }
      ],
      resultBands: [
        { id: 'low', label: 'LOW', min: 0, max: 1, message: '현재 기억 의존도는 낮은 편입니다.' },
        { id: 'watch', label: 'WATCH', min: 2, max: 2, message: '반복 업무부터 기록 구조를 만들 시점입니다.' },
        { id: 'high', label: 'HIGH', min: 3, max: 4, message: '업무 연속성을 위해 우선 문서화가 필요합니다.' }
      ]
    },
    {
      id: 'memory-debt-risk-score',
      chapterId: 'chapter-02',
      type: 'risk_score',
      title: 'Memory Debt Risk Score',
      prompt: '각 항목을 0~2점으로 평가하세요.',
      description: '0=아니다, 1=부분적으로 그렇다, 2=매우 그렇다.',
      required: true,
      saveResponse: true,
      version: 1,
      scale: { min: 0, max: 2, step: 1 },
      items: [
        { id: 'stops-without-me', label: '내가 없으면 업무가 멈춘다', weight: 1 },
        { id: 'hard-to-find', label: '다른 사람이 필요한 정보를 찾기 어렵다', weight: 1 },
        { id: 'scattered', label: '기록이 여러 곳에 흩어져 있다', weight: 1 },
        { id: 'repeat-explain', label: '같은 내용을 반복해서 설명한다', weight: 1 },
        { id: 'impact', label: '놓치면 고객 또는 팀 운영에 영향이 있다', weight: 1 }
      ],
      thresholds: [
        { id: 'low', label: 'LOW', min: 0, max: 3, message: '현재 위험은 낮지만 반복 업무는 기록 후보로 관리하세요.' },
        { id: 'watch', label: 'WATCH', min: 4, max: 6, message: '문서화 우선순위를 정하고 담당자 의존도를 낮추세요.' },
        { id: 'high', label: 'HIGH', min: 7, max: 10, message: '가장 영향도가 큰 업무부터 즉시 구조화하세요.' }
      ]
    },
    {
      id: 'persona-zero-moment-canvas',
      chapterId: 'chapter-03',
      type: 'persona_canvas',
      title: 'Persona 0 Moment Canvas',
      prompt: '정보가 필요한 바로 그 순간을 5개의 질문으로 정의하세요.',
      description: '답변을 저장하면 로컬 브라우저에만 남습니다.',
      required: true,
      saveResponse: true,
      version: 1,
      fields: [
        { id: 'who', label: '누가 이 정보를 필요로 하나?', placeholder: '예: 당일 마감 담당 팀장', required: true, maxLength: 300 },
        { id: 'when', label: '언제 찾게 되나?', placeholder: '예: 16시 재점검 직전', required: true, maxLength: 300 },
        { id: 'blocker', label: '무엇 때문에 막히나?', placeholder: '예: 예외 기준이 사람 기억에만 있음', required: true, maxLength: 300 },
        { id: 'current', label: '현재는 어떻게 해결하고 있나?', placeholder: '예: 메신저로 실장에게 물어봄', required: true, maxLength: 300 },
        { id: 'tenSeconds', label: '10초 안에 찾게 하려면 무엇이 필요한가?', placeholder: '예: 예외처리 기준 카드 + 검색 키워드', required: true, maxLength: 300 }
      ]
    },
    {
      id: 'source-summary-pair',
      chapterId: 'chapter-04',
      type: 'persona_canvas',
      title: '원문 vs 요약',
      prompt: '현장 원문과 한 줄 요약을 함께 남겨 검증 가능한 기록으로 바꿔보세요.',
      description: '요약이 원문을 대체하지 않도록 두 값을 함께 저장합니다.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'source', label: '원문', placeholder: '현장에서 들은 말 또는 관찰 내용을 그대로 적으세요.', required: true, maxLength: 1000 },
        { id: 'summary', label: '한 줄 요약', placeholder: '원문을 왜곡하지 않고 한 줄로 정리하세요.', required: true, maxLength: 300 },
        { id: 'verify', label: '검증 포인트', placeholder: '요약이 원문과 다른 부분이 없는지 확인하세요.', required: true, maxLength: 300 }
      ]
    },
    {
      id: 'memory-fragment-builder',
      chapterId: 'chapter-05',
      type: 'persona_canvas',
      title: '기억파편 1건 만들기',
      prompt: '해석보다 관찰 가능한 사실을 중심으로 기억파편을 만드세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'target', label: '대상', placeholder: '누구에 대한 기록인가?', required: true, maxLength: 300 },
        { id: 'fact', label: '관찰 가능한 사실', placeholder: '행동·발언·상황을 사실 중심으로 적으세요.', required: true, maxLength: 500 },
        { id: 'followup', label: '다시 확인할 내용', placeholder: '재점검이 필요하면 무엇을 볼지 적으세요.', required: true, maxLength: 300 }
      ]
    },
    {
      id: 'mini-data-contract-builder',
      chapterId: 'chapter-06',
      type: 'persona_canvas',
      title: 'Mini Data Contract Builder',
      prompt: '업무에서 반복 사용하는 핵심 Object와 관계를 정의하세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'objects', label: '핵심 Object 3개 이상', placeholder: '예: 상담사 / 기록 / Follow-up', required: true, maxLength: 500 },
        { id: 'relations', label: '관계 2개 이상', placeholder: '예: 상담사 → 기록, 기록 → Follow-up', required: true, maxLength: 500 },
        { id: 'rule', label: '절대 바뀌면 안 되는 의미', placeholder: 'UI가 바뀌어도 유지할 데이터 의미를 적으세요.', required: true, maxLength: 500 }
      ]
    },
    {
      id: 'kpi-change-scenario',
      chapterId: 'chapter-07',
      type: 'persona_canvas',
      title: 'KPI Change Scenario',
      prompt: 'KPI 값이 바뀔 때 과거를 덮어쓰지 않는 변경이력 규칙을 만드세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'reason', label: '변경 사유 규칙', placeholder: '회사 기준 / 팀 목표 / 오입력 / 기타', required: true, maxLength: 300 },
        { id: 'history', label: '과거 데이터 처리 원칙', placeholder: '확정된 과거 보고서를 어떻게 다룰지 적으세요.', required: true, maxLength: 500 },
        { id: 'evidence', label: '남겨야 할 이력', placeholder: '원본값·수정값·시점·사유 등', required: true, maxLength: 500 }
      ]
    },
    {
      id: 'first-screen-decision',
      chapterId: 'chapter-08',
      type: 'persona_canvas',
      title: 'First Screen Decision',
      prompt: '첫 화면에서 사용자가 단 하나만 해야 한다면 무엇인지 정하세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'moment', label: '사용 순간', placeholder: '언제 이 화면을 여는가?', required: true, maxLength: 300 },
        { id: 'action', label: '핵심 행동 1개', placeholder: '예: 말로 기록', required: true, maxLength: 300 },
        { id: 'remove', label: '첫 화면에서 뺄 것', placeholder: '후순위 기능을 적으세요.', required: true, maxLength: 500 }
      ]
    },
    {
      id: 'one-line-capture-lab',
      chapterId: 'chapter-09',
      type: 'persona_canvas',
      title: 'One-line Capture Lab',
      prompt: '긴 원문을 보존하면서 한 줄 포착을 만들어보세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'raw', label: 'STT 원문', placeholder: '원문을 그대로 붙여넣으세요.', required: true, maxLength: 1000 },
        { id: 'capture', label: '한 줄 포착', placeholder: '나중에 찾기 쉬운 한 줄로 정리하세요.', required: true, maxLength: 300 },
        { id: 'next', label: '다음 확인', placeholder: '필요하면 Follow-up을 적으세요.', required: true, maxLength: 300 }
      ]
    },
    {
      id: 'post-save-flow-builder',
      chapterId: 'chapter-10',
      type: 'persona_canvas',
      title: 'Post-save Flow Builder',
      prompt: '저장 직후 사용자에게 보여줄 다음 행동을 정확히 두 개로 줄이세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'action1', label: '다음 행동 1', placeholder: '예: 새 기록', required: true, maxLength: 200 },
        { id: 'action2', label: '다음 행동 2', placeholder: '예: 오늘 보기', required: true, maxLength: 200 },
        { id: 'why', label: '두 개만 남긴 이유', placeholder: '사용 흐름 관점에서 설명하세요.', required: true, maxLength: 500 }
      ]
    },
    {
      id: 'information-density-test',
      chapterId: 'chapter-11',
      type: 'persona_canvas',
      title: 'Information Density Test',
      prompt: '모바일 첫 화면에 몇 건을 먼저 노출할지 정하고 이유를 적으세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'count', label: '기본 노출 개수', placeholder: '예: 최근 5건', required: true, maxLength: 100 },
        { id: 'reason', label: '이유', placeholder: '최근성·인지부하 관점에서 적으세요.', required: true, maxLength: 500 },
        { id: 'more', label: '전체 이력은 어디서 보는가?', placeholder: '예: 오늘 보기 / 검색 / PC', required: true, maxLength: 300 }
      ]
    },
    {
      id: 'context-split-canvas',
      chapterId: 'chapter-12',
      type: 'persona_canvas',
      title: 'Context Split Canvas',
      prompt: '하나의 앱에 섞인 두 사용 순간을 분리해보세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'mobile', label: '현장 순간', placeholder: '목적·기기·시간 제약을 적으세요.', required: true, maxLength: 500 },
        { id: 'desktop', label: '분석 순간', placeholder: '목적·기기·시간 제약을 적으세요.', required: true, maxLength: 500 },
        { id: 'shared', label: '공유해야 할 데이터', placeholder: '두 화면이 함께 바라볼 데이터를 적으세요.', required: true, maxLength: 500 }
      ]
    },
    {
      id: 'mobile-three-tab-builder',
      chapterId: 'chapter-13',
      type: 'persona_canvas',
      title: 'Mobile 3-Tab Builder',
      prompt: '모바일 기능을 기록 / 오늘 / 더보기 세 탭으로 분류하세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'capture', label: '기록 탭', placeholder: '즉시 포착해야 할 기능', required: true, maxLength: 500 },
        { id: 'today', label: '오늘 탭', placeholder: '당일 확인할 기능', required: true, maxLength: 500 },
        { id: 'more', label: '더보기 탭', placeholder: '가끔 쓰는 관리 기능', required: true, maxLength: 500 }
      ]
    },
    {
      id: 'daily-ops-board',
      chapterId: 'chapter-14',
      type: 'persona_canvas',
      title: 'Daily Ops Board',
      prompt: '오늘 판단을 위해 PC에서 함께 봐야 할 운영 카드를 정의하세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'people', label: '사람/기록 카드', placeholder: '최근 기억파편·면담 등', required: true, maxLength: 500 },
        { id: 'kpi', label: 'KPI 카드', placeholder: '오늘 판단에 필요한 수치', required: true, maxLength: 500 },
        { id: 'followups', label: 'Follow-up 카드', placeholder: '오늘 재점검할 항목', required: true, maxLength: 500 },
        { id: 'routine', label: '운영 루틴 카드', placeholder: '시간대별 체크포인트', required: true, maxLength: 500 }
      ]
    },
    {
      id: 'same-data-different-ui',
      chapterId: 'chapter-15',
      type: 'persona_canvas',
      title: 'Same Data, Different UI',
      prompt: '모바일과 PC가 같은 데이터를 서로 다른 화면으로 사용하는 계약을 만드세요.',
      required: true, saveResponse: true, version: 1,
      fields: [
        { id: 'objects', label: '공통 Object 3개 이상', placeholder: '예: Counselor / MemoryFragment / FollowUp', required: true, maxLength: 500 },
        { id: 'mobileView', label: '모바일 View', placeholder: '같은 데이터를 어떻게 보여줄지 적으세요.', required: true, maxLength: 500 },
        { id: 'pcView', label: 'PC View', placeholder: '같은 데이터를 어떻게 보여줄지 적으세요.', required: true, maxLength: 500 },
        { id: 'trace', label: '변환 추적 규칙', placeholder: '원본·요약·변환 이력을 어떻게 보존할지 적으세요.', required: true, maxLength: 500 }
      ]
    }
  ]
} satisfies InteractiveBookContract;
