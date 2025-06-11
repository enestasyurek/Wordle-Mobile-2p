import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NetworkManager {
  constructor() {
    this.isOnline = true;
    this.listeners = new Set();
    this.unsubscribe = null;
    this.queuedActions = [];
    this.retryTimeouts = new Map();
  }

  async init() {
    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.handleNetworkChange(state);
    });

    // Get initial state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected && state.isInternetReachable;
  }

  handleNetworkChange(state) {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected && state.isInternetReachable;

    if (!wasOnline && this.isOnline) {
      // Network restored - process queued actions
      this.processQueuedActions();
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      listener(this.isOnline, state);
    });
  }

  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async queueAction(action, retryOptions = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      saveToStorage = true,
    } = retryOptions;

    const queuedAction = {
      id: Date.now() + Math.random(),
      action,
      retries: 0,
      maxRetries,
      retryDelay,
      exponentialBackoff,
      timestamp: Date.now(),
    };

    if (this.isOnline) {
      // Try to execute immediately
      return this.executeAction(queuedAction);
    } else {
      // Queue for later
      this.queuedActions.push(queuedAction);
      
      if (saveToStorage) {
        await this.saveQueueToStorage();
      }
      
      return { success: false, queued: true, id: queuedAction.id };
    }
  }

  async executeAction(queuedAction) {
    try {
      const result = await queuedAction.action();
      this.removeFromQueue(queuedAction.id);
      return { success: true, result };
    } catch (error) {
      if (queuedAction.retries < queuedAction.maxRetries) {
        queuedAction.retries++;
        
        // Calculate retry delay
        const delay = queuedAction.exponentialBackoff
          ? queuedAction.retryDelay * Math.pow(2, queuedAction.retries - 1)
          : queuedAction.retryDelay;
        
        // Schedule retry
        const timeoutId = setTimeout(() => {
          this.executeAction(queuedAction);
        }, delay);
        
        this.retryTimeouts.set(queuedAction.id, timeoutId);
        
        return { success: false, retrying: true, retriesLeft: queuedAction.maxRetries - queuedAction.retries };
      } else {
        // Max retries reached
        this.removeFromQueue(queuedAction.id);
        return { success: false, error, maxRetriesReached: true };
      }
    }
  }

  async processQueuedActions() {
    const actions = [...this.queuedActions];
    this.queuedActions = [];
    
    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  removeFromQueue(actionId) {
    this.queuedActions = this.queuedActions.filter(a => a.id !== actionId);
    
    // Clear retry timeout if exists
    const timeoutId = this.retryTimeouts.get(actionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryTimeouts.delete(actionId);
    }
  }

  async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem(
        'networkQueue',
        JSON.stringify(this.queuedActions.map(a => ({
          ...a,
          action: a.action.toString(), // Save function as string
        })))
      );
    } catch (error) {
      console.error('Failed to save network queue:', error);
    }
  }

  async loadQueueFromStorage() {
    try {
      const saved = await AsyncStorage.getItem('networkQueue');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Note: In a real app, you'd need to reconstruct the actions
        // This is a simplified version
        console.log('Loaded queued actions from storage:', parsed.length);
      }
    } catch (error) {
      console.error('Failed to load network queue:', error);
    }
  }

  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      queuedActions: this.queuedActions.length,
    };
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.retryTimeouts.clear();
    
    this.listeners.clear();
    this.queuedActions = [];
  }
}

export default new NetworkManager();