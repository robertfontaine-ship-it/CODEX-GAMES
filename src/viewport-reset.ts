export function installViewportReset() {
  const attach = () => {
    const gameFrame = document.querySelector('.game-frame');
    if (!gameFrame) {
      window.requestAnimationFrame(attach);
      return;
    }

    let activeScreen = gameFrame.firstElementChild;
    const observer = new MutationObserver(() => {
      const nextScreen = gameFrame.firstElementChild;
      if (nextScreen === activeScreen) return;
      activeScreen = nextScreen;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });

    observer.observe(gameFrame, { childList: true });
  };

  window.requestAnimationFrame(attach);
}
