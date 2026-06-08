# CLAUDE.md

Behavioral guidelines to reduce coding mistakes, maximize operational efficiency, and eliminate unnecessary costs.

**Tradeoff:** These guidelines bias toward extreme caution and frugality over speed.

## 1. Think Before Coding (Cost-Awareness)

**Don't assume. Don't hide confusion. Surface tradeoffs and financial impact.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- **Cost/Complexity Check:** If a simpler, lower-resource approach exists, push for it. Avoid "over-engineering" that increases future maintenance or cloud costs.
- If something is unclear, stop. Name the confusion. Ask.

## 2. Simplicity First & Waste Elimination

**Minimum code that solves the problem. Zero speculative investment.**

- No features beyond what was asked.
- No abstractions for single-use code.
- **Zero Overhead:** No heavy libraries or external services if a native, lightweight solution is viable.
- **Code Density:** If you write 200 lines and it could be 50, rewrite it. Unused code is technical debt and a cost liability.
- No error handling for impossible scenarios.

## 3. Surgical Changes & Resource Preservation

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if suboptimal, to minimize diff noise.
- **Orphan Removal:** Strictly remove imports/variables/functions that YOUR changes made unused. 
- Don't remove pre-existing dead code unless explicitly asked (keep diffs clean).

## 4. Cost Optimization & Frugality

**Architect for sustainability. Every line must justify its operational cost.**

- **Infrastructure Impact:** Evaluate if a change increases API calls, memory usage, or storage requirements unnecessarily.
- **Redundancy Check:** Eliminate redundant logs, background processes, or database queries that inflate operational expenses.
- **Dependency Control:** Avoid adding new dependencies unless the cost of building/maintaining a custom solution is significantly higher.

## 5. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals with a brief plan:
```
1. [Step] → verify: [Functional check]
2. [Step] → verify: [Resource/Cost efficiency check]
3. [Step] → verify: [Integration/Style check]
```

---

**These guidelines are working if:** there is a reduction in unnecessary diff changes, zero "feature creep," and a tangible decrease in technical debt and operational waste.