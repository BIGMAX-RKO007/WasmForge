extern crate alloc;

use alloc::borrow::ToOwned;
use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Clone)]
pub struct GitCommand {
    pub id: &'static str,
    pub category: &'static str,
    pub title: &'static str,
    pub command: &'static str,
    pub description: &'static str,
    pub flags: &'static str,
    #[serde(rename = "isDestructive")]
    pub is_destructive: bool,
    pub tags: &'static [&'static str],
}

#[derive(Serialize, Clone)]
pub struct GitScenario {
    pub id: &'static str,
    pub problem: &'static str,
    pub solution: &'static str,
    pub explanation: &'static str,
    pub category: &'static str,
    pub commands: &'static [&'static str],
}

#[derive(Serialize)]
pub struct CategoryInfo {
    pub id: &'static str,
    pub name: &'static str,
    pub count: usize,
}

static GIT_COMMANDS: &[GitCommand] = &[
    // --- Setup & Configuration ---
    GitCommand {
        id: "config-user",
        category: "setup",
        title: "Set global user name and email",
        command: "git config --global user.name \"Name\"\ngit config --global user.email \"email@example.com\"",
        description: "Configure author identity across all repositories on this machine.",
        flags: "--global",
        is_destructive: false,
        tags: &["config", "setup", "user", "email"],
    },
    GitCommand {
        id: "config-default-branch",
        category: "setup",
        title: "Set default initial branch name to main",
        command: "git config --global init.defaultBranch main",
        description: "Ensure newly initialized repos use 'main' instead of 'master'.",
        flags: "--global",
        is_destructive: false,
        tags: &["config", "setup", "branch", "main"],
    },
    GitCommand {
        id: "config-list",
        category: "setup",
        title: "List all global and local configs",
        command: "git config --list --show-origin",
        description: "Display all configuration key-value pairs and the exact file they originate from.",
        flags: "--list --show-origin",
        is_destructive: false,
        tags: &["config", "inspect", "list"],
    },
    GitCommand {
        id: "init-repo",
        category: "setup",
        title: "Initialize a new Git repository",
        command: "git init",
        description: "Create an empty Git repository or reinitialize an existing one in current directory.",
        flags: "",
        is_destructive: false,
        tags: &["init", "create", "start"],
    },
    GitCommand {
        id: "clone-repo",
        category: "setup",
        title: "Clone a remote repository with submodules",
        command: "git clone --recurse-submodules <url>",
        description: "Clone repository from URL and automatically initialize & clone all nested submodules.",
        flags: "--recurse-submodules",
        is_destructive: false,
        tags: &["clone", "remote", "submodules"],
    },

    // --- Basic Workflow ---
    GitCommand {
        id: "status-short",
        category: "basic",
        title: "View concise working tree status",
        command: "git status -sb",
        description: "Display git status in short format showing tracking branch and modified files.",
        flags: "-sb",
        is_destructive: false,
        tags: &["status", "check", "working-tree"],
    },
    GitCommand {
        id: "add-all",
        category: "basic",
        title: "Stage all tracked and untracked changes",
        command: "git add -A",
        description: "Stage modifications, new files, and deletions across the entire repository.",
        flags: "-A",
        is_destructive: false,
        tags: &["add", "stage", "commit"],
    },
    GitCommand {
        id: "add-patch",
        category: "basic",
        title: "Interactively choose hunks of changes to stage",
        command: "git add -p",
        description: "Allows staging specific chunks/diffs of a file individually.",
        flags: "-p",
        is_destructive: false,
        tags: &["add", "stage", "interactive", "patch"],
    },
    GitCommand {
        id: "commit-msg",
        category: "basic",
        title: "Record changes to the repository",
        command: "git commit -m \"feat: brief message describing change\"",
        description: "Create a new commit recording current staged snapshot.",
        flags: "-m",
        is_destructive: false,
        tags: &["commit", "save", "record"],
    },
    GitCommand {
        id: "diff-working",
        category: "basic",
        title: "View unstaged changes vs index",
        command: "git diff",
        description: "Inspect line-by-line differences between working tree and staged index.",
        flags: "",
        is_destructive: false,
        tags: &["diff", "compare", "changes"],
    },
    GitCommand {
        id: "diff-staged",
        category: "basic",
        title: "View staged changes vs last commit",
        command: "git diff --staged",
        description: "Inspect changes that are staged and about to be included in the next commit.",
        flags: "--staged",
        is_destructive: false,
        tags: &["diff", "staged", "cached"],
    },

    // --- Branching & Merging ---
    GitCommand {
        id: "branch-list",
        category: "branch",
        title: "List all local and remote branches",
        command: "git branch -a -vv",
        description: "List all local and remote-tracking branches with last commit SHA and tracking info.",
        flags: "-a -vv",
        is_destructive: false,
        tags: &["branch", "list", "remote"],
    },
    GitCommand {
        id: "branch-create-switch",
        category: "branch",
        title: "Create and switch to a new branch",
        command: "git switch -c <new-branch-name>",
        description: "Create a new branch from current HEAD and immediately checkout to it.",
        flags: "-c",
        is_destructive: false,
        tags: &["branch", "switch", "checkout", "create"],
    },
    GitCommand {
        id: "branch-delete-safe",
        category: "branch",
        title: "Safely delete a merged branch",
        command: "git branch -d <branch-name>",
        description: "Delete a local branch only if it has already been fully merged into upstream.",
        flags: "-d",
        is_destructive: false,
        tags: &["branch", "delete", "cleanup"],
    },
    GitCommand {
        id: "branch-delete-force",
        category: "branch",
        title: "Force delete an unmerged branch",
        command: "git branch -D <branch-name>",
        description: "Delete a local branch regardless of its merge status.",
        flags: "-D",
        is_destructive: true,
        tags: &["branch", "delete", "force"],
    },
    GitCommand {
        id: "merge-no-ff",
        category: "branch",
        title: "Merge branch creating an explicit merge commit",
        command: "git merge --no-ff <branch-name>",
        description: "Always create a merge commit even if fast-forward is possible, preserving branch topology.",
        flags: "--no-ff",
        is_destructive: false,
        tags: &["merge", "no-ff", "history"],
    },
    GitCommand {
        id: "merge-abort",
        category: "branch",
        title: "Abort merge and restore pre-merge state",
        command: "git merge --abort",
        description: "Exit current conflicted merge and reset files to state prior to merge start.",
        flags: "--abort",
        is_destructive: true,
        tags: &["merge", "abort", "conflict"],
    },

    // --- Stashing ---
    GitCommand {
        id: "stash-push-untracked",
        category: "stash",
        title: "Stash changes including untracked files",
        command: "git stash push -u -m \"work-in-progress\"",
        description: "Save modified tracked files and untracked new files into stash with description.",
        flags: "-u -m",
        is_destructive: false,
        tags: &["stash", "save", "untracked"],
    },
    GitCommand {
        id: "stash-list",
        category: "stash",
        title: "List all stashed snapshots",
        command: "git stash list",
        description: "Display all entries in stash stack with index (stash@{0}, stash@{1}).",
        flags: "list",
        is_destructive: false,
        tags: &["stash", "list", "view"],
    },
    GitCommand {
        id: "stash-pop",
        category: "stash",
        title: "Apply latest stash and remove from stack",
        command: "git stash pop",
        description: "Re-apply changes from top of stash stack onto working tree and delete the stash entry.",
        flags: "pop",
        is_destructive: false,
        tags: &["stash", "pop", "apply"],
    },
    GitCommand {
        id: "stash-drop",
        category: "stash",
        title: "Discard a specific stash entry",
        command: "git stash drop stash@{0}",
        description: "Permanently delete the specified stash entry from the stack.",
        flags: "drop",
        is_destructive: true,
        tags: &["stash", "drop", "delete"],
    },

    // --- History & Logs ---
    GitCommand {
        id: "log-graph",
        category: "history",
        title: "Pretty one-line commit log graph",
        command: "git log --graph --oneline --decorate --all",
        description: "Show a clean ASCII branch topology graph of all local and remote branches.",
        flags: "--graph --oneline --decorate --all",
        is_destructive: false,
        tags: &["log", "graph", "history", "oneline"],
    },
    GitCommand {
        id: "log-author",
        category: "history",
        title: "Filter commits by author or date",
        command: "git log --author=\"Alex\" --since=\"2 weeks ago\"",
        description: "Search commits written by specific contributor within given relative time frame.",
        flags: "--author --since",
        is_destructive: false,
        tags: &["log", "author", "date", "search"],
    },
    GitCommand {
        id: "blame-line",
        category: "history",
        title: "Show commit and author for each line in file",
        command: "git blame -L 10,25 path/to/file.rs",
        description: "Inspect who last modified lines 10 to 25 and in which commit.",
        flags: "-L",
        is_destructive: false,
        tags: &["blame", "author", "inspect", "line"],
    },
    GitCommand {
        id: "reflog",
        category: "history",
        title: "View reference logs of HEAD movements",
        command: "git reflog",
        description: "Show chronological history of HEAD pointer updates, useful to recover lost commits.",
        flags: "",
        is_destructive: false,
        tags: &["reflog", "recover", "lost", "undo"],
    },

    // --- Undoing & Resetting ---
    GitCommand {
        id: "commit-amend",
        category: "undo",
        title: "Amend last commit with staged changes or new message",
        command: "git commit --amend --no-edit",
        description: "Fold newly staged changes into the most recent commit without altering commit message.",
        flags: "--amend --no-edit",
        is_destructive: false,
        tags: &["amend", "commit", "modify", "undo"],
    },
    GitCommand {
        id: "restore-file",
        category: "undo",
        title: "Discard unstaged modifications in a file",
        command: "git restore path/to/file.ext",
        description: "Revert uncommitted modifications in working tree back to last committed state.",
        flags: "",
        is_destructive: true,
        tags: &["restore", "discard", "undo", "revert"],
    },
    GitCommand {
        id: "restore-staged",
        category: "undo",
        title: "Unstage a file keeping modifications intact",
        command: "git restore --staged path/to/file.ext",
        description: "Remove file from staging area without touching working tree changes.",
        flags: "--staged",
        is_destructive: false,
        tags: &["restore", "unstage", "reset"],
    },
    GitCommand {
        id: "reset-soft",
        category: "undo",
        title: "Undo last commit but keep changes staged",
        command: "git reset --soft HEAD~1",
        description: "Move HEAD back by 1 commit. Working directory and staging area remain unchanged.",
        flags: "--soft",
        is_destructive: false,
        tags: &["reset", "soft", "undo", "commit"],
    },
    GitCommand {
        id: "reset-hard",
        category: "undo",
        title: "Completely discard last commit and all changes",
        command: "git reset --hard HEAD~1",
        description: "Move HEAD back by 1 commit, discarding both index and working tree changes permanently.",
        flags: "--hard",
        is_destructive: true,
        tags: &["reset", "hard", "discard", "danger"],
    },
    GitCommand {
        id: "revert-commit",
        category: "undo",
        title: "Safely revert a public commit by creating inverse commit",
        command: "git revert <commit-sha>",
        description: "Apply inverse changes of specified commit as a new commit, preserving collaborative history.",
        flags: "",
        is_destructive: false,
        tags: &["revert", "safe", "undo", "public"],
    },

    // --- Remote & Collaboration ---
    GitCommand {
        id: "remote-list",
        category: "remote",
        title: "List configured remote repositories",
        command: "git remote -v",
        description: "View remote names and their fetch/push URLs.",
        flags: "-v",
        is_destructive: false,
        tags: &["remote", "url", "origin"],
    },
    GitCommand {
        id: "fetch-prune",
        category: "remote",
        title: "Fetch remotes and prune deleted remote branches",
        command: "git fetch -p --all",
        description: "Download objects and clean up stale local tracking refs that no longer exist on remote.",
        flags: "-p --all",
        is_destructive: false,
        tags: &["fetch", "prune", "cleanup", "remote"],
    },
    GitCommand {
        id: "pull-rebase",
        category: "remote",
        title: "Pull upstream changes using rebase",
        command: "git pull --rebase origin <branch>",
        description: "Replay local commits on top of freshly fetched remote branch, avoiding merge clutter.",
        flags: "--rebase",
        is_destructive: false,
        tags: &["pull", "rebase", "remote", "clean-history"],
    },
    GitCommand {
        id: "push-set-upstream",
        category: "remote",
        title: "Push new branch and link upstream tracking",
        command: "git push -u origin <branch-name>",
        description: "Push local branch to remote repository and set it as upstream tracking branch.",
        flags: "-u",
        is_destructive: false,
        tags: &["push", "upstream", "remote"],
    },
    GitCommand {
        id: "push-force-lease",
        category: "remote",
        title: "Safely force push with lease",
        command: "git push --force-with-lease origin <branch-name>",
        description: "Force push rewritten branch only if remote ref hasn't been updated by someone else.",
        flags: "--force-with-lease",
        is_destructive: true,
        tags: &["push", "force", "lease", "safe-force"],
    },

    // --- Tagging & Advanced ---
    GitCommand {
        id: "tag-annotated",
        category: "advanced",
        title: "Create annotated release tag",
        command: "git tag -a v1.0.0 -m \"Release version 1.0.0\"",
        description: "Create an annotated tag containing author, date, and release message.",
        flags: "-a -m",
        is_destructive: false,
        tags: &["tag", "release", "version"],
    },
    GitCommand {
        id: "tag-push",
        category: "advanced",
        title: "Push specific tag or all tags to remote",
        command: "git push origin v1.0.0\n# or push all tags:\ngit push origin --tags",
        description: "Publish local release tags to remote origin.",
        flags: "--tags",
        is_destructive: false,
        tags: &["tag", "push", "release"],
    },
    GitCommand {
        id: "cherry-pick",
        category: "advanced",
        title: "Apply a specific commit from another branch",
        command: "git cherry-pick <commit-sha>",
        description: "Pick changes from an arbitrary commit and apply them directly onto current branch.",
        flags: "",
        is_destructive: false,
        tags: &["cherry-pick", "commit", "port"],
    },
    GitCommand {
        id: "rebase-interactive",
        category: "advanced",
        title: "Interactive rebase last N commits",
        command: "git rebase -i HEAD~3",
        description: "Squash, reword, drop, or edit the last 3 commits in an interactive editor.",
        flags: "-i",
        is_destructive: true,
        tags: &["rebase", "interactive", "squash", "clean"],
    },
    GitCommand {
        id: "clean-untracked",
        category: "advanced",
        title: "Remove untracked files and directories",
        command: "git clean -fd",
        description: "Permanently delete untracked files and directories from working tree.",
        flags: "-fd",
        is_destructive: true,
        tags: &["clean", "untracked", "delete", "prune"],
    },
];

static GIT_SCENARIOS: &[GitScenario] = &[
    GitScenario {
        id: "undo-commit-keep-changes",
        problem: "I committed changes by accident, but want to keep all modified code in files",
        solution: "Use soft reset to uncommit while keeping everything staged",
        explanation: "HEAD moves back one commit, but all files stay staged and uncommitted.",
        category: "undo",
        commands: &["git reset --soft HEAD~1"],
    },
    GitScenario {
        id: "undo-commit-discard-all",
        problem: "I made a commit that was completely wrong and want to wipe it out permanently",
        solution: "Use hard reset to destroy the commit and reset files",
        explanation: "Warning: All uncommitted edits and the last commit will be deleted.",
        category: "undo",
        commands: &["git reset --hard HEAD~1"],
    },
    GitScenario {
        id: "fix-commit-message",
        problem: "I just committed and realized I made a typo in the commit message",
        solution: "Amend the commit with a corrected message",
        explanation: "Overwrites the latest commit without changing file contents.",
        category: "undo",
        commands: &["git commit --amend -m \"docs: corrected message\""],
    },
    GitScenario {
        id: "discard-local-file-changes",
        problem: "I modified a local file and want to reset it back to repository clean state",
        solution: "Restore the file from HEAD",
        explanation: "Reverts the file in working tree without touching other files.",
        category: "undo",
        commands: &["git restore <filename>"],
    },
    GitScenario {
        id: "stash-include-untracked",
        problem: "I have new untracked files that git stash ignores by default",
        solution: "Pass the -u / --include-untracked flag",
        explanation: "Captures both modified tracked files and newly created untracked files.",
        category: "stash",
        commands: &["git stash push -u -m \"work-in-progress\""],
    },
    GitScenario {
        id: "rename-branch-both-sides",
        problem: "How do I rename a branch locally and update the remote branch?",
        solution: "Rename locally, push new name, delete old remote name",
        explanation: "Standard three-step process to safely update remote branch reference.",
        category: "branch",
        commands: &[
            "git branch -m <old-name> <new-name>",
            "git push origin -u <new-name>",
            "git push origin --delete <old-name>",
        ],
    },
    GitScenario {
        id: "recover-deleted-commit",
        problem: "I accidentally ran git reset --hard and lost my commits",
        solution: "Find the commit SHA in git reflog and restore it",
        explanation: "Git preserves all HEAD movements in the reflog for at least 30-90 days.",
        category: "history",
        commands: &[
            "git reflog",
            "git checkout -b recovered-branch <commit-sha>",
        ],
    },
    GitScenario {
        id: "squash-commits-into-one",
        problem: "I have 4 messy WIP commits on my feature branch and want 1 clean commit",
        solution: "Interactive rebase to squash commits",
        explanation: "Keep the first commit as 'pick', change subsequent ones to 'squash' (or 's').",
        category: "advanced",
        commands: &[
            "git rebase -i HEAD~4",
        ],
    },
    GitScenario {
        id: "sync-fork-with-upstream",
        problem: "How do I update my GitHub fork with new commits from original upstream repository?",
        solution: "Add upstream remote, fetch and rebase",
        explanation: "Brings your fork's main branch up-to-date with upstream changes.",
        category: "remote",
        commands: &[
            "git remote add upstream <original-repo-url>",
            "git fetch upstream",
            "git checkout main",
            "git rebase upstream/main",
            "git push origin main",
        ],
    },
];

#[derive(Serialize)]
pub struct GitListResponse {
    pub total: usize,
    pub commands: Vec<GitCommand>,
}

#[derive(Serialize)]
pub struct GitScenarioResponse {
    pub total: usize,
    pub scenarios: Vec<GitScenario>,
}

#[derive(Serialize)]
pub struct GitSearchResult {
    pub query: String,
    #[serde(rename = "matchedCommands")]
    pub matched_commands: Vec<GitCommand>,
    #[serde(rename = "matchedScenarios")]
    pub matched_scenarios: Vec<GitScenario>,
}

#[derive(Debug, Deserialize)]
struct RequestEnvelope {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct ResponseEnvelope<T> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId")]
    request_id: String,
    data: Option<T>,
}

fn contains_ci(haystack: &str, needle: &str) -> bool {
    let needle_lower = needle.to_lowercase();
    let hay_lower = haystack.to_lowercase();
    hay_lower.contains(&needle_lower)
}

pub fn get_categories() -> Vec<CategoryInfo> {
    let cats = [
        ("setup", "Setup & Config"),
        ("basic", "Basic Workflow"),
        ("branch", "Branching & Merging"),
        ("stash", "Stashing"),
        ("history", "History & Logs"),
        ("undo", "Undoing & Reset"),
        ("remote", "Remote & Sync"),
        ("advanced", "Advanced & Tags"),
    ];

    cats.iter()
        .map(|(id, name)| {
            let count = GIT_COMMANDS.iter().filter(|c| c.category == *id).count();
            CategoryInfo {
                id,
                name,
                count,
            }
        })
        .collect()
}

pub fn list_commands(cat_filter: Option<&str>, keyword_filter: Option<&str>) -> Vec<GitCommand> {
    GIT_COMMANDS
        .iter()
        .filter(|cmd| {
            if let Some(cat) = cat_filter {
                if !cat.is_empty() && cat != "all" && cmd.category != cat {
                    return false;
                }
            }
            if let Some(kw) = keyword_filter {
                if !kw.is_empty() {
                    let in_title = contains_ci(cmd.title, kw);
                    let in_cmd = contains_ci(cmd.command, kw);
                    let in_desc = contains_ci(cmd.description, kw);
                    let in_tags = cmd.tags.iter().any(|t| contains_ci(t, kw));
                    if !in_title && !in_cmd && !in_desc && !in_tags {
                        return false;
                    }
                }
            }
            true
        })
        .cloned()
        .collect()
}

pub fn list_scenarios(keyword_filter: Option<&str>) -> Vec<GitScenario> {
    GIT_SCENARIOS
        .iter()
        .filter(|s| {
            if let Some(kw) = keyword_filter {
                if !kw.is_empty() {
                    let in_prob = contains_ci(s.problem, kw);
                    let in_sol = contains_ci(s.solution, kw);
                    let in_exp = contains_ci(s.explanation, kw);
                    let in_cmd = s.commands.iter().any(|c| contains_ci(c, kw));
                    if !in_prob && !in_sol && !in_exp && !in_cmd {
                        return false;
                    }
                }
            }
            true
        })
        .cloned()
        .collect()
}

pub fn search_all(query: &str) -> GitSearchResult {
    let cmds = list_commands(None, Some(query));
    let scens = list_scenarios(Some(query));
    GitSearchResult {
        query: query.to_owned(),
        matched_commands: cmds,
        matched_scenarios: scens,
    }
}

// Universal C-ABI
#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    core::mem::forget(buf);
    ptr
}

#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() && size > 0 {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

#[no_mangle]
pub unsafe extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    let slice = slice::from_raw_parts(ptr, len);

    let req: RequestEnvelope = match serde_json::from_slice(slice) {
        Ok(v) => v,
        Err(e) => {
            let err_res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("Invalid JSON request: {}", e),
                request_id: "".to_string(),
                data: None,
            };
            let json = serde_json::to_string(&err_res).unwrap_or_else(|_| "{}".to_string());
            return return_str(&json);
        }
    };

    let req_id = req.request_id.unwrap_or_default();

    let json_resp = match req.action.as_str() {
        "git/categories" => {
            let cats = get_categories();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(cats),
            })
        }
        "git/list" => {
            let cat = req.params.get("category").and_then(|v| v.as_str());
            let kw = req.params.get("keyword").and_then(|v| v.as_str());
            let cmds = list_commands(cat, kw);
            let total = cmds.len();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(GitListResponse { total, commands: cmds }),
            })
        }
        "git/scenarios" => {
            let kw = req.params.get("keyword").and_then(|v| v.as_str());
            let scens = list_scenarios(kw);
            let total = scens.len();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(GitScenarioResponse { total, scenarios: scens }),
            })
        }
        "git/search" => {
            let kw = req.params.get("keyword")
                .or_else(|| req.params.get("query"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let res = search_all(kw);
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        other => serde_json::to_string(&ResponseEnvelope::<()> {
            code: 404,
            msg: format!("Unsupported action: {}", other),
            request_id: req_id,
            data: None,
        }),
    }
    .unwrap_or_else(|e| format!("{{\"code\":500,\"msg\":\"{}\",\"request_id\":\"{}\"}}", e, ""));

    return_str(&json_resp)
}

unsafe fn return_str(s: &str) -> u64 {
    let bytes = s.as_bytes();
    let out_len = bytes.len();
    let out_ptr = alloc(out_len);
    core::ptr::copy_nonoverlapping(bytes.as_ptr(), out_ptr, out_len);
    ((out_ptr as u64) << 32) | (out_len as u64 & 0xffffffff)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categories() {
        let cats = get_categories();
        assert_eq!(cats.len(), 8);
        let setup = cats.iter().find(|c| c.id == "setup").unwrap();
        assert!(setup.count >= 4);
    }

    #[test]
    fn test_list_commands() {
        let cmds = list_commands(Some("undo"), None);
        assert!(!cmds.is_empty());
        assert!(cmds.iter().any(|c| c.id == "reset-soft"));
    }

    #[test]
    fn test_scenarios() {
        let scens = list_scenarios(Some("reflog"));
        assert_eq!(scens.len(), 1);
        assert_eq!(scens[0].id, "recover-deleted-commit");
    }

    #[test]
    fn test_search() {
        let res = search_all("amend");
        assert!(res.matched_commands.iter().any(|c| c.id == "commit-amend"));
        assert!(res.matched_scenarios.iter().any(|s| s.id == "fix-commit-message"));
    }
}
