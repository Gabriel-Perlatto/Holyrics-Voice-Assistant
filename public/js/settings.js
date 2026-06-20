(() => {
  const formatUptime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  };

  const getErrorMessage = async (response, fallbackMessage) => {
    try {
      const body = await response.json();

      return typeof body.message === 'string'
        ? body.message
        : fallbackMessage;
    } catch {
      return fallbackMessage;
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
    const testButton = document.querySelector('[data-holyrics-test]');
    const connectionResult = document.querySelector(
      '[data-holyrics-result]',
    );
    const tokenState = document.querySelector(
      '[data-holyrics-token-state]',
    );
    const connectedState = document.querySelector(
      '[data-holyrics-connected]',
    );
    const authenticatedState = document.querySelector(
      '[data-holyrics-authenticated]',
    );
    const versionState = document.querySelector(
      '[data-holyrics-version]',
    );
    const permissionsState = document.querySelector(
      '[data-holyrics-permissions]',
    );
    const fields = [...document.querySelectorAll('[data-settings-field]')];

    if (
      !form ||
      !stateElement ||
      !feedbackElement ||
      !submitButton ||
      !testButton ||
      !connectionResult ||
      !tokenState ||
      !connectedState ||
      !authenticatedState ||
      !versionState ||
      !permissionsState
    ) {
      return;
    }

    const setBusy = (busy) => {
      submitButton.disabled = busy;
      testButton.disabled = busy;
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
      form.elements.holyricsApiToken.value = '';
      form.elements.removeHolyricsApiToken.checked = false;
      form.elements.language.value = settings.language ?? 'pt-BR';
      form.elements.microphone.value = settings.microphone ?? '';
      form.elements.voskModelPath.value = settings.voskModelPath ?? '';
      tokenState.textContent = settings.holyricsApiTokenConfigured
        ? 'Um token está salvo. Deixe o campo vazio para mantê-lo.'
        : 'Nenhum token está salvo.';
    };

    const resetHolyricsStatus = () => {
      connectedState.textContent = 'Não testada';
      authenticatedState.textContent = 'Não testada';
      versionState.textContent = 'Não disponível';
      permissionsState.textContent = 'Não disponíveis';
    };

    const resetConnectionResult = () => {
      connectionResult.textContent =
        'Configurações alteradas. Salve antes de testar.';
      connectionResult.classList.remove(
        'connection-result--success',
        'connection-result--error',
      );
      resetHolyricsStatus();
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

    fields.forEach((field) => {
      field.addEventListener('input', resetConnectionResult);
    });

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
      const tokenValue = form.elements.holyricsApiToken.value.trim();

      if (tokenValue) {
        payload.holyricsApiToken = tokenValue;
      } else if (form.elements.removeHolyricsApiToken.checked) {
        payload.holyricsApiToken = null;
      }

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
          throw new Error(
            await getErrorMessage(
              response,
              'Não foi possível salvar as configurações.',
            ),
          );
        }

        fillForm(await response.json());
        setState('Salvo', 'status-badge--online');
        feedbackElement.textContent =
          'Configurações salvas neste computador.';
        connectionResult.textContent =
          'Configurações salvas. A API ainda não foi validada.';
        connectionResult.classList.remove(
          'connection-result--success',
          'connection-result--error',
        );
        resetHolyricsStatus();
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

    testButton.addEventListener('click', async () => {
      setBusy(true);
      connectionResult.textContent =
        'Validando conexão, token, versão e permissões...';
      connectionResult.classList.remove(
        'connection-result--success',
        'connection-result--error',
      );

      try {
        const response = await fetch('/api/holyrics/test-connection', {
          method: 'POST',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              'Não foi possível acessar o Holyrics.',
            ),
          );
        }

        const result = await response.json();
        connectedState.textContent = result.connected
          ? 'Conectado'
          : 'Indisponível';
        authenticatedState.textContent = result.authenticated
          ? 'Autenticado'
          : 'Não autenticado';
        versionState.textContent = result.version ?? 'Não disponível';
        permissionsState.textContent = result.permissions?.length
          ? result.permissions.join(', ')
          : 'Nenhuma permissão informada';
        connectionResult.textContent =
          `${result.message} Validação concluída em ${result.latencyMs} ms.`;
        connectionResult.classList.add('connection-result--success');
      } catch (error) {
        connectedState.textContent = 'Falha';
        authenticatedState.textContent = 'Falha';
        versionState.textContent = 'Não disponível';
        permissionsState.textContent = 'Não disponíveis';
        connectionResult.textContent =
          error instanceof Error
            ? error.message
            : 'Não foi possível acessar o Holyrics.';
        connectionResult.classList.add('connection-result--error');
      } finally {
        setBusy(false);
      }
    });
  };

  const initializeRealtime = () => {
    const statusElement = document.querySelector(
      '[data-realtime-status]',
    );
    const lastEventElement = document.querySelector(
      '[data-realtime-last-event]',
    );

    if (
      !statusElement ||
      !lastEventElement ||
      !window.RealtimeClient
    ) {
      return;
    }

    const setRealtimeStatus = (status) => {
      const labels = {
        connecting: 'Conectando',
        connected: 'Conectado',
        disconnected: 'Desconectado',
        error: 'Erro',
      };

      statusElement.textContent = labels[status] ?? status;
      statusElement.classList.toggle(
        'realtime-status--online',
        status === 'connected',
      );
      statusElement.classList.toggle(
        'realtime-status--error',
        status === 'disconnected' || status === 'error',
      );
    };

    const updateHolyricsStatus = (event) => {
      const connectedElement = document.querySelector(
        '[data-holyrics-connected]',
      );
      const authenticatedElement = document.querySelector(
        '[data-holyrics-authenticated]',
      );
      const versionElement = document.querySelector(
        '[data-holyrics-version]',
      );
      const resultElement = document.querySelector(
        '[data-holyrics-result]',
      );

      if (
        !connectedElement ||
        !authenticatedElement ||
        !versionElement ||
        !resultElement
      ) {
        return;
      }

      if (event.type === 'HOLYRICS_CONNECTED') {
        connectedElement.textContent = 'Conectado';
        authenticatedElement.textContent = 'Autenticado';
        versionElement.textContent = event.payload.version;
        resultElement.textContent =
          'Outro cliente confirmou a conexão autenticada com o Holyrics.';
        resultElement.classList.remove('connection-result--error');
        resultElement.classList.add('connection-result--success');
      }

      if (event.type === 'HOLYRICS_DISCONNECTED') {
        connectedElement.textContent = 'Falha';
        authenticatedElement.textContent = 'Falha';
        versionElement.textContent = 'Não disponível';
        resultElement.textContent = event.payload.reason;
        resultElement.classList.remove('connection-result--success');
        resultElement.classList.add('connection-result--error');
      }
    };

    window.RealtimeClient.connect({
      onStatus: setRealtimeStatus,
      onEvent: (event) => {
        const eventTime = new Date(event.occurredAt).toLocaleTimeString(
          'pt-BR',
        );
        lastEventElement.textContent = `${event.type} às ${eventTime}`;
        updateHolyricsStatus(event);

        if (event.type === 'SETTINGS_UPDATED') {
          const tokenState = document.querySelector(
            '[data-holyrics-token-state]',
          );
          const feedback = document.querySelector(
            '[data-settings-feedback]',
          );

          if (tokenState) {
            tokenState.textContent =
              event.payload.holyricsApiTokenConfigured
                ? 'Um token está salvo. Deixe o campo vazio para mantê-lo.'
                : 'Nenhum token está salvo.';
          }

          if (feedback) {
            feedback.textContent =
              'Configurações atualizadas em um cliente conectado.';
          }
        }
      },
    });
  };

  void loadStatus();
  void initializeSettingsForm();
  initializeRealtime();
})();
