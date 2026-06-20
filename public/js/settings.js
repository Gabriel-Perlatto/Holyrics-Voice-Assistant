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
    const modelPathInput = document.querySelector(
      '[data-model-path-input]',
    );
    const modelPathStatus = document.querySelector(
      '[data-model-path-status]',
    );
    const microphoneSelect = document.querySelector(
      '[data-microphone-select]',
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
      !permissionsState ||
      !modelPathInput ||
      !modelPathStatus ||
      !microphoneSelect
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

    const setModelPathStatus = (status) => {
      modelPathStatus.classList.remove(
        'model-path-status--valid',
        'model-path-status--invalid',
      );

      if (!status?.configured) {
        modelPathStatus.textContent =
          'Nenhum diretório de modelo configurado.';
        return;
      }

      modelPathStatus.textContent = status.valid
        ? `✓ ${status.message}`
        : `✗ ${status.message}`;
      modelPathStatus.classList.add(
        status.valid
          ? 'model-path-status--valid'
          : 'model-path-status--invalid',
      );
    };

    const fillForm = (settings) => {
      form.elements.holyricsHost.value = settings.holyricsHost ?? '';
      form.elements.holyricsPort.value = settings.holyricsPort ?? '';
      form.elements.holyricsApiToken.value = '';
      form.elements.removeHolyricsApiToken.checked = false;
      form.elements.language.value = settings.language ?? 'pt-BR';
      const microphone = settings.microphone ?? '';

      if (
        microphone &&
        ![...microphoneSelect.options].some(
          (option) => option.value === microphone,
        )
      ) {
        microphoneSelect.add(
          new Option(`${microphone} (indisponível)`, microphone),
        );
      }

      form.elements.microphone.value = microphone;
      form.elements.voskModelPath.value = settings.voskModelPath ?? '';
      form.elements.speechAutoStart.checked =
        settings.speechAutoStart ?? false;
      tokenState.textContent = settings.holyricsApiTokenConfigured
        ? 'Um token está salvo. Deixe o campo vazio para mantê-lo.'
        : 'Nenhum token está salvo.';
      setModelPathStatus(settings.voskModelPathStatus);
    };

    const loadMicrophones = async () => {
      try {
        const response = await fetch('/api/speech/microphones', {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const microphones = await response.json();
        microphoneSelect.replaceChildren(
          new Option('Selecione um microfone', ''),
          ...microphones.map(
            (microphone) =>
              new Option(
                microphone.isDefault
                  ? `${microphone.name} — padrão`
                  : microphone.name,
                microphone.id,
              ),
          ),
        );
      } catch {
        microphoneSelect.replaceChildren(
          new Option('Não foi possível listar os microfones', ''),
        );
      }
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
      await loadMicrophones();

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

    modelPathInput.addEventListener('input', () => {
      modelPathStatus.textContent =
        'Salve as configurações para verificar este caminho.';
      modelPathStatus.classList.remove(
        'model-path-status--valid',
        'model-path-status--invalid',
      );
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
        speechAutoStart: form.elements.speechAutoStart.checked,
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

  const initializeSpeechPanel = async () => {
    const stateElement = document.querySelector('[data-speech-state]');
    const providerElement = document.querySelector(
      '[data-speech-provider]',
    );
    const modelElement = document.querySelector('[data-speech-model]');
    const microphoneElement = document.querySelector(
      '[data-speech-microphone]',
    );
    const autoStartElement = document.querySelector(
      '[data-speech-auto-start]',
    );
    const transcriptionElement = document.querySelector(
      '[data-speech-transcription]',
    );
    const feedbackElement = document.querySelector(
      '[data-speech-feedback]',
    );
    const startButton = document.querySelector('[data-speech-start]');
    const stopButton = document.querySelector('[data-speech-stop]');

    if (
      !stateElement ||
      !providerElement ||
      !modelElement ||
      !microphoneElement ||
      !autoStartElement ||
      !transcriptionElement ||
      !feedbackElement ||
      !startButton ||
      !stopButton
    ) {
      return;
    }

    const stateLabels = {
      idle: 'Parado',
      initializing: 'Inicializando',
      ready: 'Pronto',
      starting: 'Iniciando',
      listening: 'Ativo',
      stopped: 'Parado',
      error: 'Erro',
    };

    const renderStatus = (status) => {
      stateElement.textContent =
        stateLabels[status.state] ?? status.state ?? 'Indisponível';
      stateElement.classList.toggle(
        'status-badge--online',
        status.state === 'ready' || status.state === 'listening',
      );
      stateElement.classList.toggle(
        'status-badge--error',
        status.state === 'error',
      );
      providerElement.textContent = status.provider ?? 'Vosk';
      modelElement.textContent = status.modelLoaded
        ? status.modelName
        : 'Não carregado';
      microphoneElement.textContent =
        status.microphone ?? 'Não configurado';
      autoStartElement.textContent = status.autoStart
        ? 'Ativada'
        : 'Desativada';
      feedbackElement.textContent = status.message;
      feedbackElement.classList.toggle(
        'connection-result--error',
        status.state === 'error',
      );
      feedbackElement.classList.toggle(
        'connection-result--success',
        status.state === 'ready' || status.state === 'listening',
      );
      startButton.disabled =
        status.state === 'initializing' ||
        status.state === 'starting' ||
        status.state === 'listening';
      stopButton.disabled = status.state !== 'listening';

      if (status.lastTranscription?.text) {
        transcriptionElement.textContent =
          `"${status.lastTranscription.text}"` +
          (status.lastTranscription.final ? '' : ' (parcial)');
      }
    };

    const requestAction = async (action) => {
      startButton.disabled = true;
      stopButton.disabled = true;
      feedbackElement.classList.remove(
        'connection-result--success',
        'connection-result--error',
      );
      feedbackElement.textContent =
        action === 'start'
          ? 'Inicializando modelo e captura...'
          : 'Parando captura...';

      try {
        const response = await fetch(`/api/speech/${action}`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              'Não foi possível alterar a captura de voz.',
            ),
          );
        }

        renderStatus(await response.json());
      } catch (error) {
        stateElement.textContent = 'Erro';
        stateElement.classList.remove('status-badge--online');
        stateElement.classList.add('status-badge--error');
        feedbackElement.textContent =
          error instanceof Error
            ? error.message
            : 'Não foi possível alterar a captura de voz.';
        feedbackElement.classList.add('connection-result--error');
        startButton.disabled = false;
      }
    };

    startButton.addEventListener('click', () => {
      void requestAction('start');
    });
    stopButton.addEventListener('click', () => {
      void requestAction('stop');
    });

    try {
      const response = await fetch('/api/speech/status', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      renderStatus(await response.json());
    } catch {
      renderStatus({
        state: 'error',
        provider: 'vosk',
        modelLoaded: false,
        microphone: null,
        autoStart: false,
        message: 'Não foi possível consultar o Speech Provider.',
      });
    }
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

        if (event.type === 'TRANSCRIPTION_RECEIVED') {
          const transcription = document.querySelector(
            '[data-speech-transcription]',
          );

          if (transcription) {
            transcription.textContent =
              `"${event.payload.text}"` +
              (event.payload.final ? '' : ' (parcial)');
          }
        }

        if (event.type === 'SPEECH_STARTED') {
          const speechState = document.querySelector(
            '[data-speech-state]',
          );
          const speechModel = document.querySelector(
            '[data-speech-model]',
          );
          const speechMicrophone = document.querySelector(
            '[data-speech-microphone]',
          );
          const speechFeedback = document.querySelector(
            '[data-speech-feedback]',
          );

          if (speechState) {
            speechState.textContent = 'Ativo';
            speechState.classList.remove('status-badge--error');
            speechState.classList.add('status-badge--online');
          }
          if (speechModel) {
            speechModel.textContent = event.payload.model;
          }
          if (speechMicrophone) {
            speechMicrophone.textContent = event.payload.microphone;
          }
          if (speechFeedback) {
            speechFeedback.textContent =
              'Captura e transcrição em andamento.';
            speechFeedback.classList.remove('connection-result--error');
            speechFeedback.classList.add('connection-result--success');
          }
        }

        if (event.type === 'SPEECH_STOPPED') {
          const speechState = document.querySelector(
            '[data-speech-state]',
          );
          const speechFeedback = document.querySelector(
            '[data-speech-feedback]',
          );

          if (speechState) {
            speechState.textContent = 'Parado';
            speechState.classList.remove(
              'status-badge--online',
              'status-badge--error',
            );
          }
          if (speechFeedback) {
            speechFeedback.textContent =
              event.payload.reason === 'capture-error'
                ? 'A captura foi interrompida por uma falha.'
                : 'Captura parada.';
          }
        }

        if (
          event.type === 'SYSTEM_ERROR' &&
          event.payload.source === 'speech'
        ) {
          const speechFeedback = document.querySelector(
            '[data-speech-feedback]',
          );

          if (speechFeedback) {
            speechFeedback.textContent = event.payload.message;
            speechFeedback.classList.add('connection-result--error');
          }
        }

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

          const autoStart = document.querySelector(
            '[data-speech-auto-start]',
          );

          if (autoStart) {
            autoStart.textContent = event.payload.speechAutoStart
              ? 'Ativada'
              : 'Desativada';
          }
        }
      },
    });
  };

  void loadStatus();
  void initializeSettingsForm();
  void initializeSpeechPanel();
  initializeRealtime();
})();
