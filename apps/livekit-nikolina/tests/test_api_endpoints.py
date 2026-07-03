import pytest
from livekit.api import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_api_endpoints_initialization(client):
    assert client is not None

def test_api_endpoints_get_root(client):
    # Test getting the root endpoint
    response = client.get('/')
    assert response.status_code == 200

    # Test getting the root endpoint with invalid method
    response = client.post('/')
    assert response.status_code == 405

def test_api_endpoints_get_weather(client):
    # Test getting the weather endpoint
    response = client.get('/weather')
    assert response.status_code == 200

    # Test getting the weather endpoint with invalid method
    response = client.post('/weather')
    assert response.status_code == 405

    # Test getting the weather endpoint with invalid parameters
    response = client.get('/weather?location=')
    assert response.status_code == 400

def test_api_endpoints_get_time(client):
    # Test getting the time endpoint
    response = client.get('/time')
    assert response.status_code == 200

    # Test getting the time endpoint with invalid method
    response = client.post('/time')
    assert response.status_code == 405

    # Test getting the time endpoint with invalid parameters
    response = client.get('/time?location=')
    assert response.status_code == 400

def test_api_endpoints_get_joke(client):
    # Test getting the joke endpoint
    response = client.get('/joke')
    assert response.status_code == 200

    # Test getting the joke endpoint with invalid method
    response = client.post('/joke')
    assert response.status_code == 405

    # Test getting the joke endpoint with invalid parameters
    response = client.get('/joke?category=')
    assert response.status_code == 400

def test_api_endpoints_get_search(client):
    # Test getting the search endpoint
    response = client.get('/search')
    assert response.status_code == 200

    # Test getting the search endpoint with invalid method
    response = client.post('/search')
    assert response.status_code == 405

    # Test getting the search endpoint with invalid parameters
    response = client.get('/search?query=')
    assert response.status_code == 400
