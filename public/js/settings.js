(() => {
  const formatUptime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  };

  const getErrorMessage = async (response) => {
    try {
      const body = await response.json();

      return typeof body.message === 'string'
        ? body.message
        : 'Não foi possível salvar as configurações.';
    } catch {
      return 'Não foi possível salvar as configurações.';
    }
  };

  const loadStatus = async () => {
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

  const initializeSettingsForm = async () => {
    const form = document.querySelector('[data-settings-form]');
    const stateElement = document.querySelector('[data-settings-state]');
    const feedbackElement = document.querySelector(
      '[data-settings-feedback]',
    );
    const submitButton = document.querySelector('[data-settings-submit]');
    const fields = [...document.querySelectorAll('[data-settings-field]')];

    if (!form || !stateElement || !feedbackElement || !submitButton) {
      return;
    }

    const setBusy = (busy) => {
      submitButton.disabled = busy;
      fields.forEach((field) => {
        field.disabled = busy;
      });
    };

    const setState = (label, modifier) => {
      stateElement.textContent = label;
      stateElement.classList.remove(
        'status-badge--online',
        'status-badge--error',
      );

      if (modifier) {
        stateElement.classList.add(modifier);
      }
    };

    const fillForm = (settings) => {
      form.elements.holyricsHost.value = settings.holyricsHost ?? '';
      form.elements.holyricsPort.value = settings.holyricsPort ?? '';
      form.elements.language.value = settings.language ?? 'pt-BR';
      form.elements.microphone.value = settings.microphone ?? '';
      form.elements.voskModelPath.value = settings.voskModelPath ?? '';
    };

    try {
      setBusy(true);

      const response = await fetch('/api/settings', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      fillForm(await response.json());
      setState('Carregado', 'status-badge--online');
      feedbackElement.textContent = 'Configurações locais carregadas.';
    } catch {
      setState('Erro', 'status-badge--error');
      feedbackElement.textContent =
        'Não foi possível carregar as configurações locais.';
      feedbackElement.classList.add('form-feedback--error');
    } finally {
      setBusy(false);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedbackElement.classList.remove('form-feedback--error');
      feedbackElement.textContent = 'Salvando configurações...';
      setState('Salvando');
      setBusy(true);

      const portValue = form.elements.holyricsPort.value.trim();
      const payload = {
        holyricsHost: form.elements.holyricsHost.value,
        holyricsPort: portValue ? Number(portValue) : null,
        language: form.elements.language.value,
        microphone: form.elements.microphone.value,
        voskModelPath: form.elements.voskModelPath.value,
      };

      try {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        fillForm(await response.json());
        setState('Salvo', 'status-badge--online');
        feedbackElement.textContent =
          'Configurações salvas neste computador.';
      } catch (error) {
        setState('Erro', 'status-badge--error');
        feedbackElement.textContent =
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar as configurações.';
        feedbackElement.classList.add('form-feedback--error');
      } finally {
        setBusy(false);
      }
    });
  };

  void loadStatus();
  void initializeSettingsForm();
})();
