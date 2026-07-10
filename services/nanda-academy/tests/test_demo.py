# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.demo import city_demo, demo_html


def test_city_json_contains_buildings():
    city = city_demo()
    assert "Evaluation Hall" in city["buildings"]
    assert any(agent["agent_id"] == "weak_negotiator" for agent in city["agents"])


def test_demo_html_has_no_external_dependency():
    html = demo_html()
    assert "<html" in html
    assert "http://" not in html and "https://" not in html

