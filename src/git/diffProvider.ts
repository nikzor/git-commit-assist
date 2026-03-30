import { StagedDiff } from '../models/types';

export async function getStagedDiff(workspaceRoot: string): Promise<StagedDiff> {
  // TODO: Execute `git diff --cached` in the workspace root
  // TODO: Parse raw diff output into structured DiffFile[] objects
  throw new Error('Not implemented');
}
