/**
 * Ti-Guy Chat Bee
 * Uses the unified Ti-Guy system for authentic Quebec joual chat
 */

import { v3TiGuyChat } from "../../v3-swarm.js";

export async function run(task: any) {
  const payload = task.payload || {};
  const message = payload.message || payload.prompt || "";
  const history = payload.history || [];
  const image = payload.image || null;
  const userId = task.userId;

  console.log(
    "[Ti-Guy Chat] Processing message:",
    message.substring(0, 50),
    image ? "(with image)" : "",
  );

  const response = await v3TiGuyChat(message, history, image, userId);

  return {
    response,
    metadata: { model: "deepseek", bee: "ti-guy-chat" },
  };
}
