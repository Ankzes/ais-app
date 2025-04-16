import sqlalchemy
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from application.models.dao.irrigation_models import Base
from typing import Optional

def get_engine(db_url: str, db_sync: str = 'false') -> Optional[Engine]:
    """ Функция создает движок для управления подключениями к БД """
    sqla_engine = sqlalchemy.create_engine(url=db_url)
    # Если в конфигурации указан флаг синхронизации БД, генерируем таблицы
    if db_sync == 'true':
        Base.metadata.create_all(bind=sqla_engine)
    return sqla_engine

def get_session_fabric(engine: Engine):
    """ Функция создает фабрику подключений (сессий) к БД """
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)