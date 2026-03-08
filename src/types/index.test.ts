// src/types/index.test.ts
import { describe, it, expect } from 'vitest';
import { Project, Session, Codebook, ParsedQuote, AppConfig, PublishAdapter } from './index';

describe('Core Types Compilation', () => {
  it('should allow creating a Session object', () => {
    const session: Session = {
      id: 's1',
      participant: 'P1',
      videoFile: 'video.mp4',
      transcriptFile: 'transcript.txt'
    };
    expect(session.id).toBe('s1');
  });

  it('should allow creating a Project object', () => {
    const project: Project = {
      id: 'p1',
      title: 'Project Title',
      date: '2026-03-07',
      researcher: 'Researcher Name',
      persona: 'User Persona',
      status: 'setup',
      codebook: null,
      sessions: [],
      publishedUrl: null
    };
    expect(project.status).toBe('setup');
  });

  it('should allow creating a Codebook object', () => {
    const codebook: Codebook = {
      tags: [
        { id: 't1', label: 'Tag 1', color: 'red', category: 'Cat 1' }
      ],
      categories: ['Cat 1']
    };
    expect(codebook.tags.length).toBe(1);
  });

  it('should allow creating an AppConfig object', () => {
    const config: AppConfig = {
      aiMode: 'auto',
      adapters: {
        'adapter-1': { key: 'val' }
      }
    };
    expect(config.aiMode).toBe('auto');
  });
});
