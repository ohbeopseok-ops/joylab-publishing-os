export type InteractiveMode = 'READ' | 'ASK' | 'BUILD' | 'SAVE';

export type InteractiveChapterPlan = {
  chapter: number;
  title: string;
  primary: InteractiveMode;
  secondary?: InteractiveMode[];
  interactionId: string;
  savedArtifact: string;
  completionRule: string;
};

export const workToSystemInteractiveMapV1: InteractiveChapterPlan[] = [
  { chapter: 1, title: '기록은 많은데 왜 다시 찾게 될까', primary: 'ASK', secondary: ['SAVE'], interactionId: 'memory-debt', savedArtifact: 'memoryDebt', completionRule: '기억 부채 1개 이상 저장' },
  { chapter: 2, title: '리더의 기억을 시스템 밖에 두지 않는다', primary: 'ASK', secondary: ['SAVE'], interactionId: 'externalize-memory', savedArtifact: 'memoryRiskScore', completionRule: '시스템 밖 기억 점검 완료' },
  { chapter: 3, title: 'Persona 0는 현장의 리더였다', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'persona0-moment', savedArtifact: 'persona0Moment', completionRule: 'Moment Canvas 5칸 중 4칸 이상 작성' },
  { chapter: 4, title: '말 한마디를 데이터로 만들 수 있을까', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'stt-source', savedArtifact: 'sourceSummaryPair', completionRule: '원문과 요약 모두 저장' },
  { chapter: 5, title: '기억파편이라는 단위를 만들다', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'fragment-practice', savedArtifact: 'memoryFragment', completionRule: '대상과 관찰 사실 저장' },
  { chapter: 6, title: 'Core Data Contract를 먼저 만든 이유', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'contract-check', savedArtifact: 'miniDataContract', completionRule: 'Object 3개 이상, 관계 2개 이상 정의' },
  { chapter: 7, title: 'KPI 숫자보다 변경이력이 중요했다', primary: 'ASK', secondary: ['BUILD','SAVE'], interactionId: 'kpi-change-policy', savedArtifact: 'kpiChangePolicy', completionRule: '변경 사유 규칙과 과거 처리 원칙 저장' },
  { chapter: 8, title: '첫 화면에서 무엇 하나만 할 수 있어야 할까', primary: 'ASK', secondary: ['SAVE'], interactionId: 'first-screen', savedArtifact: 'firstScreenDecision', completionRule: '첫 행동 1개 선택' },
  { chapter: 9, title: '말로 기록하고 한 줄로 정리하다', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'one-line-capture', savedArtifact: 'oneLineCapture', completionRule: '원문과 한 줄 포착 저장' },
  { chapter: 10, title: '저장 다음 행동을 설계하다', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'post-save-flow', savedArtifact: 'postSaveFlow', completionRule: '저장 후 다음 행동 2개 지정' },
  { chapter: 11, title: '최근 5건만 보여준 이유', primary: 'ASK', secondary: ['BUILD'], interactionId: 'density-decision', savedArtifact: 'densityDecision', completionRule: '노출 개수와 이유 저장' },
  { chapter: 12, title: '하나의 앱에 모든 기능을 넣지 않기로 했다', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'split-context', savedArtifact: 'contextSplit', completionRule: '두 사용 순간의 목적·기기·시간 제약 작성' },
  { chapter: 13, title: 'LeaderDesk Coaching', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'coaching-nav', savedArtifact: 'coachingNav', completionRule: '기능을 기록/오늘/더보기 3탭에 분류' },
  { chapter: 14, title: 'LeaderDesk Ops', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'ops-board', savedArtifact: 'opsBoard', completionRule: '오늘 판단용 카드 4개 이상 선택' },
  { chapter: 15, title: '같은 데이터, 다른 인터페이스', primary: 'BUILD', secondary: ['SAVE'], interactionId: 'same-data-different-ui', savedArtifact: 'crossInterfaceContract', completionRule: '공통 Object 3개 이상과 양쪽 View 연결' }
];
