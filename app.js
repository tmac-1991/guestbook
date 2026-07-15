import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MESSAGE_MAX_LENGTH = 100;

const form = document.getElementById("guestbook-form");
const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");
const charCountEl = document.getElementById("char-count");
const statusEl = document.getElementById("status");
const list = document.getElementById("messages");

function updateCharCount() {
  const length = messageInput.value.length;
  charCountEl.textContent = `${length} / ${MESSAGE_MAX_LENGTH}`;
  charCountEl.classList.toggle("limit", length >= MESSAGE_MAX_LENGTH);
}

messageInput.addEventListener("input", updateCharCount);

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderMessages(rows) {
  list.innerHTML = "";
  for (const row of rows) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "msg-name";
    name.textContent = row.name?.trim() || "Anonymous";

    const time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = formatTime(row.created_at);

    const body = document.createElement("div");
    body.className = "msg-body";
    body.textContent = row.message;

    li.append(name, time, body);
    list.appendChild(li);
  }
}

async function loadMessages() {
  const { data, error } = await supabase
    .from("guestbook_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(`Couldn't load messages: ${error.message}`, true);
    return;
  }
  renderMessages(data);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (!message) return;
  if (message.length > MESSAGE_MAX_LENGTH) {
    setStatus(`Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`, true);
    return;
  }

  const submitButton = form.querySelector("button");
  submitButton.disabled = true;
  setStatus("Posting...");

  const { error } = await supabase
    .from("guestbook_messages")
    .insert({ name: name || null, message });

  submitButton.disabled = false;

  if (error) {
    setStatus(`Couldn't post message: ${error.message}`, true);
    return;
  }

  setStatus("Posted!");
  messageInput.value = "";
  updateCharCount();
  await loadMessages();
});

// Live updates when other visitors post
supabase
  .channel("guestbook_messages_changes")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "guestbook_messages" },
    () => loadMessages()
  )
  .subscribe();

loadMessages();
