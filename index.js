const navButtons = document.querySelectorAll(".btn-nav");
const targetButtons = document.querySelectorAll("[data-target]");
const moodButtons = document.querySelectorAll(".mood-btn");
const moodOutput = document.getElementById("mood-output");
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll("#cards-grid [data-category]");
const journalForm = document.getElementById("journal-form");
const journalList = document.getElementById("journal-list");
const journalStatus = document.getElementById("journal-status");
const journalTitle = document.getElementById("entry-title");
const journalMood = document.getElementById("entry-mood");
const journalBody = document.getElementById("entry-body");
const storageKey = "nawal-portfolio-journal";

targetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);
    if (!target) {
      console.error(
        `Navigation target "${button.dataset.target}" was not found.`,
      );
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    navButtons.forEach((navButton) => {
      navButton.classList.toggle(
        "active",
        navButton.dataset.target === target.id,
      );
    });
  });
});

moodButtons.forEach((button) => {
  button.setAttribute(
    "aria-pressed",
    String(button.classList.contains("selected")),
  );
  button.addEventListener("click", () => {
    const template = document.getElementById(
      `mood-${button.dataset.mood}-template`,
    );
    if (!template || !moodOutput) {
      console.error(`Mood content for "${button.dataset.mood}" was not found.`);
      return;
    }

    moodOutput.replaceChildren(template.content.cloneNode(true));
    moodButtons.forEach((moodButton) => {
      const isSelected = moodButton === button;
      moodButton.classList.toggle("selected", isSelected);
      moodButton.setAttribute("aria-pressed", String(isSelected));
    });
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isSelected = filterButton === button;
      filterButton.classList.toggle("active", isSelected);
      filterButton.setAttribute("aria-pressed", String(isSelected));
    });

    projectCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

document.querySelectorAll(".toggle-detail-btn").forEach((button) => {
  const detail = button.nextElementSibling;
  if (!detail || !detail.classList.contains("extra-detail")) {
    console.error(
      "A project detail button is missing its matching detail text.",
    );
    return;
  }

  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    const isOpen = detail.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
});

const quotes = [
  "Quiet focus and bold details always win.",
  "Small steps still move you toward big dreams.",
  "Creativity grows when curiosity gets room to play.",
  "Make something today that feels like you.",
];

const quoteButton = document.getElementById("shuffle-quote-btn");
const quoteOutput = document.getElementById("inspo-text");
if (quoteButton && quoteOutput) {
  quoteButton.addEventListener("click", () => {
    const choices = quotes.filter(
      (quote) => quote !== quoteOutput.textContent.trim(),
    );
    quoteOutput.textContent =
      choices[Math.floor(Math.random() * choices.length)];
  });
}

function showJournalStatus(message) {
  if (journalStatus) {
    journalStatus.textContent = message;
  }
}

function isJournalEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.mood === "string" &&
    typeof value.body === "string" &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt))
  );
}

function readJournalEntries() {
  try {
    const storedEntries = localStorage.getItem(storageKey);
    if (storedEntries === null) {
      return [];
    }

    const parsedEntries = JSON.parse(storedEntries);
    if (!Array.isArray(parsedEntries) || !parsedEntries.every(isJournalEntry)) {
      throw new Error("Saved journal data has an unexpected format.");
    }
    return parsedEntries;
  } catch (error) {
    console.error(
      "Could not load journal entries from browser storage.",
      error,
    );
    showJournalStatus(
      "Your saved entries could not be loaded. Check browser storage and try again.",
    );
    return null;
  }
}

function writeJournalEntries(entries) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error("Could not save journal entries to browser storage.", error);
    showJournalStatus(
      "Your entry could not be saved. Check available browser storage and try again.",
    );
    return false;
  }
}

function renderJournalEntries(entries) {
  if (!journalList) {
    return;
  }

  journalList.replaceChildren();
  if (entries.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Your saved entries will appear here.";
    journalList.append(emptyState);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "entry-card";

    const top = document.createElement("div");
    top.className = "entry-top";

    const title = document.createElement("h4");
    title.className = "entry-title";
    title.textContent = entry.title;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn-danger";
    deleteButton.dataset.deleteEntry = entry.id;
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
      "aria-label",
      `Delete journal entry: ${entry.title}`,
    );
    top.append(title, deleteButton);

    const meta = document.createElement("div");
    meta.className = "entry-meta";
    meta.textContent = `${entry.mood} · ${new Date(entry.createdAt).toLocaleString()}`;

    const body = document.createElement("p");
    body.className = "entry-body";
    body.textContent = entry.body;

    card.append(top, meta, body);
    journalList.append(card);
  });
}

let journalEntries = readJournalEntries();
const journalStorageReady = journalEntries !== null;
if (journalStorageReady) {
  renderJournalEntries(journalEntries);
}

if (journalForm) {
  journalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!journalStorageReady || !journalTitle || !journalMood || !journalBody) {
      showJournalStatus(
        "The journal is unavailable until browser storage can be read.",
      );
      return;
    }

    const title = journalTitle.value.trim();
    const body = journalBody.value.trim();
    if (!title || !body) {
      showJournalStatus("Please enter both a title and journal entry.");
      return;
    }

    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      mood: journalMood.value,
      body,
      createdAt: new Date().toISOString(),
    };
    const updatedEntries = [newEntry, ...journalEntries];
    if (!writeJournalEntries(updatedEntries)) {
      return;
    }

    journalEntries = updatedEntries;
    renderJournalEntries(journalEntries);
    journalForm.reset();
    showJournalStatus("Entry saved in this browser.");
  });
}

if (journalList) {
  journalList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const deleteButton = target.closest("[data-delete-entry]");
    if (!deleteButton) {
      return;
    }

    const entryId = deleteButton.getAttribute("data-delete-entry");
    const updatedEntries = journalEntries.filter(
      (entry) => entry.id !== entryId,
    );
    if (
      updatedEntries.length === journalEntries.length ||
      !writeJournalEntries(updatedEntries)
    ) {
      return;
    }

    journalEntries = updatedEntries;
    renderJournalEntries(journalEntries);
    showJournalStatus("Entry deleted.");
  });
}
