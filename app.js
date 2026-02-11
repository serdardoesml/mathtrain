(function(){
  const $ = (id)=>document.getElementById(id);
  const { makeProblem } = window.MathTrain;

  function typeset(el){
    if (window.MathJax && MathJax.typesetPromise && window.__mjxReady){
      try{ if (MathJax.typesetClear){ MathJax.typesetClear([el]); } }catch(_){ }
      MathJax.typesetPromise([el]).catch(()=>{});
    } else {
      (window.__mjxQueue || (window.__mjxQueue=[])).push(el);
    }
  }

  const state = {
    running:false,
    queue:[],
    total:10,
    index:0,
    current:null,
    skill:'mixed',
    correct:0,
    attempted:0,
    streak:0,
    bestStreak:0
  };

  function sessionLength(){
    return Number($('lengthSelect')?.value || 10);
  }

  function updateStats(){
    const accuracy = state.attempted ? Math.round((state.correct/state.attempted)*100) : 100;
    $('statsTag').textContent = `Streak ${state.streak} • Acc ${accuracy}%`;
  }

  function startSession(skill){
    state.running=true;
    state.skill=skill;
    state.index=0;
    state.correct=0;
    state.attempted=0;
    state.streak=0;
    state.bestStreak=0;
    state.queue=[];
    state.total = skill==='mixed' ? sessionLength() : Math.max(8, Math.floor(sessionLength()*0.8));

    for (let i=0;i<state.total;i++) state.queue.push(makeProblem(skill));

    document.querySelectorAll('#skills .card button').forEach(b=>b.disabled=true);
    $('session').classList.add('open');
    document.body.classList.add('modal-open');
    updateStats();
    try{ window.scrollTo(0,0); }catch(_){ }
    nextProblem();
  }

  function finishSession(){
    $('sessionBar').style.width = '100%';
    const accuracy = state.attempted ? Math.round((state.correct/state.attempted)*100) : 100;
    const summary = `Session complete ✅<br><span class="subtle">Correct: ${state.correct}/${state.attempted || state.total} • Accuracy: ${accuracy}% • Best streak: ${state.bestStreak}</span>`;
    openFeedback(summary, ()=>{
      document.querySelectorAll('#skills .card button').forEach(b=>b.disabled=false);
      $('session').classList.remove('open');
      document.body.classList.remove('modal-open');
    }, 'Finish');
  }

  function nextProblem(){
    if (window.MathJax && MathJax.typesetClear) {
      try{ MathJax.typesetClear([$('problemCard')]); }catch(_){ }
    }

    if (state.index>=state.total){ finishSession(); return; }

    const p = state.queue[state.index];
    state.current = p;

    $('skillTag').textContent = p.skill.charAt(0).toUpperCase()+p.skill.slice(1);
    $('progressTag').textContent = `${state.index+1} / ${state.total}`;
    $('prompt').innerHTML = p.prompt;
    $('hint').style.display = 'none';
    $('hint').innerHTML = p.hint || '';
    $('feedbackModal').classList.remove('open');
    $('sessionBar').style.width = `${Math.round((state.index/state.total)*100)}%`;
    $('instruction').textContent = 'Choose the correct answer.';

    const area = $('mcqArea');
    area.innerHTML='';
    p.choices.forEach((c,i)=>{
      const btn = document.createElement('button');
      btn.className = 'secondary';
      const isMatrix = /\\begin\{bmatrix\}|\\begin\{pmatrix\}/.test(c);
      btn.innerHTML = isMatrix ? `\\[${c}\\]` : `\\(${c}\\)`;
      btn.addEventListener('click', ()=> checkMCQ(i));
      area.appendChild(btn);
    });

    $('mcqArea').style.display = 'grid';
    $('inputArea').style.display = 'none';

    try{ $('problemCard').scrollTo({top:0, behavior:'instant'}); }catch(_){ $('problemCard').scrollTop = 0; }
    updateStats();
    typeset($('problemCard'));
  }

  function openFeedback(html, onNext, nextLabel='Next'){
    const modal = $('feedbackModal');
    $('feedback').innerHTML = html;
    const nextBtn = $('nextFeedbackBtn');
    const closeBtn = $('closeFeedbackBtn');

    nextBtn.textContent = nextLabel;
    nextBtn.onclick = ()=>{ modal.classList.remove('open'); if (onNext) onNext(); };
    closeBtn.onclick = ()=> modal.classList.remove('open');

    modal.classList.add('open');
    typeset(modal);
  }

  function checkMCQ(idx){
    const p = state.current;
    if (!p) return;

    state.attempted += 1;
    const correct = idx===p.correctIndex;

    if (correct){
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      openFeedback(`✅ Correct! ${p.explain ? `<br>${p.explain}` : ''}`, ()=>{ state.index++; nextProblem(); });
    } else {
      state.streak = 0;
      state.queue.push(makeProblem(p.skill));
      state.total += 1;
      $('progressTag').textContent = `${state.index+1} / ${state.total}`;
      openFeedback(`❌ Not quite. ${p.explain ? `<br>${p.explain}` : ''}<br><span class="subtle">You got an extra question so mastery stays strict.</span>`, null, 'Continue');
    }

    updateStats();
  }

  function goHome(){
    state.running=false;
    document.querySelectorAll('#skills .card button').forEach(b=>b.disabled=false);
    $('session').classList.remove('open');
    document.body.classList.remove('modal-open');
    try{ window.scrollTo(0,0); }catch(_){ }
  }

  document.querySelectorAll('#skills .card button').forEach(btn=>btn.addEventListener('click', ()=> startSession(btn.dataset.skill)));
  $('hintBtn').addEventListener('click', ()=>{
    const h = $('hint');
    h.style.display = h.style.display==='none' ? 'block' : 'none';
    typeset(h);
  });
  $('skipBtn').addEventListener('click', ()=>{ state.index++; nextProblem(); });
  $('homeBtn').addEventListener('click', goHome);
  $('session').addEventListener('click', (e)=>{ if (e.target === $('session')) goHome(); });

  typeset(document.body);
})();
