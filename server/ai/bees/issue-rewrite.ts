export async function run(task: any) {
    const payload = task.payload || {};
    console.log('[Issue Rewrite] Rewriting issue:', payload);
    return {
        rewritten: "Fix the navigation bar glitch on mobile devices.",
        metadata: { model: 'deepseek' }
    };
}
