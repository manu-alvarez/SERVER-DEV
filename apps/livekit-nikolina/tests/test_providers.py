import pytest
from livekit.providers import ProviderFactory

@pytest.fixture
def provider_factory():
    return ProviderFactory()

def test_provider_factory_initialization(provider_factory):
    assert provider_factory is not None

def test_provider_factory_get_provider(provider_factory):
    # Test getting a provider
    provider = provider_factory.get_provider("weather")
    assert provider is not None

    # Test getting a provider with invalid name
    with pytest.raises(ValueError):
        provider_factory.get_provider("")

    # Test getting a provider that doesn't exist
    with pytest.raises(ValueError):
        provider_factory.get_provider("invalid_provider")
