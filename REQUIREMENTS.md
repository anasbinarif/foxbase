## Candidate Briefing — Extend the Codebase with Additive Filtering (Recommendations)

### Context

You will work in an existing TypeScript codebase that implements **reductive filtering** for a questionnaire-driven product selection system:

* Users answer a questionnaire.
* Each answer activates one or more **filters** that *reduce* the overall product set.
* The backend stack is **Node.js + Express + Postgres**, written in **TypeScript**.
* The system already supports evaluating a questionnaire and returning:

  * the filtered product list
  * the active (applied) reductive filters

Your task is to extend this system to support **additive filtering**.

---

# 1) What “additive filtering” means

Additive filtering is an **OR-related** concept to reductive filtering:

* **Reductive filtering**: selects products by progressively narrowing the list (logical **AND** across active filters).
* **Additive filtering**: selects **arbitrary subsets** of products triggered by answers and returns them **in addition to** (or alongside) the reductive result.

In other words, additive filtering allows the questionnaire to add products based on certain answers, rather than filtering down the list.

---

# 2) Functional requirements (minimum)

You must implement additive filtering such that:

### A) Configurable rules in Postgres

* Additive selection must be **config-driven**, stored in Postgres (no hardcoding).
* It must be possible to define that **Answer Option X** contributes a subset of products.

### B) Evaluation output

When evaluating a questionnaire, the API must return a **single result list** of products that includes:

* the products from reductive filtering (existing behavior)
* plus products selected by additive filtering (new behavior)

The final list must be:

* **deduplicated** by product ID
* ordered deterministically (define and document your rule)

### C) Behavior definition (you must choose and document)

The codebase currently returns the filtered products set. With additive filtering, you must define and document:

1. **Combination rule:**

   * Should additive-selected products be included even if they would be excluded by reductive filters?
     (Two valid approaches:
   * *Union approach:* final list = reductive set ∪ additive set
   * *Intersect approach:* additive products must also satisfy reductive filters)

2. **Sorting rule:**

   * How are results ordered if additive products are merged into the same list?
     (Examples: recommended first, then reductive; or stable by name/price; or weighted.)

You can pick the simplest approach—just document it clearly.

---

# 3) Suggested implementation scope

You are not expected to build a UI. Focus on backend correctness, clean design, and testability.

Extend the questionnaire evaluation use case to:

1. compute reductive results (existing)
2. compute additive product subset(s) based on selected answers (new)
3. return a merged list based on your documented combination rule

Keep it minimal and consistent.

---

# 4) Quality expectations

This task is intentionally aligned with how we work at FoxBase.

### What we will evaluate

* **Product thinking:** do you clarify vague parts before coding and document assumptions?
* **Reverse engineering:** can you find where to implement this without asking someone to explain the system?
* **Solution design:** clean separation (domain/application/infrastructure) and extensible approach.
* **TypeScript quality:** clear types, meaningful names, correct error handling.
* **Postgres design:** migration quality, constraints, indices if needed.
* **Testing:** at least one meaningful unit test and one integration-style test around the evaluation endpoint.
* **Incremental delivery mindset:** small shippable steps and backwards compatibility.

---

# 5) Deliverables

Please provide:

1. **DESIGN.md**

   * clarifying questions you would ask
   * your assumptions and chosen interpretation (especially combination + sorting rules)
   * schema changes and why
   * API changes with examples
   * rollout strategy (how you would ship safely)

2. **Code changes**

   * migrations
   * TypeScript implementation
   * tests

3. **Updated README**

   * how to run locally
   * how to run tests
   * how to exercise additive filtering with an example request

---

# 6) Example: what “additive” might look like (illustrative only)

If a user answers:

* “Building type: Roof”
* “Priority: Fast installation”

Reductive filters might narrow the list to roof-suitable products.

Additive filtering could additionally include:

* “Roof Foam Plus” and “Roof Wool Pro” because “Fast installation” is associated with those products.

Final output would include the union of both sets (or the intersect, depending on your documented choice), deduplicated, with stable ordering.

---

If you get stuck on unclear behavior, make a reasonable assumption, document it, and proceed with the simplest shippable implementation.
