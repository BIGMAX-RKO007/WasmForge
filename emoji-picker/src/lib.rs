extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct EmojiItem {
    pub emoji: &'static str,
    pub name: &'static str,
    pub category: &'static str,
    pub shortcode: &'static str,
    pub unicode: &'static str,
    pub keywords: &'static [&'static str],
}

#[derive(Debug, Deserialize)]
pub struct SearchParams {
    #[serde(default)]
    pub query: String,
    pub category: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: usize,
}

fn default_limit() -> usize {
    50
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub query: String,
    pub category: Option<String>,
    pub total: usize,
    pub emojis: Vec<EmojiItem>,
}

#[derive(Debug, Serialize)]
pub struct CategoryInfo {
    pub name: &'static str,
    pub icon: &'static str,
    pub count: usize,
}

#[derive(Debug, Serialize)]
pub struct EmojiPreset {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub emojis: &'static [&'static str],
}

static EMOJI_DATABASE: &[EmojiItem] = &[
    // --- Dev & Tech ---
    EmojiItem { emoji: "🦀", name: "crab", category: "Dev & Tech", shortcode: ":crab:", unicode: "U+1F980", keywords: &["rust", "ferris", "crustacean", "memory-safe"] },
    EmojiItem { emoji: "🐍", name: "snake", category: "Dev & Tech", shortcode: ":snake:", unicode: "U+1F40D", keywords: &["python", "script", "django", "fastapi"] },
    EmojiItem { emoji: "☕", name: "coffee", category: "Dev & Tech", shortcode: ":coffee:", unicode: "U+2615", keywords: &["java", "hot", "drink", "developer", "caffeine"] },
    EmojiItem { emoji: "💻", name: "laptop", category: "Dev & Tech", shortcode: ":computer:", unicode: "U+1F4BB", keywords: &["laptop", "coding", "work", "pc", "macbook"] },
    EmojiItem { emoji: "🖥️", name: "desktop", category: "Dev & Tech", shortcode: ":desktop_computer:", unicode: "U+1F5A5", keywords: &["desktop", "monitor", "screen", "workstation"] },
    EmojiItem { emoji: "📱", name: "mobile phone", category: "Dev & Tech", shortcode: ":iphone:", unicode: "U+1F4F1", keywords: &["mobile", "ios", "android", "cellphone"] },
    EmojiItem { emoji: "⌨️", name: "keyboard", category: "Dev & Tech", shortcode: ":keyboard:", unicode: "U+2328", keywords: &["typing", "mechanical", "keycaps", "input"] },
    EmojiItem { emoji: "💾", name: "floppy disk", category: "Dev & Tech", shortcode: ":floppy_disk:", unicode: "U+1F4BE", keywords: &["save", "storage", "vintage", "disk"] },
    EmojiItem { emoji: "📦", name: "package", category: "Dev & Tech", shortcode: ":package:", unicode: "U+1F4E6", keywords: &["cargo", "npm", "crate", "module", "box", "shipping"] },
    EmojiItem { emoji: "⚙️", name: "gear", category: "Dev & Tech", shortcode: ":gear:", unicode: "U+2699", keywords: &["settings", "config", "preferences", "system"] },
    EmojiItem { emoji: "🛠️", name: "hammer and wrench", category: "Dev & Tech", shortcode: ":hammer_and_wrench:", unicode: "U+1F6E0", keywords: &["tools", "build", "maintenance", "devops"] },
    EmojiItem { emoji: "🔒", name: "locked", category: "Dev & Tech", shortcode: ":lock:", unicode: "U+1F512", keywords: &["security", "https", "auth", "crypto", "encryption"] },
    EmojiItem { emoji: "🔑", name: "key", category: "Dev & Tech", shortcode: ":key:", unicode: "U+1F511", keywords: &["api-key", "token", "password", "access"] },
    EmojiItem { emoji: "🐛", name: "bug", category: "Dev & Tech", shortcode: ":bug:", unicode: "U+1F41B", keywords: &["bug", "fix", "defect", "debugger", "issue"] },
    EmojiItem { emoji: "🚀", name: "rocket", category: "Dev & Tech", shortcode: ":rocket:", unicode: "U+1F680", keywords: &["deploy", "launch", "release", "fast", "speed", "wasm"] },
    EmojiItem { emoji: "⚡", name: "lightning", category: "Dev & Tech", shortcode: ":zap:", unicode: "U+26A1", keywords: &["performance", "speed", "energy", "fast", "instant"] },
    EmojiItem { emoji: "🤖", name: "robot", category: "Dev & Tech", shortcode: ":robot:", unicode: "U+1F916", keywords: &["bot", "ai", "llm", "automation", "agent"] },
    EmojiItem { emoji: "🧠", name: "brain", category: "Dev & Tech", shortcode: ":brain:", unicode: "U+1F9E0", keywords: &["neural", "intelligence", "mind", "smart"] },
    EmojiItem { emoji: "🌐", name: "globe", category: "Dev & Tech", shortcode: ":globe_with_meridians:", unicode: "U+1F310", keywords: &["web", "internet", "world", "network", "i18n"] },
    EmojiItem { emoji: "📡", name: "satellite antenna", category: "Dev & Tech", shortcode: ":satellite_antenna:", unicode: "U+1F4E1", keywords: &["radio", "signal", "broadcast", "network"] },
    EmojiItem { emoji: "🧪", name: "test tube", category: "Dev & Tech", shortcode: ":test_tube:", unicode: "U+1F9EA", keywords: &["test", "unit-test", "qa", "experiment", "lab"] },
    EmojiItem { emoji: "🔍", name: "magnifying glass", category: "Dev & Tech", shortcode: ":mag:", unicode: "U+1F50D", keywords: &["search", "find", "query", "grep", "inspect"] },
    EmojiItem { emoji: "📊", name: "bar chart", category: "Dev & Tech", shortcode: ":bar_chart:", unicode: "U+1F4CA", keywords: &["stats", "metrics", "analytics", "graph"] },
    EmojiItem { emoji: "📝", name: "memo", category: "Dev & Tech", shortcode: ":memo:", unicode: "U+1F4DD", keywords: &["docs", "documentation", "readme", "note", "writing"] },

    // --- Git & Workflow ---
    EmojiItem { emoji: "✨", name: "sparkles", category: "Git & Workflow", shortcode: ":sparkles:", unicode: "U+2728", keywords: &["feat", "feature", "new", "shiny", "magic"] },
    EmojiItem { emoji: "💄", name: "lipstick", category: "Git & Workflow", shortcode: ":lipstick:", unicode: "U+1F484", keywords: &["ui", "style", "css", "appearance"] },
    EmojiItem { emoji: "♻️", name: "recycle", category: "Git & Workflow", shortcode: ":recycle:", unicode: "U+267B", keywords: &["refactor", "cleanup", "rewrite", "green"] },
    EmojiItem { emoji: "🔧", name: "wrench", category: "Git & Workflow", shortcode: ":wrench:", unicode: "U+1F527", keywords: &["chore", "config", "maintenance", "tool"] },
    EmojiItem { emoji: "🔨", name: "hammer", category: "Git & Workflow", shortcode: ":hammer:", unicode: "U+1F528", keywords: &["build", "compile", "make"] },
    EmojiItem { emoji: "🔖", name: "bookmark", category: "Git & Workflow", shortcode: ":bookmark:", unicode: "U+1F516", keywords: &["tag", "release", "version", "semver"] },
    EmojiItem { emoji: "📌", name: "pushpin", category: "Git & Workflow", shortcode: ":pushpin:", unicode: "U+1F4CC", keywords: &["pin", "dependencies", "pin-version"] },
    EmojiItem { emoji: "🚧", name: "construction", category: "Git & Workflow", shortcode: ":construction:", unicode: "U+1F6A7", keywords: &["wip", "work-in-progress", "under-construction"] },
    EmojiItem { emoji: "👷", name: "construction worker", category: "Git & Workflow", shortcode: ":construction_worker:", unicode: "U+1F477", keywords: &["ci", "continuous-integration", "pipeline"] },
    EmojiItem { emoji: "📈", name: "chart increasing", category: "Git & Workflow", shortcode: ":chart_with_upwards_trend:", unicode: "U+1F4C8", keywords: &["analytics", "telemetry", "tracking"] },
    EmojiItem { emoji: "🎨", name: "artist palette", category: "Git & Workflow", shortcode: ":art:", unicode: "U+1F3A8", keywords: &["format", "structure", "design", "prettier"] },
    EmojiItem { emoji: "🚚", name: "delivery truck", category: "Git & Workflow", shortcode: ":truck:", unicode: "U+1F69A", keywords: &["move", "rename", "path"] },
    EmojiItem { emoji: "🔀", name: "shuffle tracks", category: "Git & Workflow", shortcode: ":twisted_rightwards_arrows:", unicode: "U+1F500", keywords: &["merge", "branch", "pr", "pull-request"] },
    EmojiItem { emoji: "💥", name: "collision", category: "Git & Workflow", shortcode: ":boom:", unicode: "U+1F4A5", keywords: &["breaking-change", "major", "crash"] },
    EmojiItem { emoji: "🔥", name: "fire", category: "Git & Workflow", shortcode: ":fire:", unicode: "U+1F525", keywords: &["remove", "delete", "prune", "hot", "trending"] },

    // --- Smileys & Emotion ---
    EmojiItem { emoji: "😀", name: "grinning face", category: "Smileys & Emotion", shortcode: ":grinning:", unicode: "U+1F600", keywords: &["smile", "happy", "joy"] },
    EmojiItem { emoji: "😃", name: "smiling face with open mouth", category: "Smileys & Emotion", shortcode: ":smiley:", unicode: "U+1F603", keywords: &["happy", "joy", "laugh"] },
    EmojiItem { emoji: "😄", name: "grinning face with smiling eyes", category: "Smileys & Emotion", shortcode: ":smile:", unicode: "U+1F604", keywords: &["happy", "eyes", "joy"] },
    EmojiItem { emoji: "😂", name: "face with tears of joy", category: "Smileys & Emotion", shortcode: ":joy:", unicode: "U+1F602", keywords: &["laugh", "tears", "lol", "crying-laughing"] },
    EmojiItem { emoji: "🤣", name: "rolling on the floor laughing", category: "Smileys & Emotion", shortcode: ":rofl:", unicode: "U+1F923", keywords: &["rofl", "lol", "hilarious"] },
    EmojiItem { emoji: "😊", name: "smiling face with smiling eyes", category: "Smileys & Emotion", shortcode: ":blush:", unicode: "U+1F60A", keywords: &["blush", "proud", "friendly"] },
    EmojiItem { emoji: "😇", name: "smiling face with halo", category: "Smileys & Emotion", shortcode: ":innocent:", unicode: "U+1F607", keywords: &["halo", "angel", "good"] },
    EmojiItem { emoji: "😉", name: "winking face", category: "Smileys & Emotion", shortcode: ":wink:", unicode: "U+1F609", keywords: &["wink", "flirt", "joke"] },
    EmojiItem { emoji: "😍", name: "heart eyes", category: "Smileys & Emotion", shortcode: ":heart_eyes:", unicode: "U+1F60D", keywords: &["love", "crush", "adore"] },
    EmojiItem { emoji: "🥰", name: "smiling face with hearts", category: "Smileys & Emotion", shortcode: ":smiling_face_with_3_hearts:", unicode: "U+1F970", keywords: &["warm", "loved", "affection"] },
    EmojiItem { emoji: "😎", name: "smiling face with sunglasses", category: "Smileys & Emotion", shortcode: ":sunglasses:", unicode: "U+1F60E", keywords: &["cool", "awesome", "pro"] },
    EmojiItem { emoji: "🥳", name: "partying face", category: "Smileys & Emotion", shortcode: ":partying_face:", unicode: "U+1F973", keywords: &["party", "celebration", "milestone"] },
    EmojiItem { emoji: "🤔", name: "thinking face", category: "Smileys & Emotion", shortcode: ":thinking:", unicode: "U+1F914", keywords: &["wonder", "consider", "ponder", "curious"] },
    EmojiItem { emoji: "🫡", name: "saluting face", category: "Smileys & Emotion", shortcode: ":saluting_face:", unicode: "U+1FAE1", keywords: &["salute", "respect", "yes-sir", "roger"] },
    EmojiItem { emoji: "🤯", name: "exploding head", category: "Smileys & Emotion", shortcode: ":exploding_head:", unicode: "U+1F92F", keywords: &["mindblown", "shocked", "amazed"] },
    EmojiItem { emoji: "🥱", name: "yawning face", category: "Smileys & Emotion", shortcode: ":yawning_face:", unicode: "U+1F971", keywords: &["tired", "sleepy", "bored"] },
    EmojiItem { emoji: "👍", name: "thumbs up", category: "Smileys & Emotion", shortcode: ":thumbsup:", unicode: "U+1F44D", keywords: &["agree", "approve", "like", "plus1"] },
    EmojiItem { emoji: "👎", name: "thumbs down", category: "Smileys & Emotion", shortcode: ":thumbsdown:", unicode: "U+1F44E", keywords: &["disagree", "dislike", "minus1"] },
    EmojiItem { emoji: "👏", name: "clapping hands", category: "Smileys & Emotion", shortcode: ":clap:", unicode: "U+1F44F", keywords: &["bravo", "applause", "praise"] },
    EmojiItem { emoji: "🙌", name: "raising hands", category: "Smileys & Emotion", shortcode: ":raised_hands:", unicode: "U+1F64C", keywords: &["celebrate", "hooray", "cheers"] },
    EmojiItem { emoji: "🤝", name: "handshake", category: "Smileys & Emotion", shortcode: ":handshake:", unicode: "U+1F91D", keywords: &["deal", "partner", "agreement", "cooperate"] },
    EmojiItem { emoji: "🙏", name: "folded hands", category: "Smileys & Emotion", shortcode: ":pray:", unicode: "U+1F64F", keywords: &["please", "thank-you", "pray", "namaste"] },
    EmojiItem { emoji: "💯", name: "hundred points", category: "Smileys & Emotion", shortcode: ":100:", unicode: "U+1F4AF", keywords: &["perfect", "score", "century", "flawless"] },
    EmojiItem { emoji: "💖", name: "sparkling heart", category: "Smileys & Emotion", shortcode: ":sparkling_heart:", unicode: "U+1F496", keywords: &["love", "heart", "favorite"] },

    // --- Objects & Symbols ---
    EmojiItem { emoji: "✅", name: "check mark", category: "Objects & Symbols", shortcode: ":white_check_mark:", unicode: "U+2705", keywords: &["pass", "success", "done", "ok", "verified"] },
    EmojiItem { emoji: "❌", name: "cross mark", category: "Objects & Symbols", shortcode: ":x:", unicode: "U+274C", keywords: &["fail", "error", "cancel", "wrong", "delete"] },
    EmojiItem { emoji: "⚠️", name: "warning", category: "Objects & Symbols", shortcode: ":warning:", unicode: "U+26A0", keywords: &["alert", "caution", "danger", "risk"] },
    EmojiItem { emoji: "ℹ️", name: "information", category: "Objects & Symbols", shortcode: ":information_source:", unicode: "U+2139", keywords: &["info", "help", "details"] },
    EmojiItem { emoji: "🔄", name: "counterclockwise arrows", category: "Objects & Symbols", shortcode: ":arrows_counterclockwise:", unicode: "U+1F504", keywords: &["reload", "refresh", "retry", "loop", "sync"] },
    EmojiItem { emoji: "❓", name: "question mark", category: "Objects & Symbols", shortcode: ":question:", unicode: "U+2753", keywords: &["help", "doubt", "unknown"] },
    EmojiItem { emoji: "❗", name: "exclamation mark", category: "Objects & Symbols", shortcode: ":exclamation:", unicode: "U+2757", keywords: &["important", "attention", "urgent"] },
    EmojiItem { emoji: "🎯", name: "bullseye", category: "Objects & Symbols", shortcode: ":dart:", unicode: "U+1F3AF", keywords: &["target", "goal", "accuracy", "hit"] },
    EmojiItem { emoji: "🚩", name: "triangular flag", category: "Objects & Symbols", shortcode: ":triangular_flag_on_post:", unicode: "U+1F6A9", keywords: &["flag", "feature-flag", "marker"] },
    EmojiItem { emoji: "🏁", name: "chequered flag", category: "Objects & Symbols", shortcode: ":checkered_flag:", unicode: "U+1F3C1", keywords: &["finish", "complete", "milestone", "race"] },
    EmojiItem { emoji: "🔔", name: "bell", category: "Objects & Symbols", shortcode: ":bell:", unicode: "U+1F514", keywords: &["notification", "alarm", "chime", "ping"] },
    EmojiItem { emoji: "🔗", name: "link", category: "Objects & Symbols", shortcode: ":link:", unicode: "U+1F517", keywords: &["url", "chain", "hyperlink", "permalink"] },
    EmojiItem { emoji: "🗑️", name: "wastebasket", category: "Objects & Symbols", shortcode: ":wastebasket:", unicode: "U+1F5D1", keywords: &["trash", "garbage", "delete", "remove"] },
    EmojiItem { emoji: "📁", name: "file folder", category: "Objects & Symbols", shortcode: ":file_folder:", unicode: "U+1F4C1", keywords: &["directory", "folder", "archive"] },

    // --- Animals & Nature ---
    EmojiItem { emoji: "🐱", name: "cat", category: "Animals & Nature", shortcode: ":cat:", unicode: "U+1F431", keywords: &["kitten", "meow", "feline", "pet"] },
    EmojiItem { emoji: "🐶", name: "dog", category: "Animals & Nature", shortcode: ":dog:", unicode: "U+1F436", keywords: &["puppy", "woof", "canine", "pet"] },
    EmojiItem { emoji: "🦊", name: "fox", category: "Animals & Nature", shortcode: ":fox_face:", unicode: "U+1F98A", keywords: &["firefox", "mozilla", "wild"] },
    EmojiItem { emoji: "🐼", name: "panda", category: "Animals & Nature", shortcode: ":panda_face:", unicode: "U+1F43C", keywords: &["bear", "china", "bamboo"] },
    EmojiItem { emoji: "🦁", name: "lion", category: "Animals & Nature", shortcode: ":lion:", unicode: "U+1F981", keywords: &["brave", "safari", "king"] },
    EmojiItem { emoji: "🐧", name: "penguin", category: "Animals & Nature", shortcode: ":penguin:", unicode: "U+1F427", keywords: &["linux", "tux", "antarctica"] },
    EmojiItem { emoji: "🦅", name: "eagle", category: "Animals & Nature", shortcode: ":eagle:", unicode: "U+1F985", keywords: &["bird", "sky", "freedom"] },
    EmojiItem { emoji: "🐝", name: "honeybee", category: "Animals & Nature", shortcode: ":bee:", unicode: "U+1F41D", keywords: &["busy", "honey", "insect"] },
    EmojiItem { emoji: "🌲", name: "evergreen tree", category: "Animals & Nature", shortcode: ":evergreen_tree:", unicode: "U+1F332", keywords: &["pine", "forest", "tree", "wood"] },
    EmojiItem { emoji: "🍀", name: "four leaf clover", category: "Animals & Nature", shortcode: ":four_leaf_clover:", unicode: "U+1F340", keywords: &["luck", "lucky", "irish", "fortune"] },
    EmojiItem { emoji: "☀️", name: "sun", category: "Animals & Nature", shortcode: ":sunny:", unicode: "U+2600", keywords: &["light", "day", "warm", "weather"] },
    EmojiItem { emoji: "🌙", name: "crescent moon", category: "Animals & Nature", shortcode: ":crescent_moon:", unicode: "U+1F319", keywords: &["night", "dark", "dark-mode", "sleep"] },
    EmojiItem { emoji: "💧", name: "droplet", category: "Animals & Nature", shortcode: ":droplet:", unicode: "U+1F4A7", keywords: &["water", "rain", "splash", "liquid"] },
    EmojiItem { emoji: "🌊", name: "water wave", category: "Animals & Nature", shortcode: ":ocean:", unicode: "U+1F30A", keywords: &["sea", "surf", "tsunami", "ocean"] },

    // --- Food & Drink ---
    EmojiItem { emoji: "🍵", name: "teacup without handle", category: "Food & Drink", shortcode: ":tea:", unicode: "U+1F375", keywords: &["matcha", "green-tea", "drink"] },
    EmojiItem { emoji: "🧋", name: "bubble tea", category: "Food & Drink", shortcode: ":bubble_tea:", unicode: "U+1F9CB", keywords: &["boba", "milk-tea", "tapioca"] },
    EmojiItem { emoji: "🍺", name: "beer mug", category: "Food & Drink", shortcode: ":beer:", unicode: "U+1F37A", keywords: &["alcohol", "bar", "brew", "pub", "homebrew"] },
    EmojiItem { emoji: "🍻", name: "clinking beer mugs", category: "Food & Drink", shortcode: ":beers:", unicode: "U+1F37B", keywords: &["cheers", "celebrate", "party"] },
    EmojiItem { emoji: "🍕", name: "pizza", category: "Food & Drink", shortcode: ":pizza:", unicode: "U+1F355", keywords: &["cheese", "slice", "italian", "dinner"] },
    EmojiItem { emoji: "🍔", name: "hamburger", category: "Food & Drink", shortcode: ":hamburger:", unicode: "U+1F354", keywords: &["burger", "fast-food", "beef"] },
    EmojiItem { emoji: "🍟", name: "french fries", category: "Food & Drink", shortcode: ":fries:", unicode: "U+1F35F", keywords: &["potato", "chips", "snack"] },
    EmojiItem { emoji: "🍣", name: "sushi", category: "Food & Drink", shortcode: ":sushi:", unicode: "U+1F363", keywords: &["japan", "salmon", "raw-fish", "rice"] },
    EmojiItem { emoji: "🍜", name: "steaming bowl", category: "Food & Drink", shortcode: ":ramen:", unicode: "U+1F35C", keywords: &["noodle", "soup", "ramen"] },
    EmojiItem { emoji: "🍩", name: "doughnut", category: "Food & Drink", shortcode: ":doughnut:", unicode: "U+1F369", keywords: &["donut", "sweet", "dessert"] },
    EmojiItem { emoji: "🍎", name: "red apple", category: "Food & Drink", shortcode: ":apple:", unicode: "U+1F34E", keywords: &["fruit", "healthy", "macintosh"] },

    // --- Travel & Places ---
    EmojiItem { emoji: "🚗", name: "automobile", category: "Travel & Places", shortcode: ":car:", unicode: "U+1F697", keywords: &["vehicle", "drive", "road"] },
    EmojiItem { emoji: "✈️", name: "airplane", category: "Travel & Places", shortcode: ":airplane:", unicode: "U+2708", keywords: &["flight", "travel", "vacation", "trip"] },
    EmojiItem { emoji: "🛸", name: "flying saucer", category: "Travel & Places", shortcode: ":flying_saucer:", unicode: "U+1F6F8", keywords: &["ufo", "alien", "space"] },
    EmojiItem { emoji: "🌍", name: "globe showing Europe-Africa", category: "Travel & Places", shortcode: ":earth_africa:", unicode: "U+1F30D", keywords: &["earth", "planet", "world"] },
    EmojiItem { emoji: "🌎", name: "globe showing Americas", category: "Travel & Places", shortcode: ":earth_americas:", unicode: "U+1F30E", keywords: &["earth", "world", "america"] },
    EmojiItem { emoji: "🌏", name: "globe showing Asia-Australia", category: "Travel & Places", shortcode: ":earth_asia:", unicode: "U+1F30F", keywords: &["earth", "asia", "orient"] },
    EmojiItem { emoji: "🗺️", name: "world map", category: "Travel & Places", shortcode: ":world_map:", unicode: "U+1F5FA", keywords: &["map", "travel", "geography"] },
    EmojiItem { emoji: "🧭", name: "compass", category: "Travel & Places", shortcode: ":compass:", unicode: "U+1F9ED", keywords: &["navigation", "direction", "explore"] },
];

