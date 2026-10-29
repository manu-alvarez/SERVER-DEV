export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface Span {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  status: 'ok' | 'error';
  attributes?: Record<string, unknown>;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private logs: LogEntry[] = [];
  private spans: Map<string, Span> = new Map();

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  log(level: LogEntry['level'], message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({
      level,
      message,
      metadata,
      timestamp: new Date(),
    });
  }

  startSpan(name: string, attributes?: Record<string, unknown>): Span {
    const span: Span = {
      id: Math.random().toString(36).substring(2),
      name,
      startTime: new Date(),
      status: 'ok',
      attributes,
    };
    this.spans.set(span.id, span);
    return span;
  }

  endSpan(spanId: string, status: Span['status'] = 'ok'): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = new Date();
      span.status = status;
    }
  }

  getMetrics(name?: string, since?: Date): Metric[] {
    let results = this.metrics;
    if (name) results = results.filter(m => m.name === name);
    if (since) results = results.filter(m => m.timestamp >= since);
    return results;
  }

  getLogs(level?: LogEntry['level'], since?: Date): LogEntry[] {
    let results = this.logs;
    if (level) results = results.filter(l => l.level === level);
    if (since) results = results.filter(l => l.timestamp >= since);
    return results;
  }

  getSpans(completedOnly: boolean = false): Span[] {
    let results = Array.from(this.spans.values());
    if (completedOnly) results = results.filter(s => s.endTime);
    return results;
  }

  stats(): {
    totalMetrics: number;
    totalLogs: number;
    totalSpans: number;
    errorRate: number;
    avgSpanDuration: number;
  } {
    const spans = Array.from(this.spans.values());
    const completedSpans = spans.filter(s => s.endTime);
    const errorSpans = spans.filter(s => s.status === 'error');

    const avgDuration = completedSpans.length > 0
      ? completedSpans.reduce((sum, s) => sum + (s.endTime!.getTime() - s.startTime.getTime()), 0) / completedSpans.length
      : 0;

    return {
      totalMetrics: this.metrics.length,
      totalLogs: this.logs.length,
      totalSpans: spans.length,
      errorRate: spans.length > 0 ? errorSpans.length / spans.length : 0,
      avgSpanDuration: avgDuration,
    };
  }

  clear(): void {
    this.metrics = [];
    this.logs = [];
    this.spans.clear();
  }
}

export const collector = new MetricsCollector();
