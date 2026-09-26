export type BookInteraction =
  | {
      type: 'checklist';
      id: string;
      title: string;
      description?: string;
      items: string[];
    }
  | {
      type: 'reflection';
      id: string;
      title: string;
      prompt: string;
      placeholder?: string;
    }
  | {
      type: 'choice';
      id: string;
      title: string;
      question: string;
      options: Array<{ label: string; feedback: string }>;
    }
  | {
      type: 'action';
      id: string;
      title: string;
      description?: string;
      steps: string[];
    }
  | {
      type: 'multiInput';
      id: string;
      title: string;
      description?: string;
      fields: Array<{ key: string; label: string; placeholder?: string }>;
      completionMin?: number;
    }
  | {
      type: 'scorecard';
      id: string;
      title: string;
      description?: string;
      items: Array<{ key: string; label: string; weight?: number }>;
      bands: Array<{ min: number; label: string; feedback: string }>;
    }
  | {
      type: 'canvas';
      id: string;
      title: string;
      description?: string;
      fields: Array<{ key: string; label: string; prompt: string; placeholder?: string }>;
      completionMin?: number;
    }
  | {
      type: 'sourceSummary';
      id: string;
      title: string;
      description?: string;
      sourceLabel: string;
      summaryLabel: string;
      sourcePlaceholder?: string;
      summaryPlaceholder?: string;
    }
  | {
      type: 'dataContract';
      id: string;
      title: string;
      description?: string;
      objects: Array<{ key: string; label: string; description: string }>;
      relationSlots: number;
    }
  | {
      type: 'scenarioSet';
      id: string;
      title: string;
      description?: string;
      scenarios: Array<{
        key: string;
        title: string;
        body: string;
        options: Array<{ label: string; value: string; feedback: string; preferred?: boolean }>;
      }>;
    };

export type BookInteractionMap = Record<number, BookInteraction[]>;

const problemToService: BookInteractionMap = {
  1: [
    {
      type: 'checklist',
      id: 'problem-observation-five',
      title: '내 문제 후보를 5분 안에 점검하기',
      description: '생활 속 불편을 서비스 문제로 바꾸기 위한 첫 체크입니다.',
      items: [
        '반복해서 불편해하는 사람이 떠오른다.',
        '그 불편이 발생하는 구체적인 순간을 말할 수 있다.',
        '지금은 어떤 우회 방법으로 해결하는지 알고 있다.',
        '가장 큰 마찰 하나를 한 문장으로 설명할 수 있다.',
        '해결되면 사용자의 행동이 어떻게 달라지는지 설명할 수 있다.'
      ]
    },
    {
      type: 'reflection',
      id: 'problem-one-sentence',
      title: '한 문장 문제 정의',
      prompt: '“누가, 어떤 상황에서, 무엇 때문에 어려운가?”를 한 문장으로 적어보세요.',
      placeholder: '예: 낯선 장소를 걷는 시니어가 복잡한 검색 없이 가까운 화장실을 확인하기 어렵다.'
    },
    {
      type: 'choice',
      id: 'feature-or-problem',
      title: '기능보다 문제',
      question: '서비스 아이디어가 떠올랐을 때 가장 먼저 할 일은 무엇일까요?',
      options: [
        { label: '기능 목록부터 최대한 많이 만든다', feedback: '기능이 많아질수록 문제의 핵심이 흐려질 수 있습니다. 먼저 사용자와 순간을 좁혀보세요.' },
        { label: '누구의 어떤 순간을 해결할지 한 문장으로 쓴다', feedback: '좋습니다. 이 문장이 이후 MVP와 기능 우선순위의 기준이 됩니다.' },
        { label: '경쟁 앱 화면부터 그대로 따라 만든다', feedback: '경쟁 서비스는 참고 자료입니다. 먼저 실제 불편의 맥락을 확인해야 합니다.' }
      ]
    }
  ]
};