pub fn search_emojis(params: &SearchParams) -> SearchResult {
    let q = params.query.trim().to_lowercase();
    let cat_filter = params.category.as_ref().map(|c| c.trim().to_lowercase());

    let mut matches = Vec::new();

    for item in EMOJI_DATABASE {
        // Filter by category if specified
        if let Some(ref cf) = cat_filter {
            if !cf.is_empty() && item.category.to_lowercase() != *cf {
                continue;
            }
        }

        // Match query
        let matched = if q.is_empty() {
            true
        } else {
            item.emoji.contains(&q)
                || item.name.to_lowercase().contains(&q)
                || item.shortcode.to_lowercase().contains(&q)
                || item.unicode.to_lowercase().contains(&q)
                || item.category.to_lowercase().contains(&q)
                || item.keywords.iter().any(|k| k.to_lowercase().contains(&q))
        };

        if matched {
            matches.push(item.clone());
            if matches.len() >= params.limit {
                break;
            }
        }
    }

    SearchResult {
        query: params.query.clone(),
        category: params.category.clone(),
        total: matches.len(),
        emojis: matches,
    }
}

pub fn get_categories() -> Vec<CategoryInfo> {
    vec![
        CategoryInfo { name: "Dev & Tech", icon: "💻", count: 24 },
        CategoryInfo { name: "Git & Workflow", icon: "✨", count: 15 },
        CategoryInfo { name: "Smileys & Emotion", icon: "😀", count: 24 },
        CategoryInfo { name: "Objects & Symbols", icon: "✅", count: 14 },
        CategoryInfo { name: "Animals & Nature", icon: "🦀", count: 14 },
        CategoryInfo { name: "Food & Drink", icon: "☕", count: 11 },
        CategoryInfo { name: "Travel & Places", icon: "🚀", count: 8 },
    ]
}

