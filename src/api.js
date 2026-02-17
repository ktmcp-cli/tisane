import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.tisane.ai';

function getClient() {
  const apiKey = getConfig('apiKey');
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401) throw new Error('Authentication failed. Check your API key.');
    if (status === 403) throw new Error('Access forbidden. Check your subscription.');
    if (status === 404) throw new Error('Resource not found.');
    if (status === 429) throw new Error('Rate limit exceeded. Please wait before retrying.');
    const message = data?.message || data?.error || JSON.stringify(data);
    throw new Error(`API Error (${status}): ${message}`);
  } else if (error.request) {
    throw new Error('No response from Tisane API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ============================================================
// TEXT ANALYSIS
// ============================================================

export async function parse({ text, language = 'en', settings = {} } = {}) {
  const client = getClient();
  try {
    const body = {
      content: text,
      language,
      settings
    };
    const response = await client.post('/parse', body);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function detect({ text } = {}) {
  const client = getClient();
  try {
    const response = await client.post('/detect', { content: text });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// CONTENT MODERATION
// ============================================================

export async function moderate({ text, language = 'en' } = {}) {
  const client = getClient();
  try {
    const body = {
      content: text,
      language,
      settings: {
        snippets: true
      }
    };
    const response = await client.post('/parse', body);
    // Extract moderation-relevant fields
    const result = response.data;
    return {
      abuse: result.abuse || [],
      bigotry: result.bigotry || [],
      sentiment: result.sentiment || null,
      entities: result.entities || []
    };
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// SENTIMENT ANALYSIS
// ============================================================

export async function analyzeSentiment({ text, language = 'en' } = {}) {
  const client = getClient();
  try {
    const body = {
      content: text,
      language,
      settings: { snippets: true }
    };
    const response = await client.post('/parse', body);
    return {
      sentiment: response.data.sentiment || null,
      topics: response.data.topics || [],
      entities: response.data.entities || []
    };
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// ENTITY EXTRACTION
// ============================================================

export async function extractEntities({ text, language = 'en' } = {}) {
  const client = getClient();
  try {
    const body = {
      content: text,
      language,
      settings: { snippets: true }
    };
    const response = await client.post('/parse', body);
    return response.data.entities || [];
  } catch (error) {
    handleApiError(error);
  }
}

export async function extractTopics({ text, language = 'en' } = {}) {
  const client = getClient();
  try {
    const body = {
      content: text,
      language,
      settings: { snippets: true }
    };
    const response = await client.post('/parse', body);
    return response.data.topics || [];
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// TRANSFORM (grammar correction, etc.)
// ============================================================

export async function transform({ text, language = 'en', transformationType = 'spelling_and_grammar' } = {}) {
  const client = getClient();
  try {
    const body = {
      content: text,
      language,
      transformationType
    };
    const response = await client.post('/transform', body);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}
