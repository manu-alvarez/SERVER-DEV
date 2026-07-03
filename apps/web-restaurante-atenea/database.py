"""
Restaurante Atenea — Database Module

SQLite database with menu items, reservations, and restaurant info.
Seeded with authentic Atenea menu data and gourmet image assets.
"""

import logging
import os
import sqlite3
from datetime import datetime
from typing import Optional

logger = logging.getLogger("atenea-db")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "data", "atenea.db")
DB_PATH = os.getenv("ATENEA_DB_PATH", DEFAULT_DB_PATH)


class AteneaDB:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_db(self) -> None:
        conn = self._get_conn()
        try:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS restaurant_info (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    name TEXT NOT NULL DEFAULT 'Restaurante Atenea',
                    address TEXT NOT NULL DEFAULT 'Calle la Vía s/n, 22590 Torrente de Cinca, Huesca',
                    phone TEXT NOT NULL DEFAULT '+34 609 917 007',
                    description TEXT DEFAULT 'Especialistas en brasa. Fuego, producto y tiempo.',
                    cuisine_type TEXT DEFAULT 'Brasa · Mediterránea',
                    opening_time_lunch TEXT DEFAULT '13:30',
                    closing_time_lunch TEXT DEFAULT '15:30',
                    opening_time_dinner TEXT DEFAULT '20:30',
                    closing_time_dinner TEXT DEFAULT '22:30',
                    days_open TEXT DEFAULT 'lunes,martes,miercoles,jueves,viernes,sabado,domingo',
                    days_closed TEXT DEFAULT '',
                    reservation_slot_minutes INTEGER DEFAULT 30,
                    max_party_size INTEGER DEFAULT 10,
                    special_notes TEXT DEFAULT '',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS menu_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    category TEXT NOT NULL DEFAULT 'principal',
                    price REAL DEFAULT 0.0,
                    allergens TEXT DEFAULT '',
                    is_available BOOLEAN DEFAULT 1,
                    is_daily_special BOOLEAN DEFAULT 0,
                    image_url TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS reservations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_name TEXT NOT NULL,
                    customer_phone TEXT DEFAULT '',
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    num_guests INTEGER NOT NULL DEFAULT 2,
                    notes TEXT DEFAULT '',
                    source TEXT DEFAULT 'web',
                    status TEXT DEFAULT 'confirmed',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS call_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    caller_id TEXT DEFAULT '',
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    duration_seconds INTEGER DEFAULT 0,
                    summary TEXT DEFAULT ''
                );
            """)

            # Seed restaurant info
            if conn.execute("SELECT COUNT(*) AS c FROM restaurant_info").fetchone()["c"] == 0:
                conn.execute("INSERT INTO restaurant_info (id) VALUES (1)")

            # Seed menu — authentic Atenea menu with Gourmet AI images
            if conn.execute("SELECT COUNT(*) AS c FROM menu_items").fetchone()["c"] == 0:
                menu = [
                    ('Ensalada Mediterránea', 'Tomate, pepino, aceitunas, queso feta y vinagreta de limón', 'entrante', 12.50, 'lácteos', 1, 0, '/assets/ensalada.png'),
                    ('Croquetas de Jamón Ibérico', 'Croquetas caseras con bechamel cremosa y jamón 100% bellota.', 'entrante', 14.00, 'gluten,lácteos', 1, 0, '/assets/croquetas.png'),
                    ('Calamares a la Romana', 'Calamares frescos rebozados con harina de garbanzo.', 'entrante', 13.00, 'gluten,pescado', 1, 0, '/assets/calamares.png'),
                    ('Chuletón de Vaca Vieja', 'Vaca vieja con maduración 30+ días. Brasa de encina.', 'principal', 35.00, '', 1, 1, '/assets/chuleton.png'),
                    ('Ternasco de Aragón Asado', 'Ternasco IGP Aragón asado lentamente con hierbas.', 'principal', 28.00, '', 1, 0, '/assets/ternasco.png'),
                    ('Bacalao a la Vizcaína', 'Lomo de bacalao al pil-pil con salsa vizcaína tradicional.', 'principal', 22.00, 'pescado', 1, 0, '/assets/bacalao.png'),
                    ('Lubina de Pincho a la Plancha', 'Lubina salvaje a la brasa con verduras asadas.', 'principal', 24.50, 'pescado', 1, 0, '/assets/lubina.png'),
                    ('Paella Valenciana', 'Arroz bomba con marisco, azafrán de hebra y verduras.', 'principal', 22.00, '', 1, 0, '/assets/paella.png'),
                    ('Solomillo de Ternera', 'Solomillo con reducción de Pedro Ximénez.', 'principal', 28.00, '', 1, 0, '/assets/solomillo.png'),
                    ('Risotto de Setas', 'Arroz cremoso con setas de temporada y parmesano.', 'principal', 18.50, 'lácteos,gluten', 1, 0, '/assets/risotto.png'),
                    ('Tiramisú Casero', 'Bizcocho de café con mascarpone y cacao amargo.', 'postre', 7.50, 'gluten,lácteos,huevo', 1, 0, '/assets/tiramisu.png'),
                    ('Tarta de Queso', 'Tarta horneada con coulis de frutos rojos.', 'postre', 7.00, 'gluten,lácteos,huevo', 1, 0, '/assets/tarta.png'),
                    ('Sangría de la Casa', 'Vino tinto con frutas de temporada y especias.', 'bebida', 5.00, '', 1, 0, '/assets/sangria.png'),
                    ('Agua Mineral', 'Botella 750ml.', 'bebida', 2.50, '', 1, 0, ''),
                ]
                conn.executemany(
                    "INSERT INTO menu_items (name, description, category, price, allergens, is_available, is_daily_special, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    menu
                )
                logger.info("Seeded %d Atenea menu items", len(menu))

            conn.commit()
        finally:
            conn.close()

    def get_menu(self, category: Optional[str] = None, available_only: bool = True) -> list[dict]:
        conn = self._get_conn()
        try:
            query = "SELECT * FROM menu_items WHERE 1=1"
            params: list = []
            if available_only:
                query += " AND is_available = 1"
            if category:
                query += " AND category = ?"
                params.append(category)
            query += " ORDER BY category, id"
            return [dict(r) for r in conn.execute(query, params).fetchall()]
        finally:
            conn.close()

    def get_restaurant_info(self) -> dict:
        conn = self._get_conn()
        try:
            row = conn.execute("SELECT * FROM restaurant_info WHERE id = 1").fetchone()
            return dict(row) if row else {}
        finally:
            conn.close()

    def create_reservation(self, customer_name: str, date: str, time: str, num_guests: int,
                          customer_phone: str = "", notes: str = "", source: str = "web") -> dict:
        conn = self._get_conn()
        try:
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
            conn.close()

    def get_reservations(self, date: Optional[str] = None) -> list[dict]:
        conn = self._get_conn()
        try:
            query = "SELECT * FROM reservations WHERE 1=1"
            params: list = []
            if date:
                query += " AND date = ?"
                params.append(date)
            query += " ORDER BY date DESC, time DESC"
            return [dict(r) for r in conn.execute(query, params).fetchall()]
        finally:
            conn.close()

    def get_stats(self) -> dict:
        conn = self._get_conn()
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            reservations_today = conn.execute("SELECT COUNT(*) AS c FROM reservations WHERE date = ? AND status = 'confirmed'", (today,)).fetchone()
            total_reservations = conn.execute("SELECT COUNT(*) AS c FROM reservations").fetchone()
            total_menu = conn.execute("SELECT COUNT(*) AS c FROM menu_items WHERE is_available = 1").fetchone()
            return {
                "reservations_today": reservations_today["c"],
                "total_reservations": total_reservations["c"],
                "available_menu_items": total_menu["c"],
            }
        finally:
            conn.close()


db = AteneaDB()
