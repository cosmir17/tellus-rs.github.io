(() => {
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-btn');
  const modes = ['auto', 'light', 'dark'];
  const applyTheme = (mode) => {
    if (mode === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode);
    themeButton.textContent = mode;
  };
  let mode = 'auto';
  try { mode = localStorage.getItem('tellus-theme') || 'auto'; } catch (e) {}
  if (!modes.includes(mode)) mode = 'auto';
  applyTheme(mode);
  themeButton.addEventListener('click', () => {
    mode = modes[(modes.indexOf(mode) + 1) % modes.length];
    applyTheme(mode);
    try { localStorage.setItem('tellus-theme', mode); } catch (e) {}
  });

  const copyButton = document.getElementById('copy-btn');
  if (copyButton) {
    const command = document.getElementById('install-cmd');
    const selectCommand = () => {
      const range = document.createRange();
      range.selectNodeContents(command);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };
    copyButton.addEventListener('click', () => {
      const done = () => {
        copyButton.textContent = 'copied';
        setTimeout(() => { copyButton.textContent = 'copy'; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(command.textContent).then(done, selectCommand);
      else selectCommand();
    });
  }

  // data-axioms="create:8 send:9 next:12" tags the 1-based code lines a button highlights.
  const axiomCode = document.getElementById('axiom-code');
  if (axiomCode) {
    const lines = axiomCode.querySelectorAll('.giallo-l');
    axiomCode.dataset.axioms.split(' ').forEach((entry) => {
      const [axiom, line] = entry.split(':');
      const element = lines[Number(line) - 1];
      if (element) element.dataset.ax = axiom;
    });
    const axioms = document.querySelectorAll('.axiom');
    const show = (axiom) => {
      axiomCode.dataset.show = axiom || '';
      axioms.forEach((a) => a.setAttribute('aria-pressed', String(a.dataset.ax === axiom)));
    };
    let pinned = '';
    axioms.forEach((a) => {
      a.addEventListener('mouseenter', () => show(a.dataset.ax));
      a.addEventListener('mouseleave', () => show(pinned));
      a.addEventListener('focus', () => show(a.dataset.ax));
      a.addEventListener('blur', () => show(pinned));
      a.addEventListener('click', () => { pinned = pinned === a.dataset.ax ? '' : a.dataset.ax; show(pinned); });
    });
  }

  const copyIcon = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>';
  const doneIcon = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 8.5l3 3 7-7"/></svg>';
  document.querySelectorAll('pre.giallo').forEach((pre) => {
    const code = pre.querySelector('code');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-btn';
    button.setAttribute('aria-label', 'Copy code');
    button.innerHTML = `<span class="idle">${copyIcon}</span><span class="done">${doneIcon}</span><span class="label">Copy</span>`;
    const label = button.querySelector('.label');
    const show = (text) => {
      button.classList.add('copied');
      label.textContent = text;
      setTimeout(() => {
        button.classList.remove('copied');
        label.textContent = 'Copy';
      }, 1600);
    };
    const selectCode = () => {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      show('Selected');
    };
    button.addEventListener('click', () => {
      const text = code.textContent.replace(/\n$/, '');
      if (window.isSecureContext && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => show('Copied'), selectCode);
      } else {
        selectCode();
      }
    });

    const bar = pre.parentElement.querySelector(':scope > .code-bar');
    if (bar) {
      bar.append(button);
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'copy-float';
      pre.replaceWith(wrapper);
      wrapper.append(pre, button);
    }
  });

  const watchDiagram = document.getElementById('watch-svg');
  if (watchDiagram && matchMedia('(prefers-reduced-motion: reduce)').matches && watchDiagram.pauseAnimations) {
    watchDiagram.pauseAnimations();
  }
})();
