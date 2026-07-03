import pytest
from livekit.database import Database

@pytest.fixture
def database():
    return Database()

def test_database_initialization(database):
    assert database is not None

def test_database_create_table(database):
    # Test creating a table
    database.create_table("test_table", [("id", "INTEGER PRIMARY KEY"), ("name", "TEXT")])
    assert "test_table" in database.get_tables()

    # Test creating a table with invalid name
    with pytest.raises(ValueError):
        database.create_table("", [("id", "INTEGER PRIMARY KEY")])

    # Test creating a table with invalid columns
    with pytest.raises(ValueError):
        database.create_table("test_table", [])

    # Test creating a table with invalid column types
    with pytest.raises(ValueError):
        database.create_table("test_table", [("id", "INVALID_TYPE")])

def test_database_insert_data(database):
    # Create a test table
    database.create_table("test_table", [("id", "INTEGER PRIMARY KEY"), ("name", "TEXT")])

    # Test inserting data
    database.insert_data("test_table", {"name": "Test"})
    data = database.fetch_data("test_table")
    assert len(data) == 1
    assert data[0]["name"] == "Test"

    # Test inserting data with invalid table
    with pytest.raises(ValueError):
        database.insert_data("invalid_table", {"name": "Test"})

    # Test inserting data with invalid data
    with pytest.raises(ValueError):
        database.insert_data("test_table", {})

def test_database_fetch_data(database):
    # Create a test table and insert data
    database.create_table("test_table", [("id", "INTEGER PRIMARY KEY"), ("name", "TEXT")])
    database.insert_data("test_table", {"name": "Test"})

    # Test fetching data
    data = database.fetch_data("test_table")
    assert len(data) == 1
    assert data[0]["name"] == "Test"

    # Test fetching data with invalid table
    with pytest.raises(ValueError):
        database.fetch_data("invalid_table")

def test_database_update_data(database):
    # Create a test table and insert data
    database.create_table("test_table", [("id", "INTEGER PRIMARY KEY"), ("name", "TEXT")])
    database.insert_data("test_table", {"name": "Test"})

    # Test updating data
    database.update_data("test_table", {"name": "Updated"}, "id = 1")
    data = database.fetch_data("test_table")
    assert data[0]["name"] == "Updated"

    # Test updating data with invalid table
    with pytest.raises(ValueError):
        database.update_data("invalid_table", {"name": "Updated"}, "id = 1")

    # Test updating data with invalid data
    with pytest.raises(ValueError):
        database.update_data("test_table", {}, "id = 1")

    # Test updating data with invalid condition
    with pytest.raises(ValueError):
        database.update_data("test_table", {"name": "Updated"}, "")

def test_database_delete_data(database):
    # Create a test table and insert data
    database.create_table("test_table", [("id", "INTEGER PRIMARY KEY"), ("name", "TEXT")])
    database.insert_data("test_table", {"name": "Test"})

    # Test deleting data
    database.delete_data("test_table", "id = 1")
    data = database.fetch_data("test_table")
    assert len(data) == 0

    # Test deleting data with invalid table
    with pytest.raises(ValueError):
        database.delete_data("invalid_table", "id = 1")

    # Test deleting data with invalid condition
    with pytest.raises(ValueError):
        database.delete_data("test_table", "")
