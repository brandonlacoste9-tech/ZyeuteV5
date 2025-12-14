/**
 * Evaluation Tests for TiGuy Agent
 * 
 * This file demonstrates comprehensive evaluation testing using the
 * evaluation framework for the TiGuy AI agent service.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { TiGuyAgent, type TiGuyInput, type TiGuyResponse } from './tiGuyAgent';
import { EvaluationRunner, assertions, PerformanceMonitor } from '../test/evaluation';
import { globalTracer, traceAsync } from '../test/tracing';

// Initialize performance monitor
const perfMonitor = new PerformanceMonitor();

/**
 * Validators for TiGuy responses
 */
const validators = {
  hasValidStructure: (response: TiGuyResponse | null): boolean => {
    if (!response) return false;
    
    return (
      assertions.isDefined(response.caption) &&
      assertions.isDefined(response.emojis) &&
      assertions.isDefined(response.tags) &&
      assertions.isDefined(response.flagged) &&
      assertions.isDefined(response.reply) &&
      assertions.hasProperties(response, ['caption', 'emojis', 'tags', 'flagged', 'reply'])
    );
  },

  hasValidEmojis: (response: TiGuyResponse | null): boolean => {
    if (!response) return false;
    return (
      Array.isArray(response.emojis) &&
      assertions.hasLength(response.emojis, 3, 5)
    );
  },

  hasValidTags: (response: TiGuyResponse | null): boolean => {
    if (!response) return false;
    return (
      Array.isArray(response.tags) &&
      assertions.hasLength(response.tags, 1, 3)
    );
  },

  hasValidCaption: (response: TiGuyResponse | null): boolean => {
    if (!response) return false;
    return (
      typeof response.caption === 'string' &&
      response.caption.length > 0 &&
      response.caption.length <= 500
    );
  },

  hasValidReply: (response: TiGuyResponse | null): boolean => {
    if (!response) return false;
    return (
      typeof response.reply === 'string' &&
      response.reply.length > 0
    );
  },

  isFlagged: (response: TiGuyResponse | null): boolean => {
    if (!response) return false;
    return typeof response.flagged === 'boolean';
  },
};

