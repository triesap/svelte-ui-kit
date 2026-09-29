# Commit-sized step report

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Step ID and title:
Contract/requirement IDs:
Actual target root and branch:
Starting commit / baseline status:

#### Implemented

Exact behavior added or changed:
Files changed (including generated fixtures/contracts):
How changes stay within the scheduled scope:

#### Verified

Commands executed verbatim, working directory, relevant tool versions, exit status and result:
Tests added/updated and what each demonstrates:
Generated-app/type/build/browser/package checks, as applicable:
Cargo check/test/fmt/repo checks, or explicit N/A with manifest inventory:
Ignored/skipped tests, named exactly and not described as passing:
Self-review and staged-diff findings:

#### Exceptions

Pre-existing/out-of-scope/environmental failures with evidence:
Unverified behavior and release impact:
Deviations with record ID and repository evidence:
Unresolved issues:

#### Commit and next action

Actual commit hash and message:
Structured `checkpoint-evidence` record (exactly one per report/review; schema version 1; never fabricate acceptance). Before acceptance use report `candidate`, review `changes_requested`, null commit; `verified_uncommitted` uses report `implemented`, review `accepted`, null commit; `complete` uses both dispositions with the matching full post-commit hash. Malformed, non-object, duplicate and unterminated live attempts are rejected in every state, and a null completion projection is required until `complete`:
Requirements/test evidence updated:
Next step ID:
Is the next step safe to begin? yes/no, with reason:

Name the source-comparison method and its actual coverage (for example, which
fields a parser compared) rather than claiming a broader equivalence than was
tested. Never substitute “tests passed” for actual commands/results. Do not
claim a CI/platform check ran locally if it did not. A report is evidence, not a
waiver of acceptance.
