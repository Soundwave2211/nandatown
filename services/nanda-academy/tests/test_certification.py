# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.certification import certify_agent, verify_certificate


def test_strong_agent_receives_certificate(profile):
    result = certify_agent(profile(), requested_level="competent")
    assert result["certificate"]


def test_unsafe_agent_cannot_receive_advanced(profile, caps):
    result = certify_agent(profile(capabilities=caps(safety=0.3)), requested_level="advanced")
    assert result["certificate"] is None or result["level_awarded"] != "advanced"


def test_missing_evidence_blocks_expert(profile):
    result = certify_agent(profile(past_successes=[]), requested_level="expert")
    assert result["level_awarded"] != "expert"


def test_certificate_verification_fails_when_evidence_changes(profile):
    result = certify_agent(profile(), requested_level="competent")
    assert result["certificate"]
    assert verify_certificate(result["certificate"], result["evidence"])["valid"]
    assert not verify_certificate(result["certificate"], result["evidence"][:-1])["valid"]

