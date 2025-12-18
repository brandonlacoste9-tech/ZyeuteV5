/**
 * API interaction helper utilities for Playwright tests
 * Provides functions for mocking APIs, waiting for responses, and seeding test data
 */

import { Page, Route } from '@playwright/test';

/**
 * Wait for specific API endpoint to complete
 */
export async function waitForApi(page: Page, endpoint: string, timeout = 10000): Promise<void> {
    await page.waitForResponse(
        response => response.url().includes(endpoint) && response.status() === 200,
        { timeout }
    );
}

/**
 * Mock Stripe payment success
 */
export async function mockStripePayment(page: Page, shouldSucceed = true): Promise<void> {
    await page.route('**/api/stripe/**', async (route: Route) => {
        if (shouldSucceed) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    paymentIntent: {
                        id: 'pi_test_123',
                        status: 'succeeded',
                        amount: 1200,
                    },
                }),
            });
        } else {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Payment failed',
                }),
            });
        }
    });
}

/**
 * Mock WebSocket connection for real-time features
 */
export async function mockWebSocketConnection(page: Page): Promise<void> {
    await page.addInitScript(() => {
        // Mock WebSocket for messaging tests
        class MockWebSocket {
            onopen: (() => void) | null = null;
            onmessage: ((event: MessageEvent) => void) | null = null;
            onerror: (() => void) | null = null;
            onclose: (() => void) | null = null;

            constructor(url: string) {
                // Simulate connection success
                setTimeout(() => {
                    if (this.onopen) this.onopen();
                }, 100);
            }

            send(data: string) {
                // Mock echo back
                setTimeout(() => {
                    if (this.onmessage) {
                        this.onmessage(new MessageEvent('message', { data }));
                    }
                }, 200);
            }

            close() {
                if (this.onclose) this.onclose();
            }
        }

        // @ts-ignore
        window.WebSocket = MockWebSocket;
    });
}

/**
 * Seed test posts in the database
 */
export async function seedTestPosts(page: Page, count = 5): Promise<void> {
    // This would typically call a test API endpoint to create posts
    // For now, we'll simulate by calling the API directly
    for (let i = 0; i < count; i++) {
        await page.request.post('/api/posts', {
            data: {
                content: `Test post ${i + 1} - ${new Date().toISOString()}`,
                visibility: 'public',
            },
        });
    }
}

/**
 * Clear test data from database
 */
export async function clearTestData(page: Page): Promise<void> {
    // Call cleanup endpoint if available
    try {
        await page.request.post('/api/test/cleanup', {
            failOnStatusCode: false,
        });
    } catch (error) {
        // Cleanup endpoint might not exist, that's okay
        console.log('Test cleanup endpoint not available');
    }
}

/**
 * Wait for feed to load posts
 */
export async function waitForFeedToLoad(page: Page, minPosts = 1): Promise<void> {
    await page.waitForFunction(
        (min) => {
            const posts = document.querySelectorAll('[data-testid="post"], .post-item, article');
            return posts.length >= min;
        },
        minPosts,
        { timeout: 15000 }
    );
}

/**
 * Mock AI generation response
 */
export async function mockAIGeneration(page: Page): Promise<void> {
    await page.route('**/api/ai/**', async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                taskId: 'task_test_123',
                status: 'processing',
                result: {
                    imageUrl: 'https://example.com/generated-image.png',
                },
            }),
        });
    });
}

/**
 * Wait for element with retry
 */
export async function waitForElementWithRetry(
    page: Page,
    selector: string,
    maxRetries = 3
): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await page.waitForSelector(selector, { timeout: 5000 });
            return;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await page.reload();
        }
    }
}

/**
 * Intercept and log API calls for debugging
 */
export async function logApiCalls(page: Page): Promise<void> {
    page.on('response', response => {
        if (response.url().includes('/api/')) {
            console.log(`API ${response.request().method()} ${response.url()} - ${response.status()}`);
        }
    });
}
