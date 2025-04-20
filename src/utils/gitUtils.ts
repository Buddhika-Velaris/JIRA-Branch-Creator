import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Checks if the given directory has a Git repository
 * @param directory The directory to check
 * @returns Promise resolving to true if a Git repository exists, false otherwise
 */
export async function isGitRepository(directory: string): Promise<boolean> {
  try {
    await execPromise('git rev-parse --is-inside-work-tree', { cwd: directory });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the name of the current Git branch
 * @param directory The directory where the Git repository is located
 * @returns Promise resolving to the current branch name or null if an error occurs
 */
export async function getCurrentBranch(directory: string): Promise<string | null> {
  try {
    const { stdout } = await execPromise('git branch --show-current', { cwd: directory });
    return stdout.trim() || null;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a Git branch already exists
 * @param branchName The name of the branch to check
 * @param directory The directory where the Git repository is located
 * @returns Promise resolving to true if the branch exists, false otherwise
 */
export async function branchExists(branchName: string, directory: string): Promise<boolean> {
  try {
    const { stdout } = await execPromise(`git branch --list ${branchName}`, { cwd: directory });
    return !!stdout.trim();
  } catch (error) {
    return false;
  }
}

/**
 * Creates and checks out a new Git branch
 * @param branchName The name of the branch to create
 * @param directory The directory where the Git repository is located
 * @returns Promise resolving to true if successful, or an error message if it fails
 */
export async function createAndCheckoutBranch(branchName: string, directory: string): Promise<string | true> {
  try {
    if (!directory) {
      return 'No workspace folder is open';
    }
    
    const isRepo = await isGitRepository(directory);
    if (!isRepo) {
      return 'The current workspace is not a Git repository';
    }
    
    const exists = await branchExists(branchName, directory);
    if (exists) {
      const checkoutExisting = await vscode.window.showWarningMessage(
        `Branch "${branchName}" already exists. Would you like to check it out?`,
        'Yes', 'No'
      );
      
      if (checkoutExisting === 'Yes') {
        await execPromise(`git checkout ${branchName}`, { cwd: directory });
        return true;
      }
      return `Branch "${branchName}" already exists`;
    }
    
    await execPromise(`git checkout -b ${branchName}`, { cwd: directory });
    return true;
  } catch (error) {
    if (error instanceof Error) {
      return `Failed to create branch: ${error.message}`;
    }
    return 'An unknown error occurred while creating the branch';
  }
}