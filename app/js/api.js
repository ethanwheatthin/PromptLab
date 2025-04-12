// api.js - Ollama API client

class OllamaAPI {
    constructor(baseUrl = 'http://localhost:11434') {
      this.baseUrl = baseUrl;
      this.connected = false;
    }
  
    // Test connection to Ollama
    async testConnection() {
      try {
        const response = await fetch(`${this.baseUrl}/api/tags`);
        if (response.ok) {
          this.connected = true;
          return { success: true, message: 'Connected to Ollama' };
        } else {
          this.connected = false;
          return { 
            success: false, 
            message: `Failed to connect: ${response.statusText}`
          };
        }
      } catch (error) {
        this.connected = false;
        return { 
          success: false, 
          message: `Error connecting to Ollama: ${error.message}`
        };
      }
    }
  
    // List available models
    async getModels() {
      try {
        const response = await fetch(`${this.baseUrl}/api/tags`);
        if (!response.ok) {
          throw new Error(`Failed to get models: ${response.statusText}`);
        }
        const data = await response.json();
        return data.models || [];
      } catch (error) {
        console.error('Error fetching models:', error);
        throw error;
      }
    }
  
    // Get model details
    async getModelInfo(modelName) {
      try {
        const response = await fetch(`${this.baseUrl}/api/show`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: modelName })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get model info: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Error fetching info for model ${modelName}:`, error);
        throw error;
      }
    }
  
    // Generate completion
    async generateCompletion(params) {
      try {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) {
          throw new Error(`Generation failed: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error generating completion:', error);
        throw error;
      }
    }
    
    // Chat completion
    async chatCompletion(params) {
      // Add stream: false if not already specified
      if (params && !params.hasOwnProperty('stream')) {
        params.stream = false;
      }
      console.log("🚀 ~ OllamaAPI ~ chatCompletion ~ params:", params)
      
      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'chrome-extension://' + chrome.runtime.id
          },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) {
          throw new Error(`Chat completion failed: ${response.statusText}`);
        }
        
        // Add error handling for JSON parsing
        try {
          const results = await response.json();
          return results;
        } catch (error) {
          console.error('JSON parsing error:', error);
          
          // Optional: log the actual response text for debugging
          const responseText = await response.text();
          console.log('Raw response:', responseText);
          
          throw new Error('Invalid JSON response from server');
        }
      } catch (error) {
        console.error('Error in chat completion:', error);
        throw error;
      }
    }
  }
  
  // Export singleton instance
  const ollamaAPI = new OllamaAPI();
  export default ollamaAPI;