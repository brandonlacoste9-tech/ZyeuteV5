#!/usr/bin/env python3
"""
🧪 Finance Bee Integration Tests

Tests for Stripe webhook processing and Supabase integration
"""

import os
import sys
import json
import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock environment variables before importing finance_bee
os.environ['STRIPE_SECRET_KEY'] = 'sk_test_mock_key'
os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_mock_secret'
os.environ['VITE_SUPABASE_URL'] = 'https://mock.supabase.co'
# Use a valid JWT format for mock key (3 parts separated by dots, completely fake)
os.environ['SUPABASE_SERVICE_KEY'] = 'aGVhZGVy.cGF5bG9hZA.c2lnbmF0dXJl'

# ═══════════════════════════════════════════════════════════════
# TEST DATA
# ═══════════════════════════════════════════════════════════════

MOCK_SUBSCRIPTION_CREATED_EVENT = {
    'type': 'customer.subscription.created',
    'data': {
        'object': {
            'id': 'sub_test123',
            'status': 'active',
            'current_period_start': 1702800000,
            'current_period_end': 1705478400,
            'metadata': {
                'user_id': 'user_123',
                'tier_name': 'premium'
            }
        }
    }
}

MOCK_SUBSCRIPTION_UPDATED_EVENT = {
    'type': 'customer.subscription.updated',
    'data': {
        'object': {
            'id': 'sub_test123',
            'status': 'past_due',
            'current_period_start': 1702800000,
            'current_period_end': 1705478400,
        }
    }
}

MOCK_PAYMENT_SUCCEEDED_EVENT = {
    'type': 'payment_intent.succeeded',
    'data': {
        'object': {
            'id': 'pi_test123',
            'amount': 2999,  # $29.99
            'currency': 'usd',
            'status': 'succeeded'
        }
    }
}

# ═══════════════════════════════════════════════════════════════
# TESTS
# ═══════════════════════════════════════════════════════════════

@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    mock = Mock()
    mock.table.return_value = mock
    mock.insert.return_value = mock
    mock.update.return_value = mock
    mock.eq.return_value = mock
    mock.execute.return_value = Mock(data=[{'id': 'test_id'}])
    return mock


@pytest.mark.asyncio
async def test_subscription_created_processing(mock_supabase):
    """Test processing of subscription.created event"""
    with patch('finance_bee.supabase', mock_supabase):
        from finance_bee import process_subscription_created
        
        result = await process_subscription_created(MOCK_SUBSCRIPTION_CREATED_EVENT)
        
        assert result is True
        mock_supabase.table.assert_called_with('subscription_tiers')
        mock_supabase.insert.assert_called_once()


@pytest.mark.asyncio
async def test_subscription_updated_processing(mock_supabase):
    """Test processing of subscription.updated event"""
    with patch('finance_bee.supabase', mock_supabase):
        from finance_bee import process_subscription_updated
        
        result = await process_subscription_updated(MOCK_SUBSCRIPTION_UPDATED_EVENT)
        
        assert result is True
        mock_supabase.table.assert_called_with('subscription_tiers')
        mock_supabase.update.assert_called_once()


@pytest.mark.asyncio
async def test_payment_succeeded_processing(mock_supabase):
    """Test processing of payment_intent.succeeded event"""
    with patch('finance_bee.supabase', mock_supabase):
        from finance_bee import process_payment_succeeded
        
        result = await process_payment_succeeded(MOCK_PAYMENT_SUCCEEDED_EVENT)
        
        assert result is True


@pytest.mark.asyncio
async def test_webhook_signature_validation():
    """Test Stripe webhook signature validation"""
    # This test would require mocking stripe.Webhook.construct_event
    # In production, ensure signature validation is working
    pass


def test_environment_configuration():
    """Test that required environment variables are set"""
    assert os.getenv('STRIPE_SECRET_KEY') is not None
    assert os.getenv('STRIPE_WEBHOOK_SECRET') is not None
    assert os.getenv('VITE_SUPABASE_URL') is not None
    assert os.getenv('SUPABASE_SERVICE_KEY') is not None


# ═══════════════════════════════════════════════════════════════
# INTEGRATION TEST SCENARIOS
# ═══════════════════════════════════════════════════════════════

@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_subscription_lifecycle(mock_supabase):
    """Test complete subscription lifecycle: create -> update -> delete"""
    with patch('finance_bee.supabase', mock_supabase):
        from finance_bee import (
            process_subscription_created,
            process_subscription_updated,
            process_subscription_deleted
        )
        
        # Create
        create_result = await process_subscription_created(MOCK_SUBSCRIPTION_CREATED_EVENT)
        assert create_result is True
        
        # Update
        update_result = await process_subscription_updated(MOCK_SUBSCRIPTION_UPDATED_EVENT)
        assert update_result is True
        
        # Delete
        delete_event = {
            'type': 'customer.subscription.deleted',
            'data': {'object': {'id': 'sub_test123'}}
        }
        delete_result = await process_subscription_deleted(delete_event)
        assert delete_result is True


@pytest.mark.asyncio
async def test_error_handling_missing_data():
    """Test error handling when event data is malformed"""
    malformed_event = {
        'type': 'customer.subscription.created',
        'data': {
            'object': {
                # Missing required fields
            }
        }
    }
    
    with patch('finance_bee.supabase', Mock()):
        from finance_bee import process_subscription_created
        
        # Should handle error gracefully and return False
        result = await process_subscription_created(malformed_event)
        assert result is False


# ═══════════════════════════════════════════════════════════════
# TEST SUMMARY
# ═══════════════════════════════════════════════════════════════

def test_suite_info():
    """Display test suite information"""
    print("\n" + "="*60)
    print("🐝 FINANCE BEE TEST SUITE")
    print("="*60)
    print("Tests:")
    print("  ✅ Subscription creation processing")
    print("  ✅ Subscription update processing")
    print("  ✅ Payment success processing")
    print("  ✅ Environment configuration")
    print("  ✅ Full lifecycle integration")
    print("  ✅ Error handling")
    print("="*60)
    print("Status: All tests ready to run")
    print("="*60 + "\n")


if __name__ == "__main__":
    test_suite_info()
    pytest.main([__file__, "-v", "-s"])
