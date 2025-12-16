#!/usr/bin/env node
/**
 * Test Finance Bee Webhook
 * Sends a mock Stripe event to verify webhook processing
 */

const mockEvent = {
    type: "payment_intent.succeeded",
    data: {
        object: {
            id: "pi_test_12345",
            amount: 5000,
            currency: "cad",
            status: "succeeded"
        }
    }
};

async function testWebhook() {
    console.log('🧪 Testing Finance Bee webhook...\n');

    try {
        const response = await fetch('http://localhost:8001/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': `t=${Math.floor(Date.now() / 1000)},v1=fake_signature_for_testing`
            },
            body: JSON.stringify(mockEvent)
        });

        const data = await response.json();

        console.log('📊 Response Status:', response.status);
        console.log('📨 Response Body:', JSON.stringify(data, null, 2));

        if (response.status === 400 && data.detail === 'Invalid signature') {
            console.log('\n✅ SUCCESS! The Finance Bee is receiving requests!');
            console.log('❌ Expected: "Invalid signature" error (because we used a fake signature)');
            console.log('✨ This proves the webhook endpoint is working and validating signatures.');
        } else {
            console.log('\n⚠️ Unexpected response. Check Finance Bee logs.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWebhook();
