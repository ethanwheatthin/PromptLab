// background.js - Background service worker

// Initialize connection state
let connectionState = {
    connected: false,
    baseUrl: 'http://localhost:11434',
    selectedModel: null,
    availableModels: []
  };
  
  // Check Ollama connection on startup
  async function checkOllamaConnection() {
    console.log("🚀 ~ checkOllamaConnection ~ checkOllamaConnection:")
    try {
      const response = await fetch(`${connectionState.baseUrl}/api/tags`);
      if (response.ok) {
        console.log("🚀 ~ checkOllamaConnection ~ response:", response)
        const data = await response.json();
        console.log("🚀 ~ checkOllamaConnection ~ data:", data)
        connectionState.connected = true;
        connectionState.availableModels = data.models || [];
        if (connectionState.availableModels.length > 0) {
          connectionState.selectedModel = connectionState.availableModels[0].name;
        }
      } else {
        connectionState.connected = false;
      }
    } catch (error) {
      console.error('Ollama connection error:', error);
      connectionState.connected = false;
    }
    
    // Store connection state
    chrome.storage.local.set({ connectionState });
  }
  
  // Listen for connection check requests
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkConnection') {
      checkOllamaConnection().then(() => {
        sendResponse(connectionState);
      });
      return true; // Indicate async response
    }
    
    if (message.action === 'updateConnectionUrl') {
      connectionState.baseUrl = message.url;
      checkOllamaConnection().then(() => {
        sendResponse(connectionState);
      });
      return true; // Indicate async response
    }
    
    if (message.action === 'selectModel') {
      connectionState.selectedModel = message.model;
      chrome.storage.local.set({ connectionState });
      sendResponse(connectionState);
    }
  });
  
  // Initial connection check on install
  chrome.runtime.onInstalled.addListener(() => {
    checkOllamaConnection();
  });