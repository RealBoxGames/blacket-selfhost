#!/bin/bash
set -e

submodules=$(git config --file .gitmodules --get-regexp path | awk '{ print $2 }')

updated=false

for submodule in $submodules; do
    echo "Checking submodule: $submodule"
    (
        cd "$submodule"
        git fetch origin

        current_branch=$(git rev-parse --abbrev-ref HEAD)
        if [ "$current_branch" != "master" ]; then
            git checkout master
            git pull origin master
            if ! git merge --no-commit --no-ff "$current_branch" >/dev/null 2>&1; then
                echo "No changes to merge from $current_branch to master in $submodule."
                git merge --abort || true
            else
                git merge "$current_branch"
                git push origin master
                updated=true
                echo "Merged $current_branch into master and pushed for $submodule."
            fi
        else
            echo "Already on master in $submodule."
        fi
    )
done

if $updated; then
    git add $submodules
    git commit -m "Update submodules: merged branches into master"
    echo "Submodules updated and committed. You can now merge the pull request."
else
    echo "No submodule changes detected. Nothing to commit."
fi