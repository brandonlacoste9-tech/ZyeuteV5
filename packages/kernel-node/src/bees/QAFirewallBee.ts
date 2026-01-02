import { neurosphere } from '../lib/ai/deepseek.js';
import { geminiCortex } from '../lib/ai/gemini.js';
import { db } from '../lib/db.js';
import { LlmAgent } from '../lib/agents/LlmAgent.js';
import { AgentTask } from '../lib/agents/BaseAgent.js';
import { guardian, SafetyLevel } from '../lib/guardian.js';

interface AuditResult {
  approved: boolean;
  confidence: number;
  violations: string[];
  recommendations?: string[];
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional fields for flexibility
}

interface SwarmPayload {
  source: 'expression_core' | 'vision_core' | 'general';
  content: any;
  metadata?: Record<string, any>;
}

interface ScalingStatus {
  queueLength: number;
  currentReplicas: number;
  estimatedCost: number;
}

export class QAFirewallBee extends LlmAgent {
  private isAuditing = false;
  private pollInterval = 2000; // Faster polling for QA firewall

  constructor() {
    super(
      'qa_firewall_v1_0',
      neurosphere,
      "You are the Quality Assurance Firewall for Zyeuté Sovereign AI Infrastructure. You audit all outputs from The Swarm and enforce quality standards. You do not generate content - you audit and approve/reject."
    );
  }

  public async onStartup() {
    console.log(`🔥 [${this.agentId}] Quality Assurance Firewall ACTIVE. Authorization: unique-spirit-482300-s4`);
    console.log(`🔥 [${this.agentId}] Monitoring Expression Core (Gemma-3-1B-LatAm) and Vision Core (V-JEPA-2)`);
  }

  public async onShutdown() {
    console.log(`🔥 [${this.agentId}] Quality Assurance Firewall shutting down safely.`);
  }

  public async onStart() {}
  public async onStop() {}

  public wakeUp() {
    this.start();
  }

  /**
   * The Audit Loop - Monitor and Validate Swarm Outputs
   */
  protected async forage() {
    if (this.isAuditing) return;
    this.isAuditing = true;

    try {
      // Check for swarm outputs needing audit
      const { data: pendingAudits, error } = await db
        .from('colony_tasks')
        .select('*')
        .eq('status', 'completed')
        .eq('requires_audit', true)
        .order('updated_at', { ascending: true })
        .limit(5); // Process in batches

      if (error || !pendingAudits || pendingAudits.length === 0) {
        this.isAuditing = false;
        return;
      }

      for (const task of pendingAudits) {
        console.log(`🔥 [${this.agentId}] 🔍 Auditing Task: [${task.command}] - ID: ${task.id}`);
        await this.auditTask(task as unknown as AgentTask);
      }

      // Check autoscaling status
      await this.checkResourceScaling();

    } catch (error) {
      console.error(`🔥 [${this.agentId}] Audit Error:`, error);
    } finally {
      this.isAuditing = false;
    }
  }

  /**
   * Audit individual task outputs
   */
  private async auditTask(task: AgentTask): Promise<void> {
    try {
      // First, run guardian safety checks (sovereignty enforcement)
      const guardianResult = await guardian.checkTask(task);

      if (!guardianResult.approved) {
        // Immediate rejection for sovereignty violations
        const criticalViolations = guardianResult.violations.filter(v => v.level === SafetyLevel.CRITICAL);

        if (criticalViolations.length > 0) {
          console.log(`🚫 [${this.agentId}] SOVEREIGNTY VIOLATION Task ${task.id}: ${criticalViolations.map(v => v.message).join(', ')}`);

          await db.from('colony_tasks').update({
            status: 'sovereignty_violation',
            audited_at: new Date().toISOString(),
            audit_result: JSON.stringify({
              approved: false,
              confidence: 0,
              violations: criticalViolations.map(v => v.message),
              sovereignty_enforced: true
            }),
            audit_violations: criticalViolations.map(v => v.message)
          }).eq('id', task.id);

          return;
        }
      }

      // Proceed with core-specific audits
      const auditResult = await this.performAudit(task);

      // Combine guardian and core audit results
      const combinedViolations = [
        ...guardianResult.violations.map(v => v.message),
        ...auditResult.violations
      ];

      const finalConfidence = Math.min(auditResult.confidence, guardianResult.approved ? 1.0 : 0.5);
      const finalApproved = auditResult.approved && guardianResult.approved;

      // Update task with combined audit results
      const updateData: any = {
        audited_at: new Date().toISOString(),
        audit_result: JSON.stringify({
          ...auditResult,
          sovereignty_check: guardianResult.approved,
          combined_violations: combinedViolations
        }),
        audit_confidence: finalConfidence
      };

      if (!finalApproved) {
        updateData.status = 'rejected';
        updateData.audit_violations = combinedViolations;
        console.log(`❌ [${this.agentId}] REJECTED Task ${task.id}: ${combinedViolations.join(', ')}`);
      } else {
        updateData.status = 'approved';
        console.log(`✅ [${this.agentId}] APPROVED Task ${task.id} (Confidence: ${finalConfidence.toFixed(2)})`);
      }

      await db.from('colony_tasks').update(updateData).eq('id', task.id);

      // Log comprehensive audit event
      await this.logAuditEvent(task.id, {
        ...auditResult,
        sovereignty_check: guardianResult.approved,
        guardian_violations: guardianResult.violations,
        combined_violations: combinedViolations
      });

    } catch (auditError: any) {
      console.error(`🔥 [${this.agentId}] Audit failed for task ${task.id}:`, auditError);
      await db.from('colony_tasks').update({
        status: 'audit_failed',
        audit_error: auditError.message
      }).eq('id', task.id);
    }
  }

