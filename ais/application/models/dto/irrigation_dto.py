from pydantic import BaseModel, Field
from typing import Optional, Dict

class IrrigationCalculationRequest(BaseModel):
    field_id: Optional[int] = None
    field_name: Optional[str] = None
    field_area: Optional[float] = None
    soil_type_id: Optional[int] = None
    crop_id: Optional[int] = None
    crop_name: Optional[str] = None
    dripper_spacing: Optional[float] = None
    row_spacing: Optional[float] = None
    operation_time: float = Field(default=16.0, description="Время работы системы в часах")

    model_config = {
        "json_schema_extra": {
            "example": {
                "field_id": 1,
                "crop_id": 2,
                "operation_time": 16.0
            }
        }
    }

class IrrigationCalculationResponse(BaseModel):
    status: str
    data: Dict 

class FieldCreate(BaseModel):
    name: str
    area: float
    soil_type_id: int

class FieldUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[float] = None
    soil_type_id: Optional[int] = None