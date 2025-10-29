/**
 * Feature Dependency Graph
 * Manages relationships between sketches and features for parametric updates
 */

import type { Feature, FeatureSketchLink } from './types';

export interface DependencyNode {
  id: string;
  type: 'sketch' | 'feature';
  dependsOn: string[];      // IDs this node depends on
  dependents: string[];     // IDs that depend on this node
}

export class FeatureDependencyGraph {
  private nodes: Map<string, DependencyNode> = new Map();
  private links: Map<string, FeatureSketchLink[]> = new Map();
  private features: Map<string, Feature> = new Map();
  
  /**
   * Add a sketch to the graph
   */
  addSketch(sketchId: string): void {
    if (!this.nodes.has(sketchId)) {
      this.nodes.set(sketchId, {
        id: sketchId,
        type: 'sketch',
        dependsOn: [],
        dependents: [],
      });
    }
  }
  
  /**
   * Add a feature to the graph
   */
  addFeature(feature: Feature): void {
    this.features.set(feature.id, feature);
    
    const dependsOn: string[] = [];
    
    // If feature has a sketch, add dependency
    if (feature.sketchId) {
      dependsOn.push(feature.sketchId);
      this.ensureSketchNode(feature.sketchId);
    }
    
    // If feature has a parent, add dependency
    if (feature.parentId) {
      dependsOn.push(feature.parentId);
    }
    
    // Create or update node
    const node: DependencyNode = {
      id: feature.id,
      type: 'feature',
      dependsOn,
      dependents: [],
    };
    
    this.nodes.set(feature.id, node);
    
    // Update dependent nodes
    for (const depId of dependsOn) {
      const depNode = this.nodes.get(depId);
      if (depNode && !depNode.dependents.includes(feature.id)) {
        depNode.dependents.push(feature.id);
      }
    }
  }
  
  /**
   * Link a feature to specific sketch entities
   */
  linkFeatureToSketch(link: FeatureSketchLink): void {
    const existingLinks = this.links.get(link.sketchId) || [];
    
    // Check if link already exists
    const linkIndex = existingLinks.findIndex(l => l.featureId === link.featureId);
    
    if (linkIndex >= 0) {
      // Update existing link
      existingLinks[linkIndex] = link;
    } else {
      // Add new link
      existingLinks.push(link);
    }
    
    this.links.set(link.sketchId, existingLinks);
    
    // Ensure nodes exist
    this.ensureSketchNode(link.sketchId);
    
    const featureNode = this.nodes.get(link.featureId);
    if (featureNode && !featureNode.dependsOn.includes(link.sketchId)) {
      featureNode.dependsOn.push(link.sketchId);
    }
    
    const sketchNode = this.nodes.get(link.sketchId);
    if (sketchNode && !sketchNode.dependents.includes(link.featureId)) {
      sketchNode.dependents.push(link.featureId);
    }
  }
  
  /**
   * Remove a feature from the graph
   */
  removeFeature(featureId: string): void {
    const node = this.nodes.get(featureId);
    if (!node) return;
    
    // Remove from dependents of nodes it depends on
    for (const depId of node.dependsOn) {
      const depNode = this.nodes.get(depId);
      if (depNode) {
        depNode.dependents = depNode.dependents.filter(id => id !== featureId);
      }
    }
    
    // Remove from dependency list of dependent nodes
    for (const depId of node.dependents) {
      const depNode = this.nodes.get(depId);
      if (depNode) {
        depNode.dependsOn = depNode.dependsOn.filter(id => id !== featureId);
      }
    }
    
    this.nodes.delete(featureId);
    this.features.delete(featureId);
    
    // Remove links
    for (const [sketchId, links] of this.links) {
      this.links.set(
        sketchId,
        links.filter(l => l.featureId !== featureId)
      );
    }
  }
  
  /**
   * Get all features that depend on a sketch
   */
  getDependentFeatures(sketchId: string): string[] {
    const node = this.nodes.get(sketchId);
    if (!node || node.type !== 'sketch') return [];
    return node.dependents;
  }
  
  /**
   * Get all features that need to be regenerated when a sketch changes
   * Returns features in topological order (dependencies first)
   */
  getRegenerationOrder(sketchId: string): string[] {
    const affectedFeatures = new Set<string>();
    const visited = new Set<string>();
    
    // Find all dependent features recursively
    const collectDependents = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (!node) return;
      
      if (node.type === 'feature') {
        affectedFeatures.add(nodeId);
      }
      
      for (const depId of node.dependents) {
        collectDependents(depId);
      }
    };
    
    collectDependents(sketchId);
    
    // Sort in topological order
    return this.topologicalSort(Array.from(affectedFeatures));
  }
  
  /**
   * Topological sort of features
   */
  private topologicalSort(featureIds: string[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();
    
    const visit = (id: string): boolean => {
      if (temp.has(id)) {
        // Circular dependency detected
        console.warn('Circular dependency detected at:', id);
        return false;
      }
      
      if (visited.has(id)) return true;
      
      temp.add(id);
      
      const node = this.nodes.get(id);
      if (node) {
        // Visit dependencies first
        for (const depId of node.dependsOn) {
          if (featureIds.includes(depId)) {
            if (!visit(depId)) return false;
          }
        }
      }
      
      temp.delete(id);
      visited.add(id);
      sorted.push(id);
      
      return true;
    };
    
    for (const id of featureIds) {
      if (!visited.has(id)) {
        visit(id);
      }
    }
    
    return sorted;
  }
  
  /**
   * Get feature-sketch link
   */
  getFeatureSketchLink(featureId: string, sketchId: string): FeatureSketchLink | undefined {
    const links = this.links.get(sketchId) || [];
    return links.find(l => l.featureId === featureId);
  }
  
  /**
   * Get all links for a sketch
   */
  getSketchLinks(sketchId: string): FeatureSketchLink[] {
    return this.links.get(sketchId) || [];
  }
  
  /**
   * Ensure sketch node exists
   */
  private ensureSketchNode(sketchId: string): void {
    if (!this.nodes.has(sketchId)) {
      this.addSketch(sketchId);
    }
  }
  
  /**
   * Clear all dependencies
   */
  clear(): void {
    this.nodes.clear();
    this.links.clear();
    this.features.clear();
  }
  
  /**
   * Get graph statistics
   */
  getStats(): {
    sketchCount: number;
    featureCount: number;
    linkCount: number;
  } {
    let sketchCount = 0;
    let featureCount = 0;
    let linkCount = 0;
    
    for (const node of this.nodes.values()) {
      if (node.type === 'sketch') sketchCount++;
      if (node.type === 'feature') featureCount++;
    }
    
    for (const links of this.links.values()) {
      linkCount += links.length;
    }
    
    return { sketchCount, featureCount, linkCount };
  }
}