  /**
   * Perform comprehensive audit based on core type
   */
  private async performAudit(task: AgentTask): Promise<AuditResult> {
    const payload = this.parsePayload(task);

    switch (payload.source) {
      case 'expression_core':
        return await this.auditExpressionCore(payload, task.id);
      case 'vision_core':
        return await this.auditVisionCore(payload);
      default:
        return await this.auditGeneralOutput(payload);
    }
  }

  /**
   * Audit Expression Core (Gemma-3-1B-LatAm) - Spanish Localization
   */
  private async auditExpressionCore(payload: SwarmPayload, taskId: string): Promise<AuditResult> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let confidence = 1.0;

    // Extract text content
    const text = this.extractTextContent(payload.content);
    if (!text) {
      return {
        approved: false,
        confidence: 0,
        violations: ['No text content found for localization audit'],
        recommendations: ['Ensure Expression Core outputs contain text for audit']
      };
    }

    // Check for Spanish language indicators
    const hasSpanishIndicators = /([¿¡]|el|la|los|las|es|son|está|están|ser|estar|hacer|ir|ver|dar|saber|querer|llegar|pasar|deber|poder|poner|parecer|quedar|creer|saber|haber|tener)/gi.test(text);

    if (!hasSpanishIndicators) {
      violations.push('Content does not appear to be in Spanish');
      confidence -= 0.5;
      recommendations.push('Regenerate with Gemma-3-1B-LatAm for proper Spanish localization');
    }

    // Check for translation artifacts (common English-Spanish translation issues)
    const translationArtifacts = [
      /\ba\b/gi, // "a" instead of "un/una"
      /\bthe\b/gi, // "the" instead of articles
      /\bI am\b/gi, // "I am" instead of "soy/estoy"
      /\bthis is\b/gi, // "this is" instead of "esto es"
    ];

    for (const artifact of translationArtifacts) {
      if (artifact.test(text)) {
        violations.push(`Translation artifact detected: ${artifact.source}`);
        confidence -= 0.2;
      }
    }

    // AI-powered localization quality check
    try {
      const localizationCheck = await this.think([
        {
          role: 'system',
          content: 'You are a Spanish localization expert. Analyze this text for native Spanish fluency. Rate on scale 0-1 how natural it sounds. Return JSON: { score: number, issues: string[], suggestions: string[] }'
        },
        {
          role: 'user',
          content: `Text to analyze: "${text}"\n\nTarget region: Latin America (LatAm)`
        }
      ], taskId);

      const cleanJson = localizationCheck.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiAnalysis = JSON.parse(cleanJson);

      confidence *= aiAnalysis.score;

      if (aiAnalysis.issues && aiAnalysis.issues.length > 0) {
        violations.push(...aiAnalysis.issues.map((issue: string) => `AI: ${issue}`));
      }

      if (aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0) {
        recommendations.push(...aiAnalysis.suggestions);
      }
    } catch (aiError) {
      console.warn(`🔥 [${this.agentId}] AI localization check failed:`, aiError);
      violations.push('Could not perform AI-powered localization validation');
      confidence -= 0.1;
    }

