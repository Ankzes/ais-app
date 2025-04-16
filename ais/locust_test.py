import random
from locust import HttpUser, task, tag, between, constant

FIELD_IDS = [1, 2, 8, 9]
CROP_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
SOIL_TYPE_IDS = [1, 2, 3]

FIELD_NAMES = ["Тестовое поле A", "Тестовое поле B", "Тестовое поле C", "Тестовое поле D"]
FIELD_AREAS = [800, 1200, 1500, 2500, 5000]
CROP_NAMES = ["Тест 1", "Тест 2", "Тест 3", "Тест 4", "Тест 5"]
DRIPPER_SPACINGS = [15, 20, 25, 30, 40, 50]
ROW_SPACINGS = [0.7, 0.9, 1.1, 1.4, 1.5, 2.0]

class Stage1TestUser(HttpUser):
    wait_time = between(1.0, 3.0)
    
    def on_start(self):
        self.client.get("/docs")
    
    def check_response(self, response, name):
        """Общий метод для проверки ответа и логирования ошибок"""
        if response.status_code == 200:
            response.success()
        else:
            error_msg = f"Ошибка: статус код {response.status_code}"
            response.failure(error_msg)
        
    @tag("get_fields")
    @task(5)
    def get_fields(self):
        """ Тест GET-запроса (получение списка полей) """
        with self.client.get('/api/fields',
                             catch_response=True,
                             name='/api/fields') as response:
            self.check_response(response, "GET /api/fields")
    
    @tag("get_field")
    @task(10)
    def get_field(self):
        """ Тест GET-запроса (получение информации об одном поле) """
        field_id = random.choice(FIELD_IDS)
        with self.client.get(f'/api/fields/{field_id}',
                             catch_response=True,
                             name='/api/fields/{field_id}') as response:
            self.check_response(response, f"GET /api/fields/{field_id}")
    
    @tag("get_soiltypes")
    @task(3)
    def get_soiltypes(self):
        """ Тест GET-запроса (получение типов почв) """
        with self.client.get('/api/soiltypes',
                             catch_response=True,
                             name='/api/soiltypes') as response:
            self.check_response(response, "GET /api/soiltypes")
    
    @tag("get_crops")
    @task(3)
    def get_crops(self):
        """ Тест GET-запроса (получение культур) """
        with self.client.get('/api/crops',
                             catch_response=True,
                             name='/api/crops') as response:
            self.check_response(response, "GET /api/crops")
    
    @tag("update_field")
    @task(1)
    def update_field(self):
        """Тест обновления существующего поля (PUT-запрос)"""
        if not FIELD_IDS:
            return
            
        field_id = random.choice(FIELD_IDS)
        field_name = f"Обновленное поле {random.randint(100, 999)}"
        field_area = random.randint(500, 5000)

        data = {
            "name": field_name,
            "area": field_area
        }
        
        headers = {'Content-Type': 'application/json'}
        
        with self.client.put(f'/api/fields/{field_id}',
                            catch_response=True,
                            name='/api/fields/{field_id} (UPDATE)',
                            json=data,
                            headers=headers) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Ошибка: статус код {response.status_code}")

class Stage2TestUser(Stage1TestUser):    
    def check_calculation_response(self, response, name):
        """Метод для проверки ответа расчета орошения"""
        if response.status_code == 200:
            response.success()
        else:
            response.failure(f"Ошибка: статус код {response.status_code}")
            return False
    
    @tag("post_irrigation_calculation")
    @task(10)  
    def post_irrigation_calculation(self):
        """ Тест POST-запроса (расчет орошения с использованием ID) """
        # Генерируем случайные данные для запроса
        data = {
            "field_id": random.choice(FIELD_IDS),
            "crop_id": random.choice(CROP_IDS),
            "operation_time": round(random.uniform(12.0, 20.0), 2)
        }
        
        headers = {'Content-Type': 'application/json'}
        
        with self.client.post('/api/calculate',
                             catch_response=True,
                             name='/api/calculate (POST с ID)',
                             json=data,
                             headers=headers) as response:
            self.check_calculation_response(response, "POST /api/calculate (ID)")

class Stage3TestUser(Stage2TestUser):
    wait_time = constant(0.1)  # Уменьшаем время между запросами для повышения нагрузки
    
    # Увеличиваем вес POST-запросов для создания большей нагрузки на CPU
    @tag("post_irrigation_calculation")
    @task(20)  
    def post_irrigation_calculation(self):
        """ Тест POST-запроса (расчет орошения с использованием ID) """
        # Генерируем случайные данные для запроса
        data = {
            "field_id": random.choice(FIELD_IDS),
            "crop_id": random.choice(CROP_IDS),
            "operation_time": round(random.uniform(12.0, 20.0), 2)
        }
        
        headers = {'Content-Type': 'application/json'}
        
        with self.client.post('/api/calculate',
                             catch_response=True,
                             name='/api/calculate (POST с ID)',
                             json=data,
                             headers=headers) as response:
            self.check_calculation_response(response, "POST /api/calculate (ID)")
            
    # Добавляем ручной ввод для еще более ресурсоемких запросов
    @tag("post_irrigation_manual")
    @task(10)
    def post_irrigation_manual(self):
        """ Тест POST-запроса (расчет орошения с ручным вводом) """
        # Генерируем случайные данные для ручного ввода
        data = {
            "field_name": random.choice(FIELD_NAMES),
            "field_area": random.choice(FIELD_AREAS),
            "soil_type_id": random.choice(SOIL_TYPE_IDS),
            "crop_name": random.choice(CROP_NAMES),
            "dripper_spacing": random.choice(DRIPPER_SPACINGS),
            "row_spacing": random.choice(ROW_SPACINGS),
            "operation_time": round(random.uniform(12.0, 20.0), 2)
        }
        
        headers = {'Content-Type': 'application/json'}
        
        with self.client.post('/api/calculate',
                             catch_response=True,
                             name='/api/calculate (POST с ручным вводом)',
                             json=data,
                             headers=headers) as response:
            self.check_calculation_response(response, "POST /api/calculate (manual)")

# locust -f locust_test.py --host=http://192.168.56.104:8000 Stage1TestUser
# locust -f locust_test.py --host=http://192.168.56.104:8000 Stage2TestUser
# locust -f locust_test.py --host=http://192.168.56.104:8000 Stage3TestUser