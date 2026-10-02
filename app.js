(() => {
  'use strict';
  const { events, phases, locations } = window.AZ_STORY;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentEvent = events.findIndex(event => event.id === '2028-08-05');
  let currentPhase = events[currentEvent].phase;
  let toastTimeout;
  function toast(message) {
    clearTimeout(toastTimeout);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 4200);
  }
  function setHash(hash) {
    try { history.replaceState(null, '', hash); } catch (_) { /* file:// can restrict history changes. */ }
  }

  const menuToggle = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() {
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '打开导航');
  }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    mobileNav.hidden = !open;
  });
  mobileNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); }
  });
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  $('#event-count').textContent = events.length;
  $('#phase-nav').innerHTML = phases.map(phase => `<button class="phase-button" data-phase="${phase.id}" aria-pressed="false"><span>0${phase.id}</span><strong>${phase.title}</strong><small>${phase.period}</small></button>`).join('');
  function renderPhase() {
    const phase = phases[currentPhase];
    $$('.phase-button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.phase) === currentPhase)));
    $('#phase-period').textContent = phase.period;
    $('#phase-title').textContent = phase.title;
    $('#phase-intro').textContent = phase.intro;
    $('#event-list').innerHTML = events.filter(event => event.phase === currentPhase).map(event => `<button class="event-button" data-event="${event.id}" aria-pressed="${events[currentEvent].id === event.id}"><time datetime="${event.id}">${event.id.replaceAll('-', '.')}</time><span>${event.title}</span>${icon('arrow')}</button>`).join('');
  }
  function renderEvent() {
    const event = events[currentEvent];
    const date = event.date.slice(0, 10).replaceAll('-', '.');
    const time = event.date.slice(11);
    $('#event-content').innerHTML = `<div class="event-document-header"><span>EPUN 战档 / ${String(currentEvent + 1).padStart(3, '0')}</span><span class="classification">L3 · 内部记录</span></div><time class="event-date" datetime="${event.id}">${date}${time ? `<small>${time}</small>` : ''}</time><h3 id="event-title">${event.title}</h3><div class="event-body"><p>${event.text}</p>${event.bullets ? `<ul>${event.bullets.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}</div><div class="news-record"><div class="news-record-label"><span class="mini-wave" aria-hidden="true">${'<i></i>'.repeat(8)}</span>当天此时新闻播报</div><blockquote>${event.news}</blockquote></div>`;
    $('#event-position').textContent = `${String(currentEvent + 1).padStart(2, '0')} / ${events.length}`;
    $('#previous-event').disabled = currentEvent === 0;
    $('#next-event').disabled = currentEvent === events.length - 1;
    $$('.event-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.event === event.id)));
  }
  function selectEvent(id, { scroll = false, hash = true, focus = false } = {}) {
    const index = events.findIndex(event => event.id === id);
    if (index < 0) return;
    currentEvent = index;
    if (events[index].phase !== currentPhase) { currentPhase = events[index].phase; renderPhase(); }
    renderEvent();
    if (hash) setHash(`#event-${id}`);
    if (focus) { $('#event-title').tabIndex = -1; $('#event-title').focus({ preventScroll: true }); }
    if (scroll) {
      const target = focus || window.innerWidth <= 800 ? $('#event-detail') : $('#archive');
      target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
    }
  }
  $('#phase-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-phase]');
    if (!button) return;
    currentPhase = Number(button.dataset.phase);
    currentEvent = events.findIndex(item => item.phase === currentPhase);
    renderPhase(); renderEvent(); setHash(`#event-${events[currentEvent].id}`);
  });
  $('#event-list').addEventListener('click', event => {
    const button = event.target.closest('[data-event]');
    if (!button) return;
    selectEvent(button.dataset.event);
    if (window.innerWidth <= 800) $('#event-detail').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  });
  $('#previous-event').addEventListener('click', () => { if (currentEvent > 0) selectEvent(events[currentEvent - 1].id); });
  $('#next-event').addEventListener('click', () => { if (currentEvent < events.length - 1) selectEvent(events[currentEvent + 1].id); });
  $('#share-event').addEventListener('click', async () => {
    const url = new URL(location.href); url.hash = `event-${events[currentEvent].id}`;
    const text = url.href;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement('textarea'); field.value = text;
        field.style.cssText = 'position:fixed;top:0;left:-9999px'; document.body.append(field); field.select();
        const copied = document.execCommand('copy'); field.remove(); $('#share-event').focus();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      toast(location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname) ? '已复制本地记录链接；其他设备需先访问同一网站。' : '已复制这条记录的链接。');
    } catch (_) { toast('浏览器未允许复制。可从地址栏复制当前记录链接。'); }
  });
  function archiveText() {
    return '# 2031·ALFA ZONE「伪史时间线·完整广播版」\n\n（EPUN战档司 / 2031-09-24 06:00 发布，保密等级-L3，仅供「内部新闻教育模块」调用）\n\n【虚构游戏世界观，非真实新闻】\n\n格式说明：每条事件后附【当天此时新闻播报】——均为当年全球四大新闻聚合AI同时段首屏稿，原文语义未改，仅作时态统一。\n\n' + phases.map(phase => `## 阶段${phase.id} ${phase.title}（${phase.period}）\n\n` + events.filter(event => event.phase === phase.id).map(event => `${event.date}\n${event.text}${event.bullets ? '\n' + event.bullets.map(line => '- ' + line).join('\n') : ''}\n【当天此时新闻播报】\n${event.news}`).join('\n\n')).join('\n\n---\n\n');
  }
  $('#download-archive').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob(['﻿', archiveText()], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'Alpha_Zone_EPUN_2031_完整战档.txt'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000); toast('已生成完整战档，正在交给浏览器下载。');
  });
  $('#read-all').addEventListener('click', event => { event.preventDefault(); selectEvent(events[0].id, { scroll: true, focus: true }); });
  renderPhase(); renderEvent();
  function restoreHash() {
    const match = location.hash.match(/^#event-(\d{4}-\d{2}-\d{2})$/);
    if (match) selectEvent(match[1], { scroll: true, hash: false });
  }
  window.addEventListener('hashchange', restoreHash);
  if (location.hash.startsWith('#event-')) requestAnimationFrame(restoreHash);

  $('#map-markers').innerHTML = locations.map((place, index) => `<button class="map-marker" data-location="${place.id}" style="left:${place.x}%;top:${place.y}%" aria-label="${place.name}：${place.label}" aria-pressed="false"><span class="marker-ring"></span><span class="marker-text">${String(index + 1).padStart(2, '0')} / ${place.name}</span></button>`).join('');
  $('#location-tabs').innerHTML = locations.map((place, index) => `<button data-location="${place.id}" aria-label="${place.name}" aria-pressed="false">0${index + 1}</button>`).join('');
  function selectLocation(id) {
    const place = locations.find(item => item.id === id);
    if (!place) return;
    $$('[data-location]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.location === id)));
    $('#location-detail').innerHTML = `<div class="location-category"><span>${place.label}</span><span>EPUN / 情报记录</span></div><h3 class="location-title" id="location-title">${place.name}</h3><p class="location-status"><i class="status-dot"></i>${place.status}</p><p class="location-description">${place.description}</p><div class="location-metric"><strong>${place.metric}</strong><span>${place.unit}</span></div><p class="location-metric-caption">${place.detail}</p><a class="text-link location-event" href="#event-${place.event}" data-related-event="${place.event}">调阅关联战档 ${icon('arrow')}</a>`;
  }
  $('#territory').addEventListener('click', event => {
    const marker = event.target.closest('[data-location]'); if (marker) selectLocation(marker.dataset.location);
    const link = event.target.closest('[data-related-event]');
    if (link) { event.preventDefault(); selectEvent(link.dataset.relatedEvent, { scroll: true, focus: true }); }
  });
  selectLocation('denali');

  const channels = [
    { frequency: '081.2', event: '2028-01-17', title: '一美元的末日' },
    { frequency: '084.5', event: '2028-05-17', title: '监测站失联' },
    { frequency: '087.6', event: '2028-08-05', title: '核闪' },
    { frequency: '091.3', event: '2028-09-14', title: '北境失守' },
    { frequency: '096.0', event: '2031-09-24', title: '此处无未来' }
  ];
  let channelIndex = 2, audioContext, noiseSource, audioGain, filter, audioOn = false, audioBusy = false;
  function updateSoundUI() {
    $$('[data-sound]').forEach(button => {
      button.setAttribute('aria-pressed', String(audioOn));
      button.querySelector('span').textContent = audioOn ? '关闭环境音' : (button.classList.contains('sound-control') ? '环境音关闭' : '启用环境音');
    });
    $('#receiver-status').innerHTML = `<i class="status-dot"></i> ${audioOn ? '接收中' : '待机'}`;
    $('#receiver-status').classList.toggle('is-on', audioOn);
  }
  async function enableAudio() {
    if (audioBusy || audioOn) return;
    audioBusy = true;
    const buttons = $$('[data-sound]');
    buttons.forEach(button => { button.disabled = true; button.setAttribute('aria-busy', 'true'); button.querySelector('span').textContent = '连接中…'; });
    try {
      if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error('Web Audio unsupported');
        audioContext = new AudioContextClass();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate);
        const samples = buffer.getChannelData(0);
        let previous = 0;
        for (let i = 0; i < samples.length; i++) { previous = (previous + .025 * (Math.random() * 2 - 1)) / 1.025; samples[i] = previous * 5; }
        noiseSource = audioContext.createBufferSource(); noiseSource.buffer = buffer; noiseSource.loop = true;
        filter = audioContext.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 520 + channelIndex * 220; filter.Q.value = .65;
        audioGain = audioContext.createGain(); audioGain.gain.value = 0;
        noiseSource.connect(filter).connect(audioGain).connect(audioContext.destination); noiseSource.start();
      }
      await audioContext.resume();
      filter.frequency.setValueAtTime(520 + channelIndex * 220, audioContext.currentTime);
      audioOn = true; audioGain.gain.setTargetAtTime(Number($('#volume').value) / 100 * .28, audioContext.currentTime, .18);
      if (document.hidden) stopAudio();
    } catch (_) { toast('当前浏览器无法启用环境音，文字广播仍可正常阅读。'); audioOn = false; }
    finally { audioBusy = false; buttons.forEach(button => { button.disabled = false; button.removeAttribute('aria-busy'); }); updateSoundUI(); }
  }
  function stopAudio() {
    audioOn = false;
    if (audioContext) { audioGain.gain.cancelScheduledValues(audioContext.currentTime); audioGain.gain.value = 0; audioContext.suspend().catch(() => {}); }
    updateSoundUI();
  }
  $$('[data-sound]').forEach(button => button.addEventListener('click', () => { if (audioOn) stopAudio(); else enableAudio(); }));
  $('#volume').addEventListener('input', event => { if (audioOn) audioGain.gain.setTargetAtTime(Number(event.target.value) / 100 * .28, audioContext.currentTime, .06); });
  function tune(index) {
    channelIndex = index;
    const channel = channels[index], event = events.find(item => item.id === channel.event);
    $('#frequency-value').textContent = channel.frequency;
    $('#channel-label').textContent = String(index + 1).padStart(2, '0');
    $('#radio-record-date').textContent = event.id.replaceAll('-', '.');
    $('#radio-transcript').textContent = event.news;
    $('#radio-tuner').setAttribute('aria-valuetext', `频道${index + 1}：${channel.title}，${channel.frequency} kHz，模拟频率`);
    if (audioOn) filter.frequency.setTargetAtTime(520 + index * 220, audioContext.currentTime, .1);
    drawWave(0);
  }
  $('#radio-tuner').addEventListener('input', event => tune(Number(event.target.value)));
  $('#hero-broadcast').addEventListener('click', () => { $('#radio').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' }); $('#radio-tuner').focus({ preventScroll: true }); enableAudio(); });

  const waveCanvas = $('#waveform'), waveContext = waveCanvas.getContext('2d');
  function drawWave(time) {
    if (!waveContext) return;
    const ctx = waveContext, width = waveCanvas.width, height = waveCanvas.height;
    ctx.clearRect(0, 0, width, height); ctx.lineWidth = 1; ctx.strokeStyle = '#28404c';
    for (let y = 10; y <= height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    ctx.strokeStyle = '#ff8158'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = 0; x <= width; x += 2) {
      const envelope = .18 + .82 * Math.pow(Math.sin(x / width * Math.PI), 4);
      const offset = audioOn ? time * .003 : 0;
      const y = height / 2 + Math.sin(x * .105 + offset) * Math.cos(x * .017 + channelIndex) * envelope * 27 + Math.sin(x * .39 + offset * 1.4) * envelope * 9;
      if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  tune(2);

  const snowCanvas = $('#snow'), snowContext = snowCanvas.getContext('2d');
  const hero = $('.hero');
  let width = 0, height = 0, snowVisible = true, radioVisible = false, lastTime = 0, animationFrame = 0;
  const flakes = Array.from({ length: 58 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + .4, speed: Math.random() * .018 + .009, opacity: Math.random() * .35 + .12 }));
  function resizeSnow() {
    width = hero.clientWidth; height = hero.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    snowCanvas.width = width * dpr; snowCanvas.height = height * dpr;
    if (snowContext) snowContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const resizeObserver = new ResizeObserver(resizeSnow); resizeObserver.observe(hero); resizeSnow();
  function animate(time) {
    animationFrame = 0;
    if (document.hidden || reduced.matches || (!snowVisible && !radioVisible)) return;
    const elapsed = Math.min((time - lastTime) / 1000, .05); lastTime = time;
    if (snowVisible && snowContext) {
      snowContext.clearRect(0, 0, width, height);
      flakes.forEach(flake => {
        flake.x += elapsed * flake.speed * 1.1; flake.y += elapsed * flake.speed * .7;
        if (flake.x > 1.02) flake.x = -.02; if (flake.y > 1.02) flake.y = -.02;
        snowContext.fillStyle = `rgba(247,251,250,${flake.opacity})`; snowContext.beginPath(); snowContext.ellipse(flake.x * width, flake.y * height, flake.r * 2.3, flake.r * .6, .55, 0, Math.PI * 2); snowContext.fill();
      });
    }
    if (radioVisible) drawWave(time);
    animationFrame = requestAnimationFrame(animate);
  }
  function startAnimation() { if (!animationFrame && !reduced.matches && !document.hidden && (snowVisible || radioVisible)) { lastTime = performance.now(); animationFrame = requestAnimationFrame(animate); } }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.target === hero) snowVisible = entry.isIntersecting; else radioVisible = entry.isIntersecting; }); startAnimation();
  }, { threshold: 0 });
  observer.observe(hero); observer.observe($('#radio'));
  reduced.addEventListener('change', () => { if (reduced.matches) { cancelAnimationFrame(animationFrame); animationFrame = 0; drawWave(0); } else startAnimation(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopAudio(); cancelAnimationFrame(animationFrame); animationFrame = 0; } else startAnimation(); });
  window.addEventListener('pagehide', stopAudio);
  startAnimation();
})();
