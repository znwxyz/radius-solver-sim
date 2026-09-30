/* English — data.js(한글) 위에 영어 글만 덮어쓴다. 수치·순서·구조는 data.js 그대로다.
   언어는 주소 ?lang=en|ko 가 먼저, 그다음 저장된 선택(solver-b-lang), 없으면 한국어.
   말투: 한글판의 "친한 선배"처럼 가볍고 다정한 구어체. 초심자 기준으로 주어·목적어를 다 쓴다.
   tests/i18n.test.mjs 가 한글 문장마다 영어가 있는지, 영어에 한글이 남지 않았는지 본다. */
(function () {
  'use strict';
  var EN = {
    mission: {
      pill: 'Get 500 USDC on Robinhood Chain!',
      clear: 'Quest clear',
      onboard: [
        { text: '**On-chain trading,\ntry it yourself**',
          note: 'From tokens, chains, swaps and bridges\nto trading through a solver — swipe to see.' },
        { text: 'The **tokens** we know\nlive on **chains**' },
        { text: 'Trading one token for another\ninside the same chain\nis called a **swap**,' },
        { text: 'and moving a token to another chain\nmeans crossing over,\nso it’s called a **bridge**.' },
        { text: 'Can you do a swap and a bridge\nat the same time?\nSure you can.' },
        { text: 'That’s a **cross-chain swap**.\nIt changes both the token\nand the chain it lives on.' },
        { text: 'On Robinhood Chain,\nyou can buy **stock tokens** —\nreal stocks turned into tokens.\nWant to try it yourself?' },
        { text: '**On-chain trading:\nwhat changes\nwith a solver?**',
          note: 'Pick the tokens and chains yourself,\nand make 500 USDC on Robinhood Chain.' }
      ],
      cta: 'First, let’s check my wallet'
    },

    normal: {
      label: 'Normal mode',
      plan: [
        {
          kind: 'Swap',
          title: 'Swap ETH for USDC on Ethereum',
          why: 'A bridge is a tool that moves tokens like USDC to another chain. So first, swap your ETH for USDC on Ethereum to have USDC ready to move. Exchanging tokens inside the same chain like this is called a swap.',
          lines: [['Network fee (gas)', '$3.84'], ['Price impact', '<0.01%'], ['Slippage tolerance', '0.5%'], ['Route', 'ETH → USDC (0.05%)']],
          decide: 'Slippage tolerance'
        },
        {
          kind: 'Bridge',
          title: 'Move USDC from Ethereum to Robinhood Chain',
          why: 'USDC on Ethereum and USDC on Robinhood Chain are recorded on different ledgers. What we need is USDC on Robinhood Chain, not on Ethereum — so you have to bridge the USDC you just made from Ethereum to Robinhood Chain. Each bridge has its own fee and wait time, so pick the one that fits you.',
          options: [
            { name: 'Official bridge' },
            { name: 'Third-party bridge A' },
            { name: 'Third-party bridge B' }
          ],
          labels: { fee: 'Bridge fee', gas: 'Network fee (gas)', time: 'Est. time', dest: ['Gas on destination chain', 'Needed separately', 'warn'] },
          decide: 'Which bridge to use'
        },
        {
          kind: 'Bridge',
          title: 'Get gas (ETH) to use on Robinhood Chain',
          why: 'Every transaction you send on Robinhood Chain costs a little gas. Robinhood Chain’s gas token is ETH, but after step 2 your wallet only has USDC on Robinhood Chain. So you need some ETH too, right? Let’s move a little ETH from Ethereum to Robinhood Chain.',
          lines: [['Network fee (gas)', '$3.40'], ['Est. time', '~8m']],
          decide: 'How much gas to bring'
        }
      ],
      doneTitle: 'Quest clear',
      doneLine: 'Wallet signatures: {SIGS}, gas spent: {GAS}, time waited: {WAIT}.',
      nextCta: 'Now try it again in solver mode?'
    },

    solver: {
      label: 'Solver mode',
      quotes: [
        { name: 'Solver B', time: '~20s' },
        { name: 'Radius', time: '~25s' },
        { name: 'Solver A', time: '~30s' },
        { name: 'Solver C', time: '~45s' }
      ],
      lines: [['Minimum to receive', '{MIN} USDC'], ['Network fee (gas)', '$0', 'free'], ['Gas on destination chain', 'Not needed', 'free'], ['Est. time', '~25s']],
      decide: 'Minimum to receive',
      behind: [
        'Before quoting, the solvers checked whether this trade was possible, how to source the USDC, and which route to take. Only solvers who found it worthwhile for themselves sent a quote',
        'The protocol’s rules picked the quote with the best terms among the solvers',
        'The chosen solver sent its own USDC to your wallet on Robinhood Chain first. That’s why going through a solver is this easy and fast',
        'The ETH you paid will be settled to that solver under the protocol’s rules',
        'The solver handled all the complicated swaps, bridges and repeated gas fees. All you had to do was receive the result'
      ],
      doneTitle: 'Quest clear — a solver did it for you!',
      doneLine: 'You signed just once. No gas left your wallet, and you didn’t need to bring gas for the destination chain either.',
      nextCta: 'Compare the two side by side?'
    },

    board: {
      title: 'Scoreboard',
      rows: [
        { label: 'Wallet signatures', unit: '' },
        { label: 'Gas paid from my wallet' },
        { label: 'Time waited' },
        { label: 'Choices I made myself', unit: '' },
        { label: 'ETH I paid' },
        { label: 'USDC arrived on Robinhood Chain' }
      ],
      empty: 'Not tried yet',
      doing: 'In progress'
    },

    compare: {
      title: 'Here’s how much\nsolver mode changes',
      tagline: 'Fewer signatures,\nless paid,\nfaster arrival.',
      tagSub: 'Hand it to a solver, and trading gets this much easier.',
      cta: 'Start over from the beginning?'
    },

    coach: {
      wallet: [
        { title: 'How to read this row',
          text: 'Base is the chain and ETH is the token. So this row means “ETH on the Base chain.” 0.0110 is how much of that ETH you have (0.0110 ETH), and $40.53 below it is that amount converted to dollars at today’s price.' },
        { title: 'Same token, different chain — treated differently',
          text: 'Even with the same name, USDC is issued and recorded separately on each chain. So USDC on Arbitrum and USDC on Robinhood Chain are handled like different tokens. Tap Robinhood Chain in these tabs to see what’s on that chain.' }
      ],
      'wallet-empty': [
        { title: 'Nothing on Robinhood Chain yet',
          text: 'The 500 USDC for this Quest has to be on Robinhood Chain. Your wallet doesn’t have any, so you need to make 500 USDC from assets on other chains and bring it here!' }
      ],
      normal: [
        { title: 'What you pay',
          text: 'Ethereum and ETH look alike but mean different things. Ethereum is the chain (the network), and ETH is the token used on it. Your wallet has 0.84 ETH on Ethereum, and you’ll pay 0.1475 ETH of it for this trade.' },
        { title: 'What you get',
          text: 'USDC on Robinhood Chain. Compared with what you pay, both the chain (Ethereum → Robinhood Chain) and the token (ETH → USDC) are different. So this trade needs both a swap and a bridge.' },
        { title: 'This trade can’t be done in one go',
          text: 'It takes three steps: a swap, a bridge, and getting gas ready on the destination chain. Run the to-dos below in order, starting with step 1.' }
      ],
      gas: [
        { title: 'So what’s gas?',
          text: 'Gas is the fee you pay the chain every time you send a transaction. The “network fee” here is the gas, and it comes out of the ETH in your wallet each time you sign.' }
      ],
      solver: [
        { title: 'Solver mode',
          text: 'Same wallet, same starting point. What changes is how the trade gets done. Instead of walking through each step yourself, just say the result you want and a solver handles it for you.' },
        { title: 'This is all you decide',
          text: 'Just set the minimum USDC you’ll receive. A trade that gives you less won’t happen at all. You don’t need to pick the route, the bridge or the gas.' },
        { title: 'Let’s get quotes',
          text: 'Tap Get quotes and several solvers will each answer, “I’ll do it on these terms.” Who executes it is chosen by the protocol’s rules, not by you.' }
      ],
      next: 'Next', done: 'Got it', skip: 'Skip'
    },

    sign: { title: 'Signature request', confirm: 'Confirm', reject: 'Reject', changes: 'Estimated changes', fee: 'Network fee (gas)', free: '$0 · no gas', approveWhat: 'Allow the bridge contract to use your USDC' },

    pending: { title: 'Processing', done: 'Done', explorer: 'View on explorer', order: 'Order' },

    ui: {
      wallet: { total: 'Total balance', all: 'All', empty: 'Nothing on this chain yet', cta: 'Let’s go get 500 USDC' },
      swap: {
        pay: 'You pay', get: 'You get', balance: 'Balance',
        plan: 'To do', run: 'Run', ran: 'Done', optTime: 'Est.',
        quote: 'Get quotes', quoting: 'Solvers are answering', waitingOne: 'Waiting for an answer', picking: 'The rules are choosing', picked: 'Terms chosen by the rules',
        pickNote: '{WHO}’s quote was chosen.',
        quoteHint: 'Tap Get quotes and each solver will make an offer',
        sign: 'Sign', min: 'Minimum to receive',
        stepHint: 'Start with step {N}'
      },
      toast: {
        pending: 'You can move on once the transaction finishes.',
        step: 'Tap Run on the step {N} card. A wallet signature sheet will pop up.',
        quoting: 'The solvers are answering. Just a moment.',
        busy: 'The transaction is processing. The button will change when it’s done.',
        mode: 'You can switch modes once the transaction finishes.',
        max: 'It’s an example, so the amount is fixed — to keep the focus on chains and tokens.',
        explorer: 'It’s an example screen, so the explorer won’t open.'
      },
      units: { d: 'd', h: 'h', m: 'm', s: 's' },
      quotesHead: 'Quotes {N}',
      a11y: {
        less: 'Decrease', more: 'Increase', theme: 'Switch between light and dark', lang: 'Language',
        onboard: 'Onboarding, {N} pages — swipe or use the arrows at the bottom', prev: 'Previous page', next: 'Next page'
      },
      back: 'Back', restart: 'Start over'
    },

    steps: [{ label: 'Quest' }, { label: 'Wallet' }, { label: 'Trade' }, { label: 'Result' }],

    /* index.html 에 박힌 글 — 한국어는 index.html 그대로라 영어에만 있다 */
    page: {
      title: 'Normal mode vs Solver mode · Radius',
      skip: 'Skip to the app screen',
      home: 'Back to start',
      track: 'Progress',
      prevStep: 'Previous step',
      nextStep: 'Next step',
      board: 'Scoreboard',
      notesTitle: 'Notes',
      notes: [
        'The chains, tokens, fees and times in this scenario are example values made up for explanation. It isn’t about a real trading app or a specific campaign.',
        'How solvers join, compete and get settled differs by protocol. This screen only shows the common skeleton.',
        'A solver is an independent participant that executes trades on your behalf within a protocol’s rules. Radius is one of those solvers.',
        'Users can’t choose the solver. The protocol’s rules decide which of the solvers executes. Radius being chosen in this example doesn’t mean it always is.',
        'A trade isn’t always guaranteed to go through. If no participant meets the terms, it may not happen. This simulation only shows trades that went through.',
        'Not every swap involves a solver. Which route is used is up to the app and the protocol.'
      ]
    }
  };

  /* 어느 언어로 열지: 주소 ?lang= 가 먼저, 그다음 저장된 선택. 저장소가 막힌 창에서도 주소로는 연다 */
  function chosenLang() {
    var m = /[?&]lang=(en|ko)\b/.exec((window.location && window.location.search) || '');
    if (m) return m[1];
    try { return window.localStorage.getItem('solver-b-lang') === 'en' ? 'en' : 'ko'; } catch (e) { return 'ko'; }
  }

  /* 한글 데이터 위에 영어 글만 얹는다. 배열은 같은 자리끼리, 객체는 같은 키끼리. 새 객체를 만들어 돌려준다 */
  function overlay(base, top) {
    if (Array.isArray(base) && Array.isArray(top)) return base.map(function (v, i) { return i < top.length ? overlay(v, top[i]) : v; });
    if (base && top && typeof base === 'object' && typeof top === 'object' && !Array.isArray(top)) {
      var out = Object.assign({}, base);
      Object.keys(top).forEach(function (k) { out[k] = overlay(base[k], top[k]); });
      return out;
    }
    return top === undefined ? base : top;
  }

  var lang = chosenLang();
  window.MODE = lang === 'en' ? overlay(window.MODE, EN) : window.MODE;
  window.MODE.lang = lang;
  if (window.document && window.document.documentElement) window.document.documentElement.lang = lang;
})();
