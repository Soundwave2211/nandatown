# SPDX-License-Identifier: Apache-2.0
"""Reference identity plugins."""

from nest_plugins_reference.identity.did_key import DidKeyIdentity
from nest_plugins_reference.identity.ed25519_rotating import Ed25519RotatingIdentity

__all__ = ["DidKeyIdentity", "Ed25519RotatingIdentity"]
