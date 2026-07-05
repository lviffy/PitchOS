/* global Pear */
import ui from 'pear-electron';

if (typeof ui === 'function' && ui.prototype && typeof ui.prototype.start === 'function') {
  // 1. We are in the sidecar/bootstrapper process - spin up the Electron shell
  console.log("[Pear Desktop] Initializing Pear Electron UI shell...");
  const app = new ui();
  await app.start();
  // Keep the main bootstrapper process alive while the GUI is running
  setInterval(() => {}, 60000);
} else {
  // 2. We are in the GUI window process - the viewport is loaded automatically
  console.log("[Pear Desktop] GUI Window process active.");
}
