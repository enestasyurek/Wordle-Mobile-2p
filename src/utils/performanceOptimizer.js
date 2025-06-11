import { InteractionManager, FlatList, View, Image } from 'react-native';
import React from 'react';
import { COLORS } from './colors';

// Memoization helper for expensive computations
export const memoize = (fn) => {
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory issues
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

// Debounce helper for reducing function calls
export const debounce = (fn, delay = 300) => {
  let timeoutId = null;
  
  return (...args) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

// Throttle helper for limiting function execution rate
export const throttle = (fn, limit = 300) => {
  let inThrottle = false;
  let lastArgs = null;
  
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
};

// Batch updates for better performance
export const batchUpdates = (updates) => {
  InteractionManager.runAfterInteractions(() => {
    updates.forEach(update => update());
  });
};

// Lazy component loading wrapper
export const LazyComponent = ({ component: Component, fallback, ...props }) => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return fallback || null;
  }

  return <Component {...props} />;
};

// Memory cleanup helper
export const cleanupMemory = () => {
  if (global.gc) {
    global.gc();
  }
};

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderCounts: new Map(),
      renderTimes: new Map(),
      memoryUsage: [],
    };
  }

  startRenderTracking(componentName) {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Update render count
      const currentCount = this.metrics.renderCounts.get(componentName) || 0;
      this.metrics.renderCounts.set(componentName, currentCount + 1);
      
      // Update render times
      const times = this.metrics.renderTimes.get(componentName) || [];
      times.push(renderTime);
      if (times.length > 100) {
        times.shift(); // Keep only last 100 measurements
      }
      this.metrics.renderTimes.set(componentName, times);
    };
  }

  getAverageRenderTime(componentName) {
    const times = this.metrics.renderTimes.get(componentName) || [];
    if (times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  getRenderCount(componentName) {
    return this.metrics.renderCounts.get(componentName) || 0;
  }

  reset() {
    this.metrics.renderCounts.clear();
    this.metrics.renderTimes.clear();
    this.metrics.memoryUsage = [];
  }

  getReport() {
    const report = {
      components: [],
    };

    this.metrics.renderCounts.forEach((count, componentName) => {
      report.components.push({
        name: componentName,
        renderCount: count,
        averageRenderTime: this.getAverageRenderTime(componentName),
      });
    });

    return report;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React.memo with custom comparison
export const optimizedMemo = (Component, areEqual) => {
  return React.memo(Component, areEqual || ((prevProps, nextProps) => {
    // Shallow comparison with ignored functions
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    
    for (const key of prevKeys) {
      if (typeof prevProps[key] === 'function' && typeof nextProps[key] === 'function') {
        continue; // Skip function comparison
      }
      
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    
    return true;
  }));
};

// Optimize heavy list rendering
export const OptimizedList = React.memo(({ 
  data, 
  renderItem, 
  keyExtractor,
  initialNumToRender = 10,
  maxToRenderPerBatch = 5,
  windowSize = 10,
  ...props 
}) => {
  const [visibleData, setVisibleData] = React.useState([]);
  const [loadedCount, setLoadedCount] = React.useState(initialNumToRender);

  React.useEffect(() => {
    setVisibleData(data.slice(0, loadedCount));
  }, [data, loadedCount]);

  React.useEffect(() => {
    if (loadedCount < data.length) {
      const timer = setTimeout(() => {
        setLoadedCount(prev => Math.min(prev + maxToRenderPerBatch, data.length));
      }, 16); // Next frame

      return () => clearTimeout(timer);
    }
  }, [loadedCount, data.length, maxToRenderPerBatch]);

  return (
    <FlatList
      {...props}
      data={visibleData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      initialNumToRender={initialNumToRender}
      getItemLayout={(data, index) => ({
        length: props.itemHeight || 50,
        offset: (props.itemHeight || 50) * index,
        index,
      })}
    />
  );
});

// Image optimization wrapper
export const OptimizedImage = React.memo(({ source, style, ...props }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  return (
    <View style={style}>
      {!isLoaded && !error && (
        <View style={[style, { backgroundColor: COLORS.border.default }]} />
      )}
      <Image
        {...props}
        source={source}
        style={[style, { opacity: isLoaded ? 1 : 0 }]}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
      />
    </View>
  );
});

export default {
  memoize,
  debounce,
  throttle,
  batchUpdates,
  LazyComponent,
  cleanupMemory,
  performanceMonitor,
  optimizedMemo,
  OptimizedList,
  OptimizedImage,
};