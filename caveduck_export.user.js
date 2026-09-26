// ==UserScript==
// @name         Caveduck Chat Exporter
// @namespace    yvelkram.caveduck.export
// @version      1.0.0
// @description  Export the loaded Caveduck chat as a readable Markdown or TXT file.
// @match        https://caveduck.io/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Configuration (edit here)
  // ---------------------------------------------------------------------------
  const CONFIG = {
    messageSelector: 'div[id^="chat-message-"]',
    messageIdPrefix: 'chat-message-',
    contentIdAttr: 'data-chat-content-id',
    userBubbleSelector: '.rounded-tr-none',          // user prompt bubble
    charBubbleSelector: '.rounded-tl-none',          // character reply bubble
    charNameSelector: 'div.mt-4.mb-1 > div.w-full',  // character name header
    greetingNameSelector: 'span.text-foreground',    // name in the greeting block
    stripTags: ['script', 'style', 'svg', 'img', 'button'],
    userLabel: '사용자',
    greetingLabel: '인사말',
    includeMessageId: true,     // show message id next to each turn heading
    addBom: true,               // prepend UTF-8 BOM so old Windows editors detect encoding
    gapWarnThreshold: 100000,   // message-id jump reported as a possible gap
    txtRule: '─'.repeat(40),
    panelBottom: '24px',
    panelRight: '24px',
    pollMs: 1000,               // how often the panel refreshes the message count
  };

  // ---------------------------------------------------------------------------
  // Parsing (same rules as cavearchive_parse.py)
  // ---------------------------------------------------------------------------
  function blockText(node) {
    if (!node) return '';
    const clone = node.cloneNode(true);
    clone.querySelectorAll(CONFIG.stripTags.join(',')).forEach((el) => el.remove());
    clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    const lines = clone.textContent.split('\n').map((ln) => ln.trim());
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function parseGreeting(item) {
    const nameEl = item.querySelector(CONFIG.greetingNameSelector);
    const name = blockText(nameEl);
    // Greeting block = first child div that is not the action bar
    const block = Array.from(item.children).find(
      (el) => el.tagName === 'DIV' && !el.hasAttribute(CONFIG.contentIdAttr)
    );
    let text = blockText(block);
    if (name && text.startsWith(name)) text = text.slice(name.length).trim();
    return { name, text };
  }

  function parseItem(item) {
    const bar = item.querySelector('[' + CONFIG.contentIdAttr + ']');
    const rec = {
      message_id: item.id.slice(CONFIG.messageIdPrefix.length),
      content_id: bar ? bar.getAttribute(CONFIG.contentIdAttr) : null,
      type: 'turn',
      user: '',
      char_name: '',
      char: '',
    };
    const userBubble = item.querySelector(CONFIG.userBubbleSelector);
    if (!userBubble) {
      const g = parseGreeting(item);
      rec.type = 'greeting';
      rec.char_name = g.name;
      rec.char = g.text;
      return rec;
    }
    rec.user = blockText(userBubble);
    rec.char_name = blockText(item.querySelector(CONFIG.charNameSelector));
    rec.char = blockText(item.querySelector(CONFIG.charBubbleSelector));
    return rec;
  }

  function collectRecords(root) {
    return Array.from((root || document).querySelectorAll(CONFIG.messageSelector)).map(parseItem);
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------
  function idTag(rec) {
    return CONFIG.includeMessageId ? ' (' + rec.message_id + ')' : '';
  }

  function toMarkdown(records, title) {
    const out = ['# ' + title, ''];
    let turnNo = 0;
    for (const rec of records) {
      if (rec.type === 'greeting') {
        out.push('## ' + CONFIG.greetingLabel + idTag(rec), '', '**' + rec.char_name + '**', '');
        out.push(rec.char.replace(/\n/g, '\n\n'), '');
        continue;
      }
      turnNo += 1;
      out.push('## Turn ' + turnNo + idTag(rec), '');
      out.push('**' + CONFIG.userLabel + '**', '');
      rec.user.split('\n').forEach((ln) => out.push(ln ? '> ' + ln : '>'));
      out.push('', '**' + rec.char_name + '**', '');
      out.push(rec.char.replace(/\n/g, '\n\n'), '', '---', '');
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  function toText(records, title) {
    const out = [title, '='.repeat(40), ''];
    let turnNo = 0;
    for (const rec of records) {
      if (rec.type === 'greeting') {
        out.push('[' + CONFIG.greetingLabel + ']' + idTag(rec), '');
        out.push('[' + rec.char_name + ']', rec.char, '', CONFIG.txtRule, '');
        continue;
      }
      turnNo += 1;
      out.push('[Turn ' + turnNo + ']' + idTag(rec), '');
      out.push('[' + CONFIG.userLabel + ']', rec.user, '');
      out.push('[' + rec.char_name + ']', rec.char, '', CONFIG.txtRule, '');
    }
    return out.join('\n').replace(/\n{4,}/g, '\n\n\n');
  }

  function findGaps(records) {
    const ids = records.map((r) => Number(r.message_id)).filter((n) => Number.isFinite(n));
    const gaps = [];
    for (let i = 1; i < ids.length; i++) {
      if (ids[i] - ids[i - 1] > CONFIG.gapWarnThreshold) gaps.push([ids[i - 1], ids[i]]);
    }
    return gaps;
  }

  // ---------------------------------------------------------------------------
  // Download
  // ---------------------------------------------------------------------------
  function safeName(s) {
    return (s || 'caveduck_chat').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }

  function download(text, filename, mime) {
    const parts = CONFIG.addBom ? ['﻿', text] : [text];
    const blob = new Blob(parts, { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function exportChat(format) {
    const records = collectRecords(document);
    if (!records.length) {
      setStatus('대화를 찾지 못했습니다');
      return;
    }
    const charName = (records.find((r) => r.char_name) || {}).char_name || 'chat';
    const session = (location.pathname.match(/\/talk\/([0-9a-f-]{8,})/i) || [])[1] || '';
    const title = charName + ' 대화 기록';
    const base = safeName(charName + '_' + stamp() + (session ? '_' + session.slice(0, 8) : ''));
    if (format === 'md') {
      download(toMarkdown(records, title), base + '.md', 'text/markdown');
    } else {
      download(toText(records, title), base + '.txt', 'text/plain');
    }
    const turns = records.filter((r) => r.type === 'turn').length;
    const gaps = findGaps(records);
    console.log('[caveduck-export] items=%d turns=%d gaps=%o', records.length, turns, gaps);
    setStatus('저장 완료: ' + turns + '턴' + (gaps.length ? ' (ID 공백 ' + gaps.length + '곳)' : ''));
  }

  // ---------------------------------------------------------------------------
  // UI: floating panel at the bottom-right corner
  // ---------------------------------------------------------------------------
  let statusEl = null;
  let statusHoldUntil = 0;

  function setStatus(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusHoldUntil = Date.now() + 4000;
  }

  function makeButton(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    Object.assign(b.style, {
      padding: '6px 12px', border: '1px solid #555', borderRadius: '6px',
      background: '#2b2b2b', color: '#eee', font: '13px sans-serif', cursor: 'pointer',
    });
    b.addEventListener('mouseenter', () => { b.style.background = '#3a3a3a'; });
    b.addEventListener('mouseleave', () => { b.style.background = '#2b2b2b'; });
    b.addEventListener('click', onClick);
    return b;
  }

  function buildPanel() {
    if (document.getElementById('cd-export-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'cd-export-panel';
    Object.assign(panel.style, {
      position: 'fixed', right: CONFIG.panelRight, bottom: CONFIG.panelBottom, zIndex: 2147483647,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px',
      padding: '8px', borderRadius: '8px', background: 'rgba(20,20,20,0.85)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
    });
    statusEl = document.createElement('div');
    Object.assign(statusEl.style, { color: '#bbb', font: '12px sans-serif' });
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '6px' });
    row.appendChild(makeButton('MD 저장', () => exportChat('md')));
    row.appendChild(makeButton('TXT 저장', () => exportChat('txt')));
    panel.appendChild(statusEl);
    panel.appendChild(row);
    document.body.appendChild(panel);
  }

  function refresh() {
    const onTalk = /\/talk\//.test(location.pathname);
    const panel = document.getElementById('cd-export-panel');
    if (!onTalk) {
      if (panel) panel.style.display = 'none';
      return;
    }
    buildPanel();
    document.getElementById('cd-export-panel').style.display = 'flex';
    if (Date.now() > statusHoldUntil) {
      const n = document.querySelectorAll(CONFIG.messageSelector).length;
      statusEl.textContent = '불러온 항목: ' + n + '개';
    }
  }

  // Expose parser for testing outside the page (no effect in the browser)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { collectRecords, toMarkdown, toText, findGaps };
    return;
  }

  setInterval(refresh, CONFIG.pollMs);
  refresh();
})();
