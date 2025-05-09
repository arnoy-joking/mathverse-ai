
document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration ---
  const API_KEY = "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";
  const OPENROUTER_MODEL = "meta-llama/llama-4-maverick:free"; 

  // --- DOM Elements ---
  const sidebar = document.getElementById('sidebar');
  const sidebarToggleMobile = document.getElementById('sidebar-toggle-mobile');
  const sidebarToggleDesktop = document.getElementById('sidebar-toggle-desktop');
  const sidebarToggleIconDesktop = document.getElementById('sidebar-toggle-icon-desktop'); // Corrected ID
  const sidebarCloseMobile = document.getElementById('sidebar-close-mobile');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const mainContent = document.getElementById('main-content');

  const calculatorPanel = document.getElementById('calculator-panel');
  const calculatorToggleMobile = document.getElementById('calculator-toggle-mobile');
  const calculatorToggleDesktop = document.getElementById('calculator-toggle-desktop');
  const calculatorCloseButton = document.getElementById('calculator-close-button');
  const chatCalculatorToggle = document.getElementById('chat-calculator-toggle');
  const calculatorOverlay = document.getElementById('calculator-overlay');

  const chatInterface = document.getElementById('chat-interface');
  const chatMessagesArea = document.getElementById('chat-messages-area');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const chatWelcomeMessage = document.getElementById('chat-welcome-message');
  const chatInputContainer = document.getElementById('chat-input-container');


  const newChatButton = document.getElementById('new-chat-button');
  const clearAllButton = document.getElementById('clear-all-button');
  const exportChatsButton = document.getElementById('export-chats-button');
  const importChatsButton = document.getElementById('import-chats-button');
  const importFileInput = document.getElementById('import-file-input');
  const conversationsList = document.getElementById('conversations-list');

  // Calculator Elements
  const calcExpressionDisplay = document.getElementById('calc-expression-display');
  const calcLatexPreview = document.getElementById('calc-latex-preview');
  const calcModeToggle = document.getElementById('calc-mode-toggle');
  const calcAC = document.getElementById('calc-ac');
  const calcC = document.getElementById('calc-c');
  const calcDel = document.getElementById('calc-del');
  const calcConfirm = document.getElementById('calc-confirm');
  const calculatorButtonsGrid = document.getElementById('calculator-buttons-grid');

  const toastContainer = document.getElementById('toast-container');

  // --- State ---
  let state = {
      isSidebarOpen: window.innerWidth >= 768,
      isCalculatorOpen: false,
      conversations: [],
      activeConversationId: null,
      chatInputDraft: '',
      isAiTyping: false,
      calculator: {
          expression: 'Equation will appear here',
          latexExpression: '',
          history: [{ expression: 'Equation will appear here', latexExpression: '' }],
          historyIndex: 0,
          memory: 0,
          mode: 'DEG', // 'DEG' or 'RAD'
          error: null,
      }
  };

  // --- Helper Functions ---
  const uuidv4 = () => { // Basic UUID generator
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      });
  };

  const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const typesetMath = (element) => {
      if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise(element ? [element] : undefined)
              .catch(err => console.error('MathJax typeset error:', err));
      }
  };

  const showToast = (title, description, variant = 'default') => {
      const toastId = uuidv4();
      const toastElement = document.createElement('div');
      toastElement.id = toastId;
      toastElement.className = `toast ${variant === 'destructive' ? 'destructive' : ''} animate-fadeIn`;
      toastElement.innerHTML = `
          <div>
              ${title ? `<div class="toast-title">${title}</div>` : ''}
              ${description ? `<div class="toast-description">${description}</div>` : ''}
          </div>
          <button class="toast-close-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
      `;
      toastContainer.appendChild(toastElement);

      toastElement.querySelector('.toast-close-button').addEventListener('click', () => {
          toastElement.remove();
      });

      setTimeout(() => {
          toastElement.remove();
      }, 5000);
  };
  
  const showAlertDialog = (title, description, onConfirm, confirmText = 'Confirm', confirmDestructive = false) => {
      const dialogId = `dialog-${uuidv4()}`;
      const overlay = document.createElement('div');
      overlay.id = `${dialogId}-overlay`;
      overlay.className = 'alert-dialog-overlay';

      const dialog = document.createElement('div');
      dialog.id = dialogId;
      dialog.className = 'alert-dialog-content';
      dialog.innerHTML = `
          <div class="alert-dialog-header">
              <div class="alert-dialog-title">${title}</div>
              ${description ? `<div class="alert-dialog-description">${description}</div>` : ''}
          </div>
          <div class="alert-dialog-footer">
              <button class="alert-dialog-cancel">Cancel</button>
              <button class="alert-dialog-action ${confirmDestructive ? 'destructive' : ''}">${confirmText}</button>
          </div>
      `;
      document.body.appendChild(overlay);
      document.body.appendChild(dialog);

      const closeDialog = () => {
          overlay.remove();
          dialog.remove();
      };

      overlay.addEventListener('click', closeDialog);
      dialog.querySelector('.alert-dialog-cancel').addEventListener('click', closeDialog);
      dialog.querySelector('.alert-dialog-action').addEventListener('click', () => {
          onConfirm();
          closeDialog();
      });
  };


  // --- UI Update Functions ---
  const updateSidebarUI = () => {
      if (state.isSidebarOpen) {
          sidebar.classList.remove('-translate-x-full');
          sidebar.classList.add('translate-x-0');
          if (window.innerWidth < 768) sidebarOverlay.classList.remove('hidden');
          else sidebarOverlay.classList.add('hidden');
          mainContent.classList.add('md:ml-[280px]');
          if (sidebarToggleIconDesktop) sidebarToggleIconDesktop.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3H3v18h18V3zM9 3v18"/></svg>`; // PanelLeftClose
      } else {
          sidebar.classList.add('-translate-x-full');
          sidebar.classList.remove('translate-x-0');
          sidebarOverlay.classList.add('hidden');
          mainContent.classList.remove('md:ml-[280px]');
           if (sidebarToggleIconDesktop) sidebarToggleIconDesktop.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`; // PanelLeftOpen
      }
  };

  const updateCalculatorUI = () => {
      if (state.isCalculatorOpen) {
          calculatorPanel.classList.remove('translate-x-full', 'md:hidden');
          calculatorPanel.classList.add('translate-x-0');
          if (window.innerWidth < 768) calculatorOverlay.classList.remove('hidden');
          else calculatorOverlay.classList.add('hidden');
          mainContent.classList.add('md:mr-[400px]'); // This might need adjustment based on layout
      } else {
          calculatorPanel.classList.add('translate-x-full', 'md:hidden');
          calculatorPanel.classList.remove('translate-x-0');
          calculatorOverlay.classList.add('hidden');
          mainContent.classList.remove('md:mr-[400px]'); // This might need adjustment
      }
      updateCalculatorDisplay();
  };

  const updateCalculatorDisplay = () => {
      calcExpressionDisplay.textContent = state.calculator.expression;
      if (state.calculator.latexExpression) {
          calcLatexPreview.innerHTML = `\\(${state.calculator.latexExpression}\\)`;
      } else if (state.calculator.expression === "Equation will appear here") {
           calcLatexPreview.innerHTML = `<span class="italic opacity-50">LaTeX Preview</span>`;
      } else {
          calcLatexPreview.innerHTML = '';
      }
      typesetMath(calcLatexPreview);
      calcModeToggle.textContent = state.calculator.mode;

      if (state.calculator.error) {
          calcExpressionDisplay.textContent = state.calculator.error;
          calcExpressionDisplay.style.color = 'hsl(var(--destructive))';
          calcLatexPreview.innerHTML = `\\(\\text{${state.calculator.error}}\\)`;
          typesetMath(calcLatexPreview);
          setTimeout(() => {
              state.calculator.error = null;
              calcExpressionDisplay.style.color = ''; // Reset color
              updateCalculatorDisplay();
          }, 2000);
      } else {
           calcExpressionDisplay.style.color = ''; // Reset color
      }
  };


  // --- LocalStorage Persistence ---
  const saveState = () => {
      try {
          localStorage.setItem('mathverse_ai_static_state', JSON.stringify({
              conversations: state.conversations,
              activeConversationId: state.activeConversationId,
              calculatorMemory: state.calculator.memory, 
              calculatorMode: state.calculator.mode,
          }));
          if (state.activeConversationId) {
              localStorage.setItem(`mathverse_chat_draft_${state.activeConversationId}`, state.chatInputDraft);
          }
      } catch (e) { console.error("Error saving state:", e); }
  };

  const loadState = () => {
      try {
          const storedState = localStorage.getItem('mathverse_ai_static_state');
          if (storedState) {
              const parsed = JSON.parse(storedState);
              state.conversations = parsed.conversations || [];
              state.activeConversationId = parsed.activeConversationId || null;
              state.calculator.memory = parsed.calculatorMemory || 0;
              state.calculator.mode = parsed.calculatorMode || 'DEG';
          }

          if (state.activeConversationId) {
              state.chatInputDraft = localStorage.getItem(`mathverse_chat_draft_${state.activeConversationId}`) || '';
              chatInput.value = state.chatInputDraft;
              const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
              if (activeConv && activeConv.calculatorState) {
                  state.calculator = {...state.calculator, ...activeConv.calculatorState};
              } else {
                  resetCalculatorStateForActiveConvo(); 
              }
          } else if (state.conversations.length > 0) {
              state.activeConversationId = state.conversations.sort((a,b) => b.createdAt - a.createdAt)[0].id;
              loadState(); 
              return; 
          }


          if (state.conversations.length === 0) {
              startNewConversation(); 
          } else {
              renderConversationsList();
              renderChatMessages();
          }
           updateCalculatorDisplay();
      } catch (e) {
          console.error("Error loading state:", e);
          if (state.conversations.length === 0) startNewConversation();
      }
  };
  
  const resetCalculatorStateForActiveConvo = () => { // Renamed for clarity
      const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
      const newCalcState = {
          expression: 'Equation will appear here',
          latexExpression: '',
          history: [{ expression: 'Equation will appear here', latexExpression: '' }],
          historyIndex: 0,
          memory: state.calculator.memory, // Persist global memory setting
          mode: state.calculator.mode,     // Persist global mode setting
          error: null,
      };
      if (activeConv) {
          activeConv.calculatorState = { ...newCalcState };
      }
      state.calculator = { ...newCalcState }; // Update global calculator state
      updateCalculatorDisplay();
  };


  // --- Chat Functions ---
  const renderConversationsList = () => {
      conversationsList.innerHTML = '';
      if (state.conversations.length === 0) {
           conversationsList.innerHTML = `<div class="p-4 text-center text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle mx-auto h-8 w-8 mb-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              No conversations yet. <br/>Click "New Chat" to start.
            </div>`;
          return;
      }
      const sortedConversations = [...state.conversations].sort((a, b) => b.createdAt - a.createdAt);

      sortedConversations.forEach(conv => {
          const item = document.createElement('div');
          item.className = `group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 ${conv.id === state.activeConversationId ? 'bg-primary/20 text-primary-foreground' : 'text-foreground'}`; // Ensure text-foreground for non-active
          item.dataset.id = conv.id;

          const titleSection = document.createElement('div');
          titleSection.className = 'flex items-center flex-grow truncate';
          titleSection.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square mr-2 flex-shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span class="truncate" title="${conv.title}">${conv.title}</span>
          `;
          titleSection.addEventListener('click', () => setActiveConversation(conv.id));

          const controls = document.createElement('div');
          controls.className = 'flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity';
          
          const editButton = document.createElement('button');
          editButton.className = 'p-1 hover:bg-muted/80 rounded';
          editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-3 text-blue-400"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
          editButton.onclick = (e) => { e.stopPropagation(); handleEditTitle(conv.id, conv.title, item); };

          const deleteButton = document.createElement('button');
          deleteButton.className = 'p-1 hover:bg-muted/80 rounded';
          deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 text-red-400"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
          deleteButton.onclick = (e) => { e.stopPropagation(); handleDeleteConversation(conv.id, conv.title); };
          
          controls.appendChild(editButton);
          controls.appendChild(deleteButton);
          item.appendChild(titleSection);
          item.appendChild(controls);
          conversationsList.appendChild(item);
      });
  };

  const handleEditTitle = (id, currentTitle, listItemElement) => {
      const titleSpan = listItemElement.querySelector('.truncate');
      const icon = listItemElement.querySelector('svg.lucide-message-square');
      
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentTitle;
      input.className = 'h-8 flex-grow mr-2 bg-input border-primary/50 focus:border-primary rounded-md px-2 text-sm text-foreground'; // Ensure text color
      input.style.maxWidth = 'calc(100% - 30px)'; 

      const saveEdit = () => {
          const newTitle = input.value.trim();
          if (newTitle && newTitle !== currentTitle) {
              updateConversationTitle(id, newTitle);
          }
          // Restore original display
          const newTitleSpan = document.createElement('span');
          newTitleSpan.className = 'truncate';
          newTitleSpan.title = newTitle || currentTitle;
          newTitleSpan.textContent = newTitle || currentTitle;
          
          const newIcon = icon.cloneNode(true);

          const titleSection = listItemElement.querySelector('.flex-grow');
          titleSection.innerHTML = ''; 
          titleSection.appendChild(newIcon);
          titleSection.appendChild(newTitleSpan);
      };

      input.onblur = saveEdit;
      input.onkeydown = (e) => {
          if (e.key === 'Enter') {
              e.preventDefault();
              saveEdit();
          } else if (e.key === 'Escape') {
              input.value = currentTitle; 
              saveEdit();
          }
      };
      
      const titleSection = listItemElement.querySelector('.flex-grow');
      titleSection.innerHTML = ''; 
      titleSection.appendChild(input); 
      input.focus();
      input.select();
  };


  const renderChatMessages = () => {
      chatMessagesArea.innerHTML = '';
      const conversation = state.conversations.find(c => c.id === state.activeConversationId);
      
      if (chatInputContainer) chatInputContainer.style.display = state.activeConversationId ? 'block' : 'none';

      if (!conversation || conversation.messages.length === 0) {
          if (state.activeConversationId) { 
               chatWelcomeMessage.style.display = 'flex';
          } else {
               chatWelcomeMessage.style.display = 'none'; 
               const noChatSelected = document.createElement('div');
               noChatSelected.className = 'flex flex-col items-center justify-center h-full text-muted-foreground';
               noChatSelected.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot mb-4 text-primary"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg><p class="text-lg">No active conversation.</p><p>Start a new chat or select one from the sidebar.</p>`;
               chatMessagesArea.appendChild(noChatSelected);
          }
          return;
      }

      chatWelcomeMessage.style.display = 'none';

      conversation.messages.forEach(msg => {
          const msgElement = document.createElement('div');
          msgElement.className = `flex items-end gap-2 animate-fadeIn ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`;
          
          let avatarHtml = '';
          if (msg.role === 'assistant') {
              avatarHtml = `<div class="h-8 w-8 self-start shadow-md rounded-full bg-gradient-to-br from-purple-accent to-accent text-primary-foreground flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg></div>`;
          }

          const formattedContent = msg.content.replace(/\n/g, '<br>');

          const contentDiv = `
              <div class="relative max-w-[75%] rounded-lg px-4 py-2 shadow-lg ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}">
                  <div class="absolute -top-5 text-xs text-muted-foreground whitespace-nowrap" style="${msg.role === 'user' ? 'right:0;' : 'left:0;'} display:none;">${formatDate(msg.timestamp)}</div>
                  <div class="prose prose-sm break-words">${formattedContent}</div>
              </div>
          `;
          
          if (msg.role === 'user') {
              avatarHtml = `<div class="h-8 w-8 self-start shadow-md rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
              msgElement.innerHTML = contentDiv + avatarHtml;
          } else {
              msgElement.innerHTML = avatarHtml + contentDiv;
          }
          
          msgElement.addEventListener('mouseenter', () => { msgElement.querySelector('.absolute').style.display = 'block'; });
          msgElement.addEventListener('mouseleave', () => { msgElement.querySelector('.absolute').style.display = 'none'; });

          chatMessagesArea.appendChild(msgElement);
      });

      if (state.isAiTyping) {
          const typingIndicator = document.createElement('div');
          typingIndicator.className = 'flex items-end gap-2 animate-fadeIn justify-start';
          typingIndicator.innerHTML = `
              <div class="h-8 w-8 self-start shadow-md rounded-full bg-gradient-to-br from-purple-accent to-accent text-primary-foreground flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg></div>
              <div class="chat-message-typing rounded-lg px-4 py-3 shadow-lg">
                  <div class="flex space-x-1">
                      <div class="dot"></div> <div class="dot"></div> <div class="dot"></div>
                  </div>
              </div>
          `;
          chatMessagesArea.appendChild(typingIndicator);
      }
      typesetMath(chatMessagesArea);
      chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
  };

  const addMessage = async (role, content) => {
      if (!state.activeConversationId) {
          showToast('Error', 'No active conversation to add message to.', 'destructive');
          return;
      }
      const newMessage = { id: uuidv4(), role, content, timestamp: Date.now() };
      const conversation = state.conversations.find(c => c.id === state.activeConversationId);
      if (conversation) {
          conversation.messages.push(newMessage);
          conversation.createdAt = Date.now(); 
          
          if (role === 'user' && conversation.messages.filter(m => m.role === 'user').length === 1) {
              if (/^Chat \d+$/.test(conversation.title)) { 
                  const cleanContent = content.replace(/\\\(.*?\\\)|\\\[.*?\\\]|\$[^$]*\$/g, '').trim(); 
                  const newTitle = cleanContent.substring(0, 30) || conversation.title;
                  if (newTitle !== conversation.title) {
                      updateConversationTitle(conversation.id, newTitle);
                  }
              }
          }

          renderChatMessages();
          saveState(); 

          if (role === 'user') {
              state.isAiTyping = true;
              renderChatMessages(); 

              try {
                  const historyForAPI = conversation.messages.map(m => ({role: m.role, content: m.content}));
                  const aiResponseContent = await getOpenRouterResponse(historyForAPI); 
                  await addMessage('assistant', aiResponseContent);
              } catch (error) {
                  console.error("OpenRouter API error:", error);
                  await addMessage('assistant', `⚠️ Error: Could not get a response from AI. ${error.message}`);
                  showToast("AI Error", `Failed to get response: ${error.message}`, "destructive");
              } finally {
                  state.isAiTyping = false;
                  renderChatMessages(); 
                  saveState(); 
              }
          }
      }
  };

  async function getOpenRouterResponse(messages) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
              "model": OPENROUTER_MODEL,
              "messages": messages 
          })
      });
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: response.statusText } })); // Graceful error parsing
          console.error("OpenRouter API Error:", errorData);
          throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          return data.choices[0].message.content;
      } else {
          console.error("Unexpected API response format:", data);
          throw new Error("Unexpected API response format from OpenRouter.");
      }
  }
  
  const startNewConversation = () => {
      const newId = uuidv4();
      const existingTitles = state.conversations.map(c => c.title);
      let newTitleNumber = 1;
      while (existingTitles.includes(`Chat ${newTitleNumber}`)) {
          newTitleNumber++;
      }
      const newCalculatorState = {
          expression: 'Equation will appear here',
          latexExpression: '',
          history: [{ expression: 'Equation will appear here', latexExpression: '' }],
          historyIndex: 0,
          memory: state.calculator.memory, 
          mode: state.calculator.mode,     
          error: null,
      };
      state.conversations.push({
          id: newId,
          title: `Chat ${newTitleNumber}`,
          messages: [],
          createdAt: Date.now(),
          calculatorState: newCalculatorState
      });
      setActiveConversation(newId); // This will also set state.calculator
      return newId;
  };

  const setActiveConversation = (id) => {
      state.activeConversationId = id;
      state.chatInputDraft = localStorage.getItem(`mathverse_chat_draft_${id}`) || '';
      chatInput.value = state.chatInputDraft;
      
      const activeConv = state.conversations.find(c => c.id === id);
      if (activeConv && activeConv.calculatorState) {
          state.calculator = { ...state.calculator, ...activeConv.calculatorState };
      } else if (activeConv) { 
           const newInitialCalcState = { // Define a fresh initial state
              expression: 'Equation will appear here',
              latexExpression: '',
              history: [{ expression: 'Equation will appear here', latexExpression: '' }],
              historyIndex: 0,
              memory: state.calculator.memory, // Keep global memory
              mode: state.calculator.mode, // Keep global mode
              error: null,
          };
           activeConv.calculatorState = { ...newInitialCalcState }; 
           state.calculator = { ...newInitialCalcState };
      } else {
          resetCalculatorStateForActiveConvo(); // Fallback, should ideally not be hit if id is valid
      }

      renderConversationsList();
      renderChatMessages();
      updateCalculatorDisplay(); 
      saveState();
       if (window.innerWidth < 768 && state.isSidebarOpen) { 
          state.isSidebarOpen = false;
          updateSidebarUI();
      }
  };
  
  const updateConversationTitle = (id, newTitle) => {
      const conversation = state.conversations.find(c => c.id === id);
      if (conversation) {
          conversation.title = newTitle;
          renderConversationsList();
          saveState();
      }
  };

  const handleDeleteConversation = (id, title) => {
      showAlertDialog(
          'Delete Conversation?',
          `Are you sure you want to delete "${title}"? This action cannot be undone.`,
          () => {
              state.conversations = state.conversations.filter(conv => conv.id !== id);
              if (state.activeConversationId === id) {
                  state.activeConversationId = null;
                  chatInput.value = ''; 
                  state.chatInputDraft = '';
                  if (state.conversations.length > 0) {
                      setActiveConversation(state.conversations.sort((a,b) => b.createdAt - a.createdAt)[0].id);
                  } else {
                      startNewConversation(); 
                  }
              } else {
                   renderConversationsList(); 
              }
              saveState();
              showToast("Success", `Conversation "${title}" deleted.`);
          },
          "Delete",
          true
      );
  };

  const handleClearAllConversations = () => {
       showAlertDialog(
          'Clear All Chats?',
          `This action cannot be undone. This will permanently delete all your conversations.`,
          () => {
              state.conversations = [];
              state.activeConversationId = null;
              chatInput.value = '';
              state.chatInputDraft = '';
              startNewConversation();
              saveState();
              showToast("Success", "All conversations cleared.");
          },
          "Confirm Clear All",
          true
      );
  };

  const handleExportConversations = () => {
      if (state.conversations.length === 0) {
          showToast("Export Error", "No conversations to export.", "destructive");
          return;
      }
      const jsonString = JSON.stringify(state.conversations, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mathverse_ai_chats_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Success", "Conversations exported.");
  };
  
  const handleImportConversations = (event) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const imported = JSON.parse(e.target.result);
                  if (Array.isArray(imported) && imported.every(c => c.id && c.title && Array.isArray(c.messages))) {
                      state.conversations = imported.map(conv => ({
                          ...conv,
                          // Ensure calculatorState exists for imported conversations
                          calculatorState: conv.calculatorState || {
                              expression: 'Equation will appear here',
                              latexExpression: '',
                              history: [{ expression: 'Equation will appear here', latexExpression: '' }],
                              historyIndex: 0,
                              memory: 0, // Default memory for imported, or could try to derive from a global if needed
                              mode: 'DEG', // Default mode
                              error: null,
                          }
                      }));
                      if (state.conversations.length > 0) {
                          state.conversations.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Handle potentially missing createdAt
                          setActiveConversation(state.conversations[0].id);
                      } else {
                          startNewConversation();
                      }
                      saveState();
                      showToast("Success", "Conversations imported.");
                  } else {
                      throw new Error("Invalid conversation format.");
                  }
              } catch (err) {
                  console.error("Failed to import conversations:", err);
                  showToast("Import Error", `Invalid file: ${err.message}`, "destructive");
              }
          };
          reader.readAsText(file);
          importFileInput.value = ''; 
      }
  };


  // --- Event Listeners ---
  sidebarToggleMobile?.addEventListener('click', () => {
      state.isSidebarOpen = !state.isSidebarOpen;
      updateSidebarUI();
  });
  sidebarToggleDesktop?.addEventListener('click', () => {
      state.isSidebarOpen = !state.isSidebarOpen;
      updateSidebarUI();
  });
  sidebarCloseMobile?.addEventListener('click', () => {
      state.isSidebarOpen = false;
      updateSidebarUI();
  });
  sidebarOverlay?.addEventListener('click', () => {
      state.isSidebarOpen = false;
      updateSidebarUI();
  });

  const toggleCalcPanel = () => {
      state.isCalculatorOpen = !state.isCalculatorOpen;
      updateCalculatorUI();
  };
  calculatorToggleMobile?.addEventListener('click', toggleCalcPanel);
  calculatorToggleDesktop?.addEventListener('click', toggleCalcPanel);
  chatCalculatorToggle?.addEventListener('click', toggleCalcPanel);
  calculatorCloseButton?.addEventListener('click', () => {
      state.isCalculatorOpen = false;
      updateCalculatorUI();
  });
  calculatorOverlay?.addEventListener('click', () => {
      state.isCalculatorOpen = false;
      updateCalculatorUI();
  });


  sendButton?.addEventListener('click', () => {
      const content = chatInput.value.trim();
      if (content) {
          addMessage('user', content);
          chatInput.value = '';
          state.chatInputDraft = '';
          adjustTextareaHeight(chatInput);
          saveState(); 
      }
  });

  chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendButton.click();
      }
  });
  chatInput?.addEventListener('input', (e) => {
      state.chatInputDraft = e.target.value;
      adjustTextareaHeight(e.target);
  });
  chatInput?.addEventListener('blur', () => { 
      if (state.activeConversationId) {
           localStorage.setItem(`mathverse_chat_draft_${state.activeConversationId}`, state.chatInputDraft);
      }
  });

  function adjustTextareaHeight(textarea) {
      if (!textarea) return;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 150; 
      const minHeight = 44; 
      textarea.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;
  }

  newChatButton?.addEventListener('click', startNewConversation);
  clearAllButton?.addEventListener('click', handleClearAllConversations);
  exportChatsButton?.addEventListener('click', handleExportConversations);
  importChatsButton?.addEventListener('click', () => importFileInput.click());
  importFileInput?.addEventListener('change', handleImportConversations);


  window.addEventListener('resize', () => {
      updateSidebarUI();
      updateCalculatorUI();
  });

  window.addEventListener('beforeunload', () => {
      if (state.activeConversationId && chatInput) {
           localStorage.setItem(`mathverse_chat_draft_${state.activeConversationId}`, chatInput.value);
      }
      if (state.activeConversationId) {
          const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
          if (activeConv) {
              activeConv.calculatorState = { ...state.calculator };
          }
      }
      saveState();
  });

  // --- Calculator Logic ---
  const initialCalculatorStateForReset = { // Used for AC button
      expression: 'Equation will appear here',
      latexExpression: '',
      history: [{ expression: 'Equation will appear here', latexExpression: '' }],
      historyIndex: 0,
      // memory and mode are preserved on AC
      error: null,
  };

  const calculatorButtonConfigs = [
    { label: 'DEG/RAD', value: 'mode', latex: 'mode', type: 'control', action: 'mode-toggle'},
    { label: 'sin', value: 'sin(', latex: '\\sin(', type: 'scientific' },
    { label: 'cos', value: 'cos(', latex: '\\cos(', type: 'scientific' },
    { label: 'tan', value: 'tan(', latex: '\\tan(', type: 'scientific' },
    { label: 'xʸ', value: '^(', latex: '^{', type: 'scientific' },

    { label: 'x', value: 'x', latex: 'x', type: 'variable'},
    { label: 'sin⁻¹', value: 'asin(', latex: '\\sin^{-1}(', type: 'scientific' },
    { label: 'cos⁻¹', value: 'acos(', latex: '\\cos^{-1}(', type: 'scientific' },
    { label: 'tan⁻¹', value: 'atan(', latex: '\\tan^{-1}(', type: 'scientific' },
    { label: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-radical"><path d="M3 12h2l4 8 4-16h2"/></svg>`, value: 'sqrt(', latex: '\\sqrt{', type: 'scientific' },
    
    { label: 'y', value: 'y', latex: 'y', type: 'variable'},
    { label: 'sinh', value: 'sinh(', latex: '\\sinh(', type: 'scientific' },
    { label: 'cosh', value: 'cosh(', latex: '\\cosh(', type: 'scientific' },
    { label: 'tanh', value: 'tanh(', latex: '\\tanh(', type: 'scientific' },
    { label: 'ⁿ√x', value: 'nroot(', latex: '\\sqrt[]{}', type: 'scientific' },
    
    { label: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pi"><line x1="9" x2="9" y1="4" y2="20"/><path d="M4 7c0-1.7 1.3-3 3-3h13"/><path d="M18 20c-1.7 0-3-1.3-3-3V4"/></svg>`, value: 'pi', latex: '\\pi ', type: 'constant' },
    { label: 'ln', value: 'ln(', latex: '\\ln(', type: 'scientific' },
    { label: 'log₁₀', value: 'log(', latex: '\\log_{10}(', type: 'scientific' },
    { label: 'log𝘣', value: 'log_base(', latex: '\\log_{}{}', type: 'scientific' }, 
    { label: '1/x', value: '1/(', latex: '1/(', type: 'scientific' }, 
    
    { label: 'e', value: 'e', latex: 'e ', type: 'constant' },
    { label: 'nPr', value: 'P(', latex: 'P(', type: 'scientific' }, // Placeholder, needs proper math lib
    { label: 'nCr', value: 'C(', latex: 'C(', type: 'scientific' }, // Placeholder, needs proper math lib
    { label: 'x!', value: '!', latex: '!', type: 'scientific' }, // Placeholder, needs proper math lib
    { label: 'eˣ', value: 'e^(', latex: 'e^{', type: 'scientific' },

    { label: 'MR', value: 'MR', latex: 'MR', type: 'memory', action: 'memory-recall' },
    { label: 'MC', value: 'MC', latex: 'MC', type: 'memory', action: 'memory-clear' },
    { label: 'M+', value: 'M+', latex: 'M+', type: 'memory', action: 'memory-add' },
    { label: 'M-', value: 'M-', latex: 'M-', type: 'memory', action: 'memory-subtract' },
    { label: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-percent"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`, value: '%', latex: '\\% ', type: 'operator' }, // Placeholder, needs proper math lib for evaluation

    { label: '7', value: '7', latex: '7', type: 'number' },
    { label: '8', value: '8', latex: '8', type: 'number' },
    { label: '9', value: '9', latex: '9', type: 'number' },
    { label: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-divide"><circle cx="12" cy="6" r="1"/><line x1="5" x2="19" y1="12" y2="12"/><circle cx="12" cy="18" r="1"/></svg>`, value: '/', latex: '\\div ', type: 'operator' },
    { label: '|x|', value: 'abs(', latex: '\\left|', type: 'scientific' }, 

    { label: '4', value: '4', latex: '4', type: 'number' },
    { label: '5', value: '5', latex: '5', type: 'number' },
    { label: '6', value: '6', latex: '6', type: 'number' },
    { label: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`, value: '*', latex: '\\times ', type: 'operator' },
    { label: '(', value: '(', latex: '(', type: 'operator' },

    { label: '1', value: '1', latex: '1', type: 'number' },
    { label: '2', value: '2', latex: '2', type: 'number' },
    { label: '3', value: '3', latex: '3', type: 'number' },
    { label: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus"><line x1="5" x2="19" y1="12" y2="12"/></svg>`, value: '-', latex: '-', type: 'operator' },
    { label: ')', value: ')', latex: ')', type: 'operator' },

    { label: '0', value: '0', latex: '0', type: 'number', span: 2 },
    { label: '.', value: '.', latex: '.', type: 'number' },
    { label: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>`, value: '+', latex: '+', type: 'operator' },
    // Equals removed as evaluation is not part of static version directly in calc grid
  ];

  const createCalculatorButtons = () => {
      calculatorButtonsGrid.innerHTML = ''; 
      calculatorButtonConfigs.forEach(config => {
          const button = document.createElement('button');
          button.innerHTML = config.label;
          button.dataset.value = config.value;
          button.dataset.latex = config.latex;
          button.dataset.type = config.type;
          if (config.action) button.dataset.action = config.action;

          let buttonStyle = "bg-muted/30 hover:bg-muted/50 text-foreground";
          if (config.type === 'scientific' || config.type === 'constant' || config.type === 'variable') buttonStyle = "bg-purple-accent/70 hover:bg-purple-accent/90 text-purple-accent-foreground neon-button-purple-calc";
          else if (config.type === 'memory') buttonStyle = "bg-green-500/70 hover:bg-green-500/90 text-white neon-button-green-calc"; // Direct color for now
          else if (config.type === 'operator' && (config.value === '+' || config.value === '-' || config.value === '*' || config.value === '/')) buttonStyle = "bg-accent/70 hover:bg-accent/90 text-accent-foreground neon-button-accent-sm"; // Style operators
          
          button.className = `h-11 md:h-11 text-sm md:text-base font-medium border-border/50 shadow-sm hover:scale-105 active:scale-95 transition-all duration-100 rounded-md border ${buttonStyle} ${config.span ? `col-span-${config.span}` : 'col-span-1'}`;
          
          button.addEventListener('click', () => handleCalculatorButtonClick(config));
          calculatorButtonsGrid.appendChild(button);
      });
  };
  
  const displayCalcError = (message) => {
      state.calculator.error = message;
      updateCalculatorDisplay(); 
  };

  const handleCalculatorButtonClick = (config) => {
      const { expression, latexExpression, memory, mode } = state.calculator;
      let newExpression = expression === 'Equation will appear here' ? '' : expression;
      let newLatex = latexExpression === '' && newExpression === '' ? '' : latexExpression;


      if (config.action) {
          switch (config.action) {
              case 'mode-toggle':
                  state.calculator.mode = mode === 'DEG' ? 'RAD' : 'DEG';
                  break;
              case 'memory-clear':
                  state.calculator.memory = 0;
                  showToast("Calculator", "Memory Cleared (MC).", "default");
                  break;
              case 'memory-recall':
                  if (newExpression === 'Equation will appear here' || newExpression === '') {
                      newExpression = String(memory);
                      newLatex = String(memory);
                  } else {
                      newExpression += String(memory);
                      newLatex += String(memory);
                  }
                  showToast("Calculator", `Memory Recalled (MR): ${memory}`, "default");
                  break;
              case 'memory-add':
              case 'memory-subtract':
                   showToast("Info", "M+/M- require a valid number in display to operate on memory.", "default");
                  // For M+/M-, they should operate on the evaluated result of current expression.
                  // Since we don't have a safe eval here, we'll make it simpler: if expression is just a number, use it.
                  // This is a simplification. A full math library would be needed for `eval(expression)`.
                  try {
                      const currentVal = parseFloat(newExpression); // Try to parse the current expression
                      if (!isNaN(currentVal)) {
                          state.calculator.memory += (config.action === 'memory-add' ? currentVal : -currentVal);
                          showToast("Calculator", `Memory ${config.action === 'memory-add' ? 'Added To' : 'Subtracted From'}. New M: ${state.calculator.memory}`, "default");
                      } else if (newExpression !== '' && newExpression !== 'Equation will appear here') {
                           displayCalcError("Eval for M+/- Failed"); // Cannot evaluate expression
                      } else {
                          displayCalcError("No Val for M+/-");
                      }
                  } catch (e) {
                       displayCalcError("M+/- Op Error");
                  }
                  break;
              default: 
                  break; 
          }
      } else { 
          if (newExpression === 'Equation will appear here') { // Reset if it's placeholder
              newExpression = '';
              newLatex = '';
          }
          
          if (config.value === 'nroot(') { 
              newLatex += '\\sqrt[]{}'; 
              newExpression += 'n√('; // User needs to fill parts
          } else if (config.value === 'log_base(') { 
              newLatex += '\\log_{}{}';
              newExpression += 'log_base('; // User needs to fill parts
          } else if (config.value === 'abs(') { 
               newLatex += '\\left| '; 
               newExpression += 'abs(';
          } else if (config.value === '1/(') { // For 1/x
              newLatex += '1/(';
              newExpression += '1/(';
          }
          else {
              newExpression += config.value;
              newLatex += config.latex;
          }
      }
      
      state.calculator.expression = newExpression === '' ? 'Equation will appear here' : newExpression;
      state.calculator.latexExpression = newLatex;
      updateCalculatorDisplay();
  };

  calcAC?.addEventListener('click', () => {
      const currentMemory = state.calculator.memory;
      const currentMode = state.calculator.mode;
      state.calculator = { ...initialCalculatorStateForReset, memory: currentMemory, mode: currentMode };
      updateCalculatorDisplay();
  });
  calcC?.addEventListener('click', () => {
      state.calculator.expression = 'Equation will appear here';
      state.calculator.latexExpression = '';
      state.calculator.error = null;
      updateCalculatorDisplay();
  });
  calcDel?.addEventListener('click', () => {
      if (state.calculator.expression !== 'Equation will appear here' && state.calculator.expression.length > 0) {
          state.calculator.expression = state.calculator.expression.slice(0, -1);
          if (state.calculator.expression === "") state.calculator.expression = "Equation will appear here";
          
          // Attempt to smartly remove last latex part. This is tricky.
          // A very naive approach:
          if (state.calculator.latexExpression.length > 0) {
              const endings = ['\\sin(', '\\cos(', '\\tan(', '\\sqrt{', '\\log_{10}(', '\\ln(', '^{', '\\pi ', 'e ', '\\div ', '\\times ', '\\% ', '\\left| '];
              let removed = false;
              for (const ending of endings) {
                  if (state.calculator.latexExpression.endsWith(ending)) {
                      state.calculator.latexExpression = state.calculator.latexExpression.slice(0, -ending.length);
                      removed = true;
                      break;
                  }
              }
              if (!removed && state.calculator.latexExpression.endsWith(' ')) { // Remove trailing space if any
                   state.calculator.latexExpression = state.calculator.latexExpression.slice(0, -1);
              }
               if (!removed && state.calculator.latexExpression.length > 0 && !state.calculator.latexExpression.endsWith(' ')) { // Fallback to single char if not a known command and no trailing space
                  state.calculator.latexExpression = state.calculator.latexExpression.slice(0, -1);
              }

          }
           if (state.calculator.latexExpression.trim() === "" && state.calculator.expression !== 'Equation will appear here') {
               // If latex becomes empty, one might try to re-derive it, but that's complex.
               // For now, if expression has content, leave latex empty or user can C/AC.
           }
      }
      updateCalculatorDisplay();
  });
  calcConfirm?.addEventListener('click', () => {
      const openParenCount = (state.calculator.expression.match(/\(/g) || []).length;
      const closeParenCount = (state.calculator.expression.match(/\)/g) || []).length;
      
      const openBraceLatex = (state.calculator.latexExpression.match(/\{/g) || []).length;
      const closeBraceLatex = (state.calculator.latexExpression.match(/\}/g) || []).length;

      const openAbsLatex = (state.calculator.latexExpression.match(/\\left\|/g) || []).length;
      const closeAbsLatex = (state.calculator.latexExpression.match(/\\right\|/g) || []).length;


      if (openParenCount !== closeParenCount) {
          displayCalcError("Unmatched Parentheses ()");
          return;
      }
      if (openBraceLatex !== closeBraceLatex) {
          displayCalcError("Unmatched Braces {} in LaTeX");
          return;
      }
       if (openAbsLatex !== closeAbsLatex && state.calculator.latexExpression.includes('\\left|') ) { // Only error if \left| was used
          displayCalcError("Unmatched Absolute Bars | in LaTeX");
          return;
      }


      if (state.calculator.latexExpression.trim() && state.calculator.expression !== 'Equation will appear here') {
          const currentChatInput = chatInput.value;
          let latexToInsert = state.calculator.latexExpression;
          // Ensure abs has a closing part if only left was added
          if (openAbsLatex > closeAbsLatex && state.calculator.latexExpression.includes('\\left|') && !state.calculator.latexExpression.endsWith('\\right| ')) {
              latexToInsert += '\\right| ';
          }

          chatInput.value = `${currentChatInput}\\(${latexToInsert.trim()}\\) `;
          state.chatInputDraft = chatInput.value; 
          
          // Optionally close calculator panel
          // state.isCalculatorOpen = false; 
          // updateCalculatorUI();

          chatInput.focus();
          adjustTextareaHeight(chatInput);
      } else if (state.calculator.expression.trim() && state.calculator.expression !== 'Equation will appear here' && !state.calculator.latexExpression.trim()) {
          // If only plain expression exists, insert that (not as LaTeX)
           const currentChatInput = chatInput.value;
           chatInput.value = `${currentChatInput}${state.calculator.expression} `;
           state.chatInputDraft = chatInput.value;
           chatInput.focus();
           adjustTextareaHeight(chatInput);
      }
      else {
          displayCalcError("Empty Expression");
      }
  });
  calcModeToggle?.addEventListener('click', () => {
       state.calculator.mode = state.calculator.mode === 'DEG' ? 'RAD' : 'DEG';
       updateCalculatorDisplay();
  });


  // --- Initialization ---
  loadState(); 
  updateSidebarUI();
  updateCalculatorUI();
  createCalculatorButtons(); 
  adjustTextareaHeight(chatInput); 

});

