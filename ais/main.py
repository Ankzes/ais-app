import uvicorn
from fastapi import FastAPI
from application.routes import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    try:
        print("Starting server...")
        uvicorn.run(app, host='0.0.0.0', port=8000)
    except Exception as e:
        print(f"Failed to start server: {str(e)}")  