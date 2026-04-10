export const PORTABLE_TEXT_LIST_CSS = `
[role='textbox'] {
  --list-padding: 1em;
  counter-reset: level-1 level-2 level-3 level-4 level-5 level-6 level-7 level-8 level-9 level-10;
}
[data-list-item] { display: flex; gap: 0.5rem; }
[data-list-item]::before { text-align: right; width: 1.5rem; }
[data-list-item='number'] { align-items: baseline; }
[data-list-item='number']::before { font-size: 0.9rem; font-variant-numeric: tabular-nums; }
[data-list-item='bullet'] { align-items: center; }
[data-list-item='bullet']::before { font-size: 0.4rem; }
[data-level='1'][data-list-index='1'] { counter-set: level-1 1; }
[data-level='2'][data-list-index='1'] { counter-set: level-2 1; }
[data-level='3'][data-list-index='1'] { counter-set: level-3 1; }
[data-level='1']:not([data-list-index='1']) { counter-increment: level-1; }
[data-level='2']:not([data-list-index='1']) { counter-increment: level-2; }
[data-level='3']:not([data-list-index='1']) { counter-increment: level-3; }
[data-list-item='number'][data-level='1']::before { content: counter(level-1, decimal) '.'; }
[data-list-item='number'][data-level='2']::before { content: counter(level-2, lower-alpha) '.'; }
[data-list-item='number'][data-level='3']::before { content: counter(level-3, lower-roman) '.'; }
[data-list-item='bullet'][data-level='1']::before,
[data-list-item='bullet'][data-level='4']::before { content: '●'; }
[data-list-item='bullet'][data-level='2']::before,
[data-list-item='bullet'][data-level='5']::before { content: '○'; }
[data-list-item='bullet'][data-level='3']::before,
[data-list-item='bullet'][data-level='6']::before { content: '■'; }
[data-level='2'] { padding-left: var(--list-padding); }
[data-level='3'] { padding-left: calc(var(--list-padding) * 2); }
`
