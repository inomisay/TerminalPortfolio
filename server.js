'use strict';

const { Server } = require('ssh2');
const crypto     = require('crypto');
const fs         = require('fs');
const path       = require('path');
const { createUI } = require('./src/ui');

// ── Host key ──────────────────────────────────────────────
const KEY_DIR  = path.join(__dirname, 'keys');
const KEY_FILE = path.join(KEY_DIR, 'host.key');

if (!fs.existsSync(KEY_FILE)) {
  fs.mkdirSync(KEY_DIR, { recursive: true });
  console.log('[keygen] Generating RSA host key…');
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  fs.writeFileSync(KEY_FILE, privateKey.export({ type: 'pkcs1', format: 'pem' }));
  console.log('[keygen] Saved to keys/host.key');
}

// ── Server ────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '2222', 10);

/**
 * The core SSH server instance.
 * It uses the 'ssh2' library to listen for incoming SSH connections
 * and serves the terminal UI over the secure channel.
 */
const server = new Server(
  { hostKeys: [fs.readFileSync(KEY_FILE)] },
  (client) => {
    const addr = client._sock?.remoteAddress ?? '?';
    console.log(`[connect] ${addr}`);

    // Authentication: Accept any username/password.
    // This makes the portfolio public and easy to access via command line.
    client.on('authentication', (ctx) => ctx.accept());

    client.on('ready', () => {
      // Once authenticated, wait for the client to request a session (shell/pty)
      client.on('session', (accept) => {
        const session = accept();

        // Default PTY dimensions in case the client doesn't send them
        let ptyInfo = { cols: 220, rows: 50, term: 'xterm-256color' };
        let currentStream = null;
        let currentScreen = null;

        // PTY (Pseudo-Terminal) request from client
        session.once('pty', (accept, _reject, info) => {
          ptyInfo = info;
          accept();
        });

        // Handle terminal resizing (window-change event)
        // This ensures the blessed UI updates its layout when the user resizes their terminal window.
        session.on('window-change', (_accept, _reject, info) => {
          if (currentStream) {
            currentStream.columns = info.cols;
            currentStream.rows    = info.rows;
          }
          if (currentScreen) {
            currentScreen.emit('resize');
          }
        });

        // Shell request: This is where we actually boot the terminal UI
        session.once('shell', async (accept) => {
          const stream = accept();
          currentStream = stream;

          // Wire up the stream to act like a real TTY for blessed
          stream.columns = ptyInfo.cols || 220;
          stream.rows    = ptyInfo.rows  || 50;
          stream.isTTY   = true;

          try {
            // Initialize the blessed screen and inject our custom UI
            const { screen } = await createUI(stream, ptyInfo);
            currentScreen = screen;
          } catch (err) {
            fs.appendFileSync('error.log', `[ui start error] ` + (err.stack || err.message) + '\n');
            console.error('[ui error]', err.message);
            stream.write('\r\n[error] Failed to start UI: ' + err.message + '\r\n');
            stream.end();
          }

          // Clean up on session close
          stream.on('close', () => {
            console.log(`[disconnect] ${addr}`);
            if (currentScreen) {
              try { currentScreen.destroy(); } catch { /* ignore */ }
            }
          });
        });
      });
    });

    client.on('error', (err) => {
      // Suppress common noisy errors (client dropped connection etc.)
      if (!['ECONNRESET', 'ETIMEDOUT'].includes(err.code)) {
        fs.appendFileSync('error.log', `[client err] ` + (err.stack || err.message) + '\n');
        console.error('[client error]', err.message);
      }
    });
  }
);

server.on('error', (err) => console.error('[server error]', err));

// Start listening for connections
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  SSH personal site ready`);
  console.log(`  ssh -p ${PORT} localhost`);
  console.log(`  ssh -p ${PORT} -o StrictHostKeyChecking=no localhost\n`);
});
