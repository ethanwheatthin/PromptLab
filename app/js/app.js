// app.js - Main application logic
import ollamaAPI from './api.js';
import promptManager from './prompt.js';

document.addEventListener('DOMContentLoaded', async function() {
  // UI Elements
  const connectionStatus = document.getElementById('connection-status');
  const statusText = document.getElementById('status-text');
  const modelSelect = document.getElementById('model-select');
  const templateList = document.getElementById('template-list');
  const savedPromptsList = document.getElementById('saved-prompts');
  const newPromptBtn = document.getElementById('new-prompt-btn');
  const promptTitle = document.getElementById('prompt-title');
  const systemPrompt = document.getElementById('system-prompt');
  const userPrompt = document.getElementById('user-prompt');
  const savePromptBtn = document.getElementById('save-prompt-btn');
  const runPromptBtn = document.getElementById('run-prompt-btn');
  const responseContent = document.getElementById('response-content');
  const generationTime = document.getElementById('generation-time');
  const tokenCount = document.getElementById('token-count');
  
  // Parameter elements
  const temperatureSlider = document.getElementById('temperature');
  const temperatureValue = document.getElementById('temperature-value');
  const topPSlider = document.getElementById('top-p');
  const topPValue = document.getElementById('top-p-value');
  const maxTokensInput = document.getElementById('max-tokens');
  
  // Tab navigation
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  
  // Current working prompt
  let currentPrompt = {
    id: null,
    title: 'Untitled Prompt',
    systemPrompt: '',
    userPrompt: '',
    parameters: {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2048
    }
  };
  
  // Initialize the application
  async function init() {
    await checkConnection();
    await loadModels();
    loadTemplates();
    await loadSavedPrompts();
    setupEventListeners();
  }
  
  // Check connection to Ollama
  async function checkConnection() {
    chrome.runtime.sendMessage({ action: 'checkConnection' }, (response) => {
      updateConnectionUI(response);
    });
  }
  
  // Update UI based on connection state
  function updateConnectionUI(state) {
    if (state.connected) {
      connectionStatus.className = 'status-pill connected';
      statusText.textContent = 'Connected to Ollama';
      runPromptBtn.disabled = false;
    } else {
      connectionStatus.className = 'status-pill disconnected';
      statusText.textContent = 'Not connected to Ollama';
      runPromptBtn.disabled = true;
    }
  }
  
  // Load available models
  async function loadModels() {
    chrome.storage.local.get('connectionState', (data) => {
      const state = data.connectionState || {};
      
      if (state.connected && state.availableModels) {
        modelSelect.innerHTML = '';
        
        state.availableModels.forEach(model => {
          const option = document.createElement('option');
          option.value = model.name;
          option.textContent = model.name;
          if (model.name === state.selectedModel) {
            option.selected = true;
          }
          modelSelect.appendChild(option);
        });
      } else {
        modelSelect.innerHTML = '<option value="">No models available</option>';
      }
    });
  }
  
  // Load prompt templates
  function loadTemplates() {
    const categories = promptManager.getTemplateCategories();
    templateList.innerHTML = '';
    
    categories.forEach(category => {
      const templates = promptManager.getTemplatesByCategory(category);
      
      const categoryElement = document.createElement('li');
      categoryElement.className = 'template-category';
      categoryElement.innerHTML = `
        <div class="category-header">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
        <ul class="category-templates"></ul>
      `;
      
      const templatesList = categoryElement.querySelector('.category-templates');
      
      templates.forEach(template => {
        const templateElement = document.createElement('li');
        templateElement.className = 'template-item';
        templateElement.dataset.templateId = template.id;
        templateElement.textContent = template.name;
        templateElement.title = template.description;
        
        templateElement.addEventListener('click', () => {
          loadTemplate(template.id);
        });
        
        templatesList.appendChild(templateElement);
      });
      
      templateList.appendChild(categoryElement);
    });
  }
  
  // Load saved prompts
  async function loadSavedPrompts() {
    await promptManager.loadSavedPrompts();
    savedPromptsList.innerHTML = '';
    
    if (promptManager.savedPrompts.length === 0) {
      savedPromptsList.innerHTML = '<li class="empty">No saved prompts</li>';
      return;
    }
    
    promptManager.savedPrompts.forEach(prompt => {
      const promptElement = document.createElement('li');
      promptElement.className = 'saved-prompt-item';
      promptElement.dataset.promptId = prompt.id;
      promptElement.textContent = prompt.title || 'Untitled Prompt';
      
      promptElement.addEventListener('click', () => {
        loadSavedPrompt(prompt.id);
      });
      
      savedPromptsList.appendChild(promptElement);
    });
  }
  
  // Load a template into the editor
  function loadTemplate(templateId) {
    const template = promptManager.getTemplateById(templateId);
    if (template) {
      currentPrompt = {
        id: null, // New prompt based on template
        title: `New Prompt from ${template.name}`,
        systemPrompt: template.systemPrompt || '',
        userPrompt: template.userPrompt || '',
        parameters: { ...template.parameters }
      };
      
      updateEditorUI();
    }
  }
  
  // Load a saved prompt into the editor
  function loadSavedPrompt(promptId) {
    const prompt = promptManager.savedPrompts.find(p => p.id === promptId);
    if (prompt) {
      currentPrompt = { ...prompt };
      updateEditorUI();
    }
  }
  
  // Update editor UI with current prompt data
  function updateEditorUI() {
    promptTitle.value = currentPrompt.title || 'Untitled Prompt';
    systemPrompt.value = currentPrompt.systemPrompt || '';
    userPrompt.value = currentPrompt.userPrompt || '';
    
    // Update parameters
    temperatureSlider.value = currentPrompt.parameters.temperature;
    temperatureValue.textContent = currentPrompt.parameters.temperature;
    
    topPSlider.value = currentPrompt.parameters.top_p;
    topPValue.textContent = currentPrompt.parameters.top_p;
    
    maxTokensInput.value = currentPrompt.parameters.max_tokens;
  }
  
  // Save current prompt
  async function saveCurrentPrompt() {
    const prompt = {
      ...currentPrompt,
      title: promptTitle.value || 'Untitled Prompt',
      systemPrompt: systemPrompt.value,
      userPrompt: userPrompt.value,
      parameters: {
        temperature: parseFloat(temperatureSlider.value),
        top_p: parseFloat(topPSlider.value),
        max_tokens: parseInt(maxTokensInput.value)
      }
    };
    
    const savedPrompt = await promptManager.savePrompt(prompt);
    currentPrompt = savedPrompt;
    
    // Refresh saved prompts list
    loadSavedPrompts();
    
    return savedPrompt;
  }
  

  // Run the current prompt
  async function runPrompt() {
    // Get the selected model
    const model = modelSelect.value;
    if (!model) {
      showError('Please select a model first');
      return;
    }
    
    // Update current prompt from UI
    currentPrompt.systemPrompt = systemPrompt.value;
    currentPrompt.userPrompt = userPrompt.value;
    currentPrompt.parameters.temperature = parseFloat(temperatureSlider.value);
    currentPrompt.parameters.top_p = parseFloat(topPSlider.value);
    currentPrompt.parameters.max_tokens = parseInt(maxTokensInput.value);
    
    // Show loading state
    runPromptBtn.disabled = true;
    responseContent.innerHTML = '<p class="loading">Generating response...</p>';
    generationTime.textContent = '-';
    tokenCount.textContent = '-';
    
    try {
      const startTime = Date.now();
      
      // Prepare request parameters for chat API
      const requestParams = {
        model: model,
        messages: [
          {
            role: 'system',
            content: currentPrompt.systemPrompt
          },
          {
            role: 'user',
            content: currentPrompt.userPrompt
          }
        ],
        options: {
          temperature: currentPrompt.parameters.temperature,
          top_p: currentPrompt.parameters.top_p,
          max_tokens: currentPrompt.parameters.max_tokens
        }
      };
      
      // Call Ollama API
      const response = await ollamaAPI.chatCompletion(requestParams);
      const endTime = Date.now();
      
      // Display response
      if (response.message && response.message.content) {
        // Format and display the response
        responseContent.innerHTML = formatResponse(response.message.content);
        
        // Update metadata
        generationTime.textContent = `${((endTime - startTime) / 1000).toFixed(2)}s`;
        
        if (response.eval_count) {
          tokenCount.textContent = response.eval_count;
        }
      } else {
        throw new Error('Invalid response from Ollama');
      }
    } catch (error) {
      showError(`Error: ${error.message}`);
    } finally {
      runPromptBtn.disabled = false;
    }
  }
  
  // Format the response for display
  function formatResponse(text) {
    // Simple markdown-like formatting
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  
  // Show error message
  function showError(message) {
    responseContent.innerHTML = `<p class="error">${message}</p>`;
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Model selection
    modelSelect.addEventListener('change', (e) => {
      chrome.runtime.sendMessage({
        action: 'selectModel',
        model: e.target.value
      });
    });
    
    // New prompt button
    newPromptBtn.addEventListener('click', () => {
      currentPrompt = {
        id: null,
        title: 'Untitled Prompt',
        systemPrompt: '',
        userPrompt: '',
        parameters: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048
        }
      };
      updateEditorUI();
    });
    
    // Save prompt button
    savePromptBtn.addEventListener('click', saveCurrentPrompt);
    
    // Run prompt button
    runPromptBtn.addEventListener('click', runPrompt);
    
    // Tab navigation
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show active panel
        panels.forEach(panel => {
          panel.classList.remove('active');
          if (panel.id === `${tabName}-panel`) {
            panel.classList.add('active');
          }
        });
      });
    });
    
    // Parameter sliders
    temperatureSlider.addEventListener('input', (e) => {
      temperatureValue.textContent = e.target.value;
    });
    
    topPSlider.addEventListener('input', (e) => {
      topPValue.textContent = e.target.value;
    });
  }
  
  // Initialize the app
  init();
});