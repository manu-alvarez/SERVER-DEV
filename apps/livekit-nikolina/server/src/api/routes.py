from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from src.core.database import db
from src.core.auth import get_current_user

router = APIRouter()

# Local schemas for the routes
class RestaurantInfoUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    opening_time_lunch: Optional[str] = None
    closing_time_lunch: Optional[str] = None
    opening_time_dinner: Optional[str] = None
    closing_time_dinner: Optional[str] = None
    days_open: Optional[str] = None
    days_closed: Optional[str] = None
    reservation_slot_minutes: Optional[int] = None
    max_party_size: Optional[int] = None
    special_notes: Optional[str] = None

class TableCreate(BaseModel):
    table_number: int
    capacity: int
    location: str = "interior"
    description: str = ""

class TableUpdate(BaseModel):
    table_number: Optional[int] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[int] = None

class ReservationCreate(BaseModel):
    customer_name: str
    date: str
    time: str
    num_guests: int
    customer_phone: str = ""
    notes: str = ""

class MenuItemCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "principal"
    price: float = 0.0
    allergens: str = ""
    is_available: bool = True
    is_daily_special: bool = False

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    allergens: Optional[str] = None
    is_available: Optional[bool] = None
    is_daily_special: Optional[bool] = None

@router.get("/restaurant")
def get_restaurant(current_user: str = Depends(get_current_user)):
    return db.get_restaurant_info()

@router.put("/restaurant")
def update_restaurant(info: RestaurantInfoUpdate, current_user: str = Depends(get_current_user)):
    db.update_restaurant_info(**info.model_dump(exclude_unset=True))
    return {"status": "success"}

@router.get("/tables")
def get_tables(active_only: bool = False, current_user: str = Depends(get_current_user)):
    return db.get_tables(active_only=active_only)

@router.post("/tables")
def create_table(table: TableCreate, current_user: str = Depends(get_current_user)):
    tid = db.create_table(
        table.table_number, table.capacity, table.location, table.description
    )
    return {"id": tid}

@router.put("/tables/{table_id}")
def update_table(table_id: int, table: TableUpdate, current_user: str = Depends(get_current_user)):
    db.update_table(table_id, **table.model_dump(exclude_unset=True))
    return {"status": "success"}

@router.delete("/tables/{table_id}")
def delete_table(table_id: int, current_user: str = Depends(get_current_user)):
    db.delete_table(table_id)
    return {"status": "success"}

@router.get("/menu")
def get_menu(category: Optional[str] = None, available_only: bool = True, current_user: str = Depends(get_current_user)):
    return db.get_menu(category=category, available_only=available_only)

@router.post("/menu")
def create_menu_item(item: MenuItemCreate, current_user: str = Depends(get_current_user)):
    item_id = db.create_menu_item(
        name=item.name,
        description=item.description,
        category=item.category,
        price=item.price,
        allergens=item.allergens,
        is_available=item.is_available,
        is_daily_special=item.is_daily_special,
    )
    return {"id": item_id}

@router.put("/menu/{item_id}")
def update_menu_item(item_id: int, item: MenuItemUpdate, current_user: str = Depends(get_current_user)):
    db.update_menu_item(item_id, **item.model_dump(exclude_unset=True))
    return {"status": "success"}

@router.delete("/menu/{item_id}")
def delete_menu_item(item_id: int, current_user: str = Depends(get_current_user)):
    db.delete_menu_item(item_id)
    return {"status": "success"}

@router.get("/reservations")
def get_reservations(date: Optional[str] = None, status: Optional[str] = None, current_user: str = Depends(get_current_user)):
    return db.get_reservations(date=date, status=status)

@router.post("/reservations")
def create_reservation(res: ReservationCreate, current_user: str = Depends(get_current_user)):
    try:
        return db.create_reservation(
            customer_name=res.customer_name,
            date=res.date,
            time=res.time,
            num_guests=res.num_guests,
            customer_phone=res.customer_phone,
            notes=res.notes,
            source="dashboard",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.delete("/reservations/{reservation_id}")
def cancel_reservation(reservation_id: int, current_user: str = Depends(get_current_user)):
    success = db.cancel_reservation(reservation_id=reservation_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="Reservation not found or already cancelled"
        )
    return {"status": "success"}

@router.get("/calls")
def get_calls(limit: int = 50, current_user: str = Depends(get_current_user)):
    return db.get_call_log(limit=limit)

@router.get("/stats")
def get_stats(date: Optional[str] = None, current_user: str = Depends(get_current_user)):
    return db.get_stats(date=date)

@router.get("/check_availability")
def check_availability(date: str, time: str, num_guests: int, current_user: str = Depends(get_current_user)):
    return db.check_availability(date, time, num_guests)
