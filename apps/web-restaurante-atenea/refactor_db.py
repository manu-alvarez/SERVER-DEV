import os
import re

db_path = "/Users/manu/Desktop/SERVER-DEV/apps/web-restaurante-atenea/database.py"

with open(db_path, "r") as f:
    content = f.read()

# I will replace the create_reservation method
new_create_reservation = """    def create_reservation(self, customer_name: str, date: str, time: str, num_guests: int,
                          customer_phone: str = "", notes: str = "", source: str = "web") -> dict:
        if num_guests <= 0:
            raise ValueError("El número de comensales debe ser mayor a cero.")
            
        conn = self._get_conn()
        try:
            # 1. Check max_party_size and basic capacity
            info = conn.execute("SELECT max_party_size FROM restaurant_info WHERE id = 1").fetchone()
            if info:
                max_party_size = info["max_party_size"]
                if num_guests > max_party_size:
                    raise ValueError(f"No aceptamos reservas de más de {max_party_size} personas por web.")
            
            # 2. Check if the name and phone are reasonably long (prevent spam)
            if len(customer_name) > 100 or len(customer_phone) > 50:
                raise ValueError("Los datos proporcionados son demasiado largos.")
                
            cursor = conn.execute(
                "INSERT INTO reservations (customer_name, customer_phone, date, time, num_guests, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (customer_name, customer_phone, date, time, num_guests, notes, source),
            )
            conn.commit()
            return {
                "reservation_id": cursor.lastrowid,
                "customer_name": customer_name,
                "date": date,
                "time": time,
                "num_guests": num_guests,
                "status": "confirmed",
            }
        finally:
            conn.close()"""

# Replace the existing create_reservation
content = re.sub(
    r'    def create_reservation\(self, customer_name: str, date: str, time: str, num_guests: int,\n                          customer_phone: str = "", notes: str = "", source: str = "web"\) -> dict:\n        conn = self\._get_conn\(\)\n        try:\n            cursor = conn\.execute\(\n                "INSERT INTO reservations \(customer_name, customer_phone, date, time, num_guests, notes, source\) VALUES \(\?, \?, \?, \?, \?, \?, \?\)",\n                \(customer_name, customer_phone, date, time, num_guests, notes, source\),\n            \)\n            conn\.commit\(\)\n            return \{\n                "reservation_id": cursor\.lastrowid,\n                "customer_name": customer_name,\n                "date": date,\n                "time": time,\n                "num_guests": num_guests,\n                "status": "confirmed",\n            \}\n        finally:\n            conn\.close\(\)',
    new_create_reservation,
    content
)

with open(db_path, "w") as f:
    f.write(content)

print("database.py updated for Atenea.")
