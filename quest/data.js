/* IDEA 2 — 일반 모드 vs 솔버 모드
   화면에 나오는 문장·수치·순서는 전부 여기에 있다. 문장을 고칠 때 여는 파일.

   말투: 친한 선배가 옆에서 알려 주는 해체 반말. "~해 봐", "~하자", "~야", "~거든".
   "~다."로 끝나는 설명문은 쓰지 않는다. 존댓말도 쓰지 않는다. 화면 전체가 한 사람 목소리여야 한다.

   독자는 초심자다. 주어와 목적어를 생략하지 않는다. "옮겨야 해"가 아니라
   "USDC를 Robinhood Chain으로 옮겨야 해". 체인·토큰·가스 같은 말은 처음 나오는 자리에서
   그 자리의 예로 풀어 준다. 수량은 "500 USDC"처럼 숫자를 앞에 쓴다.

   지켜야 할 것
   - 수치는 전부 예시값이다. 화면 아래 주의사항이 그렇다고 말한다. 화면 안에서는 반복하지 않는다.
   - 유저는 솔버를 고르지 않는다. 규칙이 실행자를 정한다.
   - 솔버가 하는 일은 공통 역할(조건 판단·자산 마련·실행)까지만 적는다.
   - 시나리오의 체인·토큰·캠페인은 설명을 위한 예시다. 실제 앱·캠페인이 아니다. */

var ICON_V = '?v=4';

