// Popup script - shows connection status
(function () {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');

  function setConnected() {
    dot.className = 'dot';
    text.textContent = 'Extension Active';
  }

  function setDisconnected() {
    dot.className = 'dot inactive';
    text.textContent = 'Waiting for Dashboard...';
  }

  // Ping the background to check if it's alive
  try {
    chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
      if (response && response.installed) {
        setConnected();
      } else {
        setDisconnected();
      }
    });
  } catch (e) {
    setDisconnected();
  }
})();