pub fn get_presets() -> Vec<EmojiPreset> {
    vec![
        EmojiPreset {
            id: "git-commits",
            name: "Git 提交常用规范",
            description: "标准化 Git Commit 提交信息前缀表情",
            emojis: &["✨", "🐛", "📝", "💄", "♻️", "⚡", "🧪", "🔧", "🔒", "🔖", "🚧", "💥", "🔥"],
        },
        EmojiPreset {
            id: "dev-stacks",
            name: "开发者技术栈与工具",
            description: "常用编程语言、硬件及研发基础设施",
            emojis: &["🦀", "🐍", "☕", "💻", "📦", "⚙️", "🛠️", "🔒", "🚀", "⚡", "🤖", "🌐"],
        },
        EmojiPreset {
            id: "status-feedback",
            name: "状态与评审反馈",
            description: "代码审查、发布审批与运维报警交互",
            emojis: &["✅", "❌", "⚠️", "ℹ️", "🔄", "🎯", "🚩", "🏁", "👍", "👏", "🤝", "💯"],
        },
    ]
}

// Universal Request/Response Envelope
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
        "emoji/search" | "emoji/find" => {
            let params: SearchParams = serde_json::from_value(req.params).unwrap_or(SearchParams {
                query: "".to_string(),
                category: None,
                limit: default_limit(),
            });

            let res = search_emojis(&params);

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "emoji/categories" | "emoji/cats" => {
            let cats = get_categories();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(cats),
            })
        }
        "emoji/presets" | "emoji/samples" => {
            let presets = get_presets();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(presets),
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
    fn test_search_rust() {
        let params = SearchParams {
            query: "rust".to_string(),
            category: None,
            limit: 10,
        };
        let res = search_emojis(&params);
        assert!(!res.emojis.is_empty());
        assert_eq!(res.emojis[0].emoji, "🦀");
    }

    #[test]
    fn test_category_filter() {
        let params = SearchParams {
            query: "".to_string(),
            category: Some("Git & Workflow".to_string()),
            limit: 50,
        };
        let res = search_emojis(&params);
        assert_eq!(res.total, 15);
        assert!(res.emojis.iter().all(|e| e.category == "Git & Workflow"));
    }

    #[test]
    fn test_categories_and_presets() {
        let cats = get_categories();
        assert_eq!(cats.len(), 7);
        let presets = get_presets();
        assert_eq!(presets.len(), 3);
    }
}
