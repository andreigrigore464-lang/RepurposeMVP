# Feature Specification: Dynamic Template Configuration & Multi-Image Sourcing Pipeline

**Status**: Draft / RFC  
**Location**: `feature-specs/01_DYNAMIC_TEMPLATE_CONFIG_AND_MULTI_IMAGE_PIPELINE.md`  
**Created**: September 2026  
**Module**: Templates Studio, Workflow Runner, Scraper & Image Resolver  

---

## 1. Executive Summary & Objectives

This specification outlines the evolution of the Repurpose SaaS template system from a rigid 5-field structure (`headline`, `body`, `background`, `counter`, `logo`) into a **dynamic, multi-slot template engine**. 

### Primary Objectives:
1. **Per-Template Encapsulated Configuration**: Every template maintains its own independent dynamic field configuration. When carousels support multi-template composition (e.g. Slide 1 using Template A, Slides 2–5 using Template B), each template is configured standalone with zero cross-template coupling.
2. **Arbitrary Layer Mapping**: Allow templates to support any number of text and image layers (e.g. 3 text boxes, 2 image slots, 1 stat callout, 1 quote author).
3. **Advanced Prompt Customization**: Empower users in the Template Configurator to specify exact instructions for the AI on how to populate each text or image field.
4. **AI Unsplash Stock Sourcing**: Expand the media pipeline to source multiple images per article, seamlessly falling back to AI keyword-based Unsplash search when articles lack enough visuals.
5. **Deterministic "Configured" State Lifecycle**: Explicit save confirmation + at least 1 active (non-None) mapped layer to guarantee workflow safety.

---

## 2. Domain & Data Schema Architecture

### 2.1 Dynamic Template Field Schema
Instead of fixed database columns for layer names, `BrandTemplate.layerMappings` evolves into a typed configuration object supporting dynamic fields.

```typescript
export type LayerFieldType = "text" | "image" | "counter" | "badge";

export type SemanticRole =
  | "headline"          // Main hook or title
  | "body"              // Explanatory body or paragraph
  | "subheading"        // Supporting subtitle
  | "key_takeaway"      // Bulleted or bold takeaway
  | "statistic_callout" // Numeric highlight (e.g. "+45% YoY", "$1.2M")
  | "quote_author"      // Attribution or author name
  | "cta_button"        // Call to action button text
  | "hero_image"        // Main background or primary visual
  | "secondary_image"   // Diagram, screenshot, or inline graphic
  | "brand_logo"        // Workspace logo or avatar
  | "slide_counter"     // Page indexation (e.g. "01 / 05")
  | "custom";           // Custom user-defined prompt role

export interface TemplateFieldConfig {
  id: string;                      // Unique ID for the field mapping
  layerKey: string;                // Templated.io canvas layer key (e.g. "text-1", "image-2")
  type: LayerFieldType;            // Text vs Image vs Counter
  role: SemanticRole;              // High-level purpose for the LLM
  label: string;                   // Human readable label shown in UI
  promptInstruction?: string;      // Custom guidance (e.g. "Extract a 2-word statistic")
  characterLimit?: number;         // Safe character limit to prevent canvas clipping
  isRequired?: boolean;            // Whether workflow execution fails if empty
}

export interface DynamicTemplateConfig {
  version: 2;
  isConfigured: boolean;
  configuredAt?: string;
  fields: TemplateFieldConfig[];
}
```

---

## 3. Template Configuration Lifecycle (Configured vs. Not Configured)

### 3.1 Three-Pillar Validation Rule
A template is marked **🟢 Configured (Green)** if and only if:
1. **Explicit Review**: The user has clicked "Save Configuration" in the Template Studio (`isConfigured === true`).
2. **Active Content Layer**: At least **1 active content field** (text or image) is mapped to a valid canvas layer (not all fields set to `None / Disabled`).
3. **Canvas Layer Integrity**: The mapped `layerKey` values exist within the template's current Templated.io canvas layer schema.

```
                  ┌──────────────────────────────────────────────┐
                  │       Template Validation Evaluation         │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
        [ Explicit Save ]       [ Active Content ]      [ Canvas Integrity ]
        User confirmed & saved   At least 1 mapped slot  Layer key exists in
        in the Configurator      is not "None / Disabled" Templated.io schema
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                       ┌─────────────────┴─────────────────┐
                       ▼                                   ▼
             🟢 Configured (Green)               🔴 Not Configured (Red)
            - Safe for Workflows                - Blocked in Workflows
            - Quick Test Ready                  - Shows "Configure Now →"
```

---

## 4. UI / UX Design: Template Studio Configurator

### 4.1 Tri-Mode Configuration Slider (`Auto` | `Simple` | `Advanced`)

The Template Configurator features a prominent **3-option segmented slider / tab selector** at the top of the modal, giving users full flexibility from 1-click zero-touch automation to deep per-layer prompt engineering:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Configure Template: Modern Tech Carousel (1:1)                        │
├────────────────────────────────────────────────────────────────────────┤
│  Configuration Mode:                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [ ✨ Auto (Smart Auto-Fill) ]   [ 🎯 Simple ]   [ ⚡ Advanced ]  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ── Mode 1: Auto (Smart Heuristic Auto-Fill) ───────────────────────── │
│  • Instantly inspects Templated.io canvas font sizes & geometries.     │
│  • Auto-detects & populates Headline (largest font), Body, & BG.       │
│  • 1-click setup for rapid onboarding with zero manual dropdowns.      │
│                                                                        │
│  ── Mode 2: Simple (Visual Semantic Dropdowns) ─────────────────────── │
│  • Lists all canvas layers with intuitive role dropdowns.              │
│  • User explicitly maps roles: Headline, Body, Stat, Hero Photo, Logo. │
│  • Includes "None / Disabled" option for every single layer.           │
│                                                                        │
│  ── Mode 3: Advanced (Custom AI Prompting & Fine-Tuning) ───────────── │
│  • Everything in Simple Mode PLUS expandable per-layer prompt boxes.   │
│  • Custom extraction prompts (e.g. "Extract a 2-word metric +45% YoY").│
│  • Custom image visual themes (e.g. "3D isometric server graphics").   │
│  • Character limit bounds to prevent canvas text overflow.             │
├────────────────────────────────────────────────────────────────────────┤
│  [ Cancel ]                                 [ Save Configuration (🟢) ]│
└────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Breakdown of the 3 Modes:

1. **✨ Auto Mode (Smart Heuristic Auto-Fill)**:
   - Evaluates the template's live canvas layer schema:
     - Text layer with largest font size &ge; 40px &rarr; Headline Hook.
     - Text layer with second largest font size &rarr; Body Copy.
     - Image layer with largest canvas coverage &rarr; Background Hero Image.
     - Layer named `logo` or `brand` &rarr; Workspace Brand Logo.
     - Text layer named `counter` or `page` &rarr; Slide Counter.
   - Automatically populates the field assignments with 1 click, allowing immediate review and saving.

2. **🎯 Simple Mode (Manual Semantic Dropdown Mapping)**:
   - Displays all detected canvas layers in a clean, categorized table.
   - Each layer features a dropdown menu with semantic presets:
     - `Headline / Slide Hook`
     - `Body Copy / Takeaway`
     - `Subheading / Secondary Text`
     - `Key Metric / Statistic`
     - `Hero Background Visual`
     - `Secondary Graphic / Diagram`
     - `Brand Logo / Avatar`
     - `Slide Counter Index (01 / 06)`
     - `None / Disabled` (Supported on all fields)

3. **⚡ Advanced Mode (Per-Layer Custom AI Prompting & Formatting)**:
   - Expands each mapped layer into a dedicated tuning card with:
     - **Custom Prompt Instruction**: Instructs Gemini how to extract or formulate content for this specific slot (e.g., *"Summarize the core counter-argument from section 2 in under 12 words"*).
     - **Visual Search Query Directives** (for image slots): Guides Unsplash stock search (e.g., *"Search for minimalist dark workspace desk setups"*).
     - **Character Caps & Constraints**: Sets hard length bounds (e.g. Max 60 chars) to prevent bounding-box text clipping in Templated.io.
     - **Required vs. Optional Toggle**: Defines whether workflow execution can proceed if this slot is empty.

---

## 5. Dynamic LLM Prompting & Schema Generation

When executing a workflow for a specific template, the backend dynamically constructs Gemini's `responseSchema` based on the template's active field configurations:

```typescript
// Dynamic JSON Schema generation per slide
function buildGeminiSlideSchema(fields: TemplateFieldConfig[]) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const field of fields) {
    if (field.type === "text") {
      properties[field.layerKey] = {
        type: "string",
        description: field.promptInstruction || `Content for ${field.role}`,
      };
      if (field.isRequired) required.push(field.layerKey);
    } else if (field.type === "image") {
      properties[`${field.layerKey}_search_query`] = {
        type: "string",
        description: `Search query for ${field.role} (e.g. keywords for stock search)`,
      };
    }
  }

  return {
    type: "object",
    properties,
    required,
  };
}
```

---

## 6. Multi-Image Sourcing & Resolution Pipeline

Articles frequently contain 0 to 4 images, but templates may require multiple visuals across several slides. The image resolver applies a tiered sourcing strategy:

```
                          ┌──────────────────────────┐
                          │   Article Scraper Body   │
                          └────────────┬─────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     [ 1. Embedded Article Images ]                [ 2. AI Keyword Sourcing ]
     - Hero / Featured Image                       - Generated per-slot by Gemini
     - Inline <figure> / <img> elements            - Queries Unsplash / Pexels API
     - OpenGraph / Twitter Cards                   - Strict Aspect Ratio Match
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                       [ 3. Cloudinary Optimization ]
                       - Smart gravity crop (g_auto)
                       - Aspect ratio normalization
                       - WebP / PNG delivery
                                       │
                                       ▼
                       [ 4. Fallback Brand Palette ]
                       - If slot fails or disabled:
                         Solid brand kit fill
```

---

## 7. Workflow Guard & Routing

1. In `/workflows/new`, templates are displayed with real-time badges (🟢 Configured / 🔴 Not Configured).
2. Selecting an unconfigured template blocks workflow creation and displays the modal:
   > *"This template requires layer mapping configuration."*
3. Clicking **"Configure Template Now"** saves workflow form inputs to `sessionStorage` and navigates to `/templates?configure=<id>&returnTo=/workflows/new`.
4. Upon return, the workflow state is automatically rehydrated with zero progress lost.

---

## 8. Implementation Phases & Milestones

- **Phase 1: Dynamic Field Schema & Studio UI**: Build dynamic layer list with Simple/Advanced modes and None support.
- **Phase 2: Dynamic LLM Generator**: Update Gemini provider to compile dynamic prompt schemas from active template fields.
- **Phase 3: Multi-Image Ingestion & Smart Sourcing**: Support multi-slot image extraction and per-slot Unsplash search.
- **Phase 4: End-to-End Workflow Testing**: Verify 1-slide quote cards, multi-image slides, and multi-slide carousels.
