(() => {
  const EVENT_TYPES = [
    'HOLYRICS_CONNECTED',
    'HOLYRICS_DISCONNECTED',
    'BIBLE_CHANGED',
    'SETTINGS_UPDATED',
    'SYSTEM_ERROR',
    'TRANSCRIPTION_RECEIVED',
    'COMMAND_IDENTIFIED',
    'COMMAND_EXECUTED',
    'SPEECH_STARTED',
    'SPEECH_STOPPED',
    'SONG_CHANGED',
  ];

  const connect = ({ onStatus, onEvent } = {}) => {
    if (typeof window.io !== 'function') {
      onStatus?.('error');
      return { disconnect: () => undefined };
    }

    onStatus?.('connecting');

    const socket = window.io('/realtime', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => onStatus?.('connected'));
    socket.on('disconnect', () => onStatus?.('disconnected'));
    socket.on('connect_error', () => onStatus?.('error'));

    for (const eventType of EVENT_TYPES) {
      socket.on(eventType, (event) => {
        if (
          event &&
          event.type === eventType &&
          typeof event.occurredAt === 'string'
        ) {
          onEvent?.(event);
        }
      });
    }

    return {
      disconnect: () => socket.disconnect(),
    };
  };

  window.RealtimeClient = Object.freeze({
    connect,
    eventTypes: Object.freeze([...EVENT_TYPES]),
  });
})();
