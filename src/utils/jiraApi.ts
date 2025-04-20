import * as vscode from 'vscode';


interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface JiraIssue {
  key: string;
  summary: string;
  sprintName?: string;
}

interface JiraApiResponse {
  key: string;
  fields: {
    summary: string;
    customfield_10020?: Array<{
      name?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
}

/**
 * Gets the JIRA configuration from VS Code settings
 * @returns JIRA configuration object or null if not properly configured
 */
export function getJiraConfig(): JiraConfig | null {
  const config = vscode.workspace.getConfiguration('jira-branching');
  const baseUrl = config.get<string>('baseUrl');
  const email = config.get<string>('email');
  const apiToken = config.get<string>('apiToken');

  if (!baseUrl || !email || !apiToken) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''), // Remove trailing slashes
    email,
    apiToken
  };
}

/**
 * Validates if a string matches the expected JIRA ticket format
 * @param ticketId The JIRA ticket ID to validate
 * @returns true if the ticket ID is valid, false otherwise
 */
export function validateJiraTicketFormat(ticketId: string): boolean {
  // Match format like WAR-7974 (uppercase letters + dash + numbers)
  const jiraTicketRegex = /^[A-Z]+-\d+$/;
  return jiraTicketRegex.test(ticketId);
}

/**
 * Fetches a JIRA issue by its ID
 * @param ticketId The JIRA ticket ID to fetch
 * @returns Promise resolving to a JiraIssue object or null if not found
 */
export async function getJiraIssue(ticketId: string): Promise<JiraIssue | null> {
  const jiraConfig = getJiraConfig();
  
  if (!jiraConfig) {
    throw new Error('JIRA configuration is not complete. Please update your settings.');
  }

  const { baseUrl, email, apiToken } = jiraConfig;
  
  try {
    const authToken = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    const response = await fetch(`${baseUrl}/rest/api/2/issue/${ticketId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`JIRA API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json() as JiraApiResponse;
    
    const sprintName = data.fields?.customfield_10020?.[0]?.name || '';
    console.log('Extracted sprint name:', sprintName);
    
    return {
      key: data.key,
      summary: data.fields?.summary || '',
      sprintName: sprintName
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching JIRA issue:', error);
      throw new Error(`Failed to fetch JIRA issue: ${error.message}`);
    }
    throw error;
  }
}