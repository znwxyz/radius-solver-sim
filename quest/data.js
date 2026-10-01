/* IDEA 2 — 일반 모드 vs Intent 모드(예전 이름 솔버 모드)
   화면에 나오는 문장·수치·순서는 전부 여기에 있다. 문장을 고칠 때 여는 파일.

   말투: 친한 선배가 옆에서 알려 주는 해체 반말. "~해 봐", "~하자", "~야", "~거든".
   "~다."로 끝나는 설명문은 쓰지 않는다. 존댓말도 쓰지 않는다. 화면 전체가 한 사람 목소리여야 한다.

   독자는 초심자다. 주어와 목적어를 생략하지 않는다. "옮겨야 해"가 아니라
   "USDG를 Robinhood Chain으로 옮겨야 해". 체인·토큰·가스 같은 말은 처음 나오는 자리에서
   그 자리의 예로 풀어 준다. 수량은 "500 USDG"처럼 숫자를 앞에 쓴다.

   지켜야 할 것
   - 수치는 전부 예시값이다. 화면 아래 주의사항이 그렇다고 말한다. 화면 안에서는 반복하지 않는다.
   - 유저는 솔버를 고르지 않는다. 규칙이 실행자를 정한다.
   - 솔버가 하는 일은 공통 역할(조건 판단·자산 마련·실행)까지만 적는다.
   - 시나리오의 체인·토큰·캠페인은 설명을 위한 예시다. 실제 앱·캠페인이 아니다. */

var ICON_V = '?v=5';

