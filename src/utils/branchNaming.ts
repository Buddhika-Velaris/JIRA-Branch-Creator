import * as vscode from 'vscode';

/**
 * Converts a string to a kebab-case slug suitable for use in a branch name
 * @param text The text to slugify
 * @returns A kebab-case slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

/**
 * Extracts fiscal year and sprint number from the sprint name
 * @param sprintName The sprint name (e.g., "WAR 2025 - Q2 Sprint 7" or "MAV 2025 - Sprint 8")
 * @returns An object with fiscal year and sprint number
 */
export function extractSprintInfo(sprintName: string): { fiscalYear: string, sprintNumber: string } {
  const config = vscode.workspace.getConfiguration('jira-branching');
  const branchPrefix = config.get<string>('branchPrefix') || 'fy25/great-merge';


  let fiscalYear = branchPrefix?.split('/')[0] || 'fy25'; 
  let sprintNumber = branchPrefix?.split('/')[1] || '00'; 
  
  if (sprintName) {
    const yearMatch = sprintName.match(/\b(20\d{2})\b/);
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1]);
      fiscalYear = `fy${year.toString().substring(2)}`;
    }
    
    const sprintMatch = sprintName.match(/\bSprint\s+(\d+)\b/i);
    if (sprintMatch && sprintMatch[1]) {
      const sprint = parseInt(sprintMatch[1]);
      sprintNumber = sprint < 10 ? `0${sprint}` : sprint.toString();
    }
  }
  
  return { fiscalYear, sprintNumber };
}

/**
 * Creates a Git branch name from a JIRA ticket ID, summary and sprint information
 * @param ticketId The JIRA ticket ID (e.g., WAR-7974)
 * @param summary The JIRA issue summary
 * @param sprintName The sprint name (e.g., "WAR 2025 - Q2 Sprint 7")
 * @returns A formatted branch name
 */
export function createBranchName(ticketId: string, summary: string, sprintName?: string): string {
  const { fiscalYear, sprintNumber } = extractSprintInfo(sprintName || '');
  
  const summarySlug = slugify(summary);
  
  const isNumeric = !isNaN(Number(sprintNumber));
  const sprintSegment = isNumeric ? `sprint${sprintNumber}` : sprintNumber;
  
  return `${fiscalYear}/${sprintSegment}/${ticketId.toUpperCase()}/${summarySlug}`;
}