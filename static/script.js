document.addEventListener("DOMContentLoaded", () => {
    console.log("JS loaded v3");

    // Элементы для участка
    const fieldIdSelect = document.getElementById("field-id");
    const fieldAreaInput = document.getElementById("field-area");
    const soilTypeInput = document.getElementById("soil-type");
    const soilOutputInput = document.getElementById("soil-output");

    // Элементы для культуры (авто-режим)
    const cropIdSelect = document.getElementById("crop-id");
    const dripperSpacingAutoInput = document.getElementById("dripper-spacing");
    const rowSpacingAutoInput = document.getElementById("row-spacing");

    // Элементы для параметров работы
    const operationTimeInput = document.getElementById("operation-time");
    const calculateBtn = document.getElementById("calculate-btn");

    // Элементы для ручного ввода участка
    const fieldNameManualInput = document.getElementById("field-name-manual");
    const fieldAreaManualInput = document.getElementById("field-area-manual");
    const soilTypeManualSelect = document.getElementById("soil-type-manual");
    const soilOutputManualInput = document.getElementById("soil-output-manual");

    // Элементы для ручного ввода культуры
    const cropNameManualInput = document.getElementById("crop-name-manual");
    const dripperSpacingManualInput = document.getElementById("dripper-spacing-manual");
    const rowSpacingManualInput = document.getElementById("row-spacing-manual");

    // Элементы для вывода результатов
    const lengthTubingOutput = document.getElementById("length-tubing");
    const numberOfDrippersOutput = document.getElementById("number-of-drippers");
    const hourlyWaterRateOutput = document.getElementById("hourly-water-rate");
    const dailyWaterRateOutput = document.getElementById("daily-water-rate");
    const operationTimeOutput = document.getElementById("operation-time-output");
    const resultRowSpacingOutput = document.getElementById("result-row-spacing");

    // Контейнеры режимов ввода
    const fieldAutoFillContainer = document.getElementById("field-auto-fill");
    const cropAutoFillContainer = document.getElementById("crop-auto-fill");

    // Новые элементы для обновления и удаления полей
    const fieldActionsContainer = document.querySelector(".field-actions");
    const updateFieldBtn = document.getElementById("update-field-btn");
    const deleteFieldBtn = document.getElementById("delete-field-btn");
    const fieldEditForm = document.querySelector(".field-edit-form");
    const fieldEditNameInput = document.getElementById("field-edit-name");
    const fieldEditAreaInput = document.getElementById("field-edit-area");
    const fieldEditSoilSelect = document.getElementById("field-edit-soil");
    const saveFieldBtn = document.getElementById("save-field-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");

    // Проверяем, что все элементы найдены корректно
    console.log("Элементы для расчета:", { 
        fieldIdSelect, fieldAreaInput, soilTypeInput, cropIdSelect, 
        dripperSpacingAutoInput, rowSpacingAutoInput, operationTimeInput, 
        calculateBtn, resultRowSpacingOutput 
    });
    
    console.log("Элементы для редактирования:", { 
        fieldActionsContainer, updateFieldBtn, deleteFieldBtn, 
        fieldEditForm, fieldEditNameInput, fieldEditAreaInput, 
        fieldEditSoilSelect, saveFieldBtn, cancelEditBtn 
    });

    // Переключатели режимов ввода
    document.querySelectorAll('input[name="field-mode"]').forEach(radio => {
        radio.addEventListener('change', function () {
            document.getElementById('field-db-input').style.display = this.value === 'db' ? 'block' : 'none';
            document.getElementById('field-manual-input').style.display = this.value === 'manual' ? 'block' : 'none';
            fieldAutoFillContainer.style.display = this.value === 'db' ? 'block' : 'none';
            // Скрываем элементы редактирования при переключении режима
            if (fieldActionsContainer) fieldActionsContainer.style.display = 'none';
            if (fieldEditForm) fieldEditForm.style.display = 'none';
            resetFieldOutputs();
        });
    });

    document.querySelectorAll('input[name="crop-mode"]').forEach(radio => {
        radio.addEventListener('change', function () {
            document.getElementById('crop-db-input').style.display = this.value === 'db' ? 'block' : 'none';
            document.getElementById('crop-manual-input').style.display = this.value === 'manual' ? 'block' : 'none';
            cropAutoFillContainer.style.display = this.value === 'db' ? 'block' : 'none';
            dripperSpacingAutoInput.value = '';
            rowSpacingAutoInput.value = '';
        });
    });

    // Функция загрузки участков
    async function loadFields() {
        try {
            console.log("Загрузка списка участков...");
            const response = await fetch("http://192.168.56.1:8000/api/fields");
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            
            const fields = await response.json();
            console.log(`Получено ${fields.length} участков:`, fields);
            
            // Сохраняем текущее выбранное значение
            const currentFieldId = fieldIdSelect.value;
            console.log("Текущий выбранный участок ID:", currentFieldId);
            
            // Очищаем список и добавляем пустой элемент
            fieldIdSelect.innerHTML = '<option value="">-- Выберите участок --</option>';
            
            // Добавляем полученные участки
            fields.forEach(field => {
                const option = document.createElement("option");
                option.value = field.id;
                option.textContent = field.name;
                option.dataset.area = field.area;
                option.dataset.soilType = field.soil_type || 'Неизвестно';
                option.dataset.soilRange = field.soil_range || 'Неизвестно';
                fieldIdSelect.appendChild(option);
            });
            
            // Пытаемся восстановить выбранный участок, если он еще существует
            if (currentFieldId) {
                // Проверяем, существует ли еще этот участок в списке
                const exists = Array.from(fieldIdSelect.options).some(opt => opt.value === currentFieldId);
                
                if (exists) {
                    console.log(`Восстанавливаем выбор участка с ID ${currentFieldId}`);
                    fieldIdSelect.value = currentFieldId;
                    
                    // Генерируем событие change, чтобы обновились связанные поля
                    const event = new Event('change');
                    fieldIdSelect.dispatchEvent(event);
                } else {
                    console.log(`Участок с ID ${currentFieldId} больше не существует`);
                    // Сбрасываем связанные поля
                    resetFieldOutputs();
                }
            }
            
            console.log("Список участков успешно обновлен");
        } catch (err) {
            console.error("Ошибка загрузки участков:", err);
            alert("Не удалось загрузить список участков: " + err.message);
        }
    }

    // Функция загрузки типов почвы
    async function loadSoilTypes() {
        try {
            console.log("Загрузка типов почвы...");
            const response = await fetch("http://192.168.56.1:8000/api/soiltypes");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            const soilTypes = await response.json();
            console.log("Получены типы почвы:", soilTypes);
            soilTypeManualSelect.innerHTML = '<option value="">-- Выберите тип почвы --</option>';
            soilTypes.forEach(soil => {
                const option = document.createElement("option");
                option.value = soil.id;
                option.textContent = soil.name;
                option.dataset.range = soil.range;
                soilTypeManualSelect.appendChild(option);
            });
        } catch (err) {
            console.error("Ошибка загрузки типов почвы:", err);
            alert("Не удалось загрузить список типов почвы: " + err.message);
        }
    }

    // Функция загрузки культур
    async function loadCrops() {
        try {
            console.log("Загрузка культур...");
            const response = await fetch("http://192.168.56.1:8000/api/crops");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            const crops = await response.json();
            console.log("Получены культуры:", crops);
            cropIdSelect.innerHTML = '<option value="">-- Выберите культуру --</option>';
            crops.forEach(crop => {
                const option = document.createElement("option");
                option.value = crop.id;
                option.textContent = crop.name;
                // Здесь dripper_range может приходить как "40.0 - 50.0". Вычисляем среднее.
                if (crop.dripper_range) {
                    const parts = crop.dripper_range.split("-");
                    if (parts.length === 2) {
                        const num1 = parseFloat(parts[0].trim());
                        const num2 = parseFloat(parts[1].trim());
                        const avg = (num1 + num2) / 2;
                        option.dataset.dripperRange = avg;
                    } else {
                        option.dataset.dripperRange = parseFloat(crop.dripper_range);
                    }
                }
                // Для allowed_row_spacings берём первое значение и преобразовываем в число
                if (crop.allowed_row_spacings) {
                    const spacings = crop.allowed_row_spacings.split(",");
                    option.dataset.allowedRowSpacings = parseFloat(spacings[0].trim());
                }
                cropIdSelect.appendChild(option);
            });
        } catch (err) {
            console.error("Ошибка загрузки культур:", err);
            alert("Не удалось загрузить список культур: " + err.message);
        }
    }

    // При выборе участка обновляем данные и показываем кнопки редактирования
    fieldIdSelect.addEventListener("change", async () => {
        console.log("Выбран участок:", fieldIdSelect.value);
        
        const selectedOption = fieldIdSelect.options[fieldIdSelect.selectedIndex];
        
        // Скрываем элементы редактирования по умолчанию
        if (fieldActionsContainer) fieldActionsContainer.style.display = 'none';
        if (fieldEditForm) fieldEditForm.style.display = 'none';
        
        // Сбрасываем значения полей при отсутствии выбора
        if (!selectedOption || !selectedOption.value) {
            resetFieldOutputs();
            return;
        }
        
            try {
                console.log(`Загрузка данных участка с ID ${selectedOption.value}...`);
                const response = await fetch(`http://192.168.56.1:8000/api/fields/${selectedOption.value}`);
            
            if (!response.ok) {
                // Если получаем 404, возможно участок был удален
                if (response.status === 404) {
                    console.warn(`Участок с ID ${selectedOption.value} не найден, возможно был удален`);
                    // Обновляем список участков
                    await loadFields();
                    // И сбрасываем поля
                    resetFieldOutputs();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
                const field = await response.json();
                console.log("Получены данные участка:", field);
            
            // Отображаем данные
                fieldAreaInput.value = field.area || '';
                soilTypeInput.value = field.soil_type || 'Неизвестно';
                soilOutputInput.value = field.soil_range || 'Неизвестно';
            
            // Показываем кнопки действий при выборе участка
            if (fieldActionsContainer) fieldActionsContainer.style.display = 'flex';
            } catch (err) {
                console.error("Ошибка получения данных участка:", err);
                alert("Не удалось загрузить данные участка: " + err.message);
            resetFieldOutputs();
        }
    });

    // При выборе типа почвы в ручном режиме обновляем норму вылива
    soilTypeManualSelect.addEventListener("change", () => {
        const selectedOption = soilTypeManualSelect.options[soilTypeManualSelect.selectedIndex];
        soilOutputManualInput.value = selectedOption && selectedOption.dataset.range ? selectedOption.dataset.range : '';
    });

    // При выборе культуры из базы обновляем авто-поля для капельниц и расстояния между рядами
    cropIdSelect.addEventListener("change", () => {
        const selectedOption = cropIdSelect.options[cropIdSelect.selectedIndex];
        if (selectedOption) {
            dripperSpacingAutoInput.value = selectedOption.dataset.dripperRange || '';
            rowSpacingAutoInput.value = selectedOption.dataset.allowedRowSpacings || '';
        }
    });

    // Сброс значений для участка
    function resetFieldOutputs() {
        console.log("Сброс полей ввода");
        
        // Сбрасываем значения полей
        fieldAreaInput.value = '';
        soilTypeInput.value = '';
        soilOutputInput.value = '';
        
        // Скрываем элементы редактирования
        if (fieldActionsContainer) fieldActionsContainer.style.display = 'none';
        if (fieldEditForm) fieldEditForm.style.display = 'none';
    }

    // Функция валидации полей ввода
    function validateFields(requestData, fieldMode, cropMode) {
        console.log("Валидация полей ввода:", requestData);
        
        // Проверка времени работы системы
        if (isNaN(requestData.operation_time) || requestData.operation_time < 1 || requestData.operation_time > 24) {
            alert("Время работы системы должно быть от 1 до 24 часов.");
            return false;
        }

        // Проверка полей в зависимости от режима ввода участка
        if (fieldMode === 'db') {
            if (!requestData.field_id) {
                alert("Выберите участок из списка.");
                return false;
            }
        } else {
            // Проверка ручного ввода участка
            if (!requestData.field_name || requestData.field_name.length < 3) {
                alert("Название участка должно содержать минимум 3 символа.");
                return false;
            }
            
            if (isNaN(requestData.field_area) || requestData.field_area < 1 || requestData.field_area > 100000) {
                alert("Площадь участка должна быть от 1 до 100 000 м².");
                return false;
            }
            
            if (!requestData.soil_type_id) {
                alert("Выберите тип почвы.");
                return false;
            }
        }

        // Проверка полей в зависимости от режима ввода культуры
        if (cropMode === 'db') {
            if (!requestData.crop_id) {
                alert("Выберите культуру из списка.");
                return false;
            }
            
            // Проверяем, если заполнены поля для авто-режима
            if (requestData.dripper_spacing && (isNaN(requestData.dripper_spacing) || requestData.dripper_spacing < 10 || requestData.dripper_spacing > 100)) {
                alert("Шаг капельниц должен быть от 10 до 100 см.");
                return false;
            }
            
            if (requestData.row_spacing && (isNaN(requestData.row_spacing) || requestData.row_spacing < 0.5 || requestData.row_spacing > 5.0)) {
                alert("Расстояние между рядами должно быть от 0.5 до 5.0 м.");
                return false;
            }
        } else {
            // Проверка ручного ввода культуры
            if (!requestData.crop_name || requestData.crop_name.length < 2) {
                alert("Название культуры должно содержать минимум 2 символа.");
                return false;
            }
            
            if (isNaN(requestData.dripper_spacing) || requestData.dripper_spacing < 10 || requestData.dripper_spacing > 100) {
                alert("Шаг капельниц должен быть от 10 до 100 см.");
                return false;
            }
            
            if (isNaN(requestData.row_spacing) || requestData.row_spacing < 0.5 || requestData.row_spacing > 5.0) {
                alert("Расстояние между рядами должно быть от 0.5 до 5.0 м.");
                return false;
            }
        }

        return true;
    }

    // Обработка нажатия кнопки "Рассчитать"
    console.log("Добавление обработчика события click для кнопки:", calculateBtn);
    if (!calculateBtn) {
        console.error("Ошибка: кнопка calculateBtn не найдена в DOM!");
    } else {
    calculateBtn.addEventListener("click", async () => {
            console.log("Нажата кнопка Рассчитать");
            try {
                // Проверяем время работы системы
                const operationTime = parseFloat(operationTimeInput.value);
                if (isNaN(operationTime) || operationTime < 1 || operationTime > 24) {
                    alert("Укажите корректное время работы системы (от 1 до 24 часов).");
                    operationTimeInput.focus();
            return;
        }

                const requestData = {
                    operation_time: operationTime
                };
                
                // Проверяем выбранный режим ввода поля
                const fieldModeRadio = document.querySelector('input[name="field-mode"]:checked');
                if (!fieldModeRadio) {
                    console.error("Не выбран режим ввода поля");
                    alert("Ошибка: не выбран режим ввода поля");
                    return;
                }
                const fieldMode = fieldModeRadio.value;
                
                // Проверяем выбранный режим ввода культуры
                const cropModeRadio = document.querySelector('input[name="crop-mode"]:checked');
                if (!cropModeRadio) {
                    console.error("Не выбран режим ввода культуры");
                    alert("Ошибка: не выбран режим ввода культуры");
                    return;
                }
                const cropMode = cropModeRadio.value;
                
                console.log("Режимы ввода:", { fieldMode, cropMode });

        // Формируем параметры для участка
        if (fieldMode === 'db') {
            if (!fieldIdSelect.value) {
                alert("Выберите участок.");
                        fieldIdSelect.focus();
                return;
            }
                    requestData.field_id = parseInt(fieldIdSelect.value);
        } else {
            const fieldName = fieldNameManualInput.value.trim();
            const fieldArea = parseFloat(fieldAreaManualInput.value);
            const soilTypeId = soilTypeManualSelect.value;
                    
                    if (!fieldName) {
                        alert("Введите название участка.");
                        fieldNameManualInput.focus();
                        return;
                    }
                    
                    if (isNaN(fieldArea)) {
                        alert("Введите корректную площадь участка.");
                        fieldAreaManualInput.focus();
                        return;
                    }
                    
                    if (!soilTypeId) {
                        alert("Выберите тип почвы.");
                        soilTypeManualSelect.focus();
                return;
            }
                    
                    requestData.field_name = fieldName;
                    requestData.field_area = fieldArea;
                    requestData.soil_type_id = parseInt(soilTypeId);
        }

        // Формируем параметры для культуры
        if (cropMode === 'db') {
            if (!cropIdSelect.value) {
                alert("Выберите культуру.");
                        cropIdSelect.focus();
                return;
            }
                    requestData.crop_id = parseInt(cropIdSelect.value);
                    
                    // Добавляем параметры, если они введены
            if (dripperSpacingAutoInput.value) {
                        const dripperSpacing = parseFloat(dripperSpacingAutoInput.value);
                        if (isNaN(dripperSpacing) || dripperSpacing < 10 || dripperSpacing > 100) {
                            alert("Шаг капельниц должен быть от 10 до 100 см.");
                            dripperSpacingAutoInput.focus();
                            return;
                        }
                        requestData.dripper_spacing = dripperSpacing;
                    }
                    
            if (rowSpacingAutoInput.value) {
                        const rowSpacing = parseFloat(rowSpacingAutoInput.value);
                        if (isNaN(rowSpacing) || rowSpacing < 0.5 || rowSpacing > 5.0) {
                            alert("Расстояние между рядами должно быть от 0.5 до 5.0 м.");
                            rowSpacingAutoInput.focus();
                            return;
                        }
                        requestData.row_spacing = rowSpacing;
            }
        } else {
            const cropName = cropNameManualInput.value.trim();
                    if (!cropName) {
                        alert("Введите название культуры.");
                        cropNameManualInput.focus();
                        return;
                    }
                    
            const dripperSpacing = parseFloat(dripperSpacingManualInput.value);
                    if (isNaN(dripperSpacing) || dripperSpacing < 10 || dripperSpacing > 100) {
                        alert("Шаг капельниц должен быть от 10 до 100 см.");
                        dripperSpacingManualInput.focus();
                        return;
                    }
                    
            const rowSpacing = parseFloat(rowSpacingManualInput.value);
                    if (isNaN(rowSpacing) || rowSpacing < 0.5 || rowSpacing > 5.0) {
                        alert("Расстояние между рядами должно быть от 0.5 до 5.0 м.");
                        rowSpacingManualInput.focus();
                return;
            }
                    
                    requestData.crop_name = cropName;
                    requestData.dripper_spacing = dripperSpacing;
                    requestData.row_spacing = rowSpacing;
                }
    
                // Дополнительная проверка всех параметров с более информативными сообщениями
                if (!validateFields(requestData, fieldMode, cropMode)) {
                    return; // Останавливаем выполнение, если валидация не прошла
                }
    
                console.log("Отправка POST запроса на расчет:", requestData);
                // Показываем индикатор загрузки или блокируем кнопку
                calculateBtn.disabled = true;
                calculateBtn.textContent = "Выполняется расчет...";
                
                const response = await fetch("http://192.168.56.1:8000/api/calculate", { 
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
                // Возвращаем кнопку в нормальное состояние
                calculateBtn.disabled = false;
                calculateBtn.textContent = "Рассчитать";
                
                console.log("Получен ответ:", response);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Ошибка API:", errorText);
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }
                
            const result = await response.json();
                console.log("Результат расчета:", result);
                
            if (result.status === "ok") {
                const data = result.data;
                    
                    // Обновляем элементы результата
                    if (lengthTubingOutput) lengthTubingOutput.textContent = data.tubing_length_m.toFixed(2);
                    if (numberOfDrippersOutput) numberOfDrippersOutput.textContent = data.number_of_drippers.toFixed(0);
                    if (hourlyWaterRateOutput) hourlyWaterRateOutput.textContent = data.water_flow_rate_l_h.toFixed(2);
                    if (dailyWaterRateOutput) dailyWaterRateOutput.textContent = data.daily_water_consumption_l.toFixed(2);
                    if (operationTimeOutput) operationTimeOutput.textContent = data.operation_time;
                    if (resultRowSpacingOutput) resultRowSpacingOutput.textContent = data.row_spacing;
                    
                    // Показываем секцию результатов
                    const resultSection = document.getElementById("result-section");
                    if (resultSection) {
                        resultSection.classList.add("visible");
                        resultSection.scrollIntoView({ behavior: 'smooth' });
                        console.log("Секция результатов отображена");
                    } else {
                        console.error("Элемент result-section не найден!");
                    }

                // Если в ручном режиме новый участок был добавлен, обновляем список
                if (fieldMode === 'manual') {
                    loadFields();
                }
            } else {
                    alert("Ошибка расчета: " + (result.detail || "Неизвестная ошибка"));
            }
        } catch (err) {
            console.error("Ошибка при расчёте:", err);
            alert("Ошибка сети или сервера: " + err.message);
                
                // Возвращаем кнопку в нормальное состояние в случае ошибки
                if (calculateBtn) {
                    calculateBtn.disabled = false;
                    calculateBtn.textContent = "Рассчитать";
                }
            }
        });
        console.log("Обработчик успешно добавлен");
    }

    // Обработчики событий для кнопок редактирования полей
    if (updateFieldBtn) {
        updateFieldBtn.addEventListener("click", async () => {
            const selectedOption = fieldIdSelect.options[fieldIdSelect.selectedIndex];
            if (selectedOption && selectedOption.value) {
                try {
                    // Загружаем текущие данные поля для формы редактирования
                    const response = await fetch(`http://192.168.56.1:8000/api/fields/${selectedOption.value}`);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                    const field = await response.json();
                    
                    // Заполняем форму редактирования
                    fieldEditNameInput.value = field.name || '';
                    fieldEditAreaInput.value = field.area || '';
                    
                    // Копируем опции типов почв из выпадающего списка ручного ввода
                    fieldEditSoilSelect.innerHTML = soilTypeManualSelect.innerHTML;
                    
                    // Выбираем текущий тип почвы, если возможно
                    if (field.soil_type) {
                        const options = fieldEditSoilSelect.options;
                        for (let i = 0; i < options.length; i++) {
                            if (options[i].text === field.soil_type) {
                                fieldEditSoilSelect.selectedIndex = i;
                                break;
                            }
                        }
                    }
                    
                    // Показываем форму редактирования
                    if (fieldEditForm) fieldEditForm.style.display = 'block';
                    
                } catch (err) {
                    console.error("Ошибка при подготовке формы редактирования:", err);
                    alert("Не удалось загрузить данные для редактирования: " + err.message);
                }
            }
        });
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            // Скрываем форму редактирования при отмене
            if (fieldEditForm) fieldEditForm.style.display = 'none';
        });
    }
    
    if (saveFieldBtn) {
        saveFieldBtn.addEventListener("click", async () => {
            const fieldId = fieldIdSelect.value;
            if (!fieldId) {
                alert("Выберите участок для обновления");
                return;
            }
            
            // Проверяем заполненность формы
            if (!fieldEditNameInput.value || !fieldEditAreaInput.value || !fieldEditSoilSelect.value) {
                alert("Заполните все поля для обновления участка");
                return;
            }
            
            // Подготавливаем данные для обновления
            const updateData = {
                name: fieldEditNameInput.value,
                area: parseFloat(fieldEditAreaInput.value),
                soil_type_id: parseInt(fieldEditSoilSelect.value)
            };
            
            try {
                console.log(`Обновление участка с ID ${fieldId}:`, updateData);
                const response = await fetch(`http://192.168.56.1:8000/api/fields/${fieldId}`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                const result = await response.json();
                
                if (result.status === "success") {
                    alert("Участок успешно обновлен");
                    // Обновляем списки и скрываем форму редактирования
                    loadFields();
                    if (fieldEditForm) fieldEditForm.style.display = 'none';
                    
                    // Обновляем отображаемую информацию об участке
                    fieldAreaInput.value = updateData.area;
                    // Обновление типа почвы и нормы вылива может потребовать дополнительного запроса,
                    // но мы это делаем через перезагрузку данных при изменении выбора в поле select
                } else {
                    alert("Ошибка при обновлении участка: " + (result.detail || "Неизвестная ошибка"));
                }
            } catch (err) {
                console.error("Ошибка при обновлении участка:", err);
                alert("Ошибка при обновлении участка: " + err.message);
            }
        });
    }
    
    if (deleteFieldBtn) {
        deleteFieldBtn.addEventListener("click", async () => {
            const fieldId = fieldIdSelect.value;
            if (!fieldId) {
                alert("Выберите участок для удаления");
                return;
            }
            
            // Запрашиваем подтверждение перед удалением
            if (!confirm(`Вы уверены, что хотите удалить участок ${fieldIdSelect.options[fieldIdSelect.selectedIndex].textContent}? Это действие нельзя отменить.`)) {
                return;
            }
            
            try {
                console.log(`Удаление участка с ID ${fieldId}`);
                
                // Блокируем кнопку на время удаления
                deleteFieldBtn.disabled = true;
                deleteFieldBtn.textContent = "Удаление...";
                
                const response = await fetch(`http://192.168.56.1:8000/api/fields/${fieldId}`, {
                    method: "DELETE",
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                // Разблокируем кнопку
                deleteFieldBtn.disabled = false;
                deleteFieldBtn.textContent = "Удалить участок";
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Ошибка при удалении:", errorText);
                    
                    // Проверяем на ошибку внешнего ключа
                    if (errorText.includes("foreign key constraint fails") || 
                        errorText.includes("IntegrityError")) {
                        
                        if (confirm("Нельзя удалить участок, так как он используется в расчетах. Сбросить все расчеты?")) {
                            // Вызываем API для сброса расчетов
                            try {
                                const resetResponse = await fetch("http://192.168.56.1:8000/api/calculations/reset", {
                                    method: "DELETE"
                                });
                                
                                if (resetResponse.ok) {
                                    alert("Расчеты сброшены. Теперь можно удалить участок.");
                                } else {
                                    alert("Не удалось сбросить расчеты: " + resetResponse.statusText);
                                }
                            } catch (e) {
                                alert("Ошибка при сбросе расчетов: " + e.message);
                            }
                        }
                        return;
                    }
                    
                    throw new Error(`Ошибка сервера: ${response.status} - ${response.statusText}`);
                }
                
                // Пробуем распарсить ответ как JSON
                let result;
                try {
                    result = await response.json();
                } catch (jsonError) {
                    console.error("Ошибка при парсинге JSON:", jsonError);
                    throw new Error("Неверный формат ответа от сервера");
                }
                
                if (result && result.status === "success") {
                    alert(`Участок успешно удален. ${result.message || ""}`);
                    
                    // Очищаем поля формы и результаты
                    resetFieldOutputs();
                    
                    // Сбрасываем выбор в select
                    fieldIdSelect.value = "";
                    
                    // Скрываем элементы редактирования
                    if (fieldActionsContainer) fieldActionsContainer.style.display = 'none';
                    if (fieldEditForm) fieldEditForm.style.display = 'none';
                    
                    // Также можно скрыть результаты расчета, если они отображаются
                    const resultSection = document.getElementById("result-section");
                    if (resultSection && resultSection.classList.contains("visible")) {
                        resultSection.classList.remove("visible");
                    }
                    
                    // Обновляем список полей
                    await loadFields();
                } else {
                    alert("Ошибка при удалении участка: " + (result.detail || result.message || "Неизвестная ошибка"));
                }
            } catch (err) {
                console.error("Ошибка при удалении участка:", err);
                alert("Ошибка при удалении участка: " + err.message);
                
                // Разблокируем кнопку в случае ошибки
                deleteFieldBtn.disabled = false;
                deleteFieldBtn.textContent = "Удалить участок";
            }
        });
    }

    loadFields();
    loadSoilTypes();
    loadCrops();
});