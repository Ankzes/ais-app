from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, create_engine
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
import datetime

Base = declarative_base()

class SoilType(Base):
    __tablename__ = 'soil_types'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    min_output = Column(Float)
    max_output = Column(Float)

    def average_output(self) -> float:
        return (self.min_output + self.max_output) / 2 if self.min_output and self.max_output else 0

class Crop(Base):
    __tablename__ = 'crops'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    dripper_min = Column(Float)
    dripper_max = Column(Float)
    allowed_row_spacings = Column(String(50))

    def average_dripper_spacing(self) -> float:
        return (self.dripper_min + self.dripper_max) / 2 if self.dripper_min and self.dripper_max else 0

class Field(Base):
    __tablename__ = 'fields'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    area = Column(Float)
    soil_type_id = Column(Integer, ForeignKey('soil_types.id'))

    soil_type = relationship("SoilType")

class IrrigationCalculation(Base):
    __tablename__ = 'irrigation_calculations'
    id = Column(Integer, primary_key=True)
    field_id = Column(Integer, ForeignKey('fields.id'), nullable=True)
    crop_id = Column(Integer, ForeignKey('crops.id'), nullable=True)
    calculation_date = Column(Date, default=datetime.date.today)
    length_tubing = Column(Float)
    number_of_drippers = Column(Integer)
    hourly_water_rate = Column(Float)
    daily_water_rate = Column(Float)
    operation_time = Column(Float)

    field = relationship("Field")
    crop = relationship("Crop")

def insert_test_data(session):
    try:
        # Инициализация почв, если таблица пуста
        if not session.query(SoilType).first():
            soil_types = [
                SoilType(name="Песчаная", min_output=1.6, max_output=2.4),
                SoilType(name="Глинистая", min_output=0.75, max_output=1.35),
                SoilType(name="Суглинистая", min_output=1.2, max_output=1.8),
            ]
            session.add_all(soil_types)
            
        if not session.query(Crop).first():
            crops = [
                # Группа 1: 0,70 м и 0,75 м
                Crop(name="Репчатый лук", dripper_min=10, dripper_max=20, allowed_row_spacings="0.75"),
                Crop(name="Морковь", dripper_min=10, dripper_max=20, allowed_row_spacings="0.70"),
                Crop(name="Укроп", dripper_min=10, dripper_max=20, allowed_row_spacings="0.75"),
                Crop(name="Петрушка", dripper_min=10, dripper_max=20, allowed_row_spacings="0.75"),
                Crop(name="Салат", dripper_min=10, dripper_max=20, allowed_row_spacings="0.75"),
                Crop(name="Лук на перо", dripper_min=10, dripper_max=20, allowed_row_spacings="0.75"),

                # Группа 2: 25–30 см, для томатов, картофеля, огурцов, перца
                Crop(name="Томаты", dripper_min=25, dripper_max=30, allowed_row_spacings="1.4"),
                Crop(name="Картофель", dripper_min=25, dripper_max=30, allowed_row_spacings="0.9"),
                Crop(name="Огурцы", dripper_min=25, dripper_max=30, allowed_row_spacings="3.2"),
                Crop(name="Перец", dripper_min=25, dripper_max=30, allowed_row_spacings="1.4"),

                # Группа 3: 40–50 см, для капусты, кукурузы, арбузов, дынь, тыквы
                Crop(name="Капуста", dripper_min=25, dripper_max=30, allowed_row_spacings="0.9"),
                Crop(name="Кукуруза", dripper_min=40, dripper_max=50, allowed_row_spacings="1.1"),
                Crop(name="Арбузы", dripper_min=40, dripper_max=50, allowed_row_spacings="1.5"),
                Crop(name="Дыни", dripper_min=40, dripper_max=50, allowed_row_spacings="1.5"),
                Crop(name="Тыква", dripper_min=40, dripper_max=50, allowed_row_spacings="1.5"),
            ]
            session.add_all(crops)

        if not session.query(Field).first():
            fields = [
                Field(name="Поле №1", area=1000, soil_type_id=1),
                Field(name="Поле №2", area=2000, soil_type_id=2),
                Field(name="Теплица №1", area=500, soil_type_id=3),
            ]
            session.add_all(fields)

        session.commit()
        #print("Данные успешно добавлены.")
    except Exception as e:
        print(f"Ошибка при добавлении данных: {str(e)}")
        session.rollback()