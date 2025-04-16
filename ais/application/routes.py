from fastapi import APIRouter, HTTPException
from application.config import SessionLocal
from application.models.dao.irrigation_models import Field, SoilType, Crop, IrrigationCalculation, Base
from application.services.irrigation_service import calculate_irrigation
from application.models.dto.irrigation_dto import (
    IrrigationCalculationRequest, 
    IrrigationCalculationResponse,
    FieldUpdate
)
from typing import List, Dict
from sqlalchemy.sql import text

router = APIRouter(prefix='/api', tags=['Irrigation API'])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/')
async def root():
    return {"message": "Irrigation API is running."}

@router.get('/fields', response_model=List[Dict])
async def get_fields():
    db = next(get_db())
    try:
        fields = db.query(Field).all()
        #print(f"Найдено участков: {len(fields)}")
        result = [
            {
                "id": f.id,
                "name": f.name,
                "area": f.area,
                "soil_type": f.soil_type.name if f.soil_type else None,
                "soil_range": f"{f.soil_type.min_output} - {f.soil_type.max_output}" if f.soil_type else None
            }
            for f in fields
        ]
        #print("Отправляемые данные участков:", result)
        return result
    finally:
        db.close()

@router.get('/fields/{field_id}', response_model=Dict)
async def get_field(field_id: int):
    db = next(get_db())
    try:
        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            raise HTTPException(status_code=404, detail="Участок не найден")
        result = {
            "id": field.id,
            "name": field.name,
            "area": field.area,
            "soil_type": field.soil_type.name if field.soil_type else None,
            "soil_range": f"{field.soil_type.min_output} - {field.soil_type.max_output}" if field.soil_type else None,
            "soil_average_output": field.soil_type.average_output() if field.soil_type else None
        }
        #print(f"Отправляемые данные участка (ID {field_id}):", result)
        return result
    finally:
        db.close()

@router.get('/soiltypes', response_model=List[Dict])
async def get_soil_types():
    db = next(get_db())
    try:
        soil_types = db.query(SoilType).all()
        #print(f"Найдено типов почвы: {len(soil_types)}")
        result = [
            {
                "id": s.id,
                "name": s.name,
                "range": f"{s.min_output} - {s.max_output}"
            }
            for s in soil_types
        ]
        #print("Отправляемые данные типов почвы:", result)
        return result
    finally:
        db.close()


@router.get('/crops', response_model=List[Dict])
async def get_crops():
    db = next(get_db())
    try:
        crops = db.query(Crop).all()
        result = [
            {
                "id": c.id,
                "name": c.name,
                "dripper_range": f"{c.dripper_min} - {c.dripper_max}",
                "allowed_row_spacings": c.allowed_row_spacings
            }
            for c in crops
        ]
        return result
    finally:
        db.close()

@router.get('/db-check')
async def check_db():
    try:
        db = next(get_db())
        result = db.execute(text("SELECT 1")).fetchall()
        return {"status": "ok", "message": "Database connection is working"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@router.post('/calculate', response_model=IrrigationCalculationResponse)
async def calculate_irrigation_post(request: IrrigationCalculationRequest):
    try:
        result = calculate_irrigation(
            field_id=request.field_id,
            crop_id=request.crop_id,
            operation_time=request.operation_time,
            field_name=request.field_name,
            field_area=request.field_area,
            soil_type_id=request.soil_type_id,
            crop_name=request.crop_name,
            dripper_spacing=request.dripper_spacing,
            row_spacing=request.row_spacing
        )
        return {"status": "ok", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.put('/fields/{field_id}', response_model=Dict)
async def update_field(field_id: int, field_data: FieldUpdate):
    """Обновить существующий участок"""
    db = next(get_db())
    try:
        # Проверяем, существует ли участок
        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            raise HTTPException(status_code=404, detail=f"Участок с ID {field_id} не найден")
        
        # Если указан новый тип почвы, проверяем его существование
        if field_data.soil_type_id is not None:
            soil_type = db.query(SoilType).filter(SoilType.id == field_data.soil_type_id).first()
            if not soil_type:
                raise HTTPException(status_code=404, detail=f"Тип почвы с ID {field_data.soil_type_id} не найден")
            field.soil_type_id = field_data.soil_type_id
        
        # Обновляем остальные поля, если они предоставлены
        if field_data.name is not None:
            field.name = field_data.name
        
        if field_data.area is not None:
            field.area = field_data.area
        
        db.commit()
                
        # Получаем обновленные данные
        db.refresh(field)
        
        return {
            "status": "success",
            "message": "Участок успешно обновлен",
            "field": {
                "id": field.id,
                "name": field.name,
                "area": field.area,
                "soil_type_id": field.soil_type_id
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении участка: {str(e)}")
    finally:
        db.close()

@router.delete('/fields/{field_id}', response_model=Dict)
async def delete_field(field_id: int):
    """Удалить участок"""
    db = next(get_db())
    try:
        # Проверяем, существует ли участок
        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            raise HTTPException(status_code=404, detail=f"Участок с ID {field_id} не найден")
        
        # Проверяем, есть ли расчеты, связанные с этим участком
        related_calculations = db.query(IrrigationCalculation).filter(IrrigationCalculation.field_id == field_id).count()
        
        # Удаляем участок
        db.delete(field)
        db.commit()
        
        return {
            "status": "success",
            "message": f"Участок успешно удален. Связанных расчетов: {related_calculations}",
            "deleted_id": field_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении участка: {str(e)}")
    finally:
        db.close()