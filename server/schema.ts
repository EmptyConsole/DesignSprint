// JSON schema for OpenAI Structured Outputs (strict mode: every property is
// required, optional values are expressed as nullable).

const category = { type: "string", enum: ["recycling", "compost", "trash", "special"] };

export const classificationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "unclear",
    "retakeTip",
    "item",
    "material",
    "category",
    "reason",
    "confidence",
    "steps",
    "parts",
    "special",
    "details",
  ],
  properties: {
    unclear: {
      type: "boolean",
      description: "True if no single disposable item can be identified in the photo.",
    },
    retakeTip: {
      type: ["string", "null"],
      description: "If unclear, a short tip for a better photo (max 12 words). Otherwise null.",
    },
    item: { type: "string", description: "Plain name of the item, 1-4 words, e.g. 'Plastic cup'." },
    material: {
      type: "string",
      description: "Specific material, max 6 words, e.g. '#6 polystyrene (PS)' or 'Waxed paperboard'.",
    },
    category,
    reason: {
      type: "string",
      description: "ONE plain sentence, max 18 words, giving the local reason.",
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    steps: {
      type: "array",
      maxItems: 3,
      description: "0-3 prep steps, imperative, max 5 words each, e.g. 'Rinse it out'.",
      items: { type: "string" },
    },
    parts: {
      type: "array",
      maxItems: 4,
      description:
        "Only when components go to DIFFERENT places (e.g. lid vs cup). Otherwise empty.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["part", "category", "note"],
        properties: {
          part: { type: "string", description: "1-3 words" },
          category,
          note: { type: ["string", "null"], description: "max 8 words, or null" },
        },
      },
    },
    special: {
      description: "Required when category is 'special', otherwise null.",
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["kind", "headline", "where", "how", "warning"],
          properties: {
            kind: {
              type: "string",
              enum: ["hazardous", "e-waste", "drop-off", "deposit-return", "donate", "bulky", "medical"],
            },
            headline: {
              type: "string",
              description: "2-3 word label shown huge, e.g. 'Hazardous drop-off', 'E-waste', 'Return for deposit'.",
            },
            where: {
              type: "string",
              description: "Where to take it, max 15 words. Name a real program only if confident.",
            },
            how: { type: "string", description: "How to handle/transport it, max 15 words." },
            warning: {
              type: ["string", "null"],
              description: "Safety warning, max 12 words, or null.",
            },
          },
        },
      ],
    },
    details: {
      type: "object",
      additionalProperties: false,
      required: ["localRule", "whyItMatters", "commonMistake", "betterAlternative"],
      properties: {
        localRule: { type: "string", description: "What the local program says, max 28 words." },
        whyItMatters: { type: "string", description: "Environmental/processing reason, max 28 words." },
        commonMistake: { type: "string", description: "A mistake people make with this item, max 22 words." },
        betterAlternative: { type: "string", description: "A reuse/reduce tip, max 22 words." },
      },
    },
  },
} as const;