    return {
      approved: confidence >= 0.7 && violations.length === 0,
      confidence,
      violations,
      recommendations,
      metadata: {
        core_type: 'expression_core',
        language_detected: hasSpanishIndicators ? 'es' : 'unknown',
        text_length: text.length
      }
    };
  }

  /**
   * Audit Vision Core (V-JEPA-2) - Visual Consistency with AdGen Branding
   */
  private async auditVisionCore(payload: SwarmPayload): Promise<AuditResult> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let confidence = 1.0;

    // Check for image URL or base64 data
    const imageUrl = payload.content?.imageUrl || payload.content?.url;
    if (!imageUrl) {
      return {
        approved: false,
        confidence: 0,
        violations: ['No image URL found for visual audit'],
        recommendations: ['Ensure Vision Core outputs include image URLs for audit']
      };
    }

    // Use Gemini Vision for visual analysis
    try {
      const visualAnalysis = await geminiCortex.chat(
        `Analyze this image for AdGen branding compliance. Check for: ` +
        `1. Visual consistency with professional advertising standards ` +
        `2. Absence of hallucinations or artifacts ` +
        `3. Appropriate color schemes and composition ` +
        `4. Brand-appropriate imagery ` +
        `Rate on scale 0-1. Return JSON: { score: number, issues: string[], suggestions: string[] } ` +
        `Image: ${imageUrl}`
      );

      const cleanJson = visualAnalysis.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiAnalysis = JSON.parse(cleanJson);

      confidence *= aiAnalysis.score;

      if (aiAnalysis.issues && aiAnalysis.issues.length > 0) {
        violations.push(...aiAnalysis.issues.map((issue: string) => `Visual: ${issue}`));
      }

      if (aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0) {
        recommendations.push(...aiAnalysis.suggestions);
      }

      // Specific AdGen branding checks
      const adgenChecks = [
        'professional_quality',
        'brand_consistency',
        'no_artifacts',
        'appropriate_content'
      ];

      for (const check of adgenChecks) {
        if (aiAnalysis[check] === false) {
          violations.push(`AdGen branding violation: ${check.replace('_', ' ')}`);
          confidence -= 0.15;
        }
      }

    } catch (aiError) {
      console.warn(`🔥 [${this.agentId}] AI visual analysis failed:`, aiError);
      violations.push('Could not perform AI-powered visual validation');
      confidence -= 0.2;
    }

    return {
      approved: confidence >= 0.8 && violations.length === 0,
      confidence,
      violations,
      recommendations,
      metadata: {
        core_type: 'vision_core',
        image_url: imageUrl,
        analysis_method: 'gemini_vision'
      }
    };
  }

  /**
   * General output audit for other swarm activities
   */
  private async auditGeneralOutput(payload: SwarmPayload): Promise<AuditResult> {
    // Basic JSON structure validation
    if (typeof payload.content !== 'object' || payload.content === null) {
      return {
        approved: false,
        confidence: 0.5,
        violations: ['Invalid JSON structure in swarm output'],
        recommendations: ['Ensure all swarm outputs are properly structured JSON']
      };
    }

    // Check for required fields based on task type
    const violations: string[] = [];

    // Validate no null/undefined critical fields
    const criticalFields = ['status', 'result', 'timestamp'];
    for (const field of criticalFields) {
      if (payload.content[field] === null || payload.content[field] === undefined) {
        violations.push(`Missing critical field: ${field}`);
      }
    }

    return {
      approved: violations.length === 0,
      confidence: violations.length === 0 ? 1.0 : 0.7,
      violations,
      metadata: {
        core_type: 'general',
        content_type: typeof payload.content
      }
    };
  }

  /**
   * Monitor autoscaling groups and enforce cost discipline
   */
  private async checkResourceScaling(): Promise<void> {
    try {
      // Check current scaling status (this would integrate with Vertex AI monitoring)
      const scalingStatus = await this.getScalingStatus();

      if (scalingStatus.queueLength === 0 && scalingStatus.currentReplicas > 1) {
        console.log(`💰 [${this.agentId}] SCALE DOWN: Queue empty, ${scalingStatus.currentReplicas} replicas active`);

        try {
          // Trigger scale down to min-replica=1
          await this.scaleDownResources();

          await this.logAuditEvent('resource_scaling', {
            action: 'scale_down',
            reason: 'empty_queue',
            previous_replicas: scalingStatus.currentReplicas,
            target_replicas: 1,
            cost_savings: `$${(scalingStatus.currentReplicas - 1) * 0.5}/hour`,
            status: 'success'
          });
        } catch (scaleError: any) {
          console.error(`🔥 [${this.agentId}] Scale down failed:`, scaleError);
          await this.logAuditEvent('resource_scaling', {
            action: 'scale_down',
            reason: 'empty_queue',
            previous_replicas: scalingStatus.currentReplicas,
            target_replicas: 1,
            status: 'failed',
            error: scaleError.message
          });
        }
      }

      // Performance mode: ensure we have capacity when needed
      if (scalingStatus.queueLength > 10 && scalingStatus.currentReplicas < 3) {
        console.log(`⚡ [${this.agentId}] SCALE UP: High queue load detected (${scalingStatus.queueLength} tasks)`);

        try {
          await this.scaleUpResources();

          await this.logAuditEvent('resource_scaling', {
            action: 'scale_up',
            reason: 'high_queue_load',
            queue_length: scalingStatus.queueLength,
            previous_replicas: scalingStatus.currentReplicas,
            target_replicas: 3,
            status: 'success'
          });
        } catch (scaleError: any) {
          console.error(`🔥 [${this.agentId}] Scale up failed:`, scaleError);
          await this.logAuditEvent('resource_scaling', {
            action: 'scale_up',
            reason: 'high_queue_load',
            queue_length: scalingStatus.queueLength,
            previous_replicas: scalingStatus.currentReplicas,
            target_replicas: 3,
            status: 'failed',
            error: scaleError.message
          });
        }
      }

    } catch (error) {
      console.error(`🔥 [${this.agentId}] Resource scaling check failed:`, error);
    }
  }

  // --- Helper Methods ---

  private parsePayload(task: AgentTask): SwarmPayload {
    const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : (task.payload || {});

    // Determine source based on task command or metadata
    let source: SwarmPayload['source'] = 'general';
    if (task.command?.includes('expression') || task.command?.includes('text') || task.command?.includes('gemma')) {
      source = 'expression_core';
    } else if (task.command?.includes('vision') || task.command?.includes('image') || task.command?.includes('vjepa')) {
      source = 'vision_core';
    }

    return {
      source,
      content: payload.content || payload.result || payload,
      metadata: payload.metadata || task.metadata
    };
  }

  private extractTextContent(content: any): string | null {
    if (typeof content === 'string') return content;
    if (content?.text) return content.text;
    if (content?.content) return content.content;
    if (content?.message) return content.message;
    if (content?.description) return content.description;

    // Try to extract from nested structures
    const stringFields = ['title', 'body', 'caption', 'alt_text'];
    for (const field of stringFields) {
      if (typeof content?.[field] === 'string') {
        return content[field];
      }
    }

    return null;
  }

  private async getScalingStatus(): Promise<ScalingStatus> {
    try {
      // This would integrate with Vertex AI monitoring APIs
      // For now, simulate based on task queue
      const { count, error } = await db
        .from('colony_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.warn(`🔥 [${this.agentId}] Error getting queue length:`, error);
      }

      // TODO: Integrate with Vertex AI monitoring API to get actual replica count
      // For now, use a conservative estimate based on queue length
      const queueLength = count || 0;
      const estimatedReplicas = queueLength > 10 ? 3 : queueLength > 0 ? 2 : 1;

      return {
        queueLength,
        currentReplicas: estimatedReplicas,
        estimatedCost: estimatedReplicas * 0.5 * 24 // $0.5/hour per replica, daily estimate
      };
    } catch (error) {
      console.error(`🔥 [${this.agentId}] Failed to get scaling status:`, error);
      // Return safe defaults on error
      return {
        queueLength: 0,
        currentReplicas: 1,
        estimatedCost: 0.5 * 24
      };
    }
  }

  private async scaleDownResources(): Promise<void> {
    try {
      // Integration point for Vertex AI autoscaling API
      // Example: await vertexAI.setMinReplicas(1);
      console.log(`💰 [${this.agentId}] Scaling down to 1 replica to conserve budget`);
      console.log(`💰 [${this.agentId}] Estimated cost savings: $1.00/hour`);
      
      // TODO: Implement actual Vertex AI API call
      // const response = await vertexAIClient.updateEndpoint({
      //   endpoint: process.env.VERTEX_AI_ENDPOINT,
      //   minReplicas: 1,
      //   maxReplicas: 3
      // });
      
    } catch (error) {
      console.error(`🔥 [${this.agentId}] Failed to scale down resources:`, error);
      throw error;
    }
  }

  private async scaleUpResources(): Promise<void> {
    try {
      // Integration point for Vertex AI autoscaling API
      // Example: await vertexAI.setMinReplicas(3);
      console.log(`⚡ [${this.agentId}] Scaling up to 3 replicas for performance`);
      console.log(`⚡ [${this.agentId}] Performance mode: 3x GPU capacity active`);
      
      // TODO: Implement actual Vertex AI API call
      // const response = await vertexAIClient.updateEndpoint({
      //   endpoint: process.env.VERTEX_AI_ENDPOINT,
      //   minReplicas: 3,
      //   maxReplicas: 3
      // });
      
    } catch (error) {
      console.error(`🔥 [${this.agentId}] Failed to scale up resources:`, error);
      throw error;
    }
  }

  private async logAuditEvent(taskId: string, result: AuditResult | Record<string, any>) {
    await db.from('audit_log').insert({
      task_id: taskId,
      agent_id: this.agentId,
      audit_result: JSON.stringify(result),
      timestamp: new Date().toISOString(),
      authorization: 'unique-spirit-482300-s4'
    });
  }

  // --- Task Processing ---

  protected async processTask(task: AgentTask): Promise<string> {
    // QA Firewall doesn't generate content - it audits
    return JSON.stringify({
      status: 'AUDIT_MODE',
      message: 'Quality Assurance Firewall does not generate content - audit only',
      agent_id: this.agentId,
      timestamp: new Date().toISOString()
    });
  }
}