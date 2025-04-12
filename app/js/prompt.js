// prompts.js - Prompt template management

// Basic prompt templates
const DEFAULT_TEMPLATES = {
    basic: [
      {
        id: 'basic-completion',
        name: 'Basic Completion',
        description: 'Simple completion prompt',
        systemPrompt: 'You are a helpful AI assistant that provides accurate and concise information.',
        userPrompt: '[Insert your query here]',
        parameters: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048
        }
      },
      {
        id: 'step-by-step',
        name: 'Step-by-Step Reasoning',
        description: 'Encourages step-by-step thinking',
        systemPrompt: 'You are a helpful AI assistant that solves problems step-by-step, explaining your reasoning clearly at each stage.',
        userPrompt: 'Solve the following problem, showing your step-by-step reasoning:\n\n[Insert problem here]',
        parameters: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 2048
        }
      }
    ],
    
    advanced: [
      {
        id: 'few-shot-learning',
        name: 'Few-Shot Learning',
        description: 'Demonstrates examples before asking for a similar response',
        systemPrompt: 'You are a helpful AI assistant that learns from examples.',
        userPrompt: 'Here are some examples:\n\nExample 1: [Input]\n[Output]\n\nExample 2: [Input]\n[Output]\n\nNow, please respond in the same style for:\n[Your Input]',
        parameters: {
          temperature: 0.5,
          top_p: 0.9,
          max_tokens: 2048
        }
      },
      {
        id: 'chain-of-thought',
        name: 'Chain of Thought',
        description: 'Uses chain-of-thought prompting to solve complex problems',
        systemPrompt: 'You are a helpful AI assistant that thinks through problems carefully. For each step, explain your reasoning before moving to the next step.',
        userPrompt: 'Problem: [Insert complex problem here]\n\nThink through this step-by-step:',
        parameters: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 2048
        }
      }
    ]
  };
  
  class PromptManager {
    constructor() {
      this.templates = DEFAULT_TEMPLATES;
      this.savedPrompts = [];
      this.loadSavedPrompts();
    }
    
    // Get all template categories
    getTemplateCategories() {
      return Object.keys(this.templates);
    }
    
    // Get templates by category
    getTemplatesByCategory(category) {
      return this.templates[category] || [];
    }
    
    // Get all templates
    getAllTemplates() {
      let allTemplates = [];
      for (const category in this.templates) {
        allTemplates = allTemplates.concat(this.templates[category]);
      }
      return allTemplates;
    }
    
    // Get template by ID
    getTemplateById(id) {
      for (const category in this.templates) {
        const template = this.templates[category].find(t => t.id === id);
        if (template) {
          return template;
        }
      }
      return null;
    }
    
    // Load saved prompts from storage
    async loadSavedPrompts() {
      return new Promise((resolve) => {
        chrome.storage.local.get('savedPrompts', (data) => {
          this.savedPrompts = data.savedPrompts || [];
          resolve(this.savedPrompts);
        });
      });
    }
    
    // Save a prompt
    async savePrompt(prompt) {
      // Generate ID if it doesn't exist
      if (!prompt.id) {
        prompt.id = 'prompt_' + Date.now();
        prompt.created = new Date().toISOString();
      }
      
      prompt.updated = new Date().toISOString();
      
      // Check if prompt already exists
      const existingIndex = this.savedPrompts.findIndex(p => p.id === prompt.id);
      
      if (existingIndex >= 0) {
        this.savedPrompts[existingIndex] = prompt;
      } else {
        this.savedPrompts.push(prompt);
      }
      
      // Save to storage
      await chrome.storage.local.set({ savedPrompts: this.savedPrompts });
      return prompt;
    }
    
    // Delete a saved prompt
    async deletePrompt(id) {
      this.savedPrompts = this.savedPrompts.filter(p => p.id !== id);
      await chrome.storage.local.set({ savedPrompts: this.savedPrompts });
    }
  }
  
  // Export singleton instance
  const promptManager = new PromptManager();
  export default promptManager;