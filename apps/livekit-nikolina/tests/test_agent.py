import pytest
from livekit.agent import Agent

@pytest.fixture
def agent():
    return Agent()

def test_agent_initialization(agent):
    assert agent is not None

def test_agent_process_request(agent):
    # Test processing a simple request
    response = agent.process_request("Hello")
    assert response is not None
    assert "Hello" in response

    # Test processing a complex request
    response = agent.process_request("What is the weather like today?")
    assert response is not None
    assert "weather" in response.lower()

    # Test processing an empty request
    with pytest.raises(ValueError):
        agent.process_request("")

    # Test processing a request that triggers a tool
    response = agent.process_request("What is the time?")
    assert response is not None
    assert "time" in response.lower()

    # Test processing a request that triggers multiple tools
    response = agent.process_request("Tell me a joke and the weather")
    assert response is not None
    assert "joke" in response.lower() or "weather" in response.lower()

    # Test processing a request that triggers a tool with parameters
    response = agent.process_request("Search for Python tutorials")
    assert response is not None
    assert "python" in response.lower() and "tutorials" in response.lower()

    # Test processing a request that triggers a tool with invalid parameters
    with pytest.raises(ValueError):
        agent.process_request("Search for ")