window.MODE = {

  /* ── Quest ──────────────────────────────────────
     게임 퀘스트처럼. 구체적인 상황이 있어야 "왜 옮겨야 하는지"가 몸으로 느껴진다.
     Robinhood Chain 은 2026-07 메인넷이 열린 Arbitrum 계열 L2 이고 가스는 ETH 다.
     이 체인의 달러 스테이블코인은 Paxos 의 USDG 다 — USDC 는 없고, USDC 를 보내면 USDG 로 도착한다(2026-10-01 확인, 동료 피드백).
     여기서 무엇을 살 수 있는지는 예시이며, 실제 상품·캠페인을 설명하는 것이 아니다. */
  mission: {
    word: 'Quest',
    pill: 'Robinhood Chain에서 500 USDG 마련하기!',   /* 지갑·거래 화면 위에 계속 떠 있는 한 줄 */
    clear: '퀘스트 클리어',
    /* 첫 화면 = 온보딩(2026-09-30, 사용자 요청: 글이 너무 많고 온보딩스럽지 않다).
       위의 무대(체인 층 두 장)는 그대로 있고, 장을 넘기면 움직임이 바뀐다. 한 장에 한 문장 —
       사용자가 준 문장을 쪼갠 그대로다. 장은 더 늘어나도 된다(사용자).
       예전 이야기 세 문단과 Quest 박스는 solver-b-mode-backup-0930/ 에 있다. */
    /* 장마다 글 한 덩어리. 라벨·제목/본문 위계 없이 같은 크기(사용자 요청). **단어** 는 굵게, \n 은 줄바꿈 */
    onboard: [
      /* 표지 — 바닥 없이 토큰만 떠 있다. 넘기면 1장에서 체인 층이 날아와 그 아래에 앉는다 */
      { key: 'cover',  text: '**온체인 거래,\n직접 해 보기**',
        note: '토큰·체인·스왑·브릿지부터 솔버를 통한 거래까지,\n손으로 넘기며 알아보자.' },   /* 사용자 문장(2026-09-30) */
      { key: 'tokens', text: '우리가 아는 **토큰**들은\n**체인** 위에 존재해' },
      { key: 'swap',   text: '체인 안에서\n토큰들끼리 교환하는 것을\n**스왑**이라고 하고,' },
      { key: 'bridge', text: '토큰이 속해있는 체인을 바꾸는 건,\n체인을 건너가야 하니까\n**브릿지**라고 해.' },
      { key: 'ask',    text: '스왑과 브릿지를\n한 번에 할 수는 없냐고?\n가능하지.' },
      { key: 'cross',  text: '그건 **크로스체인 스왑**이야.\n토큰도 속한 체인도\n바꿔버리는 것.' },   /* "토큰 이름도" → "토큰도"(동료 피드백) */
      /* 예전 첫 화면 이야기에서 살린 한 가지 — Quest 의 이유. 1장의 스톡 토큰이 다시 나온다 */
      { key: 'why',    text: 'Robinhood Chain에서는\n기존 주식을 토큰화한\n**스톡 토큰**을 살 수 있어.\n이 과정을 직접 한 번 해볼래?' },   /* 사용자 문장. 달러(USDG) 얘기는 하지 않는다 */
      { key: 'quest',  text: '**온체인 거래,\n솔버가 있으면 뭐가 달라질까?**',   /* 사용자가 고침(2026-09-30) */
        note: '직접 토큰과 체인을 골라서\nRobinhood Chain 위의 500 USDG를 만들어 보자.' }   /* 마지막 장만: 아래 작은 보통 굵기 한 문단 */
    ],
    /* 1장 아래층(Robinhood Chain) 위의 스톡 토큰 예시. 미국 주식 1주 = 토큰 1개. 체인 위 실제 티커 표기는 확인 못 해서
       누구나 아는 종목을 예시로 쓴다. 회사 로고는 쓰지 않고 티커 첫 글자 동전(상표). 색은 로고색이 아닌 구분용.
       Robinhood 브랜드 규칙상 "스톡 토큰"이라 부른다. key 는 tools/onboard_keyframes.py 의 STOCKS 와 같게 */
    /* 마지막 장: 체인 층 넷(위 Ethereum, 아래 왼쪽 Base, 아래 오른쪽 Arbitrum, 맨 아래 Robinhood Chain), 층마다 동전 3개.
       같은 이름 토큰이 체인마다 따로 있다는 것 + 이번 Quest 가 만들 Robinhood Chain 의 USDG. 자리는 tools/onboard_keyframes.py 의 QUEST */
    questFloors: [
      { chain: 'ethereum',  tokens: ['eth', 'usdc', 'usdt'] },
      { chain: 'base',      tokens: ['dai', 'eurc', 'aero'] },   /* 층마다 다른 토큰으로 다채롭게(사용자) */
      { chain: 'arbitrum',  tokens: ['arb', 'gmx', 'wbtc'] },
      { chain: 'robinhood', tokens: ['usdg', 'tsla', 'nvda'] }
    ],
    /* 마지막 장에만 나오는 토큰. 로고 파일이 있으면 로고 동전, 없으면(상표) 색 원 + 첫 글자 동전. 색은 구분용 */
    moreTokens: [
      { key: 'dai',  name: 'DAI',  icon: '../brand/tokens/dai.svg' + ICON_V },
      { key: 'eurc', name: 'EURC', icon: '../brand/tokens/eurc.svg' + ICON_V },
      { key: 'aero', name: 'AERO', color: '#3f6fd8' },
      { key: 'arb',  name: 'ARB',  color: '#2d8fd5' },
      { key: 'gmx',  name: 'GMX',  color: '#6a5bd6' }
    ],
    stocks: [
      { key: 'tsla', name: 'TSLA', color: '#d9534f' },
      { key: 'nvda', name: 'NVDA', color: '#4c9a5f' },
      { key: 'aapl', name: 'AAPL', color: '#6b7280' }
    ],
    tags: { swap: 'swap!', bridge: 'bridge!', cross: 'cross-chain swap!' },   /* 일어나는 자리에서 톡 튀어나왔다 사라지는 글씨(배경 없음) */
    need: { chain: 'robinhood', token: 'usdg', amount: 500 },
    cta: '먼저 내 지갑을 확인해 볼까?'
  },

  chains: {
    ethereum:  { name: 'Ethereum',       short: 'ETH',  icon: '../brand/chains/ethereum.svg' + ICON_V, color: '#8e97ef', gas: 'eth' },
    arbitrum:  { name: 'Arbitrum',       short: 'ARB',  icon: '../brand/chains/arbitrum.svg' + ICON_V, color: '#12aaff', gas: 'eth' },
    base:      { name: 'Base',           short: 'BASE', icon: '../brand/chains/base.svg' + ICON_V,     color: '#3b6bff', gas: 'eth' },
    robinhood: { name: 'Robinhood Chain', short: 'RH',  icon: '../brand/chains/robinhood.png' + ICON_V, color: '#ccff00', gas: 'eth' }   // 공식 깃털 심볼 · Robin Neon
  },
  chainOrder: ['ethereum', 'arbitrum', 'base', 'robinhood'],

  tokens: {
    eth:  { name: 'ETH',  full: 'Ether',      icon: '../brand/tokens/eth.svg' + ICON_V,  color: '#627eea', price: 3684.72, dp: 4 },
    usdc: { name: 'USDC', full: 'USD Coin',   icon: '../brand/tokens/usdc.svg' + ICON_V, color: '#2775ca', price: 1,       dp: 2 },
    usdg: { name: 'USDG', full: 'Global Dollar', icon: '../brand/tokens/usdg.png' + ICON_V, color: '#5d7f2a', price: 1,       dp: 2 },   // Paxos. Robinhood Chain 의 기본 달러
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
        id: 'swap', kind: '스왑',
        title: 'Ethereum에서 ETH를 USDG로 바꾸기',
        why: '먼저 Ethereum 위에서 네 ETH를 USDG로 바꾸자. 이렇게 같은 체인 안에서 토큰을 바꾸는 걸 스왑이라고 해.',   /* 할 일부터, 두 문장만(사용자) */
        from: { chain: 'ethereum', token: 'eth',  amount: 0.1475 },
        to:   { chain: 'ethereum', token: 'usdg', amount: 541.87 },
        lines: [['네트워크 수수료(가스)', '$3.84'], ['가격 영향', '<0.01%'], ['슬리피지 허용', '0.5%'], ['경로', 'ETH → USDG (0.05%)']],
        sigs: [{ name: 'Swap', gas: 3.84 }],
        wait: 15,
        decide: '슬리피지 허용치'
      },
      {
        id: 'bridge', kind: '브릿지',
        title: 'USDG를 Ethereum에서 Robinhood Chain으로 옮기기',
        why: 'Ethereum 위의 USDG와 Robinhood Chain 위의 USDG는 서로 다른 장부에 기록돼. 우리한테 필요한 건 Ethereum 위의 USDG가 아니라 Robinhood Chain 위의 USDG니까, 방금 만든 USDG를 브릿지로 Ethereum에서 Robinhood Chain으로 옮겨야 해. 브릿지마다 수수료와 걸리는 시간이 다르니, 네 상황에 맞는 브릿지를 골라 봐.',
        from: { chain: 'ethereum',  token: 'usdg', amount: 541.87 },
        to:   { chain: 'robinhood', token: 'usdg' },
        /* 어느 브릿지로 갈지 유저가 고른다. 고른 것에 따라 수수료·가스·시간·도착 수량이 바뀌고,
           그대로 서명 시트·처리 중·기록판에 오른다. slow 는 처리 중 애니메이션을 다른 것보다 느리게 돌린다.
           Ethereum → Robinhood Chain 공식 브릿지 입금은 약 10분이다(7일은 반대 방향 출금 — 예전 값이 틀렸다, 2026-10-01).
           pick 은 아직 고르기 전 카드에 미리 보여 주는 기본값이다. */
        options: [
          { name: '공식 브릿지',      fee: 0,    gas: [1.92, 3.60], wait: 10 * 60, amount: 541.87, slow: true },
          { name: '서드파티 브릿지 A', fee: 1.63, gas: [1.92, 4.10], wait: 3 * 60,  amount: 540.24, pick: true },
          { name: '서드파티 브릿지 B', fee: 2.90, gas: [1.92, 4.35], wait: 60,      amount: 538.97 }
        ],
        labels: { fee: '브릿지 수수료', gas: '네트워크 수수료(가스)', time: '예상 시간' },
        sigNames: ['Approve USDG', 'Bridge'],
        decide: '어느 브릿지로 갈지'
      }
    ],
    /* 예전 3단계(Robinhood Chain 가스용 ETH 챙기기)는 뺐다 — 받는 데는 가스가 안 들고, 그 뒤 거래용 가스는
       두 모드 모두 똑같이 필요해서 비교가 공정하지 않았다(동료 피드백, 2026-10-01) */
    doneTitle: '퀘스트 클리어',   /* 사용자: "네가 직접 해냈어" 빼기(2026-09-30) */
    /* {SIGS}·{GAS}·{WAIT} 는 기록판 값으로 채운다. 고른 브릿지에 따라 달라지기 때문이다. */
    doneLine: '지갑에 서명한 횟수는 {SIGS}번, 가스로 나간 돈은 {GAS}, 기다린 시간은 {WAIT}.',   /* 사용자: "네가"·마지막 문장 빼기 */
    nextCta: '이번엔 Intent 모드로 다시 해 볼까?'
  },

  /* ── Intent 모드(예전 이름 솔버 모드): 원하는 결과만 말하면 솔버가 처리한다 ───── */
  solver: {
    label: 'Intent 모드',   /* 동료 피드백·사용자 결정(2026-10-01). 따로 설명 줄은 두지 않는다 */
    pay: { chain: 'ethereum', token: 'eth', amount: 0.148 },   /* 일반 모드(낸 ETH + 가스 ≈ 0.1500)보다 덜 낸다 — 결과의 "더 적게 내고" */
    want: { chain: 'robinhood', token: 'usdg' },
    minReceive: 517,
    minStep: 5,
    /* 응답한 솔버들의 견적. 유저가 고르지 않는다 — 규칙이 조건이 가장 좋은 것을 고른다. */
    /* delay 는 견적이 도착하는 시점(ms). 서로 다른 시점에 하나씩 튀어 들어온다. */
    quotes: [
      { name: '솔버 B',  amount: 538.40, time: '~20초', delay: 800 },
      { name: 'Radius',  amount: 540.90, time: '~25초', delay: 1700, radius: true },
      { name: '솔버 A',  amount: 539.12, time: '~30초', delay: 2500 },
      { name: '솔버 C',  amount: 536.75, time: '~45초', delay: 3300 }
    ],
    pickAfter: 1000,   /* 마지막 견적 뒤 규칙이 고르기까지 */
    lines: [['최소 받을 수량', '{MIN} USDG'], ['네트워크 수수료(가스)', '$0', 'free'], ['예상 시간', '~25초']],   /* 셋째 칸: free = 가스가 안 드는 줄 */
    sig: { name: 'Sign order', gas: 0 },
    wait: 25,
    decide: '최소 받을 수량',
    /* 서명 뒤 화면에 남는 짧은 복기. 솔버가 한 일은 공통 역할까지만. */
    behind: [
      '솔버들은 견적을 내기 전에 이 거래가 가능한지, 필요한 USDG를 어떻게 마련할지, 어떤 경로로 옮길지를 다 계산해 봤어. 자기한테도 수익이 남는 거래라고 판단한 솔버만 견적을 냈어',
      '프로토콜의 규칙이 여러 솔버의 견적 중 조건이 가장 좋은 견적을 골라 줬어',
      '선정된 솔버가 자기가 가진 USDG를 Robinhood Chain 위에서 네 지갑으로 먼저 보내 줬어. 그래서 솔버를 통하면 이렇게 쉽고 빨라져',
      '네가 낸 ETH는 프로토콜 규칙에 따라 그 솔버에게 정산될 거야',
      '복잡한 스왑·브릿지 과정과 여러 번 드는 가스비는 전부 솔버가 도맡아 처리했어. 너는 결과만 받으면 됐지'
    ],
    doneTitle: '퀘스트 클리어 — 솔버가 대신 해냈어!',
    doneLine: '네가 서명한 건 딱 1번이고, 가스는 네 지갑에서 나가지 않았어.',
    nextCta: '두 방식을 나란히 비교해 볼까?'
  },

  /* ── 기록판 ── 두 모드가 같은 항목으로 쌓인다 */
  board: {
    title: '기록판',
    rows: [
      { key: 'sigs',   label: '지갑 서명 횟수',        unit: '번' },
      { key: 'gas',    label: '내 지갑에서 나간 가스',  unit: '$' },
      { key: 'wait',   label: '기다린 시간',           unit: 'time' },
      { key: 'decide', label: '내가 직접 고른 것',      unit: '가지' },
      /* paid·got 은 지갑 잔액 차이에서 바로 계산한다(app.js 가 따로 세지 않는다) */
      { key: 'paid',   label: '내가 낸 ETH',           unit: 'eth' },
      { key: 'got',    label: 'Robinhood Chain에 도착한 USDG', unit: 'usdg' }
    ],
    empty: '아직 안 해 봤어',
    doing: '진행 중'
  },

  /* ── 비교 화면 ── 제목과 표뿐. 문장으로 다시 설명하지 않는다 — 표의 솔버 열이 강조된다. */
  compare: {
    title: 'Intent 모드로 하면\n이만큼 달라져',
    /* 표 아래 한 줄 카피. 수치는 표에 있으니 여기선 안 쓴다. 두 모드를 다 마쳤을 때만 */
    tagline: '더 적게 서명하고,\n더 적게 내고,\n더 빨리 받았어.',   /* 사용자 확정(2026-09-30) */
    tagSub: '솔버에게 맡기면 거래가 이만큼 쉽고 편해져.',
    cta: '솔버가 더 궁금해?'   /* 다음 화면(솔버 설명)으로 — 사용자 */
  },

  /* ── 솔버 설명 ── 결과 화면 버튼("솔버가 더 궁금해?") 다음 화면. 옆으로 넘기는 5장(표지 없이), 장마다 앱 UI 카드 그림 + 글 한 덩어리.
     그림은 why.js. 동료가 물은 두 가지 — "솔버는 어떻게 이렇게 빨리?"(1~3장), "솔버는 무슨 이득?"(4장) + Radius(5장). 2026-10-01 사용자.
     근거: Across 문서(릴레이어가 도착 체인에서 자기 자금을 먼저 보내고 나중에 정산받는다), Radius 인터뷰(LI.FI Solver Deep Dives —
     판단·인벤토리·실행정산 세 겹, 자동 판단, 정산·리밸런싱 뒤에도 수익이 남는지 계산, 받을 주문을 고르는 게 실력).
     Radius 의 실제 운영 체인·자산은 단정하지 않는다. "남는"은 주어 없이 쓰지 않는다(사용자). ask 는 왼쪽 위 검정 말풍선.
     method = Radius 자료의 솔버 유동성 마련 방법 세 가지(Optimal On-chain Routing · Ring Trading · Internal Inventory) */
  why: {
    pages: [
      /* 질문은 따로 한 장 — 큰 검정 말풍선 + 다음 장들로 이어지는 한 줄(사용자: 한 장에 요소가 너무 많았다) */
      { key: 'askFast', ask: '솔버는 어떻게\n이렇게 빨리 해 줄 수 있어?',
        text: '솔버가 Intent를 해결하는 방법은\n크게 **세 가지**야.' },   /* "USDG를 마련하는" → "Intent를 해결하는"(사용자) */
      /* 세 방법은 가장 좋은 경로가 먼저 — 솔버의 메인 일(사용자) */
      { key: 'route',  method: '방법 1 · 가장 좋은 경로',
        text: '솔버는 먼저\n여러 거래소와 브릿지를 비교해\n**가장 좋은 경로**를 찾아.\n필요하면 나눠서 보내기도 해.' },
      { key: 'ring',   method: '방법 2 · 맞물리는 주문',
        text: '반대로 바꾸려는 사람이 있으면\n두 주문의 방향을 **서로 맞바꾸는**\n방법을 쓸 수도 있어.' },   /* 사용자 문장 */
      { key: 'stock',  method: '방법 3 · 미리 가진 자산',
        text: '솔버는 여러 체인에\n**자산을 미리** 갖고 있다가\n필요할 때 바로\n네 지갑으로 보내는 거야.' },   /* 사용자 문장("유저 지갑" → 앱 말투대로 "네 지갑") */
      { key: 'decide', text: '주문이 들어오면 솔버는\n가격, 위험, 리밸런싱 비용까지\n**아주 빠르게** 따져 보고,\n견적을 보낼지 말지 결정해.' },   /* 사용자 문장 */
      { key: 'later',  text: '네가 낸 ETH는 **나중에**\n솔버에게 정산돼.\n써 버린 자산을 다시 채우는 시간도\n솔버가 감당해.' },
      { key: 'askEarn', ask: '솔버는 무슨 이득이\n있길래 해 줘?',
        text: '솔버도 **수익**이 있어야\n움직이거든.' },
      { key: 'earn',   text: '이 차이가 **솔버 수익의 바탕**이야.\n비용을 빼고도 수익성이 있다고\n판단한 주문에\n경쟁적으로 견적을 보내.' },   /* 사용자 문장 */
      { key: 'radius', text: '**Radius**도 이런 솔버 중 하나야.\n어떤 주문을 받고 어떤 주문을\n거절할지 고르는 일에 집중해.' }
    ],
    /* 그림 속 글. 솔버 지갑 잔액은 설명용 예시값 */
    ui: {
      wallet: '솔버의 지갑',
      /* 여러 체인 속 여러 돈(3×3). 가운데 아래 칸(Robinhood Chain 의 USDG)이 사용자에게 바로 떨어진다 — 자리는 why.css 의 --drop */
      inventory: [['ethereum', 'eth', 412.5], ['ethereum', 'usdc', 84200], ['ethereum', 'usdt', 39800],
                  ['arbitrum', 'usdc', 51900], ['arbitrum', 'eth', 128.4], ['base', 'usdc', 22600],
                  ['base', 'eth', 96.1], ['robinhood', 'usdg', 63500], ['robinhood', 'eth', 54.2]],
      ringYou: '너', ringOther: '다른 사람', routeHead: '경로 비교',
      routes: [['거래소 A', '브릿지 X', -0.8], ['거래소 B', '브릿지 Y', 0], ['거래소 A + C', '나눠 보내기', -0.35]],   /* 셋째 칸: 가장 좋은 경로와의 차이(USDG) — 설명용 예시 */
      solverName: 'Radius 솔버', checks: ['가격', '위험', '가진 자산', '리밸런싱 비용'], send: '견적 보내기!',   /* 생각 말풍선 속 네 가지 — 다 체크되면 견적 보내기가 켜진다 */
      you: '너', solver: '솔버', youSteps: ['서명', 'USDG 도착'], solverSteps: ['ETH 정산 받기', '자산 다시 채우기'], later: '나중에',
      paid: '네가 낸 것', got: '네가 받은 것', diff: '차이', costs: ['가스', '정산 비용', '다시 채우는 비용'], profit: '솔버 수익',
      orders: ['주문 A', '주문 B', '주문 C'], accept: '받음', decline: '거절'
    },
    link: 'Radius 인터뷰 읽기',
    url: 'https://li.fi/knowledge-hub/the-solver-deep-dives-%E2%80%93-radius',
    cta: '처음부터 다시 해 볼까?'
  },

  /* ── 코치마크 ── 처음 들어온 화면에서 한 번만. 눌러서 넘긴다.
     여기가 개념을 설명하는 자리다. 체인·토큰·가스가 처음 나오면 그 자리의 예로 풀어 준다. */
  coach: {
    wallet: [
      /* 먼저 한 줄 읽는 법, 그다음 체인 탭. 마지막 장면이 "Robinhood Chain을 눌러 봐"로 끝나야 바로 행동으로 이어진다. */
      { at: '[data-coach="asset"]', title: '이 한 줄을 읽는 법',
        text: 'Base는 체인이고, ETH는 토큰이야. 그러니까 이 줄은 "Base 체인 위에 있는 ETH"야. 0.0110은 그 ETH의 수량(0.0110 ETH)이고, 그 아래 $40.53은 그 수량을 지금 시세로 달러로 환산한 값이야.' },
      { at: '[data-coach="chains"]', title: '같은 토큰이라도 체인이 다르면 다르게 취급돼',
        text: '같은 USDC라는 이름이어도 체인마다 따로 발행되고 따로 기록돼. 그래서 Arbitrum 위의 USDC와 Base 위의 USDC는 서로 다른 토큰처럼 따로 취급돼. 이 탭에서 Robinhood Chain을 눌러서, 그 체인에 뭐가 있는지 확인해 봐.' }
    ],
    'wallet-empty': [
      { at: '[data-coach="empty"]', title: 'Robinhood Chain에는 아직 아무것도 없어',
        text: 'Quest에 필요한 500 USDG는 이 Robinhood Chain 위에 있어야 해. USDG는 Robinhood Chain에서 쓰는 달러 스테이블코인이야. 지금 네 지갑에는 없으니, 다른 체인에 있는 자산으로 500 USDG를 만들어서 여기로 옮겨 와야 해!' }
    ],
    normal: [
      { at: '[data-coach="pay"]', title: '네가 낼 것',
        text: 'Ethereum과 ETH는 같아 보이지만 서로 다른 걸 가리켜. Ethereum은 체인(네트워크)이고, ETH는 그 체인에서 쓰이는 토큰이야. 네 지갑에는 Ethereum 위에 0.84 ETH가 있고, 그중 0.1475 ETH를 이번 거래에 낼 거야.' },
      { at: '[data-coach="get"]', title: '네가 받을 것',
        text: 'Robinhood Chain 위의 USDG야. 지금 낼 것과 비교하면 체인도 다르고(Ethereum → Robinhood Chain) 토큰도 달라(ETH → USDG). 그래서 이 거래는 스왑과 브릿지를 둘 다 해야 해.' },
      { at: '[data-coach="plan"]', title: '이 거래는 한 번에 안 돼',
        text: '스왑과 브릿지, 두 단계가 필요해. 아래 해야 할 일을 1단계부터 순서대로 실행해 봐.' }
    ],
    /* 1단계를 실행해서 서명 요청이 뜬 그때, 시트의 수수료 줄을 짚는다. 미리 말하면 볼 것이 없다. */
    gas: [
      { at: '[data-coach="gas"]', title: '가스가 뭐냐면',
        text: '가스는 거래를 보낼 때마다 그 체인에 내는 수수료야. 여기 "네트워크 수수료"가 가스고, 네가 서명할 때마다 네 지갑의 ETH에서 나가.' }
    ],
    solver: [
      { at: '[data-coach="toggle"]', title: 'Intent 모드',
        text: '일반 모드에선 스왑하고 브릿지하고, 네가 한 단계씩 직접 밟았지? Intent 모드에선 \'이걸 내고 저걸 받고 싶어\'라는 결과만 말해. 나머지 과정은 솔버가 맡아.' },   /* 사용자가 고름(2026-10-01) */
      { at: '[data-coach="min"]', title: '네가 정하는 건 이것뿐이야',
        text: '최소 몇 USDG를 받을지만 정해. 이보다 적게 받는 거래는 아예 성립하지 않아. 경로도, 브릿지도, 가스도 네가 고를 필요가 없어.' },
      { at: '[data-coach="quote"]', title: '견적을 받아 보자',
        text: '견적 받기를 누르면 여러 솔버가 각자 "이 조건으로 해 주겠다"고 답해. 그중 누가 실행할지는 네가 아니라 프로토콜의 규칙이 골라.' }
    ],
    next: '다음', done: '알겠어', skip: '건너뛰기'
  },

  /* 지갑 서명 시트 — 실제 지갑 앱의 서명 요청을 본떴다 */
  sign: { title: '서명 요청', confirm: '확인', reject: '거절', changes: '예상 변화', fee: '네트워크 수수료(가스)', free: '$0 · 가스 없음', approveWhat: '브릿지 컨트랙트가 네 USDG를 쓸 수 있게 허용' },

  /* 대기 화면. 실제 시간을 다 기다리게 하지 않고 빨리 감는다 — 그렇다고 말한다. */
  pending: { title: '처리 중', done: '완료', explorer: '익스플로러에서 보기', order: '주문' },

  ui: {
    wallet: { total: '총 자산', all: '전체', empty: '이 체인에는 아직 아무것도 없어', cta: '500 USDG 마련하러 가자' },
    swap: {
      pay: '내는 것', get: '받는 것', balance: '잔액', max: 'MAX',
      plan: '해야 할 일', run: '실행', ran: '완료', optTime: '예상',
      quote: '견적 받기', quoting: '솔버들이 답하는 중', waitingOne: '답을 기다리는 중', picking: '규칙이 고르는 중',
      quoteHint: '견적 받기를 누르면 솔버들이 각자 조건을 제시해',
      sign: '서명하기', min: '최소 받을 수량',
    },
    /* 막혔을 때 뜨는 말. 눌리기만 하고 아무 말이 없으면 고장으로 읽힌다. */
    toast: {
      pending: '거래 처리가 끝나면 다음으로 넘어갈 수 있어.',
      quoting: '솔버들이 답하는 중이야. 잠깐이면 돼.',
      busy: '거래를 처리하는 중이야. 끝나면 버튼이 바뀔 거야.',
      mode: '거래 처리가 끝나면 모드를 바꿀 수 있어.',
      max: '예시라서 수량은 고정이야. 체인과 토큰에 집중하려고 그랬어.',
      explorer: '예시 화면이라서 익스플로러는 열리지 않아.'
    },
    lang: { ko: 'KOR', en: 'EN' },
    /* 시간 표기 단위 — 큰 단위 둘만(7일 2시간). 영어는 data-en.js */
    units: { d: '일', h: '시간', m: '분', s: '초' },
    quotesHead: '견적 {N}',
    /* 화면 읽기(스크린리더)용 이름 */
    a11y: {
      less: '줄이기', more: '늘리기', theme: '밝은 화면과 어두운 화면 바꾸기', lang: '언어',
      onboard: '온보딩 {N}장 — 옆으로 밀거나 아래 양옆 꺾쇠로 넘겨', prev: '이전 장', next: '다음 장'
    },
    back: '이전', restart: '처음으로'
  },

  steps: [
    { type: 'mission', label: 'Quest' },
    { type: 'wallet',  label: '지갑' },
    { type: 'swap',    label: '거래' },
    { type: 'compare', label: '결과' },
    { type: 'why',     label: '솔버' }
  ]
};
