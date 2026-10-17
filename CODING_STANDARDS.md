# Coding Standards

Read only by `swarm:sdd-task-reviewer` and `swarm:sdd-final-reviewer`, which
check each diff against these rules and cite the rule in a finding.
Implementers do not read this file. Rules that lint, typecheck or format
enforce do not belong here: add the lint rule instead. Traps an implementer
must know before writing code (money, role checks) stay in `CLAUDE.md`.

A breach is Minor unless its rule says it blocks a merge.

## Comments

- A comment says why, what breaks otherwise, or which upstream bug it works
  around. A comment that says _what_ the code does is a finding: rename the
  code instead.

## Lint disables

- An `oxlint-disable` or `@ts-expect-error` needs a comment saying why the
  rule does not apply there. One without a reason is a finding.
