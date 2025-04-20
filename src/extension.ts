// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { validateJiraTicketFormat, getJiraIssue, getJiraConfig } from './utils/jiraApi';
import { createBranchName, extractSprintInfo } from './utils/branchNaming';
import { createAndCheckoutBranch, isGitRepository } from './utils/gitUtils';

/**
 * This method is called when your extension is activated
 * @param context The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('JIRA Branch Creator extension is now active');

	// Register the createBranch command
	const createBranchDisposable = vscode.commands.registerCommand('jira-branching.createBranch', async () => {
		try {
			// Check if a workspace is open
			if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
				vscode.window.showErrorMessage('Please open a workspace folder before using this extension.');
				return;
			}

			const workspaceFolder = vscode.workspace.workspaceFolders[0];
			
			// Check if workspace is a Git repository
			const isRepo = await isGitRepository(workspaceFolder.uri.fsPath);
			if (!isRepo) {
				const initGit = 'Initialize Git';
				const response = await vscode.window.showErrorMessage(
					'The current workspace is not a Git repository.',
					initGit
				);
				
				if (response === initGit) {
					await vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						title: 'Initializing Git repository...',
						cancellable: false
					}, async () => {
						try {
							await vscode.commands.executeCommand('git.init');
							vscode.window.showInformationMessage('Git repository initialized successfully.');
						} catch (error) {
							vscode.window.showErrorMessage('Failed to initialize Git repository.');
						}
					});
				}
				return;
			}

			// Check for JIRA configuration
			const jiraConfig = getJiraConfig();
			if (!jiraConfig) {
				const configureNow = 'Configure Now';
				const response = await vscode.window.showErrorMessage(
					'JIRA configuration is missing. Please set your JIRA base URL, email, and API token in settings.',
					configureNow
				);
				
				if (response === configureNow) {
					vscode.commands.executeCommand('workbench.action.openSettings', 'jira-branching');
				}
				return;
			}
			
			// Prompt user for JIRA ticket ID
			const ticketId = await vscode.window.showInputBox({
				placeHolder: 'Enter JIRA ticket ID (e.g., VEL-123)',
				prompt: 'Create a Git branch from a JIRA ticket',
				validateInput: (value: string) => {
					if (!value) {
						return 'Please enter a ticket ID';
					}
					
					if (!validateJiraTicketFormat(value)) {
						return 'Invalid JIRA ticket format. Please use the format PROJECT-123.';
					}
					
					return null;
				}
			});
			
			if (!ticketId) {
				return; // User canceled the input
			}
			
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Fetching JIRA ticket ${ticketId}...`,
				cancellable: false
			}, async (progress) => {
				
					// Fetch the JIRA issue
					progress.report({ message: 'Contacting JIRA API...' });
					const issue = await getJiraIssue(ticketId);
					
					if (!issue) {
						vscode.window.showErrorMessage(`Ticket ${ticketId} not found. Please check the ticket ID and your JIRA credentials.`);
						return;
					}
					
					 // Create branch name using sprint information
					progress.report({ message: 'Creating branch name...' });
					const branchName = createBranchName(issue.key, issue.summary, issue.sprintName);
					
					// Create and checkout the branch
					progress.report({ message: 'Creating Git branch...' });
					const result = await createAndCheckoutBranch(branchName, workspaceFolder.uri.fsPath);
					
					if (result === true) {
						vscode.window.showInformationMessage(`Successfully created and checked out branch: ${branchName}`);
					} else {
						vscode.window.showErrorMessage(result);
					}
			});
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(`Error: ${error.message}`);
			} else {
				vscode.window.showErrorMessage('An unknown error occurred');
			}
		}
	});

	// Register a debug command to test JIRA API response
	const testJiraApiDisposable = vscode.commands.registerCommand('jira-branching.testJiraApi', async () => {
		try {
			// Prompt user for JIRA ticket ID
			const ticketId = await vscode.window.showInputBox({
				placeHolder: 'Enter JIRA ticket ID (e.g., PRJ-123)',
				prompt: 'Test JIRA API response for a ticket',
				validateInput: (value: string) => {
					if (!value) {
						return 'Please enter a ticket ID';
					}
					
					if (!validateJiraTicketFormat(value)) {
						return 'Invalid JIRA ticket format. Please use the format PROJECT-123.';
					}
					
					return null;
				}
			});
			
			if (!ticketId) {
				return;
			}
			
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Fetching JIRA ticket ${ticketId} for testing...`,
				cancellable: false
			}, async (progress) => {
			
					// Check for JIRA configuration
					const jiraConfig = getJiraConfig();
					if (!jiraConfig) {
						vscode.window.showErrorMessage('JIRA configuration is missing. Please set your JIRA base URL, email, and API token in settings.');
						return;
					}
					
					// Fetch the JIRA issue
					progress.report({ message: 'Contacting JIRA API...' });
					const issue = await getJiraIssue(ticketId);
					
					if (!issue) {
						vscode.window.showErrorMessage(`Ticket ${ticketId} not found. Please check the ticket ID and your JIRA credentials.`);
						return;
					}
					
					const { fiscalYear, sprintNumber } = extractSprintInfo(issue.sprintName || '');
					
					// Create a debug panel to show the response
					const panel = vscode.window.createOutputChannel('JIRA API Debug');
					panel.show();
					panel.appendLine('--- JIRA API Debug Information ---');
					panel.appendLine(`Ticket: ${issue.key}`);
					panel.appendLine(`Summary: ${issue.summary}`);
					panel.appendLine(`Sprint Name: ${issue.sprintName || 'Not available'}`);
					panel.appendLine(`Extracted Fiscal Year: ${fiscalYear}`);
					panel.appendLine(`Extracted Sprint Number: ${sprintNumber}`);
					panel.appendLine(`\nBranch name would be: ${createBranchName(issue.key, issue.summary, issue.sprintName)}`);
					
					vscode.window.showInformationMessage(`JIRA API test completed. Check the "JIRA API Debug" output panel for results.`);
				
			});
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(`Error: ${error.message}`);
			} else {
				vscode.window.showErrorMessage('An unknown error occurred');
			}
		}
	});

	context.subscriptions.push(createBranchDisposable);
	context.subscriptions.push(testJiraApiDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
