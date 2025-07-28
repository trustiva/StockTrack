import { performance } from 'perf_hooks';
import type { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: Date;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxMetrics = 1000; // Keep last 1000 metrics
  private defaultCacheTTL = 5 * 60 * 1000; // 5 minutes

  // Middleware to track API performance
  createPerformanceMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Store metrics
        const metric: PerformanceMetrics = {
          endpoint: req.path,
          method: req.method,
          duration,
          timestamp: new Date(),
          statusCode: res.statusCode,
          memoryUsage: process.memoryUsage()
        };

        // Add to metrics array (keep only recent ones)
        if (this.metrics.length >= this.maxMetrics) {
          this.metrics.shift();
        }
        this.metrics.push(metric);

        // Log slow requests
        if (duration > 1000) { // Requests taking more than 1 second
          console.warn(`Slow request detected: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
        }

        originalEnd.call(res, chunk, encoding);
      }.bind(this);

      next();
    };
  }

  // Simple in-memory cache
  setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL
    });
  }

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear cache entries matching pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Cache decorator for expensive operations
  withCache<T>(
    key: string,
    operation: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        // Try to get from cache first
        const cached = this.getCache<T>(key);
        if (cached !== null) {
          resolve(cached);
          return;
        }

        // Execute operation and cache result
        const result = await operation();
        this.setCache(key, result, ttl);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get performance analytics
  getPerformanceAnalytics(): {
    totalRequests: number;
    averageResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number; count: number }>;
    errorRate: number;
    memoryTrend: Array<{ timestamp: Date; memoryUsage: number }>;
    requestsPerMinute: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestEndpoints: [],
        errorRate: 0,
        memoryTrend: [],
        requestsPerMinute: 0
      };
    }

    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    
    // Group by endpoint for analysis
    const endpointStats = new Map<string, { totalTime: number; count: number; errors: number }>();
    
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0, errors: 0 };
      
      existing.totalTime += metric.duration;
      existing.count += 1;
      if (metric.statusCode >= 400) {
        existing.errors += 1;
      }
      
      endpointStats.set(key, existing);
    });

    // Find slowest endpoints
    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Calculate error rate
    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Memory trend (last 50 data points)
    const memoryTrend = this.metrics
      .slice(-50)
      .map(m => ({
        timestamp: m.timestamp,
        memoryUsage: m.memoryUsage.heapUsed / 1024 / 1024 // Convert to MB
      }));

    // Requests per minute (based on last hour of data)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentRequests = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    const requestsPerMinute = recentRequests.length / 60;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      slowestEndpoints,
      errorRate: Math.round(errorRate * 100) / 100,
      memoryTrend,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100
    };
  }

  // Database query optimization helpers
  optimizeQuery(query: string, params?: any[]): { 
    optimizedQuery: string; 
    suggestions: string[] 
  } {
    const suggestions: string[] = [];
    let optimizedQuery = query;

    // Basic query optimization suggestions
    if (query.includes('SELECT *')) {
      suggestions.push('Avoid SELECT * - specify only needed columns');
    }

    if (query.includes('WHERE') && !query.includes('INDEX')) {
      suggestions.push('Consider adding indexes for WHERE clause columns');
    }

    if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
      suggestions.push('Consider adding LIMIT to ORDER BY queries');
    }

    if (query.includes('JOIN') && !query.includes('ON')) {
      suggestions.push('Ensure JOINs have proper ON conditions');
    }

    // Add LIMIT if not present in SELECT queries
    if (query.trim().toUpperCase().startsWith('SELECT') && 
        !query.toUpperCase().includes('LIMIT') && 
        !query.toUpperCase().includes('COUNT')) {
      optimizedQuery += ' LIMIT 100';
      suggestions.push('Added default LIMIT to prevent large result sets');
    }

    return { optimizedQuery, suggestions };
  }

  // Frontend optimization recommendations
  getFrontendOptimizations(): {
    recommendations: string[];
    cacheStrategies: string[];
    performanceTips: string[];
  } {
    return {
      recommendations: [
        'Implement lazy loading for images and components',
        'Use React.memo for expensive components',
        'Optimize bundle size with code splitting',
        'Implement proper error boundaries',
        'Use service workers for caching',
        'Optimize images with WebP format',
        'Minimize and compress CSS/JS assets',
        'Use CDN for static assets'
      ],
      cacheStrategies: [
        'Cache API responses with React Query',
        'Implement browser caching headers',
        'Use localStorage for user preferences',
        'Cache static assets with service workers',
        'Implement stale-while-revalidate pattern'
      ],
      performanceTips: [
        'Monitor Core Web Vitals (LCP, FID, CLS)',
        'Use React DevTools Profiler',
        'Implement performance budgets',
        'Monitor bundle size with webpack-bundle-analyzer',
        'Use Lighthouse for performance audits',
        'Implement proper loading states',
        'Optimize database queries',
        'Use proper HTTP status codes'
      ]
    };
  }

  // Health check endpoint data
  getHealthCheck(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cacheSize: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const analytics = this.getPerformanceAnalytics();
    const memoryUsage = process.memoryUsage();
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    // Determine health status based on metrics
    if (analytics.errorRate > 10 || analytics.averageResponseTime > 2000) {
      status = 'critical';
    } else if (analytics.errorRate > 5 || analytics.averageResponseTime > 1000) {
      status = 'warning';
    }

    return {
      status,
      uptime: process.uptime(),
      memoryUsage,
      cacheSize: this.cache.size,
      averageResponseTime: analytics.averageResponseTime,
      errorRate: analytics.errorRate
    };
  }

  // Cleanup old metrics and cache entries
  cleanup(): void {
    // Remove old metrics (keep only last 1000)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Remove expired cache entries
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    console.log(`Cleanup completed. Metrics: ${this.metrics.length}, Cache entries: ${this.cache.size}`);
  }

  // Start periodic cleanup
  startPeriodicCleanup(intervalMs: number = 5 * 60 * 1000): void {
    setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }
}

export const performanceOptimizer = new PerformanceOptimizer();