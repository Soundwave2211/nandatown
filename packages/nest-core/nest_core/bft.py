# SPDX-License-Identifier: Apache-2.0
"""Shared BFT proof helpers used by HotStuff scenarios, plugins, and validators.

Example::

    params = compute_bft_parameters(7)
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any

__all__ = [
    "BftParameters",
    "compute_bft_parameters",
    "make_vote_id",
    "quorum_for_f",
    "unique_signers",
]


@dataclass(frozen=True)
class BftParameters:
    """Computed Byzantine fault-tolerance parameters.

    Example::

        params = BftParameters(n=7, f=2, quorum=5)
    """

    n: int
    f: int
    quorum: int


def compute_bft_parameters(n: int) -> BftParameters:
    """Compute ``f`` and quorum for a fixed-membership ``3f + 1`` group.

    Example::

        params = compute_bft_parameters(7)
    """
    if n < 1:
        msg = f"n must be positive; got {n}"
        raise ValueError(msg)
    f = (n - 1) // 3
    return BftParameters(n=n, f=f, quorum=2 * f + 1)


def quorum_for_f(f: int) -> int:
    """Return the quorum size ``2f + 1``.

    Example::

        quorum = quorum_for_f(2)
    """
    if f < 0:
        msg = f"f must be non-negative; got {f}"
        raise ValueError(msg)
    return 2 * f + 1


def make_vote_id(round_id: int, view: int, phase: str, signer: Any, value: str) -> str:
    """Return the deterministic identifier for one signed vote.

    Example::

        vote_id = make_vote_id(1, 1, "prepare", "replica-0", "block")
    """
    return hashlib.sha256(f"{round_id}|{view}|{phase}|{signer}|{value}".encode()).hexdigest()


def unique_signers(signers: list[str]) -> set[str]:
    """Return the unique signer set for a QC signer list.

    Example::

        signers = unique_signers(["a", "a", "b"])
    """
    return {str(signer) for signer in signers}
