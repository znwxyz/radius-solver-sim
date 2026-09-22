/* 화면에 나오는 것은 전부 여기에 있다. 문장을 고칠 때 여는 파일.

   이 판에서는 거래 종류를 탭으로 나누지 않는다.
   유저가 From·To 의 체인과 토큰을 직접 고르고, 그 조합에서 거래 종류가 나온다.

   지켜야 할 것
   - 유저는 솔버를 고르지 않는다. 규칙이 실행자를 정한다.
   - 같은 체인 스왑이라고 솔버가 없는 것이 아니다. CoW·UniswapX 처럼 같은 체인에서
     솔버가 실행하는 방식도 있다. 솔버는 거래 종류의 성질이 아니라 경로 선택이다.
   - Radius 가 매번 선발되지 않는다.
   - 솔버가 하는 일은 공통 역할(조건 판단·자산 마련·실행)까지만 적는다.
   - 수치는 모두 예시값이다. 화면이 그렇다고 말한다. */

var ICON_V = '?v=3';   // 아이콘을 교체하면 이 값을 올린다

window.SIM = {

  chains: {
    ethereum: { name: 'Ethereum', icon: 'brand/chains/ethereum.svg' + ICON_V, color: '#8e97ef' },
    arbitrum: { name: 'Arbitrum', icon: 'brand/chains/arbitrum.svg' + ICON_V, color: '#12aaff' },
    base:     { name: 'Base',     icon: 'brand/chains/base.svg' + ICON_V,     color: '#0052ff' },
    arc:      { name: 'Arc',      icon: 'brand/chains/arc.svg' + ICON_V,      color: '#c2185b' }
  },

  /* color 는 테두리·글자에 섞어 쓰는 값이라 너무 옅거나 어두운 공식 색은 한 단계 조정한다.
     아이콘 자체는 공식 색 그대로다(DAI #F4B731, WBTC #201A2D). */
  tokens: {
    eth:  { name: 'ETH',  icon: 'brand/tokens/eth.svg' + ICON_V,  color: '#627eea', price: 3684.72, dp: 4 },
    usdc: { name: 'USDC', icon: 'brand/tokens/usdc.svg' + ICON_V, color: '#2775ca', price: 1,       dp: 2 },
    eurc: { name: 'EURC', icon: 'brand/tokens/eurc.svg' + ICON_V, color: '#0b53bf', price: 1.08,    dp: 2 },
    usdt: { name: 'USDT', icon: 'brand/tokens/usdt.svg' + ICON_V, color: '#26a17b', price: 1,       dp: 2 },
    dai:  { name: 'DAI',  icon: 'brand/tokens/dai.svg'  + ICON_V, color: '#d79a13', price: 1,       dp: 2 },
    wbtc: { name: 'WBTC', icon: 'brand/tokens/wbtc.svg' + ICON_V, color: '#3b3350', price: 118500,  dp: 4 }
  },

  /* 받을 때 고를 수 있는 것 — 그 네트워크에 있는 토큰. 네트워크마다 목록이 다르다.
     Arc 는 Circle 의 네트워크라 짧다. 짧은 것도 설명의 일부다. */
  tokensOn: {
    ethereum: ['eth', 'usdc', 'usdt', 'dai', 'wbtc'],
    arbitrum: ['eth', 'usdc', 'usdt', 'dai', 'wbtc'],
    base:     ['eth', 'usdc', 'usdt', 'dai'],
    arc:      ['usdc', 'eurc']
  },

  /* 내가 가진 것 — 내는 쪽에서 고를 수 있는 건 여기까지다.
     받는 쪽(tokensOn)보다 짧다. 가진 것과 고를 수 있는 것은 다르다.
     지갑 화면이 한 화면에 들어오도록 줄 수를 늘리지 않는다. */
  holdings: {
    ethereum: { eth: 0.84, usdc: 1250 },
    arbitrum: { eth: 0.15, usdc: 320.5 },
    base:     { usdc: 12.4 },
    arc:      { usdc: 640, eurc: 210 }
  },

  /* 내보낼 수량은 토큰마다 정해 둔다. 축(체인·토큰)에 집중하기 위해 수량은 고르지 않는다. */
  send: { eth: 0.5, usdc: 1000, eurc: 500, usdt: 150, dai: 1000, wbtc: 0.01 },

  /* 예시 수수료율. 실제 값이 아니다. */
  fee: { swap: 0.003, bridge: 0.0008, xswap: 0.0035 },

  /* 솔버를 거쳐서 유저가 얻는 것. 숫자로 얼마나 빠르다·싸다고 말하지 않는다.
     확인된 바 없는 수치는 쓰지 않는다. 대신 '왜 그런가'를 붙여 구조로만 말한다. */
  perks: {
    head: '유저 입장에서 좋은 점들은 뭘까?',
    /* key 는 뒤집기 전 앞면에 놓는 말이다. 답을 미리 말하지 않으면서
       무엇에 대한 이야기인지는 알려 준다 — 지갑 화면의 가림 라벨과 같은 방식이다.

       이 화면만 편한 반말을 쓴다. 유저에게 직접 건네는 말이기 때문이다.
       나머지 화면은 혼자 정리하는 메모의 말투(~한다)로 둔다. */
    list: [
      { key: '서명',
        good: '서명을 여러 번 하지 않아도 돼',
        why: '체인을 오가며 여러 번 거래를 수행하는 건 솔버가 대신해 줘' },
      { key: '가스',
        good: '골치 아픈 가스비, 신경 쓰지 않아도 돼',
        why: '그 거래들의 가스는 솔버 지갑에서 나가. 체인마다 가스를 챙겨 둘 필요가 없어' },
      { key: '시간',
        good: '기다리는 시간이 줄어들어',
        why: '솔버가 먼저 자기 자산을 내주니, 모든 정산이 끝나기를 기다리지 않아도 돼' },
      { key: '경로',
        good: '경로를 고르지 않아도 되니 편하지',
        why: '어디를 거칠지는 솔버가 풀어 줘. 나는 원하는 결과만 말하면 돼' },
      { key: '수량',
        good: '받고 싶은 최소 수량을 내가 정할 수 있어',
        why: '그 아래로는 거래가 아예 성립하지 않아' }
    ]
  },

  /* 응답을 준비하는 솔버들이 따져보는 것. 누구 한 명의 고민이 아니라 다 같이 하는 고민이라,
     특정 솔버에 붙이지 않고 머리 위아래에 흩뿌린다.
     앞의 셋은 뒤의 '무슨 일을 했나' 화면이 순서대로 답한다. 나머지는 답하지 않는다 —
     거래 하나로 끝나지 않는 고민이라 이 시뮬레이션의 범위 밖이다. */
  ask: [
    '가능한 거래인가?',
    '자산을 어떻게 마련할까?',
    '어떤 경로로 이행할까?',
    '마치고도 리밸런싱이 될까?',
    '수수료를 빼도 남을까?',
    '남들보다 나은 조건일까?'
  ],

  /* 조합에서 나오는 세 가지 거래 종류 */
  kinds: {
    swap: {
      name: '스왑', en: 'Swap', axis: '체인 유지 · 토큰 변경',
      example: { from: { chain: 'arbitrum', token: 'usdc' }, to: { chain: 'arbitrum', token: 'eth' } },
      lock: 'chain',
      guide: '스왑은 <b>같은 네트워크</b> 안에서 <b>토큰만</b> 바꾸는 거래다. 네트워크는 그대로 두자.',
      sum: function (c) {
        return c.fromChain + ' 네트워크 안에서 ' + c.send + ' ' + c.fromToken +
               ' 를 ' + c.recv + ' ' + c.toToken + ' 로 스왑했다';
      },
      solvers: [
        { name: '솔버 A' },
        { name: '솔버 B' },
        { name: '솔버 C' },
        { name: '솔버 D' },
        { name: 'Radius', radius: true }
      ],
    },

    bridge: {
      name: '브릿지', en: 'Bridge', axis: '체인 변경 · 토큰 유지',
      example: { from: { chain: 'ethereum', token: 'usdc' }, to: { chain: 'base', token: 'usdc' } },
      lock: 'token',
      guide: '브릿지는 <b>토큰은 그대로</b> 두고 <b>다른 네트워크</b>로 옮기는 거래다.',
      sameChainGuide: '옮기는 거래인데 같은 네트워크를 고르면 무엇이 옮겨질까? 다른 네트워크를 고르자.',
      sum: function (c) {
        return c.send + ' ' + c.fromToken + ' 를 ' + c.fromChain +
               ' 네트워크에서 ' + c.toChain + ' 네트워크로 브릿지했다';
      },
      solvers: [
        { name: '솔버 A' },
        { name: '솔버 B' },
        { name: '솔버 C' },
        { name: '솔버 D' },
        { name: 'Radius', radius: true }
      ],
    },

    xswap: {
      name: '크로스체인 스왑', en: 'Cross-chain Swap', axis: '체인 변경 · 토큰 변경',
      example: { from: { chain: 'ethereum', token: 'eth' }, to: { chain: 'arc', token: 'eurc' } },
      lock: null,
      guide: '크로스체인 스왑은 <b>네트워크도 토큰도</b> 함께 바꾸는 거래다.',
      sameChainGuide: '네트워크가 같으면 크로스체인이라고 할 수 있을까? 다른 네트워크를 고르자.',
      sum: function (c) {
        return c.fromChain + ' 네트워크의 ' + c.send + ' ' + c.fromToken + ' 를 ' +
               c.toChain + ' 네트워크의 ' + c.recv + ' ' + c.toToken + ' 로 크로스체인 스왑했다';
      },
      solvers: [
        { name: '솔버 A' },
        { name: '솔버 B' },
        { name: '솔버 C' },
        { name: '솔버 D' },
        { name: 'Radius', radius: true }
      ],
    }
  },

  /* 진행 순서. 복기 단계는 거래 종류에 따라 달라진다.
     설명은 화면 안에 이미 있다. 아래에는 버튼만 둔다.
*/
  steps: [
    { type: 'connect', phase: 'app', cta: '지갑엔 뭐가 들어 있을까?' },

    { type: 'wallet', phase: 'app', cta: '그럼 뭘 해 볼까?' },

    { type: 'menu', phase: 'app', cta: '이걸 직접 해 볼까?' },

    { type: 'swap', phase: 'app', cta: '이대로 거래할까?' },

    { type: 'pending', phase: 'app', cta: '어떻게 됐을까?' },

    { type: 'result', phase: 'app', cta: '방금 그 {KIND}, 어떻게 이루어진 걸까?' },

    { type: 'stage', phase: 'replay', cta: '솔버가 있으면 뭐가 좋을까?' },
    { type: 'perks', phase: 'replay', cta: '다른 것도 해 볼까?' }
  ]
};
