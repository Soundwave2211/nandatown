# SPDX-License-Identifier: Apache-2.0
"""Reference auth plugins."""

from nest_plugins_reference.auth.delegatable import DelegatableAuth
from nest_plugins_reference.auth.jwt_auth import JwtAuth

__all__ = ["DelegatableAuth", "JwtAuth"]
