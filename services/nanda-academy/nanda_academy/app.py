# SPDX-License-Identifier: Apache-2.0
"""Small dependency-free JSON API for NANDA Academy."""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Callable

from nanda_academy.agent_factory import create_agent
from nanda_academy.benchmark import benchmark_agent
from nanda_academy.certification import certify_agent
from nanda_academy.curriculum import generate_curriculum
from nanda_academy.demo import city_demo, demo_html, example_agent_profiles
from nanda_academy.engine import evaluate_agent
from nanda_academy.models import AgentProfile, parse_profile_payload
from nanda_academy.progress import progress_prompt
from nanda_academy.recommender import recommend_collaboration_role
from nanda_academy.tournament import simulate_tournament
from nanda_academy.training import run_training


def capabilities() -> dict[str, Any]:
    return {
        "service": "NANDA Academy",
        "version": "0.1.0",
        "deterministic": True,
        "authentication": "none for local development",
        "endpoints": [
            "GET /health",
            "GET /capabilities",
            "GET /example_agent_profiles",
            "POST /evaluate_agent",
            "POST /generate_curriculum",
            "POST /run_training",
            "POST /benchmark_agent",
            "POST /certify_agent",
            "POST /create_agent",
            "POST /recommend_collaboration_role",
            "POST /simulate_tournament",
            "POST /progress_prompt",
            "GET /demo",
            "GET /demo/city",
        ],
    }


def _profile(payload: dict[str, Any]) -> AgentProfile:
    return parse_profile_payload(payload)


def handle_post(path: str, payload: dict[str, Any]) -> tuple[int, Any]:
    routes: dict[str, Callable[[dict[str, Any]], Any]] = {
        "/evaluate_agent": lambda p: evaluate_agent(_profile(p), p.get("target_role"), p.get("depth", "standard")),
        "/generate_curriculum": lambda p: generate_curriculum(_profile(p), p.get("evaluation_report"), p.get("target_role"), p.get("desired_level", "competent")),
        "/run_training": lambda p: run_training(_profile(p), p.get("curriculum"), int(p.get("sessions", 3)), p.get("mode", "standard"), int(p.get("seed", 0))),
        "/benchmark_agent": lambda p: benchmark_agent(_profile(p), p.get("benchmark_suite", "standard"), int(p.get("seed", 0))),
        "/certify_agent": lambda p: certify_agent(_profile(p), p.get("benchmark_result"), p.get("track", "general"), p.get("requested_level", "competent")),
        "/create_agent": lambda p: create_agent(
            p["target_role"],
            p["domain"],
            p["objective"],
            p.get("desired_capabilities"),
            p.get("constraints", []),
            p.get("risk_tolerance", "medium"),
            p.get("collaboration_style", "balanced"),
            p.get("available_tools", []),
        ),
        "/recommend_collaboration_role": lambda p: recommend_collaboration_role(_profile(p), p.get("task_context", {})),
        "/simulate_tournament": lambda p: simulate_tournament(p.get("agent_profiles", []), p.get("town_scenario", "market_day"), int(p.get("rounds", 3)), int(p.get("seed", 0))),
        "/progress_prompt": lambda p: progress_prompt(p),
    }
    if path not in routes:
        return 404, {"error": f"unknown endpoint: {path}"}
    return 200, routes[path](payload)


class AcademyHandler(BaseHTTPRequestHandler):
    server_version = "NANDAAcademy/0.1"

    def _send(self, status: int, body: Any, content_type: str = "application/json") -> None:
        data = body.encode("utf-8") if isinstance(body, str) else json.dumps(body, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:  # noqa: N802
        try:
            if self.path == "/health":
                self._send(200, {"status": "ok", "service": "NANDA Academy"})
            elif self.path == "/capabilities":
                self._send(200, capabilities())
            elif self.path == "/example_agent_profiles":
                self._send(200, {"agent_profiles": example_agent_profiles()})
            elif self.path == "/demo/city":
                self._send(200, city_demo())
            elif self.path == "/demo":
                self._send(200, demo_html(), "text/html; charset=utf-8")
            else:
                self._send(404, {"error": f"unknown endpoint: {self.path}"})
        except Exception as exc:  # pragma: no cover - defensive HTTP boundary
            self._send(500, {"error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            payload = json.loads(raw)
            if not isinstance(payload, dict):
                raise ValueError("JSON body must be an object")
            status, body = handle_post(self.path, payload)
            self._send(status, body)
        except KeyError as exc:
            self._send(400, {"error": f"missing required field: {exc.args[0]}"})
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            self._send(400, {"error": str(exc)})
        except Exception as exc:  # pragma: no cover - defensive HTTP boundary
            self._send(500, {"error": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        return


def run(host: str = "0.0.0.0", port: int = 8000) -> None:
    ThreadingHTTPServer((host, port), AcademyHandler).serve_forever()


def main(argv: list[str] | None = None) -> None:
    argv = list(sys.argv[1:] if argv is None else argv)
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    while argv:
        arg = argv.pop(0)
        if arg == "--host" and argv:
            host = argv.pop(0)
        elif arg == "--port" and argv:
            port = int(argv.pop(0))
        elif arg in {"-h", "--help"}:
            print("Usage: python -m nanda_academy.app [--host HOST] [--port PORT]")
            return
        else:
            raise SystemExit(f"unknown argument: {arg}")
    try:
        run(host, port)
    except OSError as exc:
        if getattr(exc, "errno", None) == 48:
            raise SystemExit(
                f"Port {port} is already in use. Stop the existing server or run with --port {port + 1}."
            ) from exc
        raise


if __name__ == "__main__":
    main()
