(() => {
  const PAGE_SIZES = {
    books: 12,
    chapters: 20,
    verses: 24,
  };

  const elements = {
    currentStep: document.querySelector('[data-current-step]'),
    currentReference: document.querySelector('[data-current-reference]'),
    currentVersion: document.querySelector('[data-current-version]'),
    versionGrid: document.querySelector('[data-version-grid]'),
    booksPanel: document.querySelector('[data-books-panel]'),
    booksGrid: document.querySelector('[data-books-grid]'),
    booksPager: document.querySelector('[data-books-pager]'),
    booksPageLabel: document.querySelector('[data-books-page-label]'),
    chaptersPanel: document.querySelector('[data-chapters-panel]'),
    chaptersGrid: document.querySelector('[data-chapters-grid]'),
    chaptersPager: document.querySelector('[data-chapters-pager]'),
    chaptersPageLabel: document.querySelector('[data-chapters-page-label]'),
    versesPanel: document.querySelector('[data-verses-panel]'),
    versesGrid: document.querySelector('[data-verses-grid]'),
    versesPager: document.querySelector('[data-verses-pager]'),
    versesPageLabel: document.querySelector('[data-verses-page-label]'),
    backBooks: document.querySelector('[data-back-books]'),
    backChapters: document.querySelector('[data-back-chapters]'),
    feedback: document.querySelector('[data-preacher-feedback]'),
    realtimeStatus: document.querySelector('[data-realtime-status]'),
  };

  if (Object.values(elements).some((element) => !element)) {
    return;
  }

  const state = {
    versions: [],
    books: [],
    chapters: [],
    verses: [],
    selectedVersion: null,
    selectedBook: null,
    selectedChapter: null,
    selectedVerse: null,
    pages: {
      books: 0,
      chapters: 0,
      verses: 0,
    },
  };
  let initialized = false;
  let pendingBibleEvent = null;

  const apiGet = async (url) => {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Não foi possível carregar os dados bíblicos.');
    }

    return response.json();
  };

  const getErrorMessage = async (response) => {
    try {
      const body = await response.json();
      return typeof body.message === 'string'
        ? body.message
        : 'Não foi possível registrar a passagem.';
    } catch {
      return 'Não foi possível registrar a passagem.';
    }
  };

  const createButton = (label, onClick, options = {}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = options.className ?? 'selection-button';
    button.textContent = label;
    button.addEventListener('click', onClick);

    if (options.pressed !== undefined) {
      button.setAttribute('aria-pressed', String(options.pressed));
    }

    return button;
  };

  const showFeedback = (message, type = 'neutral') => {
    elements.feedback.textContent = message;
    elements.feedback.classList.toggle(
      'preacher-feedback--success',
      type === 'success',
    );
    elements.feedback.classList.toggle(
      'preacher-feedback--error',
      type === 'error',
    );
  };

  const updateHeader = () => {
    const referenceParts = [];

    if (state.selectedBook) {
      referenceParts.push(state.selectedBook.name);
    }

    if (state.selectedChapter) {
      referenceParts.push(String(state.selectedChapter));
    }

    const chapterReference = referenceParts.join(' ');
    elements.currentReference.textContent = state.selectedVerse
      ? `${chapterReference}:${state.selectedVerse}`
      : chapterReference || 'Selecione um livro';
    elements.currentVersion.textContent =
      state.selectedVersion?.abbreviation ?? 'Não disponível';
  };

  const updatePanels = (activePanel) => {
    elements.booksPanel.hidden = activePanel !== 'books';
    elements.chaptersPanel.hidden = activePanel !== 'chapters';
    elements.versesPanel.hidden = activePanel !== 'verses';
    elements.backBooks.hidden = activePanel === 'books';
    elements.backChapters.hidden = activePanel !== 'verses';
    elements.currentStep.textContent =
      activePanel === 'books'
        ? 'Livros'
        : activePanel === 'chapters'
          ? 'Capítulos'
          : 'Versículos';
  };

  const renderPager = (kind, itemCount, renderPage) => {
    const pager = elements[`${kind}Pager`];
    const label = elements[`${kind}PageLabel`];
    const pageSize = PAGE_SIZES[kind];
    const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
    const currentPage = Math.min(state.pages[kind], pageCount - 1);

    state.pages[kind] = currentPage;
    label.textContent = `${currentPage + 1}/${pageCount}`;
    pager.replaceChildren();

    if (pageCount === 1) {
      return;
    }

    const previous = createButton(
      '← Anterior',
      () => {
        state.pages[kind] = Math.max(0, currentPage - 1);
        renderPage();
      },
      { className: 'pager-button' },
    );
    previous.disabled = currentPage === 0;

    const next = createButton(
      'Próxima →',
      () => {
        state.pages[kind] = Math.min(pageCount - 1, currentPage + 1);
        renderPage();
      },
      { className: 'pager-button' },
    );
    next.disabled = currentPage === pageCount - 1;

    pager.append(previous, next);
  };

  const renderVersions = () => {
    elements.versionGrid.replaceChildren();

    for (const version of state.versions) {
      const selected = version.id === state.selectedVersion?.id;
      const button = createButton(
        version.abbreviation,
        () => {
          state.selectedVersion = version;
          window.PreacherPreferences.saveFavoriteVersion(
            window.localStorage,
            version.id,
          );
          renderVersions();
          updateHeader();
          showFeedback(`Versão ${version.abbreviation} selecionada.`);
        },
        {
          className: selected
            ? 'version-button version-button--active'
            : 'version-button',
          pressed: selected,
        },
      );

      button.title = version.name;
      elements.versionGrid.append(button);
    }
  };

  const renderBooks = () => {
    const start = state.pages.books * PAGE_SIZES.books;
    const visibleBooks = state.books.slice(
      start,
      start + PAGE_SIZES.books,
    );

    elements.booksGrid.replaceChildren();

    for (const book of visibleBooks) {
      elements.booksGrid.append(
        createButton(book.name, () => selectBook(book), {
          className: 'selection-button selection-button--book',
        }),
      );
    }

    renderPager('books', state.books.length, renderBooks);
  };

  const renderChapters = () => {
    const start = state.pages.chapters * PAGE_SIZES.chapters;
    const visibleChapters = state.chapters.slice(
      start,
      start + PAGE_SIZES.chapters,
    );

    elements.chaptersGrid.replaceChildren();

    for (const chapter of visibleChapters) {
      elements.chaptersGrid.append(
        createButton(String(chapter.number), () =>
          selectChapter(chapter.number),
        ),
      );
    }

    renderPager('chapters', state.chapters.length, renderChapters);
  };

  const renderVerses = () => {
    const start = state.pages.verses * PAGE_SIZES.verses;
    const visibleVerses = state.verses.slice(
      start,
      start + PAGE_SIZES.verses,
    );

    elements.versesGrid.replaceChildren();

    for (const verse of visibleVerses) {
      const selected = verse.number === state.selectedVerse;
      elements.versesGrid.append(
        createButton(
          String(verse.number),
          () => selectVerse(verse.number),
          {
            className: selected
              ? 'selection-button selection-button--active'
              : 'selection-button',
            pressed: selected,
          },
        ),
      );
    }

    renderPager('verses', state.verses.length, renderVerses);
  };

  const selectBook = async (book) => {
    state.selectedBook = book;
    state.selectedChapter = null;
    state.selectedVerse = null;
    state.pages.chapters = 0;
    updateHeader();
    showFeedback(`Carregando capítulos de ${book.name}...`);

    try {
      const response = await apiGet(
        `/api/bible/books/${encodeURIComponent(book.id)}/chapters`,
      );
      state.chapters = response.items;
      renderChapters();
      updatePanels('chapters');
      showFeedback(`${book.name}: escolha o capítulo.`);
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  const selectChapter = async (chapter) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    state.selectedChapter = chapter;
    state.selectedVerse = null;
    state.pages.verses = 0;
    updateHeader();
    showFeedback(`Carregando versículos do capítulo ${chapter}...`);

    try {
      const response = await apiGet(
        `/api/bible/books/${encodeURIComponent(state.selectedBook.id)}/chapters/${chapter}/verses`,
      );
      state.verses = response.items;
      renderVerses();
      updatePanels('verses');
      showFeedback(
        `${state.selectedBook.name} ${chapter}: escolha o versículo.`,
      );
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  const selectVerse = async (verse) => {
    state.selectedVerse = verse;
    updateHeader();
    renderVerses();
    showFeedback('Registrando passagem no servidor local...');

    try {
      const response = await fetch('/api/bible/selection', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionId: state.selectedVersion.id,
          bookId: state.selectedBook.id,
          chapter: state.selectedChapter,
          verse,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const result = await response.json();
      const deliveryMessages = {
        holyrics: `${result.selection.reference} enviado ao Holyrics.`,
        'local-only':
          `${result.selection.reference} selecionado somente no sistema local.`,
        failed:
          `${result.selection.reference} selecionado localmente, mas o envio ao Holyrics falhou.`,
      };
      showFeedback(
        deliveryMessages[result.delivery] ?? result.message,
        result.delivery === 'failed' ? 'error' : 'success',
      );
    } catch (error) {
      showFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a passagem.',
        'error',
      );
    }
  };

  const applyBibleChangedEvent = async (event) => {
    const { payload } = event;
    const book = state.books.find(({ id }) => id === payload.book);

    if (!initialized || !book) {
      pendingBibleEvent = event;
      return;
    }

    const version = state.versions.find(
      ({ id, abbreviation }) =>
        id === String(payload.version).toLocaleLowerCase('pt-BR') ||
        abbreviation === payload.version,
    );

    state.selectedBook = book;
    state.selectedChapter = payload.chapter;
    state.selectedVerse = payload.verse;
    state.pages.books = Math.floor(
      state.books.findIndex(({ id }) => id === book.id) /
        PAGE_SIZES.books,
    );
    state.pages.chapters = Math.floor(
      (payload.chapter - 1) / PAGE_SIZES.chapters,
    );
    state.pages.verses = Math.floor(
      (payload.verse - 1) / PAGE_SIZES.verses,
    );

    if (version) {
      state.selectedVersion = version;
    }

    try {
      const chaptersResponse = await apiGet(
        `/api/bible/books/${encodeURIComponent(book.id)}/chapters`,
      );
      const versesResponse = await apiGet(
        `/api/bible/books/${encodeURIComponent(book.id)}/chapters/${payload.chapter}/verses`,
      );

      state.chapters = chaptersResponse.items;
      state.verses = versesResponse.items;
      renderVersions();
      renderBooks();
      renderChapters();
      renderVerses();
      updateHeader();
      updatePanels('verses');
      showFeedback(
        payload.delivery === 'holyrics'
          ? `${book.name} ${payload.chapter}:${payload.verse} enviado ao Holyrics.`
          : payload.delivery === 'failed'
            ? `${book.name} ${payload.chapter}:${payload.verse} atualizado localmente; envio ao Holyrics falhou.`
            : `${book.name} ${payload.chapter}:${payload.verse} atualizado somente no sistema local.`,
        payload.delivery === 'failed' ? 'error' : 'success',
      );
    } catch {
      updateHeader();
      showFeedback(
        'A passagem mudou em outro dispositivo, mas os dados não puderam ser atualizados.',
        'error',
      );
    }
  };

  const initializeRealtime = () => {
    if (!window.RealtimeClient) {
      elements.realtimeStatus.textContent = 'Indisponível';
      elements.realtimeStatus.classList.add('realtime-status--error');
      return;
    }

    window.RealtimeClient.connect({
      onStatus: (status) => {
        const labels = {
          connecting: 'Conectando',
          connected: 'Tempo real',
          disconnected: 'Desconectado',
          error: 'Erro',
        };

        elements.realtimeStatus.textContent = labels[status] ?? status;
        elements.realtimeStatus.classList.toggle(
          'realtime-status--online',
          status === 'connected',
        );
        elements.realtimeStatus.classList.toggle(
          'realtime-status--error',
          status === 'disconnected' || status === 'error',
        );
      },
      onEvent: (event) => {
        if (event.type === 'BIBLE_CHANGED') {
          void applyBibleChangedEvent(event);
        }

        if (event.type === 'SYSTEM_ERROR') {
          showFeedback(event.payload.message, 'error');
        }
      },
    });
  };

  elements.backBooks.addEventListener('click', () => {
    state.selectedBook = null;
    state.selectedChapter = null;
    state.selectedVerse = null;
    state.pages.books = 0;
    updateHeader();
    renderBooks();
    updatePanels('books');
    showFeedback('Escolha um livro.');
  });

  elements.backChapters.addEventListener('click', () => {
    state.selectedChapter = null;
    state.selectedVerse = null;
    state.pages.chapters = 0;
    updateHeader();
    renderChapters();
    updatePanels('chapters');
    showFeedback(`${state.selectedBook.name}: escolha o capítulo.`);
  });

  const initialize = async () => {
    try {
      const [versionsResponse, booksResponse] = await Promise.all([
        apiGet('/api/bible/versions'),
        apiGet('/api/bible/books'),
      ]);

      state.versions = versionsResponse.items;
      state.books = booksResponse.items;

      const favoriteVersionId =
        window.PreacherPreferences.loadFavoriteVersion(
          window.localStorage,
        );
      state.selectedVersion =
        state.versions.find(({ id }) => id === favoriteVersionId) ??
        state.versions.find(
          ({ id }) => id === versionsResponse.currentVersionId,
        ) ??
        state.versions[0];

      renderVersions();
      renderBooks();
      updateHeader();
      updatePanels('books');
      showFeedback('Escolha um livro.');
      initialized = true;

      if (pendingBibleEvent) {
        const event = pendingBibleEvent;
        pendingBibleEvent = null;
        await applyBibleChangedEvent(event);
      }
    } catch (error) {
      showFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar a tela do pregador.',
        'error',
      );
    }
  };

  initializeRealtime();
  void initialize();
})();
