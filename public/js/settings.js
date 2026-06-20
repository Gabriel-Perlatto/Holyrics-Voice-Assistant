(() => {
  const stateElement = document.querySelector('[data-system-state]');
  const urlElement = document.querySelector('[data-system-url]');
  const ipElement = document.querySelector('[data-system-ip]');
  const uptimeElement = document.querySelector('[data-system-uptime]');
  const messageElement = document.querySelector('[data-system-message]');

  if (
    !stateElement ||
    !urlElement ||
    !ipElement ||
    !uptimeElement ||
    !messageElement
  ) {
    return;
  }

  const formatUptime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/system/status', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const status = await response.json();

      stateElement.textContent = 'Online';
      stateElement.classList.add('status-badge--online');
      urlElement.textContent = status.localUrl;
      ipElement.textContent = status.localIp;
      uptimeElement.textContent = formatUptime(status.uptimeSeconds);
      messageElement.textContent = status.networkAvailable
        ? 'O servidor está disponível para dispositivos na mesma rede local.'
        : 'Não foi possível detectar a rede local. O acesso está limitado a este computador.';
    } catch {
      stateElement.textContent = 'Indisponível';
      stateElement.classList.add('status-badge--error');
      urlElement.textContent = 'Não disponível';
      ipElement.textContent = 'Não disponível';
      uptimeElement.textContent = 'Não disponível';
      messageElement.textContent =
        'Não foi possível consultar o estado do servidor.';
    }
  };

  void loadStatus();
})();
