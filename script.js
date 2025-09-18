// ==========================
//   Originale Selektoren
// ==========================
const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

// ===== Upload-Selektoren (NEU) =====
const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const uploadMsg = document.getElementById("uploadMsg");

// ==========================
//   State
// ==========================
let currentUserMessage = null;
let isGeneratingResponse = false;

import config from "./config.js";

// ==========================
//   highlight.js Setup
// ==========================
hljs.configure({
  languages: ["javascript", "python", "bash", "typescript", "json", "html", "css"],
});
hljs.highlightAll();

// ==========================
//   API
// ==========================
const API_REQUEST_URL = `${config.API_BASE_URL}/models/${config.MODEL_NAME}:generateContent?key=${config.GEMINI_API_KEY}`;

// ==========================
//   Local Storage laden
// ==========================
const loadSavedChatHistory = () => {
  const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
  const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

  document.body.classList.toggle("light_mode", isLightTheme);
  if (themeToggleButton) {
    themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';
  }

  if (!chatHistoryContainer) return;
  chatHistoryContainer.innerHTML = "";

  savedConversations.forEach((conversation) => {
    // User
    const userMessageHtml = `
      <div class="message__content">
        <img class="message__avatar" src="assets/profile.png" alt="User avatar">
        <p class="message__text">${conversation.userMessage}</p>
      </div>
    `;
    const outgoingMessageElement = createChatMessageElement(userMessageHtml, "message--outgoing");
    chatHistoryContainer.appendChild(outgoingMessageElement);

    // Assistant
    const responseText = conversation.apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsedApiResponse = marked.parse(responseText);
    const rawApiResponse = responseText;

    const responseHtml = `
      <div class="message__content">
        <img class="message__avatar" src="assets/gemini.svg" alt="Gemini avatar">
        <p class="message__text"></p>
        <div class="message__loading-indicator hide">
          <div class="message__loading-bar"></div>
          <div class="message__loading-bar"></div>
          <div class="message__loading-bar"></div>
        </div>
      </div>
      <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
    `;
    const incomingMessageElement = createChatMessageElement(responseHtml, "message--incoming");
    chatHistoryContainer.appendChild(incomingMessageElement);

    const messageTextElement = incomingMessageElement.querySelector(".message__text");

    // ohne Tipp-Effekt
    showTypingEffect(rawApiResponse, parsedApiResponse, messageTextElement, incomingMessageElement, true);
  });

  document.body.classList.toggle("hide-header", savedConversations.length > 0);
};

// ==========================
//   Message Helpers
// ==========================
const createChatMessageElement = (htmlContent, ...cssClasses) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", ...cssClasses);
  messageElement.innerHTML = htmlContent;
  return messageElement;
};

const showTypingEffect = (rawText, htmlText, messageElement, incomingMessageElement, skipEffect = false) => {
  const copyIconElement = incomingMessageElement.querySelector(".message__icon");
  copyIconElement?.classList.add("hide");

  if (skipEffect) {
    messageElement.innerHTML = htmlText;
    hljs.highlightAll();
    addCopyButtonToCodeBlocks();
    copyIconElement?.classList.remove("hide");
    isGeneratingResponse = false;
    return;
  }

  const wordsArray = rawText.split(" ");
  let wordIndex = 0;

  const typingInterval = setInterval(() => {
    messageElement.innerText += (wordIndex === 0 ? "" : " ") + (wordsArray[wordIndex++] || "");
    if (wordIndex >= wordsArray.length) {
      clearInterval(typingInterval);
      isGeneratingResponse = false;
      messageElement.innerHTML = htmlText;
      hljs.highlightAll();
      addCopyButtonToCodeBlocks();
      copyIconElement?.classList.remove("hide");
    }
  }, 75);
};

const requestApiResponse = async (incomingMessageElement) => {
  const messageTextElement = incomingMessageElement.querySelector(".message__text");

  try {
    const response = await fetch(API_REQUEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: currentUserMessage }] }],
      }),
    });

    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData?.error?.message || "Request failed");

    const responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("Invalid API response.");

    const parsedApiResponse = marked.parse(responseText);
    showTypingEffect(responseText, parsedApiResponse, messageTextElement, incomingMessageElement);

    // speichern
    const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    savedConversations.push({ userMessage: currentUserMessage, apiResponse: responseData });
    localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
  } catch (error) {
    isGeneratingResponse = false;
    messageTextElement.innerText = error.message || "Unbekannter Fehler";
    messageTextElement.closest(".message")?.classList.add("message--error");
  } finally {
    incomingMessageElement.classList.remove("message--loading");
  }
};

const addCopyButtonToCodeBlocks = () => {
  const codeBlocks = document.querySelectorAll("pre");
  codeBlocks.forEach((block) => {
    const codeElement = block.querySelector("code");
    if (!codeElement) return;

    // Mehrfach-Init vermeiden
    if (block.querySelector(".code__copy-btn")) return;

    const language = ([...codeElement.classList].find((c) => c.startsWith("language-")) || "language-text").replace("language-", "") || "Text";

    const languageLabel = document.createElement("div");
    languageLabel.innerText = language.charAt(0).toUpperCase() + language.slice(1);
    languageLabel.classList.add("code__language-label");
    block.appendChild(languageLabel);

    const copyButton = document.createElement("button");
    copyButton.innerHTML = `<i class='bx bx-copy'></i>`;
    copyButton.type = "button";
    copyButton.classList.add("code__copy-btn");
    block.appendChild(copyButton);

    copyButton.addEventListener("click", () => {
      navigator.clipboard
        .writeText(codeElement.innerText)
        .then(() => {
          copyButton.innerHTML = `<i class='bx bx-check'></i>`;
          setTimeout(() => (copyButton.innerHTML = `<i class='bx bx-copy'></i>`), 2000);
        })
        .catch((err) => {
          console.error("Copy failed:", err);
          alert("Unable to copy text!");
        });
    });
  });
};

