import Conf from 'conf';

const config = new Conf({
  projectName: 'tisane-cli',
  schema: {
    apiKey: {
      type: 'string',
      default: ''
    },
    baseUrl: {
      type: 'string',
      default: 'https://api.tisane.ai'
    }
  }
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function getAllConfig() {
  return config.store;
}

export function clearConfig() {
  config.clear();
}

export function isConfigured() {
  const apiKey = config.get('apiKey');
  return !!(apiKey);
}

export default config;
