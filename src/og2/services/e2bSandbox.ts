export async function executePythonInSandbox(_code: string): Promise<{ output: string; error: string | null }> {
  return {
    output: '',
    error: 'The E2B sandbox is not connected on this host. The editor still keeps your buffer.',
  };
}
