#!/usr/bin/env bash
set -euo pipefail

base=https://tellus.rs
pages=$(find content/docs -name '*.md' ! -name '_index.md' | sed -e "s|^content|$base|" -e 's|\.md$|/|' | sort)
listed=$(grep -o "$base/docs/[^)]*" static/llms.txt | sort -u)
built=$(grep -o '<loc>[^<]*' public/sitemap.xml | sed 's|<loc>||' | sort)

missing=$(comm -23 <(echo "$pages") <(echo "$listed"))
stale=$(comm -23 <(echo "$listed") <(echo "$built"))

if [[ -n $missing ]]; then
    echo "docs pages missing from static/llms.txt:" >&2
    echo "$missing" >&2
fi
if [[ -n $stale ]]; then
    echo "links in static/llms.txt to pages which do not exist:" >&2
    echo "$stale" >&2
fi
[[ -z $missing && -z $stale ]]