const workToSystem: BookInteractionMap = {
  1: [
    {
      type: 'multiInput',
      id: 'memory-debt',
      title: '기억 부채 진단',
      description: '“내가 머릿속으로 기억하고 있어서 굴러가는 일”을 최대 3개 적어보세요. 하나만 적어도 다음 단계로 갈 수 있습니다.',
      completionMin: 1,
      fields: [
        { key: 'debt1', label: '기억 부채 1', placeholder: '예: 누구에게 다시 확인해야 하는지' },
        { key: 'debt2', label: '기억 부채 2', placeholder: '예: KPI 예외 이유' },
        { key: 'debt3', label: '기억 부채 3', placeholder: '예: 어제 약속한 Follow-up' }
      ]
    }
  ],
  2: [
    {
      type: 'scorecard',
      id: 'externalize-memory',
      title: '기억 위험 점수',
      description: '현재 업무에서 해당되는 항목을 체크하세요. 점수는 이 브라우저 안에서만 계산됩니다.',
      items: [
        { key: 'followup-memory', label: '다시 확인해야 할 날짜가 사람의 기억에만 남아 있다.', weight: 1 },
        { key: 'kpi-reason-memory', label: '왜 숫자가 바뀌었는지 특정 사람만 알고 있다.', weight: 1 },
        { key: 'fragmented-records', label: '면담과 관찰 기록이 서로 다른 곳에 흩어져 있다.', weight: 1 },
        { key: 'handover-loss', label: '업무 담당자가 바뀌면 맥락이 사라질 가능성이 있다.', weight: 1 }
      ],
      bands: [
        { min: 0, label: 'LOW', feedback: '현재 기억 의존 위험은 낮습니다. 다만 반복 업무 한 가지는 시스템으로 옮겨보세요.' },
        { min: 2, label: 'MEDIUM', feedback: '기억 부채가 운영 리스크로 바뀌기 시작한 상태입니다. Follow-up과 변경이력부터 구조화해보세요.' },
        { min: 4, label: 'HIGH', feedback: '핵심 운영 맥락이 사람의 기억에 크게 의존하고 있습니다. 기록·Follow-up·변경이력 구조를 우선 설계하는 편이 좋습니다.' }
      ]
    }
  ],
  3: [
    {
      type: 'canvas',
      id: 'persona0-moment',
      title: 'Persona 0 Moment Canvas',
      description: '가상의 사용자 프로필보다 “실제 일이 벌어지는 순간”을 적습니다. 5칸 중 4칸 이상 작성하면 Canvas가 완료됩니다.',
      completionMin: 4,
      fields: [
        { key: 'who', label: 'WHO', prompt: '누가 이 일을 하나요?', placeholder: '예: 고객센터 현장 리더' },
        { key: 'when', label: 'WHEN', prompt: '언제 가장 자주 발생하나요?', placeholder: '예: 상담 직후, 오후 운영 점검 전' },
        { key: 'where', label: 'WHERE', prompt: '어떤 환경에서 일어나나요?', placeholder: '예: 현장을 이동하며 휴대폰으로' },
        { key: 'urgent', label: 'URGENT', prompt: '그 순간 무엇이 가장 급한가요?', placeholder: '예: 생각이 사라지기 전에 20초 안에 기록' },
        { key: 'next', label: 'NEXT', prompt: '기록 후 다음 행동은 무엇인가요?', placeholder: '예: 오늘 다시 보기 또는 Follow-up 지정' }
      ]
    }
  ],
  4: [
    {
      type: 'sourceSummary',
      id: 'stt-source-summary',
      title: 'STT 원문 → 한 줄 요약',
      description: '원문을 지우지 않고 요약과 나란히 보존합니다. 요약은 원문에 없는 사실을 추가하지 않는 것이 원칙입니다.',
      sourceLabel: 'STT 원문',
      summaryLabel: '한 줄 요약',
      sourcePlaceholder: '예: 김 상담사 오늘 결합 할인 문의에서 설명이 길어져 고객이 다시 물었고, 두 번째에는 순서를 잡아 이해시켰음. 내일 오전 다시 모니터링.',
      summaryPlaceholder: '예: 결합할인 설명 순서 개선 필요, 내일 오전 재모니터링.'
    }
  ],
  5: [
    {
      type: 'canvas',
      id: 'memory-fragment-builder',
      title: '기억파편 1건 만들기',
      description: '평가 문장이 아니라 나중에 다시 사용할 수 있는 관찰 가능한 기록으로 바꿉니다.',
      completionMin: 3,
      fields: [
        { key: 'target', label: 'TARGET', prompt: '누구/무엇에 대한 기록인가요?', placeholder: '예: 김 상담사' },
        { key: 'fact', label: 'OBSERVED FACT', prompt: '관찰 가능한 사실 한 문장은?', placeholder: '예: 고객 설명 중 답변을 두 차례 끊고 다음 안내로 넘어감' },
        { key: 'followup', label: 'FOLLOW-UP', prompt: '다시 확인할 행동은?', placeholder: '예: 다음 요금 문의 1건 재모니터링' },
        { key: 'date', label: 'WHEN', prompt: '언제 다시 확인할까요?', placeholder: '예: 내일 오전 10시' }
      ]
    }
  ],
  6: [
    {
      type: 'dataContract',
      id: 'mini-data-contract',
      title: 'Mini Data Contract Builder',
      description: '업무 화면이 아니라 먼저 공통 데이터 객체와 관계를 정합니다. 최소 3개 Object와 2개 관계를 선택하면 완료됩니다.',
      relationSlots: 2,
      objects: [
        { key: 'person', label: 'Person / Counselor', description: '기록이 연결되는 사람 또는 대상' },
        { key: 'fragment', label: 'Memory Fragment', description: '관찰·메모·신호의 작은 기록 단위' },
        { key: 'followup', label: 'Follow-up', description: '언제 무엇을 다시 확인할지 나타내는 행동' },
        { key: 'interview', label: 'Formal Interview', description: '정식 대화·합의·후속조치 기록' },
        { key: 'source', label: 'Source / STT', description: '변환 전 원문 또는 입력 근거' }
      ]
    }
  ],
  7: [
    {
      type: 'scenarioSet',
      id: 'kpi-change-policy',
      title: 'KPI 변경이력 시나리오',
      description: '숫자가 바뀌었을 때 조용히 덮어쓰지 않고 “왜 바뀌었는가”를 남기는 규칙을 선택합니다.',
      scenarios: [
        {
          key: 'company-rule',
          title: 'Scenario A · 회사 기준 변경',
          body: '이번 달부터 품질 목표가 90에서 92로 변경되었습니다. 지난달 확정 보고서는 어떻게 할까요?',
          options: [
            { label: '현재 기준 92로 과거까지 다시 계산한다', value: 'recalc', feedback: '현재 기준으로 과거를 다시 쓰면 당시 판단 근거가 사라질 수 있습니다.' },
            { label: '지난달 보고서는 90 기준 그대로 보존한다', value: 'preserve', feedback: '좋습니다. 변경일 이후부터 92를 적용하고 과거 확정본은 당시 기준으로 보존합니다.', preferred: true }
          ]
        },
        {
          key: 'input-error',
          title: 'Scenario B · 오입력 수정',
          body: '94를 49로 잘못 입력한 사실을 확인했습니다. 어떻게 수정할까요?',
          options: [
            { label: '49를 94로 바꾸고 흔적은 남기지 않는다', value: 'overwrite', feedback: '값은 맞아져도 왜 달라졌는지 재현할 수 없습니다.' },
            { label: '원본 49, 수정값 94, 시점과 사유를 남긴다', value: 'audit', feedback: '좋습니다. 오입력은 수정하되 원본·수정값·시점·사유를 함께 남깁니다.', preferred: true }
          ]
        },
        {
          key: 'team-target',
          title: 'Scenario C · 팀 목표 조정',
          body: '회사 기준은 그대로지만 팀 목표만 상향했습니다. 변경 사유는 무엇으로 남길까요?',
          options: [
            { label: '회사 기준 변경', value: 'company', feedback: '회사 기준 자체는 바뀌지 않았으므로 원인을 구분해야 합니다.' },
            { label: '팀 목표 변경', value: 'team', feedback: '좋습니다. 회사 기준과 내부 팀 목표를 구분해 이력을 남깁니다.', preferred: true }
          ]
        }
      ]
    }
  ],
  8: [
    {
      type: 'choice',
      id: 'first-screen',
      title: '첫 화면 결정',
      question: '모바일 첫 화면에서 하나만 할 수 있다면 무엇을 남길까요?',
      options: [
        { label: '전체 KPI 대시보드', feedback: 'PC 운영 본체에는 중요하지만 현장 모바일 첫 행동으로는 무겁습니다.' },
        { label: '지금 떠오른 기록을 빠르게 남기기', feedback: 'Coaching의 핵심입니다. 현장에서는 기억이 사라지기 전에 포착하는 것이 먼저입니다.' },
        { label: '설정과 메뉴 전체 보기', feedback: '설정은 자주 쓰는 핵심 행동과 분리하는 편이 좋습니다.' }
      ]
    }
  ],
  12: [
    {
      type: 'reflection',
      id: 'split-context',
      title: '하나의 앱을 나눠야 할 순간',
      prompt: '같은 데이터를 쓰지만 사용 순간과 목적이 완전히 다른 업무 두 가지를 적어보세요.',
      placeholder: '예: 현장 20초 기록 / PC에서 주간 패턴 분석'
    }
  ],
  15: [
    {
      type: 'action',
      id: 'same-data-different-ui',
      title: '같은 데이터, 다른 인터페이스 설계',
      steps: [
        '공통 데이터 객체를 3~5개로 정한다.',
        '모바일에서 필요한 행동만 표시한다.',
        'PC에서 필요한 비교·회수·판단 기능을 분리한다.',
        '두 화면이 같은 ID와 의미를 공유하는지 확인한다.'
      ]
    }
  ]
};

const interactions: Record<string, BookInteractionMap> = {
  'problem-to-service': problemToService,
  'work-to-system': workToSystem
};

export function getBookInteractions(bookSlug: string): BookInteractionMap {
  return interactions[bookSlug] ?? {};
}
