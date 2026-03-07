export type Language = 'en' | 'pl';

function plPlural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few;
  return many;
}

export const translations = {
  en: {
    // Home
    subtitle: 'Decide together.',
    createRoom: 'Create a room',
    joinWithCode: 'Join with code',
    newRoomHeading: 'New room',
    yourName: 'Your name',
    whatDeciding: 'What are we deciding?',
    maxSuggestionsLabel: 'Max suggestions per person',
    anonymousVoting: 'Anonymous voting',
    anonymousVotingDesc: 'Hide who suggested what',
    ideasModeLabel: 'Who adds ideas?',
    ideasModeOpen: 'Everyone',
    ideasModePredefined: 'Just me (host)',
    predefinedIdeasLabel: 'Your ideas',
    predefinedIdeaPlaceholder: 'Add an idea...',
    createRoomBtn: 'Create room',
    joinARoomHeading: 'Join a room',
    roomCodeLabel: 'Room code',
    roomCodeHint: 'Ask the room creator to share their 6-character code',
    findRoom: 'Find room',
    namePlaceholder: 'e.g. Jordan',
    topicPlaceholder: 'e.g. Movie night',
    topicChips: ['Movie night', 'Where to eat', 'Weekend plan', 'Game night', 'Vacation'],

    // Lobby
    roomLabel: 'Room',
    codeLabel: 'Code:',
    waitingForFriends: 'Waiting for friends',
    linkCopied: 'Link copied!',
    startingLabel: 'Starting...',
    startEveryoneAdd: 'Start — everyone add their picks',
    startVoting: 'Start Voting',
    startChallenge: 'Start Challenge',
    waitingForHost: 'Waiting for the host to start...',
    youBadge: 'You',
    predefinedIdeasPreview: 'Ideas to vote on',

    // Submitting
    addYourPicks: 'Add your picks',
    youAreDone: "You're done!",
    nothingYet: 'Nothing yet — add your first pick below',
    passingStartVoting: "I'm passing — start voting",
    doneStartVoting: 'Done! Start voting',
    forceStartBtn: 'Force start voting now (host)',
    cantStartNoSuggestions: "Can't start — no suggestions yet!",
    savedIdeas: 'Your saved ideas',
    spinWheel: 'Spin the wheel',

    // Wheel
    wheelSpinning: 'Spinning...',
    wheelRevealResults: 'Reveal Results',
    wheelWaitingReveal: 'Waiting for host to reveal...',
    chosenByWheel: 'Chosen by the wheel',
    wonTheBracket: 'Won the bracket',

    // Challenge
    drawTypeLabel: 'Draw type',
    drawTypeStandard: 'Standard',
    drawTypeChallenge: 'Challenge',
    drawTypeStandardDesc: 'Swipe voting',
    drawTypeChallengeDesc: 'Bracket battle',
    challengeRound: (round: number) => `Round ${round}`,
    challengeMatch: (current: number, total: number) => `Match ${current} of ${total}`,
    challengeVoted: (voted: number, total: number) => `${voted} / ${total} voted`,
    challengeWaitingOthers: 'Waiting for others...',
    challengePickOne: 'Pick the winner',

    // Voting
    youAreDoneVoting: "You're done!",
    tallyingResults: 'Tallying results...',
    swipeHint: 'swipe or tap the buttons',

    // Results
    winnerLabel: 'Winner',
    allPicks: 'All picks',
    noSuggestions: 'No suggestions were made.',
    newRoom: 'New room',
    byAuthor: (name: string) => `by ${name}`,

    // Tiebreaker
    itsATie: "It's a Tie!",
    pickFavourite: 'Pick your favourite to break it.',

    // JoinGate
    joining: 'Joining',
    joinRoomBtn: 'Join room',
    useAccountName: 'Use account name',
    useCustomName: 'Use a different name',

    // Settings
    settingsTitle: 'Settings',
    languageLabel: 'Language',
    goHome: 'Go to home',

    // Feedback
    feedbackTitle: 'Send Feedback',
    feedbackTypeLabel: 'Type',
    feedbackMessageLabel: 'Message',
    feedbackMessagePlaceholder: 'Describe the issue or idea...',
    feedbackSend: 'Send',
    feedbackSuccess: 'Feedback sent, thank you!',
    feedbackError: 'Failed to send feedback. Please try again.',
    feedbackAriaLabel: 'Send feedback',
    feedbackTypes: { Bug: 'Bug', 'Feature Request': 'Feature Request', Other: 'Other' },
    feedbackEmailLabel: 'Email (optional)',
    feedbackEmailPlaceholder: 'your@email.com',

    // Auth
    signIn: 'Sign in',
    signUp: 'Sign up',
    myIdeas: 'My Ideas',
    history: 'History',
    loginRequiredTitle: 'Sign in required',
    loginRequiredDesc: 'History and My Ideas are only available for signed-in users.',

    // History page
    roomHistory: 'Room History',
    noRoomsYet: 'No rooms yet. Create or join a room to get started.',
    saveToIdeas: 'Save to My Ideas',
    ideaSaved: (title: string) => `"${title}" saved to ideas`,
    saveIdeaTo: (title: string) => `Save "${title}" to...`,
    noCategory: 'No category',

    // Profile page
    myProfile: 'My Profile',
    accentColor: 'Accent color',
    saving: 'Saving...',
    profileSaved: 'Profile saved',
    addCategory: 'Add category',
    categoryNamePlaceholder: 'Category name...',
    newIdeaPlaceholder: 'New idea...',
    addIdea: 'Add idea',
    uncategorized: 'Uncategorized',
    noIdeasYet: 'No ideas saved yet.',
    addFirstIdea: 'Add your first idea',
    customColor: 'Custom color',
    noCategoriesHint: 'Create a category first to start adding ideas',
    deleteCategoryConfirm: (name: string, count: number) =>
      `Delete "${name}"? This will also delete ${count} idea${count === 1 ? '' : 's'} inside it.`,
    deleteCategoryConfirm2: 'Are you sure? This cannot be undone.',

    // Dynamic
    addedCount: (n: number, max: number) => `${n}/${max} added`,
    readyCount: (done: number, total: number) => `${done}/${total} ready`,
    waitingForMore: (n: number) => `Waiting for ${n} more ${n === 1 ? 'person' : 'people'}...`,
    likesOutOf: (likes: number, voters: number) =>
      `${likes} ${likes === 1 ? 'like' : 'likes'} out of ${voters} ${voters === 1 ? 'voter' : 'voters'}`,
    tiedWith: (count: number, score: number) =>
      `${count} items tied with ${score} ${score === 1 ? 'like' : 'likes'}.`,
    tiebreakerVotes: (n: number) => `${n} ${n === 1 ? 'vote' : 'votes'}`,
    roomCodeDisplay: (code: string) => `Room ${code}`,

    // Chat
    chatLabel: 'Chat',
    chatPlaceholder: 'Say something...',
    chatEmptyState: 'No messages yet...',
    chatSendAriaLabel: 'Send message',
  },

  pl: {
    // Home
    subtitle: 'Zdecydujcie razem.',
    createRoom: 'Utwórz pokój',
    joinWithCode: 'Dołącz kodem',
    newRoomHeading: 'Nowy pokój',
    yourName: 'Twoje imię',
    whatDeciding: 'Co ustalamy?',
    maxSuggestionsLabel: 'Maks. propozycji na osobę',
    anonymousVoting: 'Anonimowe głosowanie',
    anonymousVotingDesc: 'Ukryj kto co zaproponował',
    ideasModeLabel: 'Kto dodaje pomysły?',
    ideasModeOpen: 'Wszyscy',
    ideasModePredefined: 'Tylko ja (host)',
    predefinedIdeasLabel: 'Twoje pomysły',
    predefinedIdeaPlaceholder: 'Dodaj pomysł...',
    createRoomBtn: 'Utwórz pokój',
    joinARoomHeading: 'Dołącz do pokoju',
    roomCodeLabel: 'Kod pokoju',
    roomCodeHint: 'Poproś twórcę pokoju o 6-znakowy kod',
    findRoom: 'Znajdź pokój',
    namePlaceholder: 'np. Sebastian',
    topicPlaceholder: 'np. Wieczór filmowy',
    topicChips: ['Wieczór filmowy', 'Gdzie zjeść', 'Plan na weekend', 'Wieczór gier', 'Wakacje'],

    // Lobby
    roomLabel: 'Pokój',
    codeLabel: 'Kod:',
    waitingForFriends: 'Czekamy na znajomych',
    linkCopied: 'Link skopiowany!',
    startingLabel: 'Uruchamianie...',
    startEveryoneAdd: 'Start — wszyscy dodają propozycje',
    startVoting: 'Zacznij głosowanie',
    startChallenge: 'Zacznij wyzwanie',
    waitingForHost: 'Czekanie na start hosta...',
    youBadge: 'Ty',
    predefinedIdeasPreview: 'Pomysły do głosowania',

    // Submitting
    addYourPicks: 'Dodaj propozycje',
    youAreDone: 'Gotowe!',
    nothingYet: 'Brak propozycji — dodaj pierwszą poniżej',
    passingStartVoting: 'Pasuję — przejdź do głosowania',
    doneStartVoting: 'Gotowe! Zacznij głosowanie',
    forceStartBtn: 'Wymuś start głosowania (host)',
    cantStartNoSuggestions: 'Nie można zacząć — brak propozycji!',
    savedIdeas: 'Twoje pomysły',
    spinWheel: 'Zakręć kołem fortuny',

    // Wheel
    wheelSpinning: 'Kręci się...',
    wheelRevealResults: 'Pokaż wyniki',
    wheelWaitingReveal: 'Czekanie na hosta...',
    chosenByWheel: 'Wybrano przez koło fortuny',
    wonTheBracket: 'Wygrał zawody',

    // Challenge
    drawTypeLabel: 'Tryb losowania',
    drawTypeStandard: 'Standardowy',
    drawTypeChallenge: 'Wyzwanie',
    drawTypeStandardDesc: 'Głosowanie przez swipe',
    drawTypeChallengeDesc: 'Drabinka eliminacyjna',
    challengeRound: (round: number) => `Runda ${round}`,
    challengeMatch: (current: number, total: number) => `Pojedynek ${current} z ${total}`,
    challengeVoted: (voted: number, total: number) => `${voted} / ${total} zagłosowało`,
    challengeWaitingOthers: 'Czekam na pozostałych...',
    challengePickOne: 'Wybierz zwycięzcę',

    // Voting
    youAreDoneVoting: 'Gotowe!',
    tallyingResults: 'Zliczanie wyników...',
    swipeHint: 'przesuń lub kliknij przyciski',

    // Results
    winnerLabel: 'Zwycięzca',
    allPicks: 'Wszystkie propozycje',
    noSuggestions: 'Brak propozycji.',
    newRoom: 'Nowy pokój',
    byAuthor: (name: string) => `od ${name}`,

    // Tiebreaker
    itsATie: 'Remis!',
    pickFavourite: 'Wybierz ulubioną, by rozstrzygnąć.',

    // JoinGate
    joining: 'Dołączanie do',
    joinRoomBtn: 'Dołącz do pokoju',
    useAccountName: 'Użyj konta',
    useCustomName: 'Użyj innego imienia',

    // Settings
    settingsTitle: 'Ustawienia',
    languageLabel: 'Język',
    goHome: 'Wróć do strony głównej',

    // Feedback
    feedbackTitle: 'Wyślij opinię',
    feedbackTypeLabel: 'Typ',
    feedbackMessageLabel: 'Wiadomość',
    feedbackMessagePlaceholder: 'Opisz problem lub pomysł...',
    feedbackSend: 'Wyślij',
    feedbackSuccess: 'Opinia wysłana, dziękujemy!',
    feedbackError: 'Nie udało się wysłać. Spróbuj ponownie.',
    feedbackAriaLabel: 'Wyślij opinię',
    feedbackTypes: { Bug: 'Bug', 'Feature Request': 'Propozycja ficzera', Other: 'Inne' },
    feedbackEmailLabel: 'Email (opcjonalnie)',
    feedbackEmailPlaceholder: 'twoj@email.com',

    // Auth
    signIn: 'Zaloguj',
    signUp: 'Zarejestruj',
    myIdeas: 'Moje pomysły',
    history: 'Historia',
    loginRequiredTitle: 'Wymagane logowanie',
    loginRequiredDesc: 'Historia i Moje pomysły są dostępne tylko dla zalogowanych użytkowników.',

    // History page
    roomHistory: 'Historia pokojów',
    noRoomsYet: 'Brak pokojów. Utwórz lub dołącz do pokoju, żeby zacząć.',
    saveToIdeas: 'Zapisz do pomysłów',
    ideaSaved: (title: string) => `"${title}" zapisano do pomysłów`,
    saveIdeaTo: (title: string) => `Zapisz "${title}" do...`,
    noCategory: 'Bez kategorii',

    // Profile page
    myProfile: 'Mój profil',
    accentColor: 'Kolor akcentu',
    saving: 'Zapisywanie...',
    profileSaved: 'Profil zapisany',
    addCategory: 'Dodaj kategorię',
    categoryNamePlaceholder: 'Nazwa kategorii...',
    newIdeaPlaceholder: 'Nowy pomysł...',
    addIdea: 'Dodaj pomysł',
    uncategorized: 'Bez kategorii',
    noIdeasYet: 'Brak zapisanych pomysłów.',
    addFirstIdea: 'Dodaj pierwszy pomysł',
    customColor: 'Własny kolor',
    noCategoriesHint: 'Najpierw utwórz kategorię, by dodać pomysły',
    deleteCategoryConfirm: (name: string, count: number) =>
      `Usunąć "${name}"? Spowoduje to również usunięcie ${count} ${count === 1 ? 'pomysłu' : 'pomysłów'} w środku.`,
    deleteCategoryConfirm2: 'Jesteś pewien? Tej operacji nie można cofnąć.',

    // Dynamic
    addedCount: (n: number, max: number) => `${n}/${max} dodanych`,
    readyCount: (done: number, total: number) => `${done}/${total} gotowych`,
    waitingForMore: (n: number) =>
      `Oczekiwanie na ${n} ${plPlural(n, 'osobę', 'osoby', 'osób')}...`,
    likesOutOf: (likes: number, voters: number) =>
      `${likes} ${plPlural(likes, 'polubienie', 'polubienia', 'polubień')} z ${voters} ${plPlural(voters, 'głosującego', 'głosujących', 'głosujących')}`,
    tiedWith: (count: number, score: number) =>
      `${count} ${plPlural(count, 'propozycja', 'propozycje', 'propozycji')} z ${score} ${plPlural(score, 'polubieniem', 'polubień', 'polubień')}.`,
    tiebreakerVotes: (n: number) => `${n} ${plPlural(n, 'głos', 'głosy', 'głosów')}`,
    roomCodeDisplay: (code: string) => `Pokój ${code}`,

    // Chat
    chatLabel: 'Czat',
    chatPlaceholder: 'Napisz coś...',
    chatEmptyState: 'Brak wiadomości...',
    chatSendAriaLabel: 'Wyślij wiadomość',
  },
};

export type T = typeof translations.en;
