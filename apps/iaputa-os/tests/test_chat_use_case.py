import pytest
from iaputa.chat_use_case import ChatUseCase

@pytest.fixture
def chat_use_case():
    return ChatUseCase()

def test_chat_use_case_initialization(chat_use_case):
    assert chat_use_case is not None

def test_chat_use_case_process_message(chat_use_case):
    # Test with a simple message
    response = chat_use_case.process_message("Hello")
    assert response is not None
    assert "Hello" in response

    # Test with a complex message
    response = chat_use_case.process_message("What is the weather like today?")
    assert response is not None
    assert "weather" in response.lower()

    # Test with an empty message
    with pytest.raises(ValueError):
        chat_use_case.process_message("")

    # Test with a message that triggers a tool
    response = chat_use_case.process_message("What is the time?")
    assert response is not None
    assert "time" in response.lower()

    # Test with a message that triggers multiple tools
    response = chat_use_case.process_message("Tell me a joke and the weather")
    assert response is not None
    assert "joke" in response.lower() or "weather" in response.lower()

    # Test with a message that triggers a tool with parameters
    response = chat_use_case.process_message("Search for Python tutorials")
    assert response is not None
    assert "python" in response.lower() and "tutorials" in response.lower()

    # Test with a message that triggers a tool with invalid parameters
    with pytest.raises(ValueError):
        chat_use_case.process_message("Search for ")
