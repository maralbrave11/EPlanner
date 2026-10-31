// English = the source of truth. Every other language file must have exactly these keys
// (TypeScript enforces it). Keep {placeholders} unchanged in translations.
export const en = {
  // Language picker
  "lang.label": "Language",

  // Header
  "nav.ask": "Ask",
  "nav.login": "Log in",
  "nav.signup": "Sign up",
  "nav.logout": "Log out",

  // Landing page
  "home.badge": "Free AI travel assistant",
  "home.title1": "Plan smarter trips.",
  "home.title2": "Save money and time.",
  "home.subtitle":
    "Ask any travel question and get a clear recommendation plus a few options with estimated prices. No hours of research.",
  "home.cta": "Ask a travel question",
  "home.howLink": "How it works",
  "home.howTitle": "How it works",
  "home.step1Title": "Ask anything",
  "home.step1Text": "Where to stay, how to get around, what to do. Type it like you would ask a friend.",
  "home.step2Title": "Get one clear pick",
  "home.step2Text": "A single recommendation with the reason why, so you can decide fast.",
  "home.step3Title": "Compare options",
  "home.step3Text":
    "A few alternatives with estimated prices, pros and cons, and a follow-up to fine-tune.",
  "home.tryAsking": "Try asking",
  "home.footer": "Prices are estimates and may differ. SmartTrip does not sell or book anything.",

  // Log in / sign up
  "auth.loginTitle": "Welcome back",
  "auth.signupTitle": "Create your account",
  "auth.loginIntro": "Log in to ask questions and see your saved conversations.",
  "auth.signupIntro": "Sign up to ask travel questions and save your conversations.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.wait": "Please wait…",
  "auth.login": "Log in",
  "auth.signup": "Sign up",
  "auth.noAccount": "No account yet?",
  "auth.haveAccount": "Already have an account?",
  "auth.checkEmail": "Check your email to confirm your account, then log in.",
  "auth.rateLimit":
    "Too many emails were sent recently. If you already signed up, try logging in. Otherwise wait about an hour and try again.",

  // New conversation page
  "new.title1": "Where to next?",
  "new.title2": "Ask a travel question.",
  "new.subtitle": "Get one clear recommendation plus a few options with estimated prices.",
  "new.orTry": "Or try one of these",
  "ex.1": "Where should I stay in Tokyo for 3 nights on a mid budget?",
  "ex.2": "How do I get from the airport to the city center in Seoul?",
  "ex.3": "What can I do in Ulaanbaatar in winter?",
  "ex.4": "Is it cheaper to travel by train or bus from Beijing to Shanghai?",

  // Question box
  "input.placeholder": "Ask a travel question…",
  "input.followUp": "Ask a follow-up question…",
  "input.answerPlaceholder": "Type your answer…",
  "input.aria": "Your travel question",
  "input.send": "Ask",
  "input.sendAria": "Send question",

  // Conversation list (sidebar)
  "side.new": "+ New question",
  "side.title": "Your conversations",
  "side.loading": "Loading conversations",
  "side.loadError": "Could not load conversations.",
  "side.empty": "No conversations yet. Ask your first question!",
  "side.deleteConfirm": "Delete this conversation?",
  "side.deleteFail": "Could not delete. Please try again.",
  "side.deleteAria": "Delete conversation: {title}",

  // Conversation page
  "view.listError": "Could not load your conversations. Please refresh the page.",
  "view.loading": "Loading conversation…",
  "view.notFoundTitle": "Conversation not found",
  "view.notFoundText": "It may have been deleted, or the link is wrong.",
  "view.askNew": "Ask a new question",
  "view.finding": "Finding the best options for you…",
  "view.tryAgain": "Try again",
  "view.answering": "Answering: {question}",
  "view.tellMeMsg": 'Tell me more about "{title}".',
  "view.routeMsg": 'Yes, plan my route for "{place}".',

  // Answer cards
  "ans.bestPick": "Best pick",
  "ans.otherOptions": "Other options",
  "ans.tellMore": "Tell me more",
  "ans.improve": "To improve this answer:",
  "ans.answer": "Answer",
  "ans.pricesNote": "Prices are estimates and may differ.",
  "price.est": "est.",
  "det.badge": "More about this place",
  "det.yes": "Yes, plan my route",
  "det.no": "No thanks",
  "route.badge": "Suggested order",
  "route.total": "Total: about {time}",
  "route.tip": "Tip: {tip}",
  "time.min": "{n} min",
  "time.h": "{n} h",
  "time.hmin": "{h} h {m} min",

  // Error messages (also used for the codes returned by the API)
  "err.badInput": "Please enter a question (up to 2000 characters).",
  "err.login": "Please log in to ask questions.",
  "err.notFound": "Conversation not found.",
  "err.load": "Could not load your conversation. Please try again.",
  "err.refused": "Sorry, I can't help with that question. Try asking it differently.",
  "err.busy": "The assistant is busy right now. Please try again in a moment.",
  "err.config": "The assistant is not configured correctly.",
  "err.claude": "The assistant could not answer right now. Please try again.",
  "err.save": "Could not save your conversation. Please try again.",
  "err.network": "Network error. Check your connection and try again.",
  "err.generic": "Something went wrong.",
  "err.loadMessages": "Could not load this conversation.",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