describe('TiGuy Agent - Evaluation Tests', () => {
  let evaluationRunner: EvaluationRunner<TiGuyInput, TiGuyResponse | null>;

  beforeAll(() => {
    // Wrap TiGuyAgent with tracing
    const tracedTiGuyAgent = async (input: TiGuyInput) => {
      return traceAsync(
        'TiGuyAgent',
        () => TiGuyAgent(input),
        { intent: input.intent, textLength: input.text.length }
      );
    };

    evaluationRunner = new EvaluationRunner(tracedTiGuyAgent, 'TiGuyAgent');
  });

  describe('Response Structure Validation', () => {
    it('should return response with valid structure for joke intent', async () => {
      const end = perfMonitor.start('joke-validation');
      
      const result = await evaluationRunner.runTest({
        name: 'Valid structure - Joke',
        input: {
          text: "J'ai vu 3 cônes orange sur le chemin ce matin!",
          intent: 'joke',
        },
        validator: validators.hasValidStructure,
      });

      end();
      expect(result.passed).toBe(true);
    });

    it('should return response with valid emojis', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Valid emojis - Event',
        input: {
          text: "Party sur la terrasse du Plateau ce soir!",
          intent: 'event',
        },
        validator: validators.hasValidEmojis,
      });

      expect(result.passed).toBe(true);
    });

    it('should return response with valid tags', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Valid tags - Rant',
        input: {
          text: "La construction sur le pont Jacques-Cartier ENCORE!",
          intent: 'rant',
        },
        validator: validators.hasValidTags,
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('Intent-Specific Validation', () => {
    it('should handle joke intent appropriately', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Joke intent processing',
        input: {
          text: "Pourquoi les Québécois adorent l'hiver? Parce que c'est la seule saison où la poutine reste chaude longtemps!",
          intent: 'joke',
        },
        validator: (response) => {
          return validators.hasValidStructure(response) && !response!.flagged;
        },
      });

      expect(result.passed).toBe(true);
    });

    it('should handle event intent appropriately', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Event intent processing',
        input: {
          text: "Festival de jazz ce weekend au centre-ville! Musique live et food trucks!",
          intent: 'event',
        },
        validator: (response) => {
          return validators.hasValidStructure(response) && 
                 validators.hasValidCaption(response);
        },
      });

      expect(result.passed).toBe(true);
    });

    it('should handle rant intent appropriately', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Rant intent processing',
        input: {
          text: "Encore des travaux sur l'autoroute 40! C'est rendu impossible de circuler!",
          intent: 'rant',
        },
        validator: (response) => {
          return validators.hasValidStructure(response) && 
                 validators.hasValidReply(response);
        },
      });

      expect(result.passed).toBe(true);
    });

    it('should handle ad intent appropriately', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Ad intent processing',
        input: {
          text: "Nouveau café québécois! 50% de rabais cette semaine!",
          intent: 'ad',
        },
        validator: validators.hasValidStructure,
      });

      expect(result.passed).toBe(true);
    });

    it('should handle poem intent appropriately', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Poem intent processing',
        input: {
          text: "Sous la neige qui tombe, l'hiver québécois magnifique...",
          intent: 'poem',
        },
        validator: validators.hasValidStructure,
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('Performance Evaluation', () => {
    it('should process requests within acceptable latency', async () => {
      const testCases = [
        {
          name: 'Performance - Short text',
          input: { text: "Super beau!", intent: 'joke' as const },
          validator: validators.hasValidStructure,
        },
        {
          name: 'Performance - Medium text',
          input: { 
            text: "C'était vraiment une belle journée au parc aujourd'hui. Le soleil brillait!", 
            intent: 'joke' as const 
          },
          validator: validators.hasValidStructure,
        },
        {
          name: 'Performance - Long text',
          input: { 
            text: "Hier, j'ai participé à un événement incroyable dans le Vieux-Montréal. Il y avait tellement de monde et l'ambiance était fantastique! Les musiciens étaient excellents et la nourriture était délicieuse. Je recommande vraiment à tout le monde d'y aller la prochaine fois!", 
            intent: 'event' as const 
          },
          validator: validators.hasValidStructure,
        },
      ];

      const results = await evaluationRunner.runTests(testCases);
      const summary = evaluationRunner.getSummary();

      // Check that all tests passed
      expect(results.every(r => r.passed)).toBe(true);
      
      // Check average duration is reasonable (under 5 seconds)
      expect(summary.avgDuration).toBeLessThan(5000);
    });

    it('should maintain consistent performance across multiple requests', async () => {
      const testCases = Array(5).fill(null).map((_, i) => ({
        name: `Consistency test ${i + 1}`,
        input: {
          text: "Test de consistance de performance",
          intent: 'joke' as const,
        },
        validator: validators.hasValidStructure,
      }));

      const results = await evaluationRunner.runTests(testCases);
      const durations = results.map(r => r.duration);
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be less than 50% of average (reasonable consistency)
      expect(stdDev / avgDuration).toBeLessThan(0.5);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty text gracefully', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Empty text handling',
        input: { text: "", intent: 'joke' },
        validator: (response) => {
          // Should either return null or a valid response with error flag
          return response === null || validators.isFlagged(response);
        },
      });

      // Test passes if it handles empty text without crashing
      expect(result.error).toBeUndefined();
    });

    it('should handle very long text', async () => {
      const longText = "A".repeat(1000);
      
      const result = await evaluationRunner.runTest({
        name: 'Long text handling',
        input: { text: longText, intent: 'rant' },
        validator: (response) => {
          return response === null || validators.hasValidStructure(response);
        },
      });

      // Should handle without crashing
      expect(result.error).toBeUndefined();
    });

    it('should handle special characters', async () => {
      const result = await evaluationRunner.runTest({
        name: 'Special characters handling',
        input: { 
          text: "Événement spécial: café & thé! 50% 🎉", 
          intent: 'ad' 
        },
        validator: validators.hasValidStructure,
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('Evaluation Summary', () => {
    it('should generate comprehensive evaluation summary', () => {
      const summary = evaluationRunner.getSummary();
      
      expect(summary).toHaveProperty('serviceName');
      expect(summary).toHaveProperty('totalTests');
      expect(summary).toHaveProperty('passedTests');
      expect(summary).toHaveProperty('successRate');
      expect(summary).toHaveProperty('avgDuration');
      expect(summary.serviceName).toBe('TiGuyAgent');
    });

    it('should provide detailed metrics', () => {
      const metrics = evaluationRunner.getMetrics();
      
      expect(metrics).toHaveProperty('accuracy');
      expect(metrics).toHaveProperty('latency');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('errorRate');
    });

    it('should export results for analysis', () => {
      const exported = evaluationRunner.exportResults();
      
      expect(exported).toHaveProperty('summary');
      expect(exported).toHaveProperty('metrics');
      expect(exported).toHaveProperty('timestamp');
    });
  });

  describe('Tracing Integration', () => {
    it('should collect trace data during evaluation', () => {
      const stats = globalTracer.getStats();
      
      // Should have collected some spans
      expect(stats.totalSpans).toBeGreaterThan(0);
    });

    it('should track performance metrics', () => {
      const perfStats = perfMonitor.getAllStats();
      
      // Should have some performance measurements
      expect(Object.keys(perfStats).length).toBeGreaterThan(0);
    });
  });
});
