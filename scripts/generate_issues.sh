#!/bin/bash
# Script to generate Wapex GitHub issues based on the implementation plan.

REPO="bitvice/wapex"
PROJECT_NUMBER=1
OWNER="bitvice"

# Function to create an issue and add it to the project
create_issue() {
    local title="$1"
    local body="$2"
    local label="$3"
    
    echo "Creating issue: $title..."
    # Create issue and capture only the URL/number
    ISSUE_URL=$(gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$label")
    
    if [[ $? -eq 0 ]]; then
        echo "Adding $ISSUE_URL to project $PROJECT_NUMBER..."
        gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$ISSUE_URL"
    else
        echo "Failed to create issue: $title"
    fi
}

# 1. Foundation
create_issue "[Foundation] Initialize Tauri 2 Project with React, Tailwind, and Shadcn" "## Description
Set up the core project structure as defined in the engineering plan.

## Tasks
- Initialize Tauri 2 with Vite and React.
- Configure Tailwind CSS.
- Install and configure Shadcn components.
- Setup folder structure.
- Configure tauri-plugin-sql for account metadata storage.

## References
- See Section 7, Step 1 of implementation plan." "enhancement,foundation"

# 2. Account Manager Core
create_issue "[Core] Implement Rust AccountManager and Profile Isolation" "## Description
Implement the backend logic for managing multiple accounts and their isolated profiles.

## Tasks
- Creation of AccountManager struct in Rust.
- Logic for dynamic user_data_dir path generation (~/.local/share/[app-id]/profiles/[account-id]).
- Persistence of account metadata in SQLite.

## References
- See Section 4 of implementation plan." "enhancement,core"

# 3. Bridge Script
create_issue "[Core] Develop reliable Unread Count & Notification Bridge (bridge.js)" "## Description
Create the injected script that runs inside the WhatsApp webview to relay events to the Rust backend.

## Tasks
- Use MutationObserver to detect unread count badges.
- Relay web notifications to the backend via Tauri's IPC.
- Handle WhatsApp DOM changes safely.

## References
- See Section 7, Step 3 of implementation plan." "enhancement,core"

# 4. Phase 2 Epic
create_issue "[EPIC] Phase 2: V1 (The Multi-Account App)" "This epic tracks the multi-account management features for Wapex Phase 2." "epic"

# 5. Multi-Account Navigation
create_issue "[UI] Sidebar Navigation for Accounts & Workspaces" "## Description
Build the primary navigation interface.

## Tasks
- Workspace icons + switching.
- Account initials/strip for active workspace.
- Responsive layout with Tailwind CSS.

## References
- See Section 5 of implementation plan." "enhancement"

# 6. Phase 3 Epic
create_issue "[EPIC] Phase 3: V2 (The Productivity Hub)" "This epic tracks the productivity features for Wapex Phase 3." "epic"

# 7. Command Palette
create_issue "[Feature] Global Command Palette (Cmd + K)" "## Description
Implement a global command palette for quick navigation and actions.

## Tasks
- Search accounts across workspaces.
- Keyboard shortcuts for common actions.
- Integrated UI with Shadcn/Command." "enhancement"
