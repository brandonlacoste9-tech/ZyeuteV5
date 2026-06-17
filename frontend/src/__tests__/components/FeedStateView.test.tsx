import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "../../test/utils";
import {
  FeedStateView,
  FeedFallbackBanner,
} from "@/components/feed/FeedStateView";

describe("FeedStateView", () => {
  it("renders loading skeleton", () => {
    render(<FeedStateView variant="loading" />);
    expect(screen.getByText(/Chargement du fil/i)).toBeInTheDocument();
  });

  it("renders error state with retry", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<FeedStateView variant="error" onRetry={onRetry} />);

    expect(
      screen.getByRole("heading", { name: /Impossible de charger le fil/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Réessayer/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders abonnements-empty with explore and upload links", () => {
    render(<FeedStateView variant="abonnements-empty" />);

    expect(
      screen.getByRole("heading", { name: /Aucun abonnement encore/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Publier une vidéo/i }),
    ).toHaveAttribute("href", "/upload");
    expect(
      screen.getByRole("link", { name: /Découvrir des créateurs/i }),
    ).toHaveAttribute("href", "/explore");
  });

  it("shows retrying label when isRetrying", () => {
    render(<FeedStateView variant="error" onRetry={vi.fn()} isRetrying />);
    expect(screen.getByRole("button", { name: /Chargement/i })).toBeDisabled();
  });
});

describe("FeedFallbackBanner", () => {
  it("renders suggestions copy and dismisses", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(<FeedFallbackBanner onDismiss={onDismiss} />);

    expect(screen.getByText(/Suggestions/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Fermer/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
