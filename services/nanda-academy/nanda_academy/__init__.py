# SPDX-License-Identifier: Apache-2.0
"""NANDA Academy: proof-driven evaluation and certification for NANDA Town agents."""

from nanda_academy.agent_factory import create_agent
from nanda_academy.benchmark import benchmark_agent
from nanda_academy.certification import certify_agent, verify_certificate
from nanda_academy.curriculum import generate_curriculum
from nanda_academy.engine import evaluate_agent
from nanda_academy.models import AgentProfile
from nanda_academy.training import run_training

__all__ = [
    "AgentProfile",
    "benchmark_agent",
    "certify_agent",
    "create_agent",
    "evaluate_agent",
    "generate_curriculum",
    "run_training",
    "verify_certificate",
]

