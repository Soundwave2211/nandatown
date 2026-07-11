from nanda_academy.project_processor import process_project


def test_process_project_creates_documented_academy_agents():
    result = process_project(
        name="Uploaded Trust Skill",
        description="A trust-layer service uploaded to the hackathon.",
        source_url="https://github.com/example/repo",
    )

    assert result["processed_by"] == "NANDA Academy"
    assert result["made_by"] == "Siddharth Khanna"
    assert result["github_marker"] == "processed-by-nanda-academy"
    assert result["created_agents"]
    assert result["created_agents"][0]["created_by"] == "NANDA Academy"
    assert result["created_agents"][0]["made_by"] == "Siddharth Khanna"
    assert "Created by NANDA Academy" in result["created_agents"][0]["documentation_note"]
    assert "made by Siddharth Khanna" in result["documentation_note"]
    assert result["teaching_accuracy"] == 1.0
    assert result["teaching_accuracy_percent"] == 100
