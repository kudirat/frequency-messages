import { blockList } from './blockList.js';
import { ethnicSlurs } from './ethnicSlurs.js';

const socket = io();
const mainContainer = document.querySelector('#main-container');
const userForm = document.querySelector('#user-form');
const messages = [];
const promptTitle = document.querySelector('#prompt-title');
let lastTime = performance.now();
let topics = ["What's one word to describe your day?", "You can vent for a bit, don't hold back.", "Share something you're grateful for!", "How many hours of sleep did you get?!", "Try not to use any profanity in here!", "What's (3+6)/9*7?", "Tell a joke don't be shy!", "Did you laugh today?", "Are you a coffee, tea, or water person?", "What's one thing you want to accomplish today?", "How was your commute today?", "What's one thing you want more of next year?", "Describe your day in emojis", "Tell a scary story"];
//target fields
let aliasInput = document.querySelector('#alias');
let colorPicker = document.querySelector('#favcolor');
let slider = document.querySelector('#speed-slider');
let txtMsgInput = document.querySelector('#txt-msg');

let userResponse = {
  alias: "",
  color: "",
  speed: 0,
  message: ""
};

let messageContainer = {
  text: "",
  posx: 0,
  posy: 0,
  speed: 0
};


const separatorPattern = '[\\p{P}\\p{S}\\p{M}\\u200D]*';
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blockedTerms = [...new Set([...blockList, ...ethnicSlurs])];
const blockListPattern = blockedTerms
  .sort((a, b) => b.length - a.length)
  .map((term) => term
    .trim()
    .split(/\s+/u)
    .map((word) => Array.from(word, escapeRegex).join(separatorPattern))
    .join('\\s+'))
  .join('|');
const blockListRegex = new RegExp(`(?<![\\p{L}\\p{N}])(?:${blockListPattern})(?![\\p{L}\\p{N}])`, 'giu');

const containsBlockedTerm = (value) => {
  blockListRegex.lastIndex = 0;
  return blockListRegex.test(value);
};

const validateAlias = () => {
  const isBlocked = containsBlockedTerm(aliasInput.value);
  aliasInput.setCustomValidity(
    isBlocked ? 'Please choose an alias that does not contain blocked terms.' : ''
  );
  return !isBlocked;
};

aliasInput.addEventListener('input', validateAlias);

userForm.addEventListener("submit", function (e) {
  e.preventDefault();
  if (!validateAlias()) {
    aliasInput.reportValidity();
    aliasInput.focus();
    return;
  }

  socket.emit("submit-user-resp", {
    alias: aliasInput.value,
    color: colorPicker.value,
    speed: slider.value,
    message: txtMsgInput.value
  });
});

socket.on("user-resp", (data) => {
  console.log("Client received response from server: " + JSON.stringify(data));
  userResponse = data;
  // alert(userResponse.alias + " has joined");
  let currMessage = buildMessage(userResponse);
  console.log(currMessage);
  let msgContainer = buildMessageContainer(currMessage);
  updateForm();
 displayMessage(msgContainer);
messages.push(msgContainer);
});

const buildMessage = (u) => {
  u.alias = validateMessage(u.alias);
  u.message = validateMessage(u.message);
  return `${u.alias}: ${u.message}`;
};

const validateMessage = (msg) => {
  console.log("Validating message: " + msg);
  const filteredMessage = msg.replace(blockListRegex, '***');
  if (filteredMessage !== msg) {
    console.log("Blocked message detected: " + msg);
  }
  return filteredMessage;
};


const buildMessageContainer = (msg) => {
  let temp = {
    text: msg,
    posx: Math.random() * window.innerWidth,
    posy: Math.random() * window.innerHeight,
    speed: Number(userResponse.speed)
  };
  return temp;
};

const updateForm = () => {
  //if prompt title is not hidden, hide alias and label, show prompt title with random topic
  if (!document.querySelector('#alias-row').classList.contains('hidden-element')) {
  document.querySelector('#alias-title').classList.add('hidden-element');
  document.querySelector('#alias').classList.add('hidden-element');
  document.querySelector('#favcolor-row').classList.add('hidden-element');
  document.querySelector('#favcolor-title').classList.add('hidden-element');
  document.querySelector('#favcolor').classList.add('hidden-element');
  document.querySelector('#prompt-title').classList.remove('hidden-element');
  } 
    document.querySelector('#prompt-title').textContent = topics[Math.floor(Math.random() * topics.length)];

}

const displayMessage = (msgContainer) => {
  let messageElement = document.createElement('p');
  messageElement.classList.add('message');
  messageElement.textContent = msgContainer.text;
  messageElement.style.backgroundColor = userResponse.color+'20';
  messageElement.style.border = `1px solid ${userResponse.color}`;
  messageElement.style.color = userResponse.color;
  // messageElement.style.left = `${msgContainer.posx}px`;
  // messageElement.style.top = `${msgContainer.posy}px`;
  mainContainer.appendChild(messageElement);
  const rect = messageElement.getBoundingClientRect();
  msgContainer.width = rect.width;
  msgContainer.height = rect.height;
  msgContainer.posx = Math.random() * (mainContainer.clientWidth - rect.width);
  msgContainer.posy = Math.random() * (mainContainer.clientHeight - rect.height);
  messageElement.style.left = `${msgContainer.posx}px`;
  messageElement.style.top = `${msgContainer.posy}px`;
  msgContainer.el = messageElement;

  return messageElement;
};

const clearMessages = () => {
  //if the amount of messages on the screen is greater than 300 start removing them
  if (messages.length > 300) {
    for (let i = messages.length; i > 0; i --) {
      let m = messages.pop();
      m.el.remove();
    }
  }
  else {
    console.log(`Current message count: ${messages.length}`);
  }
}

const tick = (currentTime) => {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;
  if (currentTime - lastTime > 300) {
    clearMessages();
  }
  for (const m of messages) {
    m.posx += m.speed * dt;
    if (m.posx > mainContainer.clientWidth - 1) {
      m.posx = -m.width;
    }
    m.el.style.left = `${m.posx}px`;
  }
  requestAnimationFrame(tick);
};

requestAnimationFrame(tick);