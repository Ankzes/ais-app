from application.models.dao.irrigation_models import Field, Crop, IrrigationCalculation, SoilType
from application.config import SessionLocal

def calculate_irrigation(
    field_id=None,
    crop_id=None,
    operation_time=16,
    field_name=None,
    field_area=None,
    soil_type_id=None,
    crop_name=None,
    dripper_spacing=None,   # вводится в см
    row_spacing=None        # расстояние между рядами, в м
):
    session = SessionLocal()
    try:
        # Определение участка
        if field_id:
            field = session.query(Field).filter(Field.id == field_id).first()
            if not field:
                raise ValueError("Неверный id участка.")
            actual_area = field.area  # в м²
            soil = field.soil_type
        elif field_name and field_area and soil_type_id:
            actual_area = field_area
            soil = session.query(SoilType).filter(SoilType.id == soil_type_id).first()
            if not soil:
                raise ValueError("Такой тип почвы не найден.")
            field = session.query(Field).filter(Field.name == field_name, Field.area == field_area).first()
            if not field:
                field = Field(
                    name=field_name,
                    area=field_area,
                    soil_type_id=soil.id
                )
                session.add(field)
                session.flush()
        else:
            raise ValueError("Недостаточно данных для расчёта участка.")
        
        # Определение культуры
        if crop_id:
            crop = session.query(Crop).filter(Crop.id == crop_id).first()
            if not crop:
                raise ValueError("Неверный id культуры.")
            if not dripper_spacing:
                dripper_spacing = crop.average_dripper_spacing()  # в см
            # Если row_spacing не передано, можно выбрать первое из допустимых значений
            if not row_spacing:
                if crop.allowed_row_spacings:
                    row_spacing = float(crop.allowed_row_spacings.split(',')[0])
                else:
                    raise ValueError("Не указано расстояние между рядами для выбранной культуры.")
        elif crop_name and dripper_spacing and row_spacing:
            crop = session.query(Crop).filter(Crop.name == crop_name).first()
            if not crop:
                crop = Crop(
                    name=crop_name,
                    dripper_min=dripper_spacing - 10,
                    dripper_max=dripper_spacing + 10,
                    allowed_row_spacings=str(row_spacing)
                )
                session.add(crop)
                session.flush()
        else:
            raise ValueError("Недостаточно данных для расчёта культуры.")
        
        # Расчёты по заданным формулам:
        # 1. Расчет потребления воды на заданную площадь (Q, л/ч):
        #    Q = (6 * area) / operation_time, где area в м².
        Q = (6 * actual_area) / operation_time
        
        # 2. Расчет длины оросительных трубок (Lt, м):
        #    Lt = area / row_spacing
        Lt = actual_area / row_spacing
        
        # 3. Расчет количества капельниц (K):
        #    dripper_spacing в см переводим в метры: N = dripper_spacing / 100,
        #    K = Lt / N
        N = dripper_spacing / 100
        K = Lt / N
        
        # 4. Расчет расхода воды (O, л/ч):
        #    O = K * M, где M – норма вылива (л/ч) для данной почвы.
        #    Для глинистой почвы можно взять M = 1.35, для остальных использовать среднее значение.
        if soil.name.lower() == "глинистая":
            M = 1.35
        else:
            M = soil.average_output()
        O = K * M
        
        # Суточный расход воды:
        daily_consumption = O * operation_time
        
        result = {
            "water_consumption_l_h": Q,          # Расчет потребления воды (л/ч) на заданную площадь
            "tubing_length_m": Lt,                 # Длина оросительных трубок (м)
            "number_of_drippers": K,               # Количество капельниц
            "water_flow_rate_l_h": O,              # Расчет расхода воды (л/ч)
            "daily_water_consumption_l": daily_consumption,  # Суточный расход воды (л)
            "operation_time": operation_time,
            "row_spacing": row_spacing           # Использованное расстояние между рядами (м)
        }
        
        # Сохранение расчета (если требуется ведение истории)
        calc = IrrigationCalculation(
            field_id=field.id if field else None,
            crop_id=crop.id if crop else None,
            length_tubing=Lt,
            number_of_drippers=K,
            hourly_water_rate=O,
            daily_water_rate=daily_consumption,
            operation_time=operation_time
        )
        session.add(calc)
        session.commit()
        
        return result

    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()