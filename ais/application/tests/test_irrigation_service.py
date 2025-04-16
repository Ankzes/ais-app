import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from application.services.irrigation_service import calculate_irrigation
from application.models.dao.irrigation_models import Base, Field, Crop, SoilType

class TestIrrigationService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Создаём временную SQLite базу в памяти
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        
        # Создаём сессию для тестов
        cls.session = cls.SessionLocal()
        
        # Добавляем тестовые данные
        soil = SoilType(name="песчаная", min_output=1.6, max_output=2.4)
        cls.session.add(soil)
        cls.session.commit()
        
        crop = Crop(name="картофель", dripper_min=25, dripper_max=30)
        cls.session.add(crop)
        cls.session.commit()
        
        field = Field(name="Поле №1", area=10000, soil_type_id=soil.id, region_id=None, row_spacing=0.75)
        cls.session.add(field)
        cls.session.commit()
        
        cls.soil = soil
        cls.crop = crop
        cls.field = field

    def test_calculate_irrigation(self):
        # Используем тестовые данные, предполагаем operation_time = 16 ч/сутки
        result = calculate_irrigation(field_id=self.field.id, crop_id=self.crop.id, operation_time=16)
        self.assertIsInstance(result, dict)
        self.assertIn("length_tubing", result)
        self.assertIn("number_of_drippers", result)
        self.assertIn("hourly_water_rate", result)
        self.assertIn("daily_water_rate", result)
        
        self.assertEqual(result["length_tubing"], self.field.area)
        self.assertGreater(result["hourly_water_rate"], 0)

    def test_calculate_irrigation_manual(self):
        result = calculate_irrigation(
            field_name="Тестовое поле",
            field_area=10000,
            soil_output=2.0,
            crop_name="Тестовая культура",
            dripper_spacing=27.5,
            operation_time=16
        )
        self.assertIsInstance(result, dict)
        self.assertEqual(result["length_tubing"], 10000)
        self.assertGreater(result["hourly_water_rate"], 0)

    @classmethod
    def tearDownClass(cls):
        cls.session.close()

if __name__ == "__main__":
    unittest.main()