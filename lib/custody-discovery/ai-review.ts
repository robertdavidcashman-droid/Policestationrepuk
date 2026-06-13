import OpenAI from 'openai';
import type {
  AiReviewRecommendation,
  CustodyAiReview,
  CustodyNumberFinding,
  SourceEvidence,
} from './types';
import {
  downgradeReviewOnValidationFailure,
  validateAiReviewOutput,
} from './ai-review-validator';

const MODEL = 'gpt-4o-mini';
const VALID: AiReviewRecommendation[] = ['approve', 'reject', 'hold'];

export interface AiReviewContext {
  hasApprovedNumber: boolean;
  approvedNumber?: string;
}

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function holdReview(
  evidence: SourceEvidence,
  whyNot: string,
  flags: string[] = [],
): CustodyAiReview {
  return {
    recommendation: 'hold',
    aiConfidence: 0,
    whyPublish: '',
    whyNot,
    evidence,
    publishVerified: false,
    flags,
    model: 'none',
    reviewedAt: new Date().toISOString(),
  };
}

function parseAiReviewJson(raw: string, evidence: SourceEvidence): CustodyAiReview | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const recommendation = String(parsed.recommendation ?? '').toLowerCase() as AiReviewRecommendation;
    if (!VALID.includes(recommendation)) return null;

    const aiConfidence = Number(parsed.aiConfidence ?? 0);
    const whyPublish = String(parsed.whyPublish ?? '').trim();
    const whyNot = parsed.whyNot ? String(parsed.whyNot).trim() : undefined;
    const publishVerified = Boolean(parsed.publishVerified);
    const flags = Array.isArray(parsed.flags)
      ? parsed.flags.map((f) => String(f)).slice(0, 10)
      : [];

    return {
      recommendation,
      aiConfidence: Math.max(0, Math.min(100, aiConfidence)),
      whyPublish,
      whyNot,
      evidence,
      publishVerified,
      flags,
      model: MODEL,
      reviewedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function runAiReview(
  finding: CustodyNumberFinding,
  evidence: SourceEvidence,
  ctx: AiReviewContext,
): Promise<CustodyAiReview> {
  const client = getClient();
  if (!client) {
    return holdReview(evidence, 'OPENAI_API_KEY not configured — manual review required.', ['no_openai']);
  }

  const conflictNote = finding.conflictReason
    ? `Conflict flagged: ${finding.conflictReason}.`
    : 'No conflict flagged.';
  const approvedNote = ctx.hasApprovedNumber
    ? `Suite already has approved number: ${ctx.approvedNumber ?? 'yes'}.`
    : 'No approved number on this suite yet.';

  const userPrompt = `Review this custody desk number finding for a UK police station directory.

Force: ${finding.forceName}
Custody suite: ${finding.custodySuiteName}
Police station: ${finding.policeStationName}
Number: ${finding.possiblePhoneNumber}
Source URL: ${finding.sourceUrl}
Source type: ${finding.sourceType}
Rule classification: ${finding.classification}
Rule confidence score: ${finding.confidenceScore} (${finding.confidenceLevel})
${conflictNote}
${approvedNote}

Evidence section: ${evidence.section}
Evidence excerpt (ONLY quote from this — do not invent text):
"""
${evidence.quote.replace(/\*\*/g, '')}
"""

Return JSON only:
{
  "recommendation": "approve" | "reject" | "hold",
  "aiConfidence": 0-100,
  "whyPublish": "2-4 sentences if approve — why this excerpt supports publishing as a direct custody desk line for this suite",
  "whyNot": "if reject or hold — what the excerpt shows instead",
  "publishVerified": true/false,
  "flags": ["optional", "flags"]
}

Rules:
- Use approve only when the excerpt clearly shows a direct custody suite/desk line for the named suite.
- Use reject for switchboard, 101, solicitor, victim/witness, or wrong station.
- Use hold when uncertain, excerpt is weak, or conflict exists.
- Base reasoning ONLY on the excerpt provided.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You review UK police custody desk phone evidence for a legal directory. Respond with valid JSON only. Never invent text not in the excerpt.',
        },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return holdReview(evidence, 'AI returned empty response.', ['empty_response']);
    }

    const parsed = parseAiReviewJson(raw, evidence);
    if (!parsed) {
      return holdReview(evidence, 'AI response could not be parsed.', ['parse_error']);
    }

    const validation = validateAiReviewOutput(finding, parsed);
    if (!validation.ok) {
      return downgradeReviewOnValidationFailure(parsed, validation.flags);
    }

    return parsed;
  } catch (err) {
    console.warn('[custody-ai-review]', finding.id, err);
    return holdReview(evidence, 'AI review failed — manual review required.', ['api_error']);
  }
}

export function formatAiReviewNotes(review: CustodyAiReview): string {
  const date = review.reviewedAt.slice(0, 10);
  const action = review.recommendation;
  const why =
    action === 'approve'
      ? review.whyPublish
      : review.whyNot || review.whyPublish;
  return `[AI ${date}] ${action.toUpperCase()} (${review.aiConfidence}%) · Section: ${review.evidence.section} | ${why}`;
}
