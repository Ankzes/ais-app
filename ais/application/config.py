from configparser import RawConfigParser, ExtendedInterpolation
from .repository import get_engine, get_session_fabric
from application.models.dao.irrigation_models import Base, insert_test_data

"""
    Данный модуль отвечает за конфигурирование приложения
"""

# Читаем файл конфигурации приложения
app_config = RawConfigParser(interpolation=ExtendedInterpolation())
app_config.read('ais\\application.ini')

db_config = app_config['Database'] # Получаем значения раздела "Database"

# Инициализируем драйвер соединения с БД
engine = get_engine(db_url=db_config['database_url'], db_sync=db_config['database_sync'])

# Создаём таблицы
Base.metadata.create_all(engine)

# Создаём фабрику сессий
SessionLocal = get_session_fabric(engine)

# Добавляем тестовые данные
session = SessionLocal()
try:
    insert_test_data(session)
finally:
    session.close()