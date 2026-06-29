# Antigravity Workspace Rules

These rules apply when writing, reviewing, or editing blog posts in this repository.

## Rules for High-Impact Tech & AI Blog Posts

### 1. Close the Fowler/Schmid Gap (Concrete Code & Demos)
- **No Pseudo-Code**: Avoid abstract, simplified pseudo-code. All code blocks must be valid, production-grade code (e.g., compile-able TypeScript or Python).
- **Show "Before & After" Refactoring Diffs**: When discussing code improvements or design patterns, structure the explanation around a clear code diff (using markdown `diff` syntax).
- **Host Companion Repositories**: For post topics that involve setup, orchestration, or multi-file architecture, link to a companion GitHub repository.
- **Embed Live Demos**: For frontend, UI, layout, or configuration topics, include links to interactive sandboxes (e.g., StackBlitz, CodePen, or GitHub Pages previews).

### 2. Close the Schmid/AI Practitioner Gap (Metrics, Latency & Costs)
- **Never Make Unbacked Performance Claims**: Ground all claims of speed, efficiency, or quality in quantifiable metrics.
- **Include a Cost & Token Breakdown**: For any AI-driven workflow, outline the model used, token counts, cost, and latency.
- **Comparison Matrices**: When comparing tools, models, or architectures, include a structured evaluation matrix with explicit rating criteria or benchmark numbers.

### 3. Close the Karpathy/LLM Gap (Prompt Engineering & Raw Logs)
- **Publish the Exact Prompt**: Include the exact prompt, system instructions, or agent rule file that was used.
- **Use Collapsible Details for Logs**: Use HTML `<details>` tags for prompt histories so readers can expand and study them without cluttering the article:
  ```html
  <details>
    <summary>View the exact prompt template used</summary>
    
    ```markdown
    [Prompt content]
    ```
  </details>
  ```
- **Describe the Human-LLM Interaction Loop**: Reflect on the developer's workflow adjustments. Explain where the model failed, how you corrected it, and how the interaction changed your understanding of the codebase.
