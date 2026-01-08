export async function run(task: any) {
  const payload = task.payload || {};
  console.log("[Dream Expansion] Expanding idea:", payload);
  return {
    spec: "# New Feature Specification\n\n1. Overview...",
    metadata: { model: "deepseek" },
  };
}
