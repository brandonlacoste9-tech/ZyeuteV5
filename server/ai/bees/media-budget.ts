export async function run(task: any) {
    const payload = task.payload || {};
    console.log('[Media Budget] Checking budget:', payload);
    return {
        approved: true,
        remainingBudget: 100.00,
        metadata: { model: 'mistral' }
    };
}
