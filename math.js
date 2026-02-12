(function(global){
  const rng=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
  const choice=(arr)=>arr[Math.floor(Math.random()*arr.length)];
  const shuffle=(arr)=>arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const fmt = (x)=> (Math.abs(x) < 1e-12 ? "0" : (Number.isInteger(x) ? String(x) : String(+x.toFixed(6))).replace(/\.0+$/,''));
  const gcd = (a,b)=>{ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a||1; };
  const fracStr = (num, den)=>{ const s = (den<0?-1:1); num*=s; den*=s; const g=gcd(num,den); num/=g; den/=g; return den===1? String(num):`\\frac{${num}}{${den}}`; };
  // Fraction helpers for exact probability arithmetic
  const reduceFrac = (n,d)=>{ const s = d<0?-1:1; n*=s; d*=s; const g=gcd(n,d); return {n:n/g, d:d/g}; };
  const addFrac = (n1,d1,n2,d2)=> reduceFrac(n1*d2 + n2*d1, d1*d2);
  const subFrac = (n1,d1,n2,d2)=> reduceFrac(n1*d2 - n2*d1, d1*d2);
  const mulFrac = (n1,d1,n2,d2)=> reduceFrac(n1*n2, d1*d2);
  const divFrac = (n1,d1,n2,d2)=> reduceFrac(n1*d2, d1*n2);
  const toFracStr = (f)=> fracStr(f.n, f.d);
  const sign = (v)=> v>=0?'+':'-';
  const abs = (v)=> Math.abs(v);
  const lin = (k,m,x='x')=> `${k}${x} ${sign(m)} ${abs(m)}`;
  const coef = (k)=> k===1? '' : (k===-1? '-' : String(k));
  // Matrix/Vector helpers (small sizes for mental math)
  const mat2 = (a,b,c,d)=> [[a,b],[c,d]];
  const vec = (...xs)=> xs.map(Number);
  const mat2MulVec2 = (M,v)=> [ M[0][0]*v[0] + M[0][1]*v[1], M[1][0]*v[0] + M[1][1]*v[1] ];
  const mat2Mul = (A,B)=> [
    [A[0][0]*B[0][0] + A[0][1]*B[1][0], A[0][0]*B[0][1] + A[0][1]*B[1][1]],
    [A[1][0]*B[0][0] + A[1][1]*B[1][0], A[1][0]*B[0][1] + A[1][1]*B[1][1]]
  ];
  const det2 = (M)=> M[0][0]*M[1][1] - M[0][1]*M[1][0];
  // Use escaped backslashes so JS strings preserve LaTeX commands
  const matToLatex = (rows)=> `\\begin{bmatrix} ${rows.map(r=> r.map(x=> fmt(x)).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;
  const vecToLatex = (v)=> `\\begin{bmatrix} ${v.map(x=> fmt(x)).join(' \\\\ ')} \\end{bmatrix}`;
  // Format polynomial Ax^2 + Bx + C with 0-term removal
  function polyStr(A,B,C){
    const terms=[];
    if (A!==0){ terms.push(A===1? 'x^2' : (A===-1? '-x^2' : `${A}x^2`)); }
    if (B!==0){
      const tb = Math.abs(B)===1? 'x' : `${Math.abs(B)}x`;
      if (terms.length===0) terms.push(B<0? `-${tb}` : `${tb}`);
      else terms.push(B<0? `- ${tb}` : `+ ${tb}`);
    }
    if (C!==0){
      const tc = `${Math.abs(C)}`;
      if (terms.length===0) terms.push(C<0? `-${tc}` : `${tc}`);
      else terms.push(C<0? `- ${tc}` : `+ ${tc}`);
    }
    return terms.length? terms.join(' ') : '0';
  }
  // Ensure 5 unique choices including the correct answer
  function finalizeChoices(candidates, correct, need=5){
    const correctStr = String(correct);
    const unique = [];
    const seen = new Set([correctStr]);
    (candidates||[]).forEach(x=>{
      if (x==null) return;
      const s = String(x);
      if (!seen.has(s)){
        seen.add(s);
        unique.push(s);
      }
    });
    const fillers = ['0','1','2','3','4','-1','\\frac{1}{2}','\\frac{2}{3}','e'];
    for (const f of fillers){
      if (unique.length >= need-1) break;
      if (!seen.has(f)){
        seen.add(f);
        unique.push(f);
      }
    }
    const distractors = shuffle(unique).slice(0, Math.max(0, need-1));
    const insertAt = rng(0, distractors.length);
    const choices = distractors.slice(0, insertAt).concat([correctStr], distractors.slice(insertAt));
    return { choices, correctIndex: insertAt };
  }
  const fact = (n)=>{ let r=1; for(let i=2;i<=n;i++) r*=i; return r; };
  const nCr = (n,r)=>{ if(r<0||r>n) return 0; r=Math.min(r,n-r); let num=1,den=1; for(let i=1;i<=r;i++){ num*= (n-r+i); den*=i; } return Math.round(num/den); };
  const nPr = (n,r)=>{ if(r<0||r>n) return 0; let v=1; for(let i=0;i<r;i++) v*= (n-i); return v; };
  const oneOver = (k)=>{
    if (k===1) return '';
    if (k===-1) return '-';
    const s = k<0?'-':'';
    return `${s}\\frac{1}{${Math.abs(k)}}`;
  };
  // Build multiple-choice numeric options around the correct answer
  function buildNumericMCQ(ans){
    const correct = fmt(ans);
    const opts = new Set([correct]);
    const base = Number(correct);
    const seed = [base + 1, base - 1, -base, base * 2, base / 2, base + 0.5, base - 0.5];
    seed.forEach(v=>{ if (opts.size < 5) opts.add(fmt(v)); });
    while (opts.size < 5){
      const v = base + (rng(-9,9))/rng(2,6);
      opts.add(fmt(v));
      if (opts.size > 12) break; // safety
    }
    const choices = shuffle(Array.from(opts)).slice(0,5);
    const correctIndex = choices.indexOf(correct);
    return { choices, correctIndex };
  }
  function nearlyEqual(a,b,eps=1e-6){ const scale = Math.max(1, Math.abs(a), Math.abs(b)); return Math.abs(a-b) <= eps * scale; }

  function genArithmetic(){
    const mode = choice(["fraction","power","mixed"]);
    if (mode==="fraction"){
      const a=rng(1,9), b=rng(2,9), c=rng(1,9), d=rng(2,9);
      const prompt = `Compute $\\frac{${a}}{${b}} + \\frac{${c}}{${d}}$.`;
      const ans = a/b + c/d;
      const hint = `Common denominator is ${b*d}.`;
      const explain = `\(\frac{${a}}{${b}}+\frac{${c}}{${d}} = \frac{${a*d}+${c*b}}{${b*d}} = ${fmt((a*d+c*b)/(b*d))}\).`;
      const {choices, correctIndex} = buildNumericMCQ(ans);
      return {skill:"arithmetic", type:"mcq", prompt, choices, correctIndex, hint, explain};
    } else if (mode==="power"){
      const x=rng(2,5), p=rng(2,4), y=rng(2,5), q=rng(2,3);
      const prompt = `Evaluate $${x}^{${p}} - ${y}^{${q}}$.`;
      const ans = x**p - y**q; const hint = `Compute powers separately, then subtract.`; const explain = `\\(${x}^{${p}}=${x**p},\; ${y}^{${q}}=${y**q} \\Rightarrow ${ans}\\).`;
      const {choices, correctIndex} = buildNumericMCQ(ans);
      return {skill:"arithmetic", type:"mcq", prompt, choices, correctIndex, hint, explain};
    } else {
      const a=rng(2,9), b=rng(1,9), c=rng(1,9);
      const prompt = `Compute $${a}(${b}+${c}) - ${c}^2$.`;
      const dist = a*b + a*c;
      const c2 = c*c;
      const ans = a*(b+c) - c2;
      const hint = c2===0 ? `Distribute.` : `Distribute then subtract ${c}^2.`;
      const explain = c2===0
        ? `\\(${a}(${b}+${c}) = ${dist}\\).`
        : `\\(${a}(${b}+${c}) - ${c}^2 = ${a*b}+${a*c} - ${c2} = ${ans}\\).`;
      const {choices, correctIndex} = buildNumericMCQ(ans);
      return {skill:"arithmetic", type:"mcq", prompt, choices, correctIndex, hint, explain};
    }
  }
  function genLinear(){
    let a=rng(2,9); const b=rng(-9,9), c=rng(-9,9); if (a===0) a=2; const x=(c-b)/a;
    const prompt=`Solve for x: $${a}x ${b>=0?'+':'-'} ${Math.abs(b)} = ${c}$.`;
    const hint=`Isolate x: subtract ${b>=0?b:('('+b+')')} then divide by ${a}.`;
    const explain = (b===0)
      ? `\\(${a}x = ${c};\\; x = ${c}/${a} = ${fmt(x)}\\).`
      : `\\(${a}x = ${c} ${b>=0?'-':'+'} ${Math.abs(b)} = ${fmt(c-b)};\\; x = (${fmt(c-b)})/${a} = ${fmt(x)}\\).`;
    const {choices, correctIndex} = buildNumericMCQ(x);
    return {skill:"algebra", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function genExpand(){
    const a=rng(1,6), b=rng(-6,6), c=rng(1,6), d=rng(-6,6);
    const A=a*c, B=a*d + b*c, C=b*d;
    const correct = polyStr(A,B,C);
    const d1 = polyStr(A,B,-C);
    const d2 = polyStr(A,-B,C);
    const d3 = polyStr((a+b)*(c+d), B, C);
    const extra = polyStr(A,B,0); // drops constant term
    const cands = shuffle([ d1,d2,d3,extra ]);
    const {choices, correctIndex} = finalizeChoices(cands, correct, 5);
    const prompt = `Expand: $(${a}x ${b>=0?'+':'-'} ${Math.abs(b)})(${c}x ${d>=0?'+':'-'} ${Math.abs(d)})$.`;
    const hint = `Use FOIL (distribute).`;
    const explain = `\\( (${a}x+${b})(${c}x+${d}) = ${polyStr(A,B,C)} \\)`;
    return {skill:"algebra", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function genFactor(){
    const r1=rng(-7,7) || 1; const r2=rng(-7,7) || -1; const s = -(r1 + r2); const p = r1 * r2;
    const correct = `(x ${-r1>=0?'+':''}${-r1})(x ${-r2>=0?'+':''}${-r2})`;
    const w1 = `(x ${r1>=0?'+':''}${r1})(x ${-r2>=0?'+':''}${-r2})`;
    const w2 = `(x ${-r1>=0?'+':''}${-r1})(x ${r2>=0?'+':''}${r2})`;
    const w3 = `(x ${-r1>=0?'+':''}${-r1})(x ${-r2>=0?'+':''}${-r2 + (r1===r2?1:0)})`;
    const w4 = `(x ${r1>=0?'+':''}${r1})(x ${r2>=0?'+':''}${r2})`;
    const cands = shuffle([ w1, w2, w3, w4 ]);
    const {choices:choicesF, correctIndex:ciF} = finalizeChoices(cands, correct, 5);
    const prompt = `Factor: $x^2 ${s>=0?'+':'-'} ${Math.abs(s)}x ${p>=0?'+':'-'} ${Math.abs(p)}$.`;
    const hint = `Find integers \(r_1, r_2\) with \(r_1+r_2=${-s}\) and \(r_1\cdot r_2=${p}\).`;
    const explain = `\((x - r_1)(x - r_2)\), with \(r_1=${r1},\; r_2=${r2}\).`;
    return {skill:"algebra", type:"mcq", prompt, choices:choicesF, correctIndex:ciF, hint, explain};
  }
  function genDerivativePoint(){
    const a = rng(-3,3);
    const pattern = choice(["powerChain","sinLinear","expQuad","product"]);
    let prompt, ans, hint, explain;
    if (pattern==="powerChain"){
      let k=rng(2,5), m=rng(1,4), n=rng(2,4);
      // keep (k*a+m) manageable for mental math
      let ua = k*a + m; let guard=0;
      while (Math.abs(ua) > 5 && guard++ < 10){ k=rng(2,5); m=rng(1,4); ua = k*a + m; }
      prompt = `Compute \\(f'(${a})\\) for \\(f(x)=( ${k}x + ${m} )^{${n}}\\).`;
      ans = n * (k*a+m)**(n-1) * k;
      hint = `\\((u^n)' = n u^{n-1} u'\\) with \\(u=${k}x+${m}\\).`;
      explain = `\\(f'(x)=${n}(${k}x+${m})^{${n-1}}\\cdot ${k}\\). Evaluate at \\(x=${a}\\).`;
      // Always symbolic answer to avoid calculators
      const nk = n*k;
      const correct = `${nk}(${ua})^{${n-1}}`;
      const d1 = `${n}(${ua})^{${n-1}}`; // missing chain factor
      const d2 = `${nk}(${ua})^{${n}}`;  // wrong power
      const d3 = `${nk}(${ua+1})^{${n-1}}`; // shifted input
      const d4 = `${k}(${ua})^{${n-1}}`;
      const {choices:ch1, correctIndex:ci1} = finalizeChoices([d1,d2,d3,d4], correct, 5);
      return {skill:"calculus", type:"mcq", prompt, choices:ch1, correctIndex:ci1, hint, explain};
    } else if (pattern==="sinLinear"){
      const k=rng(2,6), m=rng(-3,3);
      prompt = `Compute \\(f'(${a})\\) for \\(f(x)=\\sin(${k}x ${m>=0?'+':'-'} ${Math.abs(m)})\\).`;
      ans = Math.cos(k*a + m) * k;
      hint = `\\((\\sin u)' = \\cos u \\cdot u'\\) with \\(u=${k}x+${m}\\).`;
      explain = `\\(f'(x)=${k}\\cos(${k}x+${m})\\). Evaluate at \\(x=${a}\\).`;
      const angle = `${k*a + m}`;
      const ck = coef(k);
      const correct = `${ck}\\cos(${angle})`;
      const alt1 = `${ck}\\sin(${angle})`;
      const alt2 = `${coef(-k)}\\cos(${angle})`;
      const alt3 = `${coef(k===1?2:k+1)}\\cos(${angle})`;
      const alt4 = `${ck}\\cos(${angle}+1)`;
      const {choices:ch2, correctIndex:ci2} = finalizeChoices([alt1,alt2,alt3,alt4], correct, 5);
      return {skill:"calculus", type:"mcq", prompt, choices:ch2, correctIndex:ci2, hint, explain};
    } else if (pattern==="expQuad"){
      const k=rng(1,3), m=rng(1,3);
      prompt = `Compute \\(f'(${a})\\) for \\(f(x)=e^{${k}x^2 + ${m}}\\).`;
      ans = Math.exp(k*a*a + m) * (2*k*a);
      hint = `\\((e^{u})' = e^{u}\\cdot u'\\) with \\(u=${k}x^2+${m}\\).`;
      explain = `\\(f'(x)=e^{${k}x^2+${m}}\\cdot ${2*k}x\\). Evaluate at \\(x=${a}\\).`;
      const expv = `${k*a*a + m}`;
      const factor = 2*k*a;
      const correct = factor===0? '0' : `${coef(factor)}e^{${expv}}`;
      const d1 = `${2*k}e^{${expv}}`; // forgot to plug x=a
      const d2 = `e^{${expv}}`;      // missing factor
      const d3 = `e^{${k}x^2+${m}}\\cdot ${2*k}x`; // not evaluated at a
      const d4 = `${2*a}e^{${expv}}`;
      const {choices:ch3, correctIndex:ci3} = finalizeChoices([d1,d2,d3,d4], correct, 5);
      return {skill:"calculus", type:"mcq", prompt, choices:ch3, correctIndex:ci3, hint, explain};
    } else {
      const A=rng(1,4), B=rng(-4,4), C=rng(1,4);
      prompt = `Compute \\(f'(${a})\\) for \\(f(x)=(${A}x ${B>=0?'+':'-'} ${Math.abs(B)})\\sin(${C}x)\\).`;
      const fp = A*Math.sin(C*a) + (A*a+B)*Math.cos(C*a)*C;
      ans = fp;
      hint = `Product rule: \\(u'v + uv'\\), and \\((\\sin cx)'=c\\cos cx\\).`;
      const ca = `${C*a}`;
      const ampCos = (A*a+B)*C;
      const term1 = `${coef(A)}\\sin(${ca})`;
      const term2 = ampCos===0? '' : `${coef(ampCos)}\\cos(${ca})`;
      const correct = term2? `${term1} ${term2.startsWith('-')?'':'+'} ${term2}` : term1;
      const evalStr = term2? `${term1} ${term2.startsWith('-')?'':'+'} ${term2}` : term1;
      const d1t2 = ampCos===0? '' : `${coef(ampCos)}\\sin(${ca})`;
      const d1 = d1t2? `${coef(A)}\\cos(${ca}) ${d1t2.startsWith('-')?'':'+'} ${d1t2}` : `${coef(A)}\\cos(${ca})`;
      const d2t2amp = (A*a+B); // missing C
      const d2t2 = d2t2amp===0? '' : `${coef(d2t2amp)}\\cos(${ca})`;
      const d2 = d2t2? `${term1} ${d2t2.startsWith('-')?'':'+'} ${d2t2}` : term1;
      const d3t2 = ampCos===0? '' : `${coef(-ampCos)}\\cos(${ca})`;
      const d3 = d3t2? `${term1} ${d3t2.startsWith('-')?'':'+'} ${d3t2}` : term1;
      const d4term1 = `${coef(-A)}\\sin(${ca})`;
      const d4 = term2? `${d4term1} ${term2.startsWith('-')?'':'+'} ${term2}` : d4term1;
      const {choices:ch4, correctIndex:ci4} = finalizeChoices([d1,d2,d3,d4], correct, 5);
      const explain = `\\(f'(x)=${A}\\sin(${C}x)+(${A}x+${B})\\cdot ${C}\\cos(${C}x)\\). Evaluate at \\(x=${a}\\): \\(${evalStr}\\).`;
      return {skill:"calculus", type:"mcq", prompt, choices:ch4, correctIndex:ci4, hint, explain};
    }
    // Fallback shouldn't happen, but ensure we return something
    const {choices, correctIndex} = buildNumericMCQ(ans);
    return {skill:"calculus", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  // Basic integrals
  function genIntegralPoly(){
    const a = rng(1,6) * (Math.random()<0.3?-1:1);
    const n = rng(0,3);
    const prompt = `Find an antiderivative: \\int ${a}x^{${n}}\\,dx`;
    const coeff = fracStr(a, n+1);
    const correct = `${coeff}x^{${n+1}} + C`;
    const d1 = `${a}x^{${n+1}} + C`;
    const d2 = `${coeff}x^{${n}} + C`;
    const d3 = `${fracStr(a, n+2)}x^{${n+2}} + C`;
    const d4 = `-${coeff}x^{${n+1}} + C`;
    const {choices:chP, correctIndex:ciP} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"calculus", type:"mcq", prompt:`Compute: \\( \\int ${a}x^{${n}}\\,dx \\)`, choices:chP, correctIndex:ciP, hint:`Power rule: \\int x^n dx = x^{n+1}/(n+1) + C`, explain:`Antiderivative is \\(${correct}\\)`};
  }
  // Probability generators
  function genCoinBinom(){
    const n = rng(3,6); const k = rng(0,n);
    const comb = nCr(n,k);
    const prompt = `A fair coin is flipped ${n} times. What is $P(\\text{exactly }${k} \\text{ heads})$?`;
    const correct = `${fracStr(comb, 2**n)}`;
    const distract = new Set();
    const tryPush=(s)=>{ if (s!==correct) distract.add(s); };
    if (k-1>=0) tryPush(fracStr(nCr(n,k-1), 2**n));
    if (k+1<=n) tryPush(fracStr(nCr(n,k+1), 2**n));
    tryPush(fracStr(1, 2**n));
    tryPush(fracStr(nCr(n,k), 2**(n-1)));
    if (k-2>=0) tryPush(fracStr(nCr(n,k-2), 2**n));
    const cand = shuffle(Array.from(distract));
    const {choices:chB, correctIndex:ciB} = finalizeChoices(cand, correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices:chB, correctIndex:ciB, hint:`Use $\\binom{n}{k}/2^n$.`, explain:`$P=\\binom{${n}}{${k}}/2^{${n}} = ${correct}$.`};
  }
  function genTwoDiceSum(){
    const s = rng(2,12);
    const counts = {2:1,3:2,4:3,5:4,6:5,7:6,8:5,9:4,10:3,11:2,12:1};
    const c = counts[s];
    const prompt = `Two fair dice are rolled. What is $P(\\text{sum}=${s})$?`;
    const correct = `${fracStr(c,36)}`;
    const near = [s-1,s+1].filter(x=>counts[x]);
    const dset = new Set();
    near.forEach(x=> dset.add(fracStr(counts[x],36)));
    dset.add(fracStr(c,12)); // wrong denominator
    dset.add(fracStr(36-c,36)); // complement count
    dset.add(fracStr(1,6)); // common mistake
    const {choices:chD, correctIndex:ciD} = finalizeChoices(Array.from(dset), correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices:chD, correctIndex:ciD, hint:`Favorable outcomes over $36$.`, explain:`There are ${c} pairs giving ${s}, so $${correct}$.`};
  }
  function genIndependence(){
    const dieEvents = [
      {txt:'even', m:3},
      {txt:'odd', m:3},
      {txt:'prime', m:3}, // 2,3,5
      {txt:'a multiple of 3', m:2},
      {txt:'greater than 4', m:2},
      {txt:'less than 3', m:2}
    ];
    const ev = choice(dieEvents);
    const prompt = `A fair coin is flipped and a fair die is rolled. What is $P(\\text{Heads AND die is ${ev.txt}})$?`;
    const correct = `${fracStr(ev.m,12)}`; // (1/2)*(m/6) = m/12
    const ds = new Set([
      fracStr(ev.m,6), // forgot multiply
      fracStr(6-ev.m,12), // complement die event
      fracStr(ev.m,36), // wrong denominator
      fracStr(1,2) // coin only
    ]);
    const {choices:chI, correctIndex:ciI} = finalizeChoices(Array.from(ds), correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices:chI, correctIndex:ciI, hint:`Independence: multiply $1/2$ by $${fracStr(ev.m,6)}$.`, explain:`$P=\\frac12\\cdot \\frac{${ev.m}}{6} = ${correct}$.`};
  }
  function genExpectedDie(){
    const mode = choice(['X','2X+1','X-1']);
    const prompt = mode==='X'
      ? `Let $X$ be a fair die roll. Compute $E[X]$.`
      : (mode==='2X+1' ? `Let $X$ be a fair die roll. Compute $E[2X+1]$.` : `Let $X$ be a fair die roll. Compute $E[X-1]$.`);
    const EX = fracStr(7,2);
    let correct, distractors;
    if (mode==='X'){
      correct = EX; distractors = ['3','4', fracStr(8,3), fracStr(5,2)];
    } else if (mode==='2X+1'){
      correct = '8'; distractors = ['7', '9', fracStr(15,2), '6'];
    } else {
      correct = fracStr(5,2); distractors = ['2', EX, '3', fracStr(3,2)];
    }
    const {choices:chE, correctIndex:ciE} = finalizeChoices(distractors, correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices:chE, correctIndex:ciE, hint:`Use linearity of expectation.`, explain:`$E[X]=${EX}$.`};
  }
  function genBayesLikelihoods(){
    // Given P(A), P(B|A), P(B|~A) compute P(A|B)
    const dA = rng(3,6), a = rng(1,dA-1);
    const e1 = rng(2,6), b1 = rng(1,e1-1);
    const e2 = rng(2,6), b2 = rng(1,e2-1);
    const pA = reduceFrac(a,dA);
    const pNotA = reduceFrac(dA-a, dA);
    const pB_A = reduceFrac(b1,e1);
    const pB_notA = reduceFrac(b2,e2);
    const pAB = mulFrac(pA.n,pA.d,pB_A.n,pB_A.d);
    const pNotA_B = mulFrac(pNotA.n,pNotA.d,pB_notA.n,pB_notA.d);
    const pB = addFrac(pAB.n,pAB.d,pNotA_B.n,pNotA_B.d);
    const pA_given_B = divFrac(pAB.n,pAB.d,pB.n,pB.d);
    const prompt = `Given $P(A)=${toFracStr(pA)}$, $P(B\\mid A)=${toFracStr(pB_A)}$, and $P(B\\mid \\neg A)=${toFracStr(pB_notA)}$, compute $P(A\\mid B)$.`;
    const correct = toFracStr(pA_given_B);
    const d1 = toFracStr(pB_A);
    const d2 = toFracStr(pA);
    const d3 = toFracStr(pNotA); // common confusion with complement
    const d4 = toFracStr(pNotA_B); // numerator wrong part
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    const hint = `Bayes: $P(A\\mid B)=\\dfrac{P(B\\mid A)P(A)}{P(B\\mid A)P(A)+P(B\\mid \\neg A)(1-P(A))}$.`;
    const explain = `$= \\dfrac{${toFracStr(pB_A)}\\cdot ${toFracStr(pA)}}{${toFracStr(pB_A)}\\cdot ${toFracStr(pA)} + ${toFracStr(pB_notA)}\\cdot ${toFracStr(pNotA)}} = ${correct}$.`;
    return {skill:"probability", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function genBayesGivenB(){
    // Given P(A), P(B|A), P(B|~A), we can also present P(B) as a given and ask P(A|B)
    // Compute P(B) exactly and present it.
    const dA = rng(3,6), a = rng(1,dA-1);
    const e1 = rng(2,6), b1 = rng(1,e1-1);
    const e2 = rng(2,6), b2 = rng(1,e2-1);
    const pA = reduceFrac(a,dA);
    const pNotA = reduceFrac(dA-a, dA);
    const pB_A = reduceFrac(b1,e1);
    const pB_notA = reduceFrac(b2,e2);
    const pAB = mulFrac(pA.n,pA.d,pB_A.n,pB_A.d);
    const pNotA_B = mulFrac(pNotA.n,pNotA.d,pB_notA.n,pB_notA.d);
    const pB = addFrac(pAB.n,pAB.d,pNotA_B.n,pNotA_B.d);
    const pA_given_B = divFrac(pAB.n,pAB.d,pB.n,pB.d);
    const prompt = `Given $P(A)=${toFracStr(pA)}$, $P(B)=${toFracStr(pB)}$, and $P(B\\mid A)=${toFracStr(pB_A)}$, compute $P(A\\mid B)$.`;
    const correct = toFracStr(pA_given_B);
    const d1 = toFracStr(pB_A);
    const d2 = toFracStr(pA);
    const d3 = toFracStr(pNotA);
    const d4 = toFracStr(pB);
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    const hint = `Bayes: $P(A\\mid B)=\\dfrac{P(B\\mid A)P(A)}{P(B)}$.`;
    const explain = `$= \\dfrac{${toFracStr(pB_A)}\\cdot ${toFracStr(pA)}}{${toFracStr(pB)}} = ${correct}$.`;
    return {skill:"probability", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function genChoose(){
    const n = rng(5,8); const k = rng(1,n-1);
    const prompt = `How many ways to choose ${k} items from ${n}?`;
    const correct = String(nCr(n,k));
    const d1 = String(nPr(n,k));
    const d2 = String(nCr(n, Math.max(1, k-1)));
    const d3 = String(nCr(n, Math.min(n-1, k+1)));
    const d4 = String(n**k);
    const {choices:chC, correctIndex:ciC} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices:chC, correctIndex:ciC, hint:`Use $\\binom{n}{k}$.`, explain:`$\\binom{${n}}{${k}} = ${correct}$.`};
  }

  function genHypergeometric(){
    const red = rng(3,7);
    const blue = rng(3,7);
    const total = red + blue;
    const draw = choice([2,3]);
    const k = rng(0, Math.min(draw, red));
    const favorable = nCr(red, k) * nCr(blue, draw-k);
    const all = nCr(total, draw);
    const rf = reduceFrac(favorable, all);
    const correct = toFracStr(rf);
    const prompt = `An urn has ${red} red and ${blue} blue balls. If ${draw} are drawn without replacement, what is $P(\\text{exactly }${k}\\text{ red})$?`;
    const d1 = fracStr(nCr(red, k), nCr(total, draw));
    const d2 = fracStr(nCr(red, k) * nCr(blue, draw-k), total**draw);
    const d3 = fracStr(nCr(red, Math.max(0,k-1)) * nCr(blue, draw-Math.max(0,k-1)), all);
    const d4 = fracStr(nCr(total, k), all);
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices, correctIndex, hint:`Use hypergeometric: $\\dfrac{\\binom{R}{k}\\binom{B}{n-k}}{\\binom{R+B}{n}}$.`, explain:`$P=\\dfrac{\\binom{${red}}{${k}}\\binom{${blue}}{${draw-k}}}{\\binom{${total}}{${draw}}}=${correct}$.`};
  }

  function genVarianceBernoulli(){
    const pNum = choice([1,2,3,4]);
    const pDen = choice([5,6,8,10]);
    const pFrac = reduceFrac(pNum, pDen);
    const qFrac = reduceFrac(pFrac.d - pFrac.n, pFrac.d);
    const varF = mulFrac(pFrac.n,pFrac.d,qFrac.n,qFrac.d);
    const correct = toFracStr(varF);
    const prompt = `For a Bernoulli random variable with $P(X=1)=${toFracStr(pFrac)}$, compute $\operatorname{Var}(X)$.`;
    const d1 = toFracStr(pFrac);
    const d2 = toFracStr(qFrac);
    const d3 = toFracStr(addFrac(varF.n,varF.d,1,10));
    const d4 = toFracStr(mulFrac(pFrac.n,pFrac.d,pFrac.n,pFrac.d));
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices, correctIndex, hint:`Bernoulli variance is $p(1-p)$.`, explain:`$\operatorname{Var}(X)=p(1-p)=${toFracStr(pFrac)}(1-${toFracStr(pFrac)})=${correct}$.`};
  }

  function genNormalRule(){
    const z = choice([1,2]);
    const correct = z===1 ? '0.68' : '0.95';
    const prompt = `Using the 68-95-99.7 rule, approximately what is $P(|Z|\\le ${z})$ for $Z\\sim\\mathcal N(0,1)$?`;
    const distractors = z===1 ? ['0.95','0.50','0.32','0.84'] : ['0.68','0.997','0.75','0.90'];
    const {choices, correctIndex} = finalizeChoices(distractors, correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices, correctIndex, hint:`Empirical rule: 1σ≈68%, 2σ≈95%, 3σ≈99.7%.`, explain:`For ±${z}σ, the rule gives about ${correct}.`};
  }

  function genConditionalTable(){
    const males = rng(18,30);
    const females = rng(18,30);
    const mLike = rng(6, males-4);
    const fLike = rng(6, females-4);
    const like = mLike + fLike;
    const total = males + females;
    const correct = fracStr(mLike, like);
    const d1 = fracStr(mLike, males);   // P(like|male)
    const d2 = fracStr(mLike, total);   // joint / total
    const d3 = fracStr(like, total);    // P(like)
    const d4 = fracStr(males, total);   // P(male)
    const prompt = `In a survey, ${mLike} of ${males} men and ${fLike} of ${females} women prefer Model A. If one person is chosen uniformly from those who prefer Model A, what is $P(\\text{male}\\mid\\text{prefers A})$?`;
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices, correctIndex, hint:`Condition on the subgroup who prefer A.`, explain:`Among A-likers, ${mLike} are male out of ${like}, so probability is ${correct}.`};
  }

  function genCovarianceBinary(){
    const pX = reduceFrac(choice([1,2,3]), 4);
    const pY = reduceFrac(choice([1,2,3]), 4);
    const p11NumMin = Math.max(0, pX.n*pY.d + pY.n*pX.d - pX.d*pY.d);
    const p11NumMax = Math.min(pX.n*pY.d, pY.n*pX.d);
    const den = pX.d * pY.d;
    const candidates = [];
    for (let n=Math.max(0,p11NumMin); n<=p11NumMax; n++) candidates.push(reduceFrac(n, den));
    const p11 = choice(candidates);
    const exy = p11;
    const exey = mulFrac(pX.n,pX.d,pY.n,pY.d);
    const cov = subFrac(exy.n,exy.d,exey.n,exey.d);
    const correct = toFracStr(cov);
    const d1 = toFracStr(exy);
    const d2 = toFracStr(exey);
    const d3 = toFracStr(addFrac(cov.n,cov.d,1,4));
    const d4 = toFracStr(subFrac(exey.n,exey.d,exy.n,exy.d));
    const prompt = `Let $X,Y\\in\\{0,1\\}$ with $P(X=1)=${toFracStr(pX)}$, $P(Y=1)=${toFracStr(pY)}$, and $P(X=1,Y=1)=${toFracStr(p11)}$. Compute $\\operatorname{Cov}(X,Y)$.`;
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices, correctIndex, hint:`$\\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]$.`, explain:`$E[XY]=P(X=1,Y=1)=${toFracStr(p11)}$, so covariance is ${correct}.`};
  }

  function genPortfolioVariance(){
    const s1 = choice([1,2,3]);
    const s2 = choice([1,2,3]);
    const rho = choice([-1,0,1]);
    const prompt = `Two returns have standard deviations ${s1} and ${s2}, correlation $\\rho=${rho}$, and equal weights $(1/2,1/2)$. Compute portfolio variance.`;
    const v = 0.25*(s1*s1 + s2*s2 + 2*rho*s1*s2);
    const correct = fmt(v);
    const d1 = fmt(0.25*(s1*s1 + s2*s2));
    const d2 = fmt(0.5*(s1+s2));
    const d3 = fmt(0.25*(s1+s2)*(s1+s2));
    const d4 = fmt(0.5*(s1*s1+s2*s2));
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"probability", type:"mcq", prompt, choices, correctIndex, hint:`$\\mathrm{Var}(w_1R_1+w_2R_2)=w_1^2\\sigma_1^2+w_2^2\\sigma_2^2+2w_1w_2\\rho\\sigma_1\\sigma_2$.`, explain:`With $w_1=w_2=1/2$, variance is ${correct}.`};
  }

  function genSystem2x2(){
    let x = rng(-4,4), y = rng(-4,4);
    const a = rng(-5,5) || 2, b = rng(-5,5) || -1;
    let c = rng(-5,5) || 1, d = rng(-5,5) || 3;
    let det = a*d - b*c;
    let guard = 0;
    while ((det===0 || Math.abs(det)>16) && guard++<20){
      c = rng(-5,5) || 1;
      d = rng(-5,5) || 3;
      det = a*d - b*c;
    }
    const e = a*x + b*y;
    const f = c*x + d*y;
    const prompt = `Solve the system: $${a}x ${b>=0?'+':'-'} ${Math.abs(b)}y = ${e}$ and $${c}x ${d>=0?'+':'-'} ${Math.abs(d)}y = ${f}$.`;
    const correct = `(${x}, ${y})`;
    const d1 = `(${y}, ${x})`;
    const d2 = `(${x+1}, ${y})`;
    const d3 = `(${x}, ${y-1})`;
    const d4 = `(${fmt(e/a)}, ${fmt(f/d)})`;
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"algebra", type:"mcq", prompt, choices, correctIndex, hint:`Eliminate one variable or use substitution.`, explain:`The pair $(x,y)=(${x},${y})$ satisfies both equations.`};
  }

  function genLogDerivativePoint(){
    const a = choice([1,2,3,4]);
    const b = rng(1,6);
    const x0 = rng(1,5);
    const inside = a*x0 + b;
    const correctVal = a/inside;
    const prompt = `Compute $f'(${x0})$ for $f(x)=\\ln(${a}x + ${b})$.`;
    const {choices, correctIndex} = buildNumericMCQ(correctVal);
    return {skill:"calculus", type:"mcq", prompt, choices, correctIndex, hint:`$\\frac{d}{dx}\\ln(u)=u'/u$.`, explain:`$f'(${x0})=\\dfrac{${a}}{${a* x0 + b}}=${fmt(correctVal)}$.`};
  }

  function genPartialDerivativePoint(){
    const a = rng(1,4), b = rng(-4,4), c = rng(1,4);
    const x0 = rng(-2,3), y0 = rng(-2,3);
    const prompt = `For $f(x,y)=${a}x^2 ${b>=0?'+':'-'} ${Math.abs(b)}xy + ${c}y^2$, compute $\\partial f/\\partial x$ at $(${x0},${y0})$.`;
    const ans = 2*a*x0 + b*y0;
    const {choices, correctIndex} = buildNumericMCQ(ans);
    const explain = `$f_x=2(${a})x ${b>=0?'+':'-'} ${Math.abs(b)}y$, so at $(${x0},${y0})$ it is ${fmt(ans)}.`;
    return {skill:"calculus", type:"mcq", prompt, choices, correctIndex, hint:`Treat $y$ as constant for $\\partial/\\partial x$.`, explain};
  }

  function genSecondDerivativePoint(){
    const a = rng(1,4), b = rng(1,4), x0 = rng(-3,3);
    const prompt = `For $f(x)=${a}x^3 ${b>=0?'+':'-'} ${Math.abs(b)}x^2$, compute $f''(${x0})$.`;
    const ans = 6*a*x0 + 2*b;
    const {choices, correctIndex} = buildNumericMCQ(ans);
    return {skill:"calculus", type:"mcq", prompt, choices, correctIndex, hint:`Differentiate twice: $x^3\\to 3x^2\\to 6x$.`, explain:`$f''(x)=${6*a}x + ${2*b}$, so $f''(${x0})=${fmt(ans)}$.`};
  }

  function genLA_SolveLinearSystem(){
    let x = rng(-4,4), y = rng(-4,4);
    const A = mat2(rng(-4,4)||2, rng(-4,4), rng(-4,4), rng(-4,4)||1);
    let det = det2(A);
    let guard = 0;
    while (det===0 && guard++<20){
      A[0][0] = rng(-4,4)||2;
      A[0][1] = rng(-4,4);
      A[1][0] = rng(-4,4);
      A[1][1] = rng(-4,4)||1;
      det = det2(A);
    }
    const b = mat2MulVec2(A, [x,y]);
    const correct = vecToLatex([x,y]);
    const d1 = vecToLatex([y,x]);
    const d2 = vecToLatex([x+1,y]);
    const d3 = vecToLatex([x,y-1]);
    const d4 = vecToLatex([b[0], b[1]]);
    const prompt = `Solve for $x$: \\[ ${matToLatex(A)}x = ${vecToLatex(b)} \\]`;
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"linalg", type:"mcq", prompt, choices, correctIndex, hint:`You can solve by elimination or compute $A^{-1}b$.`, explain:`Substituting ${correct} satisfies both equations.`};
  }

  function genLA_Rank2(){
    const M = mat2(rng(-3,3), rng(-3,3), rng(-3,3), rng(-3,3));
    const d = det2(M);
    const correct = d===0 ? '1' : '2';
    const d1 = d===0 ? '2' : '1';
    const d2 = '0';
    const d3 = '3';
    const d4 = '4';
    const prompt = `What is the rank of $${matToLatex(M)}$?`;
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"linalg", type:"mcq", prompt, choices, correctIndex, hint:`For 2x2 matrices: rank is 2 iff determinant is nonzero.`, explain:`$\\det=${fmt(d)}$, so rank is ${correct}.`};
  }

  function genLA_ProjectionCoeff(){
    const v = [choice([1,2,3]), choice([1,2,3])];
    const k = choice([-3,-2,-1,1,2,3]);
    const ortho = [v[1], -v[0]];
    const u = [k*v[0] + ortho[0], k*v[1] + ortho[1]];
    const dotuv = u[0]*v[0] + u[1]*v[1];
    const dotvv = v[0]*v[0] + v[1]*v[1];
    const coeff = fracStr(dotuv, dotvv);
    const prompt = `Compute the projection coefficient of $u$ onto $v$: $\\dfrac{u\\cdot v}{v\\cdot v}$ for $u=${vecToLatex(u)}, v=${vecToLatex(v)}$.`;
    const d1 = fracStr(dotuv, 1);
    const d2 = fracStr(dotvv, dotuv || 1);
    const d3 = fracStr(k+1,1);
    const d4 = fracStr(-k,1);
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], coeff, 5);
    return {skill:"linalg", type:"mcq", prompt, choices, correctIndex, hint:`Use $\\alpha=(u\\cdot v)/(v\\cdot v)$.`, explain:`$u\\cdot v=${dotuv},\\; v\\cdot v=${dotvv}$ so coefficient is ${coeff}.`};
  }

  function genExpEquation(){
    const base = choice([2,3]);
    const m = choice([1,2]);
    const c = rng(-3,4);
    const x = rng(-2,4);
    const rhsPow = m*x + c;
    const prompt = `Solve for $x$: $${base}^{${m}x + ${c}} = ${base}^{${rhsPow}}$.`;
    const correct = fmt(x);
    const d1 = fmt(rhsPow);
    const d2 = fmt(x+1);
    const d3 = fmt((rhsPow-c)/(m+1));
    const d4 = fmt(-x);
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"algebra", type:"mcq", prompt, choices, correctIndex, hint:`Equal bases imply equal exponents.`, explain:`${m}x+${c}=${rhsPow} gives $x=${correct}$.`};
  }

  function genIntegralTrig(){
    const k = rng(1,5) * (Math.random()<0.2?-1:1);
    const m = rng(-3,3);
    if (Math.random()<0.5){
      // integral of cos(kx+m)
      const prompt = `Compute: \\( \\int \\cos(${k}x ${sign(m)} ${abs(m)})\\,dx \\)`;
      const correct = `${oneOver(k)}\\sin(${k}x ${sign(m)} ${abs(m)}) + C`;
      const w1 = `-${oneOver(k)}\\sin(${k}x ${sign(m)} ${abs(m)}) + C`;
      const w2 = `${oneOver(k)}\\cos(${k}x ${sign(m)} ${abs(m)}) + C`;
      const k2 = Math.abs(k)+1;
      const w3 = `${coef(k2)}\\sin(${k}x ${sign(m)} ${abs(m)}) + C`;
      const w4 = `-${oneOver(k)}\\cos(${k}x ${sign(m)} ${abs(m)}) + C`;
      const {choices:chT1, correctIndex:ciT1} = finalizeChoices([w1,w2,w3,w4], correct, 5);
      return {skill:"calculus", type:"mcq", prompt, choices:chT1, correctIndex:ciT1, hint:`\\int \\cos(u)du = \\sin(u) + C, \\; du = ${k}dx`, explain:`Multiply by \\(${oneOver(k)||'1'}\\) for chain.`};
    } else {
      // integral of sin(kx+m)
      const prompt = `Compute: \\( \\int \\sin(${k}x ${sign(m)} ${abs(m)})\\,dx \\)`;
      const factor = fracStr(-1, k);
      const correct = `${factor}\\cos(${k}x ${sign(m)} ${abs(m)}) + C`;
      const w1 = `${fracStr(1,k)}\\cos(${k}x ${sign(m)} ${abs(m)}) + C`;
      const w2 = `${factor}\\sin(${k}x ${sign(m)} ${abs(m)}) + C`;
      const k2 = Math.abs(k)+1;
      const w3 = `${coef(k2)}\\cos(${k}x ${sign(m)} ${abs(m)}) + C`;
      const w4 = `${fracStr(1,k)}\\sin(${k}x ${sign(m)} ${abs(m)}) + C`;
      const {choices:chT2, correctIndex:ciT2} = finalizeChoices([w1,w2,w3,w4], correct, 5);
      return {skill:"calculus", type:"mcq", prompt, choices:chT2, correctIndex:ciT2, hint:`\\int \\sin(u)du = -\\cos(u) + C`, explain:`Chain factor \\(${oneOver(k)||'1'}\\).`};
    }
  }
  function genIntegralExp(){
    const a = choice([1,2,3,4]) * (Math.random()<0.25?-1:1);
    const b = rng(-3,3);
    const prompt = `Compute: \\( \\int e^{${a}x ${sign(b)} ${abs(b)}}\\,dx \\)`;
    const correct = `${oneOver(a)}e^{${a}x ${sign(b)} ${abs(b)}} + C`;
    const w1 = `${oneOver(-a)}e^{${a}x ${sign(b)} ${abs(b)}} + C`; // wrong overall factor sign
    const w2 = `${oneOver(a)}e^{${a}x ${sign(-b)} ${abs(b)}} + C`;   // wrong inner sign
    const w3 = `${oneOver(a)}e^{${a}x} + C`;                        // missing constant
    const w4 = `-${oneOver(a)}e^{${a}x ${sign(b)} ${abs(b)}} + C`;
    const {choices:chE2, correctIndex:ciE2} = finalizeChoices([w1,w2,w3,w4], correct, 5);
    return {skill:"calculus", type:"mcq", prompt, choices:chE2, correctIndex:ciE2, hint:`\\int e^{ax}dx = e^{ax}/a + C`, explain:`Chain factor \\(${oneOver(a)||'1'}\\).`};
  }
  function genDefiniteIntegralPoly(){
    const a = rng(1,6) * (Math.random()<0.3?-1:1);
    const b = rng(-4,4);
    const p = rng(-3,0);
    const q = rng(1,4);
    const prompt = `Compute: \\( \\int_{${p}}^{${q}} (${a}x ${sign(b)} ${abs(b)})\\,dx \\)`;
    const ans = 0.5*a*(q*q - p*p) + b*(q-p);
    const {choices, correctIndex} = buildNumericMCQ(ans);
    return {skill:"calculus", type:"mcq", prompt, choices, correctIndex, hint:`Use FTOC on a linear function.`, explain:`Antiderivative: \\(${fracStr(a,2)}x^2 ${sign(b)} ${abs(b)}x\\).`};
  }
  // Linear Algebra generators
  function genLA_Mat2Vec2(){
    // [ [a,b],[c,d] ] * [x;y]
    const a=rng(-3,3)||1, b=rng(-3,3), c=rng(-3,3), d=rng(-3,3)||1;
    const x=rng(-3,3), y=rng(-3,3);
    const M = mat2(a,b,c,d); const v = vec(x,y); const r = mat2MulVec2(M,v);
    const prompt = `Compute \\[ ${matToLatex(M)} \\cdot ${vecToLatex(v)} \\]`;
    const correct = vecToLatex(r);
    // Distractors: swapped rows, transposed use, sign error
    const d1 = vecToLatex([r[1], r[0]]);
    const d2 = vecToLatex([ a*x + c*y, b*x + d*y ]); // using columns incorrectly
    const d3 = vecToLatex([ a*x - b*y, c*x - d*y ]);
    const d4 = vecToLatex([ b*x + a*y, d*x + c*y ]);
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    const hint = `Row-by-vector: first entry is $${a}\\cdot${x} + ${b}\\cdot${y}$.`;
    const explain = `$=${vecToLatex([a*x + b*y, c*x + d*y])}$.`;
    return {skill:"linalg", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function genLA_Det2(){
    const a=rng(-4,4), b=rng(-4,4), c=rng(-4,4), d=rng(-4,4);
    const M = mat2(a,b,c,d); const val = det2(M);
    const prompt = `Compute \\[ \\det\\,${matToLatex(M)} \\]`;
    const correct = fmt(val);
    const {choices, correctIndex} = finalizeChoices([ fmt(a*d + b*c), fmt(a*b + c*d), fmt(a-d), fmt(b-c) ], correct, 5);
    const hint = `$\\det\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}=ad-bc$.`;
    const explain = `$= ${a}\\cdot${d} - ${b}\\cdot${c} = ${correct}$.`;
    return {skill:"linalg", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function genLA_Mat2Mat2(){
    // A(2x2)*B(2x2)
    const A = mat2(rng(-3,3), rng(-3,3), rng(-3,3), rng(-3,3));
    const B = mat2(rng(-3,3), rng(-3,3), rng(-3,3), rng(-3,3));
    const R = mat2Mul(A,B);
    const prompt = `Compute \\[ ${matToLatex(A)} \\cdot ${matToLatex(B)} \\]`;
    const correct = matToLatex(R);
    // Distractors: BA, transpose result, and one with swapped middle terms
    const BA = mat2Mul(B,A);
    const d1 = matToLatex(BA);
    const d2 = matToLatex([[R[0][1],R[0][0]],[R[1][1],R[1][0]]]);
    const d3 = matToLatex([[A[0][0]*B[0][0] + A[1][0]*B[1][0], A[0][1]*B[0][1] + A[1][1]*B[1][1]], [A[1][0]*B[0][0] + A[0][0]*B[1][0], A[1][1]*B[0][1] + A[0][1]*B[1][1]]]);
    const d4 = matToLatex([[R[0][0],R[1][0]],[R[0][1],R[1][1]]]);
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    const hint = `Row-by-column multiplication.`;
    const explain = `First entry: $(${A[0][0]})(${B[0][0]})+(${A[0][1]})(-${-B[1][0]})$ etc.`;
    return {skill:"linalg", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function genLA_Trace(){
    const n = choice([2,3]);
    const M = Array.from({length:n}, _=> Array.from({length:n}, _=> rng(-3,3)));
    const tr = M.reduce((s,_,i)=> s + M[i][i], 0);
    const prompt = `Compute \\[ \\operatorname{tr}\\,${matToLatex(M)} \\]`;
    const correct = fmt(tr);
    const {choices, correctIndex} = finalizeChoices([ fmt(tr+1), fmt(tr-1), fmt(-tr), fmt(tr+2) ], correct, 5);
    const hint = `Sum of diagonal entries.`;
    const explain = `$=${M.map((r,i)=>M[i][i]).join(' + ')} = ${correct}$.`;
    return {skill:"linalg", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function genLA_Dot(){
    const n = choice([2,3]);
    const v = Array.from({length:n}, _=> rng(-3,3));
    const w = Array.from({length:n}, _=> rng(-3,3));
    const dot = v.reduce((s,vi,i)=> s + vi*w[i], 0);
    const prompt = `Compute \\[ ${vecToLatex(v)} \\cdot ${vecToLatex(w)} \\]`;
    const correct = fmt(dot);
    const {choices, correctIndex} = finalizeChoices([ fmt(dot+1), fmt(dot-1), fmt(-dot), fmt(dot+2) ], correct, 5);
    const hint = `Multiply components and add.`;
    const explain = `$=${v.map((vi,i)=>`${vi}\\cdot${w[i]}`).join(' + ')} = ${correct}$.`;
    return {skill:"linalg", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }

  function genLA_Inverse2(){
    let a=rng(-4,4), b=rng(-4,4), c=rng(-4,4), d=rng(-4,4);
    let det = a*d - b*c;
    let guard=0;
    while ((det===0 || Math.abs(det)>8) && guard++<20){
      a=rng(-4,4); b=rng(-4,4); c=rng(-4,4); d=rng(-4,4);
      det = a*d - b*c;
    }
    if (det===0) det = 1;
    const M = mat2(a,b,c,d);
    const correct = `${fracStr(1,det)}${matToLatex([[d,-b],[-c,a]])}`;
    const d1 = `${fracStr(1,det)}${matToLatex([[a,-b],[-c,d]])}`;
    const d2 = `${fracStr(1,det)}${matToLatex([[d,b],[c,a]])}`;
    const d3 = `${fracStr(1,Math.max(1,Math.abs(det)+1))}${matToLatex([[d,-b],[-c,a]])}`;
    const d4 = `${fracStr(1,det)}${matToLatex([[a,c],[b,d]])}`;
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"linalg", type:"mcq", prompt:`For $A=${matToLatex(M)}$, choose $A^{-1}$.`, choices, correctIndex, hint:`$A^{-1}=\\frac{1}{ad-bc}\\begin{bmatrix}d&-b\\\\-c&a\\end{bmatrix}$.`, explain:`$\\det(A)=${det}$, so invert by swap/negate pattern.`};
  }

  function genLA_EigenDiagonal(){
    const a = rng(-5,6);
    let d = rng(-5,6);
    if (d===a) d += 2;
    const M = [[a,0],[0,d]];
    const correct = `{${a}, ${d}}`;
    const d1 = `{${a+d}, ${a*d}}`;
    const d2 = `{${a}, ${a}}`;
    const d3 = `{${d}, ${d}}`;
    const d4 = `{${Math.abs(a)}, ${Math.abs(d)}}`;
    const {choices, correctIndex} = finalizeChoices([d1,d2,d3,d4], correct, 5);
    return {skill:"linalg", type:"mcq", prompt:`What are the eigenvalues of $${matToLatex(M)}$?`, choices, correctIndex, hint:`For diagonal matrices, eigenvalues are diagonal entries.`, explain:`The diagonal entries are ${a} and ${d}.`};
  }

  function genLimit(){
    const x0 = rng(-5,5);
    const prompt = `Compute \\( \\lim_{h\\to 0} \\dfrac{( ${x0}+h )^2 - (${x0})^2}{h} \\).`;
    const ans = 2*x0;
    const hint = `Expand numerator then cancel h: \\((x_0+h)^2 - x_0^2 = 2x_0 h + h^2\\).`;
    const explain = `\\(= \\lim_{h\\to 0} (2x_0 + h) = 2 \\cdot ${x0}\\).`;
    const {choices, correctIndex} = buildNumericMCQ(ans);
    return {skill:"calculus", type:"mcq", prompt, choices, correctIndex, hint, explain};
  }
  function makeProblem(skill){
    if (skill==="arithmetic") return choice([genArithmetic, genArithmetic, genArithmetic])();
    if (skill==="algebra")   return choice([genLinear, genExpand, genFactor, genSystem2x2, genExpEquation])();
    if (skill==="calculus")  return choice([
      genDerivativePoint,
      genLimit,
      genIntegralPoly,
      genIntegralTrig,
      genIntegralExp,
      genDefiniteIntegralPoly,
      genLogDerivativePoint,
      genPartialDerivativePoint,
      genSecondDerivativePoint
    ])();
    if (skill==="probability") return choice([
      genCoinBinom,
      genTwoDiceSum,
      genIndependence,
      genExpectedDie,
      genChoose,
      genBayesLikelihoods,
      genBayesGivenB,
      genHypergeometric,
      genVarianceBernoulli,
      genNormalRule,
      genConditionalTable,
      genCovarianceBinary,
      genPortfolioVariance
    ])();
    if (skill==="linalg") return choice([
      genLA_Mat2Vec2,
      genLA_Det2,
      genLA_Mat2Mat2,
      genLA_Trace,
      genLA_Dot,
      genLA_Inverse2,
      genLA_EigenDiagonal,
      genLA_SolveLinearSystem,
      genLA_Rank2,
      genLA_ProjectionCoeff
    ])();
    return choice([
      genArithmetic,
      genLinear,
      genExpand,
      genFactor,
      genSystem2x2,
      genExpEquation,
      genDerivativePoint,
      genLimit,
      genIntegralPoly,
      genIntegralTrig,
      genIntegralExp,
      genDefiniteIntegralPoly,
      genLogDerivativePoint,
      genPartialDerivativePoint,
      genSecondDerivativePoint,
      genCoinBinom,
      genTwoDiceSum,
      genIndependence,
      genExpectedDie,
      genChoose,
      genBayesLikelihoods,
      genBayesGivenB,
      genHypergeometric,
      genVarianceBernoulli,
      genNormalRule,
      genConditionalTable,
      genCovarianceBinary,
      genPortfolioVariance,
      genLA_Mat2Vec2,
      genLA_Det2,
      genLA_Mat2Mat2,
      genLA_Trace,
      genLA_Dot,
      genLA_Inverse2,
      genLA_EigenDiagonal,
      genLA_SolveLinearSystem,
      genLA_Rank2,
      genLA_ProjectionCoeff
    ])();
  }

  global.MathTrain = {
    makeProblem,
    formatNumber: fmt,
    nearlyEqual
  };
})(window);
