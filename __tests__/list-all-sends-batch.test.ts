import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPipelineGet = vi.fn();
const mockPipelineExec = vi.fn();
const mockPipeline = vi.fn(() => ({
  get: mockPipelineGet,
  exec: mockPipelineExec,
}));

const mockKvGet = vi.fn();

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    get: mockKvGet,
    pipeline: mockPipeline,
  }),
  skipKVInPrerender: () => false,
}));

describe('listAllSends pipeline batching', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    mockKvGet.mockResolvedValue(['fos_a', 'fos_b']);
  });

  it('batch-gets send records via kv.pipeline instead of sequential gets', async () => {
    const sendA = {
      id: 'fos_a',
      prospectId: 'fop_a',
      firmName: 'A LLP',
      prospectType: 'firm',
      email: 'a@test.co.uk',
      campaignId: 'c',
      sequenceStep: 0,
      subject: 'Hello',
      status: 'sent',
      createdAt: '2026-01-01T00:00:00Z',
    };
    const sendB = { ...sendA, id: 'fos_b', email: 'b@test.co.uk' };

    mockPipelineExec.mockResolvedValue([sendA, sendB]);

    const { listAllSends } = await import('@/lib/firm-outreach/storage');
    const sends = await listAllSends();

    expect(mockPipeline).toHaveBeenCalledTimes(1);
    expect(mockPipelineGet).toHaveBeenCalledTimes(2);
    expect(sends).toHaveLength(2);
    expect(sends.map((s) => s.id).sort()).toEqual(['fos_a', 'fos_b']);
  });
});
