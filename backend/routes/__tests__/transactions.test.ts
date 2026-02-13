import { describe, it, expect, vi, beforeEach } from "vitest";
import { storage } from "../../storage";

// Mock storage
vi.mock("../../storage", () => ({
  storage: {
    getUserTransactions: vi.fn(),
  },
}));

describe("getUserTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user transactions with sender and receiver info", async () => {
    // Mock transaction data
    const mockTransactions = [
      {
        id: "tx-1",
        senderId: "user-1",
        receiverId: "user-2",
        amount: 1000,
        creditType: "cash",
        type: "gift",
        status: "completed",
        feeAmount: 50,
        taxAmount: 25,
        metadata: { message: "Pour ta poutine!" },
        hiveId: "quebec",
        createdAt: new Date("2024-01-01"),
        sender: {
          id: "user-1",
          username: "sender",
          displayName: "Sender User",
          avatarUrl: "https://example.com/avatar1.jpg",
        },
        receiver: {
          id: "user-2",
          username: "receiver",
          displayName: "Receiver User",
          avatarUrl: "https://example.com/avatar2.jpg",
        },
      },
      {
        id: "tx-2",
        senderId: "user-2",
        receiverId: "user-1",
        amount: 500,
        creditType: "cash",
        type: "purchase",
        status: "pending",
        feeAmount: 25,
        taxAmount: 12,
        metadata: {},
        hiveId: "quebec",
        createdAt: new Date("2024-01-02"),
        sender: {
          id: "user-2",
          username: "receiver",
          displayName: "Receiver User",
          avatarUrl: "https://example.com/avatar2.jpg",
        },
        receiver: {
          id: "user-1",
          username: "sender",
          displayName: "Sender User",
          avatarUrl: "https://example.com/avatar1.jpg",
        },
      },
    ];

    (storage.getUserTransactions as any).mockResolvedValue(mockTransactions);

    const result = await storage.getUserTransactions("user-1");

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("sender");
    expect(result[0]).toHaveProperty("receiver");
    expect(result[0].sender?.username).toBe("sender");
    expect(result[0].receiver?.username).toBe("receiver");
  });

  it("should respect the limit parameter", async () => {
    const mockTransactions = Array(100)
      .fill(null)
      .map((_, i) => ({
        id: `tx-${i}`,
        senderId: "user-1",
        receiverId: "user-2",
        amount: 100,
        creditType: "cash",
        type: "gift",
        status: "completed",
        feeAmount: 5,
        taxAmount: 2,
        metadata: {},
        hiveId: "quebec",
        createdAt: new Date(),
      }));

    (storage.getUserTransactions as any).mockResolvedValue(
      mockTransactions.slice(0, 10),
    );

    const result = await storage.getUserTransactions("user-1", 10);

    expect(storage.getUserTransactions).toHaveBeenCalledWith("user-1", 10);
    expect(result).toHaveLength(10);
  });

  it("should handle transactions where user is sender", async () => {
    const mockTransaction = {
      id: "tx-1",
      senderId: "user-1",
      receiverId: "user-2",
      amount: 1000,
      creditType: "cash",
      type: "gift",
      status: "completed",
      feeAmount: 50,
      taxAmount: 25,
      metadata: {},
      hiveId: "quebec",
      createdAt: new Date(),
      sender: {
        id: "user-1",
        username: "sender",
        displayName: "Sender User",
        avatarUrl: "https://example.com/avatar1.jpg",
      },
      receiver: {
        id: "user-2",
        username: "receiver",
        displayName: "Receiver User",
        avatarUrl: "https://example.com/avatar2.jpg",
      },
    };

    (storage.getUserTransactions as any).mockResolvedValue([mockTransaction]);

    const result = await storage.getUserTransactions("user-1");

    expect(result[0].senderId).toBe("user-1");
    expect(result[0].sender?.id).toBe("user-1");
  });

  it("should handle transactions where user is receiver", async () => {
    const mockTransaction = {
      id: "tx-1",
      senderId: "user-2",
      receiverId: "user-1",
      amount: 1000,
      creditType: "cash",
      type: "gift",
      status: "completed",
      feeAmount: 50,
      taxAmount: 25,
      metadata: {},
      hiveId: "quebec",
      createdAt: new Date(),
      sender: {
        id: "user-2",
        username: "sender",
        displayName: "Sender User",
        avatarUrl: "https://example.com/avatar2.jpg",
      },
      receiver: {
        id: "user-1",
        username: "receiver",
        displayName: "Receiver User",
        avatarUrl: "https://example.com/avatar1.jpg",
      },
    };

    (storage.getUserTransactions as any).mockResolvedValue([mockTransaction]);

    const result = await storage.getUserTransactions("user-1");

    expect(result[0].receiverId).toBe("user-1");
    expect(result[0].receiver?.id).toBe("user-1");
  });

  it("should return empty array when no transactions exist", async () => {
    (storage.getUserTransactions as any).mockResolvedValue([]);

    const result = await storage.getUserTransactions("user-1");

    expect(result).toHaveLength(0);
  });
});
