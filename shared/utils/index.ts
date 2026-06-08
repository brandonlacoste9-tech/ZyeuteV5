/**
 * Shared Utilities
 * Common utility functions used across frontend and backend
 */

export {
  validatePostType,
  inferMediaType,
  isVideoUrl,
  isImageUrl,
  type MediaType,
} from "./validatePostType";

export {
  dedupePostsByContent,
  getPostAuthorKey,
  getPostContentKey,
  interleaveByAuthor,
  interleaveQueues,
  mergeFeedWithDedup,
  prepareShuffledFeed,
  shuffleWithSeed,
  spaceOutFeed,
  type FeedSpacingOptions,
} from "./feedDedup";
