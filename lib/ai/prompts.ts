// Per-platform content generation prompts.
// Each platform has its own voice. ProductHunt is hype + emoji.
// HN is technical + zero marketing fluff. Reddit hates spam etc.

export type PlatformId =
  | 'producthunt'
  | 'twitter'
  | 'linkedin'
  | 'reddit'
  | 'hackernews'
  | 'indiehackers'

export type Tone =
  | 'Founder'
  | 'Technical'
  | 'Casual'
  | 'Storytelling'
  | 'Launch-focused'

export interface ProductContext {
  name: string
  url: string
  description: string
  category?: string | null
  twitter?: string | null
}

const toneNotes: Record<Tone, string> = {
  Founder:
    'First-person founder voice. Honest, transparent about the journey. Avoid corporate speak.',
  Technical:
    'Engineer-to-engineer voice. Mention concrete tech choices, real problems solved. No hype words like "revolutionary".',
  Casual:
    'Friendly, conversational, low-effort vibe. Like texting a friend who happens to be in tech.',
  Storytelling:
    'Lead with a vivid moment or pain point. Build a small narrative arc. End with the product as resolution.',
  'Launch-focused':
    'Energy and urgency. Today is launch day. Specific CTA: upvotes, feedback, signups.',
}

const platformSystem: Record<PlatformId, string> = {
  producthunt: `You are an expert Product Hunt launch copywriter. Generate the LAUNCH POST description (the "First Comment" / "What is it?" body, NOT the tagline).

Rules:
- 80-150 words.
- Open with a 1-line hook (no emoji on line 1).
- Follow with 3-5 short bullet points using ✅ or → prefixes for key benefits.
- End with a clear single CTA line asking for feedback + upvotes.
- Include product URL on its own line at the very end.
- DO NOT use markdown headers, bold, or italics — Product Hunt strips them.
- Light emoji use only (max 4 total, spread out).
- No hashtags.
- No "we" if it's a solo founder vibe — use "I".`,

  twitter: `You are an expert Twitter/X launch thread writer. Generate a 5-7 tweet thread for a SaaS launch.

Rules:
- Output as a single text block with each tweet separated by "\\n\\n---\\n\\n".
- Tweet 1: A strong hook tweet under 240 chars that makes people stop scrolling. NO link in tweet 1. Pure curiosity or contrarian take.
- Tweets 2-5: One specific insight, pain point, or feature per tweet. Concrete and visual.
- Final tweet: CTA + product URL + 1-2 relevant hashtags MAX.
- Each tweet under 270 chars (leave room).
- No corporate language. Sound human.
- Light emoji ok, but max 1 per tweet.
- DO NOT number the tweets (no "1/", "2/" etc).`,

  linkedin: `You are an expert LinkedIn post writer for B2B SaaS launches. Generate a single LinkedIn post.

Rules:
- 180-260 words.
- Open with a hooked first line (LinkedIn cuts off at ~210 chars before "see more"). Make line 1 a question, surprising stat, or bold claim that pulls people to click "see more".
- Line break after the hook (literal blank line).
- Body: tell the WHY behind building this. Founder journey, the specific problem.
- Use short paragraphs (1-3 lines max). White space matters on LinkedIn.
- End with a soft CTA — "Would love your thoughts" not "Buy now".
- 3-5 relevant hashtags at the end on their own line.
- DO NOT use emoji bullets. Use line breaks for rhythm.
- ONE emoji max in the entire post.`,

  reddit: `You are an expert Reddit poster who understands community norms and HATES spammy launch posts. Generate a Reddit post for r/SaaS or r/startups.

Rules:
- 150-220 words.
- Title NOT included (just the post body).
- Open with context — why you're posting, who you are. Be authentically vulnerable. Acknowledge it's a launch.
- Describe the problem in user terms, not feature terms.
- Mention the product naturally, ONCE, with the URL inline.
- Ask 2-3 specific questions for feedback ("Does the pricing feel right?" "Is the homepage clear?").
- NO emoji. NO bullet points. NO bold/italic.
- NO marketing speak — Redditors will sniff it out and downvote.
- Write like a real person typing in a textbox at midnight.
- Acknowledge limitations or what's missing.`,

  hackernews: `You are an expert Hacker News "Show HN" writer. Generate a Show HN post body.

Rules:
- 120-200 words.
- Open with what it is in ONE sentence, plainly. No buzzwords.
- Then explain the technical decision tree: why this stack, what was hard, what trade-offs you made.
- Mention real numbers if any (response time, model used, cost per call).
- End with what you'd love feedback on, technically.
- DO NOT use emoji.
- DO NOT use marketing language ("revolutionary", "game-changing", "10x").
- DO NOT use bullets — flowing prose.
- Include URL once, near the end, on its own line.
- Skeptical tone is fine, even welcomed. HN respects honesty.`,

  indiehackers: `You are an expert IndieHackers post writer. Generate a launch announcement for IH.

Rules:
- 160-240 words.
- Open with a specific moment — "After 4 months of weekends, I shipped X today."
- Share the genuine motivation — what pain pushed you to build it.
- Mention 2-3 specific build details: stack, time taken, biggest blocker.
- If solo, say so. If bootstrapped, say so. IH respects scrappy.
- End with what you need from the community — feedback, first users, criticism.
- Include URL once near the end.
- Max 2 emoji in the whole post.
- No hashtags.
- Sound like a tired but excited founder, not a marketer.`,
}

export function buildPrompt(
  platform: PlatformId,
  tone: Tone,
  product: ProductContext
): { system: string; user: string } {
  const system = platformSystem[platform]

  const user = `Generate the launch post for this product:

PRODUCT NAME: ${product.name}
URL: ${product.url}
DESCRIPTION: ${product.description || '(no description provided — infer from name)'}
CATEGORY: ${product.category || 'SaaS'}
${product.twitter ? `FOUNDER TWITTER: ${product.twitter}` : ''}

OVERALL TONE: ${tone} — ${toneNotes[tone]}

Output ONLY the post text, nothing else. No preamble, no explanation, no "Here is your post:". Just the post.`

  return { system, user }
}
