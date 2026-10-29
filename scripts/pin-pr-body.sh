#!/usr/bin/env bash
set -euo pipefail

pinned=$1
latest=$2

echo "Pins tellus to \`$latest\`, from \`$pinned\`."
echo
echo "Review every change below for statements on the site before marking this ready, e.g. with"
echo "\`/update-site-docs\`."

older=$(gh pr list --state open --json number,headRefName \
    --jq ".[] | select((.headRefName | startswith(\"pin/\")) and .headRefName != \"pin/$latest\") | \"#\(.number)\"")
if [[ -n $older ]]; then
    echo
    echo "Supersedes $(echo "$older" | paste -sd ' ' -). Carry over the docs changes made there, then close it."
fi

echo
git -C tellus log --first-parent --reverse --format='%H %s' "$pinned..$latest" |
    while read -r sha subject; do
        number=$(sed -n 's/^Merge pull request #\([0-9]*\) .*/\1/p' <<< "$subject")
        if [[ -z $number ]]; then
            echo "- [ ] tellus-rs/tellus@${sha:0:7} $subject"
            continue
        fi
        gh pr view "$number" -R tellus-rs/tellus --json number,title \
            --jq '"- [ ] tellus-rs/tellus#\(.number) \(.title)"'
    done
