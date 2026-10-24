// Small, dependency-free helpers: front matter, a tiny markdown subset, escaping.
'use strict';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function parseValue(raw) {
  const v = raw.trim();
  if (v === '' || v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith('[') && v.endsWith(']')) {
    return v
      .slice(1, -1)
      .split(',')
      .map((x) => x.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return v.replace(/^["'](.*)["']$/, '$1');
}

// Parses "---\nkey: value\n---\nbody". Values: strings, numbers, booleans, [a, b] lists.
function frontMatter(src) {
  const text = src.replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 1 || line.trim().startsWith('#')) continue;
    data[line.slice(0, i).trim()] = parseValue(line.slice(i + 1));
  }
  return { data, body: m[2] };
}

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

// Markdown subset: "## heading" sections, paragraphs, "> quote", *em*, **strong**, [link](url).
function sections(md) {
  const out = [];
  let cur = null;
  for (const block of md.trim().split(/\n\s*\n/)) {
    const lines = block.split('\n');
    if (lines[0].startsWith('## ')) {
      cur = { title: lines[0].slice(3).trim(), html: '' };
      out.push(cur);
      lines.shift();
      if (!lines.length) continue;
    }
    if (!cur) {
      cur = { title: null, html: '' };
      out.push(cur);
    }
    const body = lines.join('\n');
    if (body.startsWith('> ')) {
      cur.html += `<blockquote>${lines.map((l) => inline(l.replace(/^>\s?/, ''))).join('<br>')}</blockquote>`;
    } else {
      cur.html += `<p>${lines.map(inline).join('<br>')}</p>`;
    }
  }
  return out;
}

// Poem body → stanzas of lines. "[1]" on its own line marks a numbered stanza.
// A line "===roman===" separates the original from an optional Roman transliteration.
function parsePoem(body) {
  const [orig, roman] = body.split(/\n===roman===\n/);
  const toStanzas = (txt) =>
    txt
      .trim()
      .split(/\n\s*\n/)
      .map((block) => {
        const lines = block.split('\n').map((l) => l.replace(/\s+$/, ''));
        let mark = null;
        const mm = lines[0].match(/^\[(\d+)\]$/);
        if (mm) {
          mark = mm[1];
          lines.shift();
        }
        return { mark, lines: lines.filter((l) => !/^#\s/.test(l)) };
      })
      .filter((s) => s.lines.length);
  return { stanzas: toStanzas(orig), roman: roman ? toStanzas(roman) : null };
}

const normalize = (s) =>
  String(s || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/़/g, '') // nukta: ज़ → ज
    .replace(/[ँं]/g, 'ं') // chandrabindu ≈ anusvara
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const devaNum = (n) => String(n).replace(/\d/g, (d) => '०१२३४५६७८९'[d]);
const roman = (n) => ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx', 'xxi', 'xxii'][n - 1] || String(n);
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

module.exports = { esc, frontMatter, sections, inline, parsePoem, normalize, devaNum, roman, cap };
