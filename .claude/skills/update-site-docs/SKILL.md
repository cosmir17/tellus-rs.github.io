---
name: update-site-docs
description: Review every tellus change between the pinned release and a new one for statements on tellus.rs, and correct the affected pages on the pin branch. Use on a pin PR (branch pin/tellus-vX.Y.Z), or when asked to update the site docs for a tellus release.
---

# Update the site docs for a tellus release

The site states facts about tellus: contracts, behavior, configuration, API names, versions. A
release can make any of them false. This skill reviews every change since the last pin and
corrects the pages on the pin branch.

## 1. Find the range

Work on the pin branch, with the submodule at the new tag. The old pin is the one on `main`:

```shell
git -C tellus fetch --quiet --tags origin
old=$(git ls-tree origin/main tellus | awk '{print $3}')
new=$(git -C tellus rev-parse HEAD)
git -C tellus describe --tags --exact-match --match 'tellus-v*' "$old"
git -C tellus describe --tags --exact-match --match 'tellus-v*' "$new"
git -C tellus log --first-parent --reverse --format='%h %s' "$old..$new"
```

Every first-parent commit in that range is one item to review, a merged PR or a direct commit.
`scripts/pin-pr-body.sh <old tag> <new tag>` prints the same list as the PR's checklist.

## 2. Review each change

For each item, read the change itself, not only its title: `git -C tellus show --stat <merge>` for
the overview, then `git -C tellus diff <merge>^1 <merge> -- <paths>` for what matters. Record what a
user of tellus could notice:

- public API: added, removed or renamed items, changed signatures, new required items such as an
  associated type;
- behavior and contracts: doc comments of public items and `docs/*.md` in tellus, which state the
  contracts the site explains in simpler words;
- configuration: keys, defaults, validation;
- features and versions: Cargo features, MSRV, edition, dependency versions the site names;
- embedded code: examples and tests the site shows (step 4).

A change with nothing a user could notice (CI, benchmarks, investigations, internal refactoring)
gets "no site impact" with the reason. Release PRs only bump versions and changelogs; the landing
page reads the version from the submodule.

Notes in a PR's description (e.g. "a follow-up outside this repository") are hints. They raise an
item's priority; they never take one off the list.

## 3. Find the affected statements

Search everything that states facts about tellus, not only `content/`:

- `content/` (docs, tutorials, how-tos, explanations);
- `templates/index.html` (landing page prose);
- `snippets/` (landing page code not yet in tellus; a release may now provide its target source,
  see `snippets/README.md`);
- `static/llms.txt` (one line per docs page).

Search by identifier (`rg -n 'pipe_to_self|reply_to'`) and by concept (`rg -n -i 'mailbox is
full|dead letter'`), since a page often states a contract without naming the function. Read the
whole section around each hit: a statement can be false by omission, e.g. a list of what bypasses
the capacity which misses a new item.

## 4. Check the embedded code

`{{<example path=... anchor=...>}}` and `{{<code path=...>}}` read files from the submodule at the
new tag. `just all` fails on a missing file or anchor. Code which changed under the same anchor
passes, so diff the embedded files across the range and check that the prose around each changed
snippet still describes the code. `example` paths are relative to the submodule, `code` paths to
the site root:

```shell
{
    rg -o --no-filename '\{\{<example path="[^"]+"' content templates | sed 's/.*path="//; s/"$//'
    rg -o --no-filename '\{\{<code path="tellus/[^"]+"' content templates | sed 's/.*path="tellus\///; s/"$//'
} | sort -u | xargs git -C tellus diff --stat "$old" "$new" --
```

## 5. Write the corrections

Correct false or incomplete statements directly on the pin branch, following the writing style
rules. Keep each correction as small as the change it follows. Ask before adding a page, a
section or a how-to; whether one should exist is the user's decision. A new docs page also needs
its line in `static/llms.txt`. Do not commit; the user commits.

Run `just all` when done.

## 6. Report

Report per item, in range order:

- `tellus-rs/tellus#196 fix: ...`: changed `content/docs/how-to/call-async-code.md` (a piped
  result is no longer dropped by a full mailbox), ...
- `tellus-rs/tellus#188 ci: ...`: no site impact, CI only.

Then list what needs the user's decision (new pages, unclear statements). Once the user agrees
with the report, tick the reviewed items in the PR's checklist with `gh pr edit --body-file`.
