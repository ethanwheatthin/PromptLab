// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const ollamaUrlInput = document.getElementById('ollama-url');
    const connectBtn = document.getElementById('connect-btn');
    const modelsContainer = document.getElementById('models-container');
    const modelSelect = document.getElementById('model-select');
    const openAppBtn = document.getElementById('open-app-btn');
    
    // Check connection status on popup open
    chrome.runtime.sendMessage({ action: 'checkConnection' }, (response) => {
      updateConnectionUI(response);
    });
    
    // Connect button handler
    connectBtn.addEventListener('click', () => {
        console.log("CLICK EVENT!")
      const url = ollamaUrlInput.value.trim();
      console.log("🚀 ~ connectBtn.addEventListener ~ url:", url)
      if (url != null) {
        statusText.textContent = 'Connecting to Ollama...';
        statusIndicator.className = 'status-indicator connecting';
        
        chrome.runtime.sendMessage(
          { action: 'updateConnectionUrl', url }, 
          (response) => {
            updateConnectionUI(response);
          }
        );
      }
    });
    
    // Model selection handler
    modelSelect.addEventListener('change', () => {
      const selectedModel = modelSelect.value;
      chrome.runtime.sendMessage(
        { action: 'selectModel', model: selectedModel }
      );
    });
    
    // Open app button handler
    openAppBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('app/index.html') });
    });
    
    // Update UI based on connection state
    function updateConnectionUI(state) {
      if (state.connected) {
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = 'Connected to Ollama';
        ollamaUrlInput.value = state.baseUrl;
        openAppBtn.disabled = false;
        
        // Populate models dropdown
        modelsContainer.style.display = 'block';
        modelSelect.innerHTML = '';
        
        if (state.availableModels.length > 0) {
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
          const option = document.createElement('option');
          option.textContent = 'No models available';
          modelSelect.appendChild(option);
          openAppBtn.disabled = true;
        }
      } else {
        statusIndicator.className = 'status-indicator disconnected';
        statusText.textContent = 'Not connected to Ollama';
        openAppBtn.disabled = true;
        modelsContainer.style.display = 'none';
      }
    }
  });