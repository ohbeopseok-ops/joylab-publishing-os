# JoyLab Release Rule V1

## Core rule
No pull request may be merged into `main` until the required Build gate is completed successfully.

## Required sequence
1. Open PR against `main`.
2. Required status checks run.
3. `Build` must conclude `success`.
4. Any repository-specific required gate must also conclude `success`.
5. Only then may the PR move from Draft to Ready.
6. Merge only when the PR is mergeable and required checks are green.
7. After merge, verify the resulting `main` commit through the normal post-merge / deploy checks.

## Prohibited shortcuts
- Do not merge while `Build` is queued or in progress.
- Do not override a failing GOLD baseline merely to land a change.
- Do not treat a partial pass as GREEN.
- Do not bypass required checks for routine maintenance.
- Do not label a release GOLD based only on a successful merge.

## Merge Gate V1
A PR is eligible for merge only when all of the following are true:
- draft = false
- mergeable = true
- required Build = success
- all explicitly required repository gates = success
- head SHA used for approval is still the current head SHA
- no newly introduced blocker is known

Recommended merge mode: squash, unless repository history requires another method.

## Main verification
After merge:
- verify the merge commit exists on `main`
- allow post-merge/deploy workflows to run
- if a production/deploy gate fails, treat the release as not GOLD until resolved

## Authority
This rule is the default JoyLab release rule. Repository-specific rules may be stricter, but not weaker.
