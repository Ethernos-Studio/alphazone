// Deterministic original brand/map assets. Run: bun scripts/generate-assets.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'assets');
fs.mkdirSync(out, { recursive: true });
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#101c25" d="M28 4h10l24 55H46L32 24 18 59H2L25 7ZM24 43h28l5 12H19Z"/><path fill="#ff693b" d="m39 4 6 14H29l-6-14Z"/></svg>`;
fs.writeFileSync(path.join(out, 'az-mark.svg'), logo);
let contours = '';
for (let k = 0; k < 55; k++) {
  const points = [];
  for (let a = 0; a <= 180; a++) {
    const theta = a / 180 * Math.PI * 2;
    const rad = 35 + k * 10;
    const modulation = 1 + .09 * Math.sin(theta * 7 + k * .08) + .055 * Math.cos(theta * 13 - k * .09) + .025 * Math.sin(theta * 21);
    const x = 670 + Math.cos(theta) * rad * 1.3 * modulation + Math.sin(theta * 2) * 28;
    const y = 280 + Math.sin(theta) * rad * .76 * modulation + Math.sin(theta * 3) * 15;
    points.push(`${a ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  contours += `<path d="${points.join(' ')}Z" stroke="${k % 5 === 0 ? '#5b7685' : '#37505d'}" stroke-width="${k % 5 === 0 ? 1 : .6}"/>`;
}
const coast = 'M-30 70 50 83 96 128 147 118 190 161 249 151 292 190 331 157 376 116 420 124 455 97 520 106 568 82 640 96 677 80 730 118 778 91 816 119 860 106 930 140 1000 113 1150 158 1140 700 990 700 920 660 875 689 810 640 790 675 734 618 700 592 657 611 621 579 610 549 568 550 549 517 520 553 477 521 480 566 452 577 442 542 404 559 411 583 375 594 346 583 326 610 304 599 262 628 222 625 211 641 150 666 98 665 132 637 196 612 209 584 252 551 270 516 253 480 219 491 214 458 166 465 168 425 198 416 188 388 162 374 123 401 104 367 66 360 87 323 103 279 73 263 87 233 53 215 58 184 21 185-4 136Z';
const map = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 800" fill="none"><defs><pattern id="grid" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M70 0H0V70" stroke="#537080" opacity=".21" stroke-width=".65"/></pattern><pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V9" stroke="#ff693b" opacity=".13"/></pattern><clipPath id="land"><path d="${coast}"/></clipPath><radialGradient id="glow"><stop stop-color="#365561" stop-opacity=".35"/><stop offset="1" stop-color="#15252e" stop-opacity="0"/></radialGradient></defs><rect width="1100" height="800" fill="#11212b"/><rect width="1100" height="800" fill="url(#grid)"/><path d="${coast}" fill="#1c313b" stroke="#76909a" stroke-width="1.2"/><g clip-path="url(#land)">${contours}<ellipse cx="580" cy="400" rx="500" ry="390" fill="url(#glow)"/><path d="M470 90 520 700M750 80 800 700" stroke="#7d939d" stroke-dasharray="6 9" opacity=".27"/><path d="M315 255 745 219 934 390 801 582 469 650 255 510Z" fill="url(#hatch)" stroke="#ff693b" stroke-opacity=".5" stroke-dasharray="5 6"/></g><path d="M219 542C269 514 317 539 341 570S470 594 527 590 576 624 630 638 745 670 796 624 898 650 972 665" stroke="#ff693b" stroke-width="2" stroke-dasharray="7 9" opacity=".7"/><path d="M270 628 650 650" stroke="#6d858f" stroke-dasharray="2 8" opacity=".3"/><g stroke="#c0d0d4" opacity=".2"><path d="M100 100h18m-9-9v18M980 680h18m-9-9v18M100 680h18m-9-9v18M980 100h18m-9-9v18"/></g></svg>`;
fs.writeFileSync(path.join(out, 'zone-map.svg'), map);
global.window = {};
require(path.join(root, 'story-data.js'));
const story = window.AZ_STORY;
const text = '# 2031·ALFA ZONE「伪史时间线·完整广播版」\n\n（EPUN战档司 / 2031-09-24 06:00 发布，保密等级-L3，仅供「内部新闻教育模块」调用）\n\n【虚构游戏世界观，非真实新闻】\n\n格式说明：每条事件后附【当天此时新闻播报】——均为当年全球四大新闻聚合AI同时段首屏稿，原文语义未改，仅作时态统一。\n\n' + story.phases.map(phase => `## 阶段${phase.id} ${phase.title}（${phase.period}）\n\n` + story.events.filter(event => event.phase === phase.id).map(event => `${event.date}\n${event.text}${event.bullets ? '\n' + event.bullets.map(line => '- ' + line).join('\n') : ''}\n【当天此时新闻播报】\n${event.news}`).join('\n\n')).join('\n\n---\n\n');
fs.writeFileSync(path.join(out, 'alpha-zone-archive.txt'), '﻿' + text);
console.log(`Original map, mark and complete ${story.events.length}-entry archive created.`);