window.MODE = {

  /* ── Quest ──────────────────────────────────────
     게임 퀘스트처럼. 구체적인 상황이 있어야 "왜 옮겨야 하는지"가 몸으로 느껴진다.
     Robinhood Chain 은 2026-07 메인넷이 열린 Arbitrum 계열 L2 이고 가스는 ETH 다.
     여기서 무엇을 살 수 있는지는 예시이며, 실제 상품·캠페인을 설명하는 것이 아니다. */
  mission: {
    eyebrow: 'QUEST 01',
    word: 'Quest',
    pill: 'Robinhood Chain에서 500 USDC 마련하기!',   /* 지갑·거래 화면 위에 계속 떠 있는 한 줄 */
    clear: '퀘스트 클리어',
    title: 'Robinhood Chain에서\n스톡 토큰을 사 보자!',
    need: { chain: 'robinhood', token: 'usdc', amount: 500 },
    needLabel: '필요한 것',
    haveLabel: '지금 가진 것',
    gap: '스톡 토큰을 사려면 Robinhood Chain 위에 500 USDC가 있어야 해. 지금 네 지갑에 있는 USDC는 다른 체인(Arbitrum, Base)에 있고 양도 모자라. 그러니 Ethereum에 있는 네 ETH로 500 USDC를 만들어서, Robinhood Chain으로 옮겨야 해.',
    cta: '먼저 내 지갑을 확인해 볼까?'
  },

  chains: {
    ethereum:  { name: 'Ethereum',       short: 'ETH',  icon: '../brand/chains/ethereum.svg' + ICON_V, color: '#8e97ef', gas: 'eth' },
    arbitrum:  { name: 'Arbitrum',       short: 'ARB',  icon: '../brand/chains/arbitrum.svg' + ICON_V, color: '#12aaff', gas: 'eth' },
    base:      { name: 'Base',           short: 'BASE', icon: '../brand/chains/base.svg' + ICON_V,     color: '#3b6bff', gas: 'eth' },
    robinhood: { name: 'Robinhood Chain', short: 'RH',  icon: './rh-chain.svg' + ICON_V,               color: '#4cd37a', gas: 'eth' }
  },
  chainOrder: ['ethereum', 'arbitrum', 'base', 'robinhood'],

  tokens: {
    eth:  { name: 'ETH',  full: 'Ether',      icon: '../brand/tokens/eth.svg' + ICON_V,  color: '#627eea', price: 3684.72, dp: 4 },
    usdc: { name: 'USDC', full: 'USD Coin',   icon: '../brand/tokens/usdc.svg' + ICON_V, color: '#2775ca', price: 1,       dp: 2 },
    usdt: { name: 'USDT', full: 'Tether USD', icon: '../brand/tokens/usdt.svg' + ICON_V, color: '#26a17b', price: 1,       dp: 2 },
    wbtc: { name: 'WBTC', full: 'Wrapped BTC', icon: '../brand/tokens/wbtc.svg' + ICON_V, color: '#3b3350', price: 118500, dp: 5 }
  },

  /* 출발점. 두 모드 모두 이 지갑에서 시작한다 — 비교가 성립하려면 같아야 한다. */
  holdings: {
    ethereum:  { eth: 0.84, usdt: 120 },
    arbitrum:  { usdc: 320.5 },
    base:      { usdc: 12.4, eth: 0.011 },
    robinhood: {}
  },
  address: '0x7a3F…4f2b',

  /* ── 일반 모드: 직접 하면 이렇게 된다 ─────────────
     한 번에 안 되는 거래라서 앱이 할 일 목록을 내놓는다.
     sigs 는 지갑 서명 횟수, gas 는 달러, wait 는 초 단위 예상 대기.
     decide 는 이 단계에서 유저가 스스로 정해야 하는 것(있으면 기록판에 오른다).
     options 가 있는 단계는 고른 선택지의 수치를 쓴다(screens.js 의 resolve). */
  normal: {
    label: '일반 모드',
    pay: { chain: 'ethereum', token: 'eth', amount: 0.1475 },
    plan: [
      {
        id: 'swap', kind: '스왑', app: 'Uniswap v3',
        title: 'Ethereum에서 ETH를 USDC로 바꾸기',
        why: '브릿지는 USDC 같은 토큰을 다른 체인으로 옮기는 도구야. 그러니까 먼저 Ethereum 위에서 네 ETH를 USDC로 바꿔서, 옮길 USDC를 만들어 두자. 이렇게 같은 체인 안에서 토큰을 바꾸는 걸 스왑이라고 해.',
        from: { chain: 'ethereum', token: 'eth',  amount: 0.1475 },
        to:   { chain: 'ethereum', token: 'usdc', amount: 541.87 },
        lines: [['네트워크 수수료(가스)', '$3.84'], ['가격 영향', '<0.01%'], ['슬리피지 허용', '0.5%'], ['경로', 'ETH → USDC (0.05%)']],
        sigs: [{ name: 'Swap', gas: 3.84 }],
        wait: 15,
        decide: '슬리피지 허용치'
      },
      {
        id: 'bridge', kind: '브릿지', app: '브릿지 고르기',
        title: 'USDC를 Ethereum에서 Robinhood Chain으로 옮기기',
        why: 'Ethereum 위의 USDC와 Robinhood Chain 위의 USDC는 서로 다른 장부에 기록돼. 그래서 방금 만든 USDC를 브릿지로 Robinhood Chain에 옮겨야 해. 어느 브릿지를 쓸지는 네가 골라야 하고, 브릿지마다 수수료와 걸리는 시간이 달라.',
        from: { chain: 'ethereum',  token: 'usdc', amount: 541.87 },
        to:   { chain: 'robinhood', token: 'usdc' },
        /* 어느 브릿지로 갈지 유저가 고른다. 고른 것에 따라 수수료·가스·시간·도착 수량이 바뀌고,
           그대로 서명 시트·처리 중·기록판에 오른다. slow 는 처리 중 애니메이션을 다른 것보다
           느리게 돌린다 — 실제 7일을 기다리게 하진 않고, 표기만 7일이다.
           pick 은 아직 고르기 전 카드에 미리 보여 주는 기본값이다. */
        options: [
          { name: '공식 브릿지',      fee: 0,    gas: [1.92, 3.60], wait: 7 * 86400 + 2 * 3600, amount: 541.87, note: '수수료는 없지만 출금 대기가 길어', slow: true },
          { name: '서드파티 브릿지 A', fee: 1.63, gas: [1.92, 4.10], wait: 12 * 60,             amount: 540.24, note: '', pick: true },
          { name: '서드파티 브릿지 B', fee: 2.90, gas: [1.92, 4.35], wait: 4 * 60,              amount: 538.97, note: '빠른 대신 수수료가 비싸' }
        ],
        labels: { fee: '브릿지 수수료', gas: '네트워크 수수료(가스)', time: '예상 시간', dest: ['도착 체인의 가스', '네가 따로 챙겨야 해'] },
        sigNames: ['Approve USDC', 'Bridge'],
        decide: '어느 브릿지로 갈지'
      },
      {
        id: 'gas', kind: '브릿지', app: '가스 챙기기',
        title: 'Robinhood Chain에서 쓸 가스(ETH) 챙기기',
        why: 'Robinhood Chain에서 거래를 하려면 그 체인에서 쓰는 가스, 즉 ETH가 조금 필요해. USDC만 있으면 거래를 보낼 수가 없거든. 그래서 Ethereum에 있는 ETH도 조금 옮겨 두자.',
        from: { chain: 'ethereum',  token: 'eth', amount: 0.004 },
        to:   { chain: 'robinhood', token: 'eth', amount: 0.0039 },
        lines: [['네트워크 수수료(가스)', '$3.40'], ['예상 시간', '~8분'], ['옮길 양', '거래 몇 번 할 만큼']],
        sigs: [{ name: 'Bridge ETH', gas: 3.40 }],
        wait: 480,
        decide: '가스를 얼마나 챙길지'
      }
    ],
    doneTitle: '퀘스트 클리어 — 네가 직접 해냈어!',
    /* {SIGS}·{GAS}·{WAIT} 는 기록판 값으로 채운다. 고른 브릿지에 따라 달라지기 때문이다. */
    doneLine: '네가 지갑에 서명한 횟수는 {SIGS}번, 가스로 나간 돈은 {GAS}, 기다린 시간은 {WAIT}. 그리고 중간마다 네가 직접 골라야 했지.',
    nextCta: '이번엔 솔버 모드로 다시 해 볼까?'
  },

  /* ── 솔버 모드: 원하는 결과만 말한다 ─────────────── */
  solver: {
    label: '솔버 모드',
    pay: { chain: 'ethereum', token: 'eth', amount: 0.15 },
    want: { chain: 'robinhood', token: 'usdc' },
    minReceive: 517,
    minStep: 5,
    /* 응답한 솔버들의 견적. 유저가 고르지 않는다 — 규칙이 조건이 가장 좋은 것을 고른다. */
    /* delay 는 견적이 도착하는 시점(ms). 서로 다른 시점에 하나씩 튀어 들어온다. */
    quotes: [
      { name: '솔버 B',  amount: 538.40, time: '~20초', delay: 500 },
      { name: 'Radius',  amount: 540.90, time: '~25초', delay: 1150, radius: true },
      { name: '솔버 A',  amount: 539.12, time: '~30초', delay: 1700 },
      { name: '솔버 C',  amount: 536.75, time: '~45초', delay: 2350 }
    ],
    pickAfter: 700,   /* 마지막 견적 뒤 규칙이 고르기까지 */
    lines: [['최소 받을 수량', '{MIN} USDC'], ['네 지갑에서 나가는 가스', '없어'], ['도착 체인의 가스', '필요 없어, 솔버가 대신 실행해'], ['예상 시간', '~25초']],
    sig: { name: 'Sign order', gas: 0 },
    wait: 25,
    decide: '최소 받을 수량',
    /* 서명 뒤 화면에 남는 짧은 복기. 솔버가 한 일은 공통 역할까지만. */
    behind: [
      '솔버들은 견적을 내기 전에 이 거래를 따져 봤어. 이 거래가 가능한지, 필요한 USDC를 어떻게 마련할지, 어떤 경로로 옮길지',
      '프로토콜의 규칙이 그중 조건이 제일 좋은 견적을 골랐어',
      '골라진 솔버가 자기가 가진 USDC를 Robinhood Chain 위에서 네 지갑으로 먼저 보내 줬어',
      '네가 낸 ETH는 프로토콜 규칙에 따라 그 솔버에게 정산돼',
      '중간에 필요한 스왑·브릿지·가스는 전부 솔버가 처리했어. 네가 할 일이 아니었지'
    ],
    doneTitle: '퀘스트 클리어 — 솔버가 대신 해냈어!',
    doneLine: '네가 서명한 건 딱 1번. 가스는 네 지갑에서 나가지 않았고, 도착 체인의 가스도 챙길 필요가 없었어.',
    nextCta: '두 방식을 나란히 비교해 볼까?'
  },

  /* ── 기록판 ── 두 모드가 같은 항목으로 쌓인다 */
  board: {
    title: '기록판',
    sub: '같은 지갑 · 같은 Quest',
    rows: [
      { key: 'sigs',   label: '지갑 서명 횟수',        unit: '번' },
      { key: 'gas',    label: '내 지갑에서 나간 가스',  unit: '$' },
      { key: 'wait',   label: '기다린 시간',           unit: 'time' },
      { key: 'decide', label: '내가 직접 고른 것',      unit: '가지' },
      /* paid·got 은 지갑 잔액 차이에서 바로 계산한다(app.js 가 따로 세지 않는다) */
      { key: 'paid',   label: '내가 낸 ETH',           unit: 'eth' },
      { key: 'got',    label: 'Robinhood Chain에 도착한 USDC', unit: 'usdc' }
    ],
    empty: '아직 안 해 봤어',
    doing: '진행 중'
  },

  /* ── 비교 화면 ── 제목 한 줄, 숫자 한 줄, 표. 설명 문장은 두지 않는다(주의사항으로).
     핵심은 솔버 모드가 얼마나 편한지다. 숫자는 기록판 값으로 채운다. */
  compare: {
    title: '솔버 모드로 하면\n이만큼 달라져',
    /* 두 모드가 다 끝나면 뜨는 두 줄. 첫 줄은 서명·가스·시간, 둘째 줄은 낸 ETH·받은 USDC. */
    headline: '서명 {SIGS_N}번 → {SIGS_S}번 · 가스 {GAS_N} → {GAS_S} · 기다림 {WAIT_N} → {WAIT_S}',
    verdict: {
      cheaper: '게다가 솔버 모드에서 ETH를 {DIFF} 덜 내고, USDC는 {GOT} 더 받았어.',
      mixed: 'USDC는 네가 직접 한 쪽이 {GOT} 더 받았지만, ETH는 솔버 모드에서 {DIFF} 덜 냈고 {WAIT}을 기다리지 않아도 됐어.'
    },
    cta: '처음부터 다시 해 볼까?'
  },

  /* ── 코치마크 ── 처음 들어온 화면에서 한 번만. 눌러서 넘긴다.
     여기가 개념을 설명하는 자리다. 체인·토큰·가스가 처음 나오면 그 자리의 예로 풀어 준다. */
  coach: {
    wallet: [
      { at: '[data-coach="chains"]', title: '같은 토큰이라도 체인이 다르면 따로야',
        text: '같은 USDC라는 이름이어도 체인마다 따로 발행되고 따로 기록돼. 그래서 Arbitrum 위의 USDC와 Robinhood Chain 위의 USDC는 서로 다른 토큰처럼 따로 취급돼. 이 탭에서 Robinhood Chain을 눌러서, 그 체인에 뭐가 있는지 확인해 봐.' }
    ],
    'wallet-empty': [
      { at: '[data-coach="empty"]', title: 'Robinhood Chain에는 아직 아무것도 없어',
        text: 'Quest에 필요한 500 USDC는 이 Robinhood Chain 위에 있어야 해. 지금 네 지갑에는 없으니, 다른 체인에 있는 자산으로 500 USDC를 만들어서 여기로 옮겨 와야 해!' }
    ],
    normal: [
      { at: '[data-coach="pay"]', title: '네가 낼 것',
        text: 'Ethereum과 ETH는 같아 보이지만 서로 다른 걸 가리켜. Ethereum은 체인(네트워크)이고, ETH는 그 체인에서 쓰이는 토큰이야. 네 지갑에는 Ethereum 위에 0.84 ETH가 있고, 그중 0.1475 ETH를 이번 거래에 낼 거야.' },
      { at: '[data-coach="get"]', title: '네가 받을 것',
        text: 'Robinhood Chain 위의 USDC야. 지금 낼 것과 비교하면 체인도 다르고(Ethereum → Robinhood Chain) 토큰도 달라(ETH → USDC). 그래서 이 거래는 스왑과 브릿지를 둘 다 해야 해.' },
      { at: '[data-coach="plan"]', title: '이 거래는 한 번에 안 돼',
        text: '스왑, 브릿지, 그리고 도착 체인의 가스 준비까지 세 단계가 필요해. 앱은 해야 할 일을 보여 줄 뿐이고, 순서대로 실행하고 중간에 고르는 건 네 몫이야.' },
      { at: '[data-coach="gas"]', title: '가스가 뭐냐면',
        text: '가스는 거래를 보낼 때마다 그 체인에 내는 수수료야. 여기 "네트워크 수수료"가 가스고, 네가 서명할 때마다 네 지갑의 ETH에서 나가.' }
    ],
    solver: [
      { at: '[data-coach="toggle"]', title: '솔버 모드',
        text: '같은 지갑, 같은 출발점이야. 달라지는 건 거래를 처리하는 방식이야. 네가 직접 단계를 밟는 대신, 원하는 결과만 말하면 솔버가 대신 처리해.' },
      { at: '[data-coach="min"]', title: '네가 정하는 건 이것뿐이야',
        text: '최소 몇 USDC를 받을지만 정해. 이보다 적게 받는 거래는 아예 성립하지 않아. 경로도, 브릿지도, 가스도 네가 고를 필요가 없어.' },
      { at: '[data-coach="quote"]', title: '견적을 받아 보자',
        text: '견적 받기를 누르면 여러 솔버가 각자 "이 조건으로 해 주겠다"고 답해. 그중 누가 실행할지는 네가 아니라 프로토콜의 규칙이 골라.' }
    ],
    next: '다음', done: '알겠어', skip: '건너뛰기'
  },

  /* 지갑 서명 시트 — 실제 지갑 앱의 서명 요청을 본떴다 */
  sign: { title: '서명 요청', from: 'Radius Swap (예시 앱)', confirm: '확인', reject: '거절', changes: '예상 변화', fee: '네트워크 수수료(가스)', free: '$0 · 가스 없음', approveWhat: '브릿지 컨트랙트가 네 USDC를 쓸 수 있게 허용' },

  /* 대기 화면. 실제 시간을 다 기다리게 하지 않고 빨리 감는다 — 그렇다고 말한다. */
  pending: { title: '처리 중', ff: '빨리 감기', done: '완료', explorer: '익스플로러에서 보기', order: '주문' },

  ui: {
    wallet: { total: '총 자산', all: '전체', empty: '이 체인에는 아직 아무것도 없어', cta: '500 USDC 마련하러 가자' },
    swap: {
      pay: '내는 것', get: '받는 것', balance: '잔액', max: 'MAX',
      plan: '해야 할 일', run: '실행', ran: '완료', optTime: '예상',
      quote: '견적 받기', quoting: '솔버들이 답하는 중', waitingOne: '답을 기다리는 중', picking: '규칙이 고르는 중', picked: '규칙이 고른 조건',
      pickNote: '{WHO}의 견적이 골라졌어.',
      quoteHint: '견적 받기를 누르면 솔버들이 각자 조건을 제시해',
      sign: '서명하기', min: '최소 받을 수량',
      stepHint: '{N}단계부터 실행해 보자'
    },
    /* 막혔을 때 뜨는 말. 눌리기만 하고 아무 말이 없으면 고장으로 읽힌다. */
    toast: {
      pending: '거래 처리가 끝나면 다음으로 넘어갈 수 있어.',
      step: '{N}단계 카드의 실행 버튼을 눌러 봐. 지갑 서명 시트가 뜰 거야.',
      quoting: '솔버들이 답하는 중이야. 잠깐이면 돼.',
      busy: '거래를 처리하는 중이야. 끝나면 버튼이 바뀔 거야.',
      mode: '거래 처리가 끝나면 모드를 바꿀 수 있어.',
      max: '예시라서 수량은 고정이야. 체인과 토큰에 집중하려고 그랬어.',
      explorer: '예시 화면이라서 익스플로러는 열리지 않아.'
    },
    lang: { ko: 'KOR', en: 'EN', soon: '영어 버전은 아직 준비 중이야. 지금은 한글만 볼 수 있어!' },
    back: '이전', restart: '처음으로'
  },

  steps: [
    { type: 'mission', label: 'Quest' },
    { type: 'wallet',  label: '지갑' },
    { type: 'swap',    label: '거래' },
    { type: 'compare', label: '비교' }
  ]
};
