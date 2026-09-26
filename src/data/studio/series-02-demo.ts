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
    }
  ]
} satisfies InteractiveBookContract;