const displayLoadingAnimation = () => {
  const loadingHtml = `
    <div class="message__content">
      <img class="message__avatar" src="assets/gemini.svg" alt="Gemini avatar">
      <p class="message__text"></p>
      <div class="message__loading-indicator">
        <div class="message__loading-bar"></div>
        <div class="message__loading-bar"></div>
        <div class="message__loading-bar"></div>
      </div>
    </div>
    <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
  `;

  const loadingMessageElement = createChatMessageElement(loadingHtml, "message--incoming", "message--loading");
  chatHistoryContainer.appendChild(loadingMessageElement);

  requestApiResponse(loadingMessageElement);
};

// Global machen wegen inline onClick im HTML
function copyMessageToClipboard(copyButton) {
  const messageContent = copyButton.parentElement.querySelector(".message__text")?.innerText || "";
  navigator.clipboard.writeText(messageContent);
  copyButton.innerHTML = `<i class='bx bx-check'></i>`;
  setTimeout(() => (copyButton.innerHTML = `<i class='bx bx-copy-alt'></i>`), 1000);
}
window.copyMessageToClipboard = copyMessageToClipboard;

// ==========================
//   Sending
// ==========================
const handleOutgoingMessage = () => {
  if (!messageForm) return;
  currentUserMessage = messageForm.querySelector(".prompt__form-input").value.trim() || currentUserMessage;
  if (!currentUserMessage || isGeneratingResponse) return;

  isGeneratingResponse = true;

  const outgoingMessageHtml = `
    <div class="message__content">
      <img class="message__avatar" src="assets/profile.png" alt="User avatar">
      <p class="message__text"></p>
    </div>
  `;
  const outgoingMessageElement = createChatMessageElement(outgoingMessageHtml, "message--outgoing");
  outgoingMessageElement.querySelector(".message__text").innerText = currentUserMessage;
  chatHistoryContainer.appendChild(outgoingMessageElement);

  messageForm.reset();
  document.body.classList.add("hide-header");
  setTimeout(displayLoadingAnimation, 500);
};

// ==========================
//   Theme Toggle
// ==========================
themeToggleButton?.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  const newIconClass = isLightTheme ? "bx bx-moon" : "bx bx-sun";
  themeToggleButton.querySelector("i").className = newIconClass;
});

// ==========================
//   Clear Chat
// ==========================
clearChatButton?.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all chat history?")) {
    localStorage.removeItem("saved-api-chats");
    loadSavedChatHistory();
    currentUserMessage = null;
    isGeneratingResponse = false;
  }
});

// ==========================
//   Suggestions
// ==========================
suggestionItems.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    currentUserMessage = suggestion.querySelector(".suggests__item-text").innerText;
    handleOutgoingMessage();
  });
});

// ==========================
//   Form Submit
// ==========================
messageForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingMessage();
});

// ==========================
//   Upload-Logik (NEU)
// ==========================
const allowedExt = new Set(["pdf", "pptx", "docx", "xlsx", "jpg", "jpeg", "txt"]);
const maxBytes = 4 * 1024 * 1024; // 4 MB

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// Optional: als Chat-Bubble anhängen nach erfolgreichem Upload
function appendAttachmentMessage({ originalName, size, path }) {
  const html = `
    <div class="message__content">
      <img class="message__avatar" src="assets/profile.png" alt="User avatar">
      <p class="message__text">
        📎 Datei hochgeladen: <strong>${originalName}</strong> (${humanSize(size)})<br>
        ${path ? `<a href="${path}" target="_blank" rel="noopener">Öffnen</a>` : ""}
      </p>
    </div>
  `;
  const el = createChatMessageElement(html, "message--outgoing");
  chatHistoryContainer.appendChild(el);
}

uploadForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!fileInput) return;

  uploadMsg && (uploadMsg.textContent = "");

  const file = fileInput.files?.[0];
  if (!file) {
    uploadMsg && (uploadMsg.textContent = "Bitte eine Datei auswählen.");
    return;
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!allowedExt.has(ext)) {
    uploadMsg && (uploadMsg.textContent = "Unzulässiger Dateityp.");
    return;
  }

  if (file.size > maxBytes) {
    uploadMsg && (uploadMsg.textContent = `Datei ist zu groß (${humanSize(file.size)}). Maximal 4 MB.`);
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    uploadMsg && (uploadMsg.textContent = "Lade hoch …");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok || !data?.ok) throw new Error(data?.error || "Upload fehlgeschlagen.");

    uploadMsg && (uploadMsg.textContent = `Upload OK: ${data.originalName} (${humanSize(data.size)})`);

    // Optional: als Nachricht anzeigen
    appendAttachmentMessage(data);

    // Optional: direkt als Prompt anhängen / an dein Backend weiterleiten:
    // currentUserMessage = `Bitte analysiere die Datei: ${data.originalName}`;
    // handleOutgoingMessage();
  } catch (err) {
    uploadMsg && (uploadMsg.textContent = err.message || "Upload fehlgeschlagen.");
  } finally {
    // Optional: input leeren
    if (fileInput) fileInput.value = "";
  }
});

// ==========================
//   Init
// ==========================
loadSavedChatHistory();
