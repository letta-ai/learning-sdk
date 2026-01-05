"""
Unit tests for MemoryClient upsert behavior.
"""

import time
import pytest


@pytest.mark.unit
class TestMemoryClientUnit:
    def test_upsert_updates_existing_block(self, learning_client, cleanup_agent, sleep_config):
        # Create agent
        learning_client.agents.create(agent=cleanup_agent)

        # Create initial memory block
        label = "test_upsert_label"
        created = learning_client.memory.create(
            agent=cleanup_agent,
            label=label,
            value="initial value",
            description="user profile",
        )
        assert created is not None

        # Allow Letta to process memory creation
        time.sleep(sleep_config["memory_create"])

        # Upsert on existing label (this is where UnboundLocalError happens pre-fix)
        updated = learning_client.memory.upsert(
            agent=cleanup_agent,
            label=label,
            value="updated value",
            description="user profile updated",
        )
        assert updated is not None

        # Ensure update occurred (same block id)
        assert getattr(updated, "id", None) == getattr(created, "id", None)

        # Optional sanity: no duplicate label blocks
        blocks = learning_client.memory.list(agent=cleanup_agent)
        labels = [b.label for b in blocks if hasattr(b, "label")]
        assert labels.count(label) == 1
