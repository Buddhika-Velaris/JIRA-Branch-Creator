# 🧙‍♂️ Velaris Branch Creator

> "One does not simply name a branch without consulting the JIRA overlords."  
> — Boromir, probably

A VS Code extension that creates Git branches from JIRA ticket IDs, following the naming conventions used in Velaris.

![END NOTE](https://cdn.glitch.global/51637606-60d9-484c-a941-c3ad0567928a/ezgif-51b63a1e924279.gif?v=1745070466165)

## 🐒 How to use

Follow these steps to create a branch from a JIRA ticket:

1. Open your project in VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) to open the Command Palette
3. Type "JIRA" and select "JIRA: Create Branch from Ticket" from the dropdown
4. Enter your JIRA ticket ID (e.g., WAR-1234) in the input box that appears
5. The extension will connect to JIRA and fetch the ticket details
6. A new Git branch will be created and checked out automatically
7. You'll see a confirmation message with the new branch name

You can also test your JIRA API connection by selecting "JIRA: Test API Response" from the Command Palette.

### ✨ Branch Naming Convention

The extension automatically creates branch names with the following format:
```
{fiscal_year}/sprint{sprint_number}/{ticket_id}/{summary-slug}
```

For example, if your JIRA ticket:
- Has ID: WAR-7080
- Has Summary: "Fix task name bug"
- Is in Sprint: "WAR 2025 - Q2 Sprint 7"

🔮 The resulting branch name will be:
```
fy25/sprint07/WAR-7080/fix-task-name-bug
```

## 🧍‍♂️ Installation

You can install this extension through:

1. The VS Code Marketplace
2. Search for "Velaris Branch Creator"

### 🔧 How to Configure

1. Open VS Code Settings (`File > Preferences > Settings` or `Ctrl+,`)
2. Search for "JIRA Branch Creator"
3. Fill in your JIRA base URL, email, and API token
4. Optionally change the branch prefix

Example settings.json configuration:
```json
{
  "jira-branching.baseUrl": "https://yourcompany.atlassian.net",
  "jira-branching.email": "your.email@company.com",
  "jira-branching.apiToken": "your-api-token-here",
  "jira-branching.branchPrefix": "fy25/great-merge"
}
```

### 😑 How to Get a JIRA API Token

1. Log in to your Atlassian account at [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Enter a label for your token (e.g., "vscode")
4. Copy the generated token

### 🚒 Troubleshooting

### Error: "Failed to fetch JIRA issue"
- Verify your JIRA base URL, email, and API token are correct
- Ensure your JIRA instance is accessible from your network

## 🛠️ Contributing
[Contributions to this extension are welcome!](https://github.com/Buddhika-Velaris/JIRA-Branch-Creator)

### 🧪 Development Setup

1. Clone the repository
2. Run `npm install`
3. Open the project in VS Code
4. Press F5 to start debugging

---

![END NOTE](https://cdn.glitch.global/51637606-60d9-484c-a941-c3ad0567928a/thumbs-up-borat.gif?v=1745058098345)


**Made with bugs🐞 Enjoy!**
