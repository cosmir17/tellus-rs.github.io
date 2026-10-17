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

  const watchDiagram = document.getElementById('watch-svg');
  if (watchDiagram && matchMedia('(prefers-reduced-motion: reduce)').matches && watchDiagram.pauseAnimations) {
    watchDiagram.pauseAnimations();
  }
})();
