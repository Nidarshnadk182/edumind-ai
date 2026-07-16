import { describe, it, expect } from 'vitest';
import { DemoProvider } from '@/lib/ai/demo-provider';

describe('DemoProvider', () => {
  it('always returns isDemoResponse: true', async () => {
    const provider = new DemoProvider();
    const result = await provider.complete({
      systemPrompt: 'test',
      messages: [{ role: 'user', content: 'Explain NPV' }],
    });
    expect(result.isDemoResponse).toBe(true);
    expect(result.model).toBe('demo-mode');
  });

  it('never returns empty content', async () => {
    const provider = new DemoProvider();
    const result = await provider.complete({
      systemPrompt: 'test',
      messages: [{ role: 'user', content: '' }],
    });
    expect(result.content.length).toBeGreaterThan(0);
  });
});
