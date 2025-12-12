# Импорт необходимых модулей FastAPI и других библиотек
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.database import JSONDatabase
from backend.auth import AuthSystem
from backend.admin import AdminSystem
import logging
import sys
import uvicorn

# Настройка логирования: убираем лишние логи для уменьшения шума в консоли
logging.getLogger("uvicorn").setLevel(logging.WARNING)  # Уменьшаем логи uvicorn
logging.getLogger("fastapi").setLevel(logging.WARNING)  # Уменьшаем логи fastapi

# Создание экземпляра FastAPI приложения
app = FastAPI(title="Idea Management System")

# Инициализация компонентов системы
db = JSONDatabase()  # Создаем базу данных
auth = AuthSystem(db)  # Создаем систему аутентификации с привязкой к БД
admin = AdminSystem(db, auth)  # Создаем систему администратора

# Настройка CORS (Cross-Origin Resource Sharing) для разрешения запросов из браузера
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем запросы с любых доменов 
    allow_methods=["*"],  # Разрешаем все HTTP методы 
    allow_headers=["*"],  # Разрешаем все заголовки
)

# Модели данных (Data Transfer Objects) для валидации входящих запросов

# Модель для запроса входа в систему
class LoginRequest(BaseModel):
    username: str  # Имя пользователя
    password: str  # Пароль

# Модель для запроса голосования
class VoteRequest(BaseModel):
    user_id: int   # ID пользователя
    vote: str      # Тип голоса за или против

# Модель для запроса добавления комментария
class CommentRequest(BaseModel):
    user_id: int  # ID пользователя
    text: str     # Текст комментария

# Модель для запроса создания идеи
class IdeaCreateRequest(BaseModel):
    title: str               # Заголовок идеи
    short_description: str   # Краткое описание
    full_description: str    # Полное описание
    expected_effect: str     # Ожидаемый эффект
    category: str            # Категория
    author_id: int           # ID автора

# Модель для запроса завершения знакомства (ввод ФИО)
class IntroductionRequest(BaseModel):
    full_name: str  # Полное имя пользователя

# Модель для запроса смены пароля
class ChangePasswordRequest(BaseModel):
    current_password: str  # Текущий пароль
    new_password: str      # Новый пароль

# Модели для работы с категориями
class CategoryCreateRequest(BaseModel):
    name: str  # Название новой категории

class CategoryUpdateRequest(BaseModel):
    old_name: str  # Старое название категории
    new_name: str  # Новое название категории

class CategoryDeleteRequest(BaseModel):
    name: str  # Название категории для удаления

# Эндпоинт для входа в систему
@app.post("/login")
def login(login_data: LoginRequest):
    # Вызываем метод аутентификации с переданными данными
    result = auth.login(login_data.username, login_data.password)
    return result

# Эндпоинт для завершения знакомства (ввод ФИО)
@app.post("/complete-introduction")
def complete_introduction(data: IntroductionRequest):
    # Проверяем, авторизован ли пользователь
    if not auth.current_user:
        raise HTTPException(status_code=401, detail="Не авторизован")
    
    # Вызываем метод завершения знакомства
    result = auth.complete_introduction(data.full_name)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для смены пароля администратора
@app.post("/change-password")
def change_password(data: ChangePasswordRequest):
    # Проверяем, авторизован ли пользователь
    if not auth.current_user:
        raise HTTPException(status_code=401, detail="Не авторизован")
    
    # Вызываем метод смены пароля
    result = auth.change_admin_password(data.current_password, data.new_password)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для выхода из системы
@app.post("/logout")
def logout():
    # Вызываем метод выхода
    return auth.logout()

# Эндпоинт для генерации случайных пользователей (только админ) - СТАРЫЙ МЕТОД
@app.post("/admin/generate-users")
def generate_random_users(count: int = 10):
    # Устанавливаем текущего пользователя как администратора (для обхода проверок)
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод генерации пользователей (старый)
    result = admin.generate_random_users(count)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для генерации пользователей с возвратом паролей (НОВЫЙ МЕТОД)
@app.post("/admin/generate-users-with-passwords")
def generate_users_with_passwords(count: int = 10):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем НОВЫЙ метод из admin.py
    result = admin.generate_random_users_with_passwords(count)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для хеширования всех временных паролей
@app.post("/admin/hash-temp-passwords")
def hash_temp_passwords():
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    result = admin.hash_all_temp_passwords()
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для получения пользователей с временными паролями
@app.get("/admin/temp-password-users")
def get_temp_password_users():
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    result = admin.get_temp_password_users()
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для получения списка идей (публичный)
@app.get("/ideas")
def list_ideas(filter: str = "open"):
    # Получаем все идеи и фильтруем скрытые
    ideas = [i for i in db.get_all_ideas() if not i["is_hidden"]]
    
    # Применяем фильтры сортировки
    if filter == "new":
        # Сортировка по дате создания (новые первые)
        ideas.sort(key=lambda x: x["created_at"], reverse=True)
    elif filter == "popular":
        # Сортировка по популярности (разница между голосами "за" и "против")
        ideas.sort(key=lambda x: x["votes_for"] - x["votes_against"], reverse=True)
    elif filter == "approved":
        # Только одобренные идеи
        ideas = [i for i in ideas if i["is_approved"]]
    elif filter == "open":
        # Только неодобренные идеи (открытые для обсуждения)
        ideas = [i for i in ideas if not i["is_approved"]]
    
    return ideas

# Эндпоинт для получения всех идей (включая скрытые) - только для админа
@app.get("/admin/ideas")
def list_all_ideas_admin():
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin", 
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Получаем все идеи через админ-систему
    result = admin.get_all_ideas_admin()
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result 

# Эндпоинт для получения конкретной идеи по ID
@app.get("/idea/{idea_id}")
def get_idea(idea_id: int):
    # Получаем идею из базы данных
    idea = db.get_idea_by_id(idea_id)
    
    # Если идея не найдена или скрыта, возвращаем ошибку 404
    if not idea or idea["is_hidden"]:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    return idea

# Эндпоинт для создания новой идеи
@app.post("/idea")
def create_idea(data: IdeaCreateRequest):
    # Преобразуем модель Pydantic в словарь
    idea_data = data.dict()
    
    # Создаем идею в базе данных
    idea_id = db.create_idea(idea_data)
    
    # Возвращаем успешный результат с ID созданной идеи
    return {"success": True, "idea_id": idea_id}

# Эндпоинт для голосования за идею
@app.post("/idea/{idea_id}/vote")
def vote_idea(idea_id: int, vote_data: VoteRequest):
    # Проверяем, что тип голоса корректен
    if vote_data.vote not in ["for", "against"]:
        raise HTTPException(
            status_code=400, 
            detail="Неверный тип голоса. Используйте 'for' или 'against'."
        )
    
    # Вызываем метод голосования
    result = db.vote_for_idea(idea_id, vote_data.user_id, vote_data.vote)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для добавления комментария к идее
@app.post("/idea/{idea_id}/comment")
def add_comment(idea_id: int, comment_data: CommentRequest):
    # Добавляем комментарий в базу данных
    comment_id = db.add_comment(idea_id, comment_data.user_id, comment_data.text)
    
    # Возвращаем успешность операции (True если комментарий был создан)
    return {"success": bool(comment_id)}

# Эндпоинт для одобрения идеи (только админ)
@app.post("/admin/idea/{idea_id}/approve")
def approve_idea(idea_id: int):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод одобрения идеи
    result = admin.approve_idea(idea_id)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для скрытия идеи (только админ)
@app.post("/admin/idea/{idea_id}/hide")
def hide_idea(idea_id: int):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод скрытия идеи
    result = admin.hide_idea(idea_id)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для отображения скрытой идеи (только админ)
@app.post("/admin/idea/{idea_id}/unhide")
def unhide_idea(idea_id: int):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод отображения идеи
    result = admin.unhide_idea(idea_id)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для регистрации пользователя (только админ)
@app.post("/admin/register")
def admin_register_user(username: str, password: str, role: str = "user"):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод регистрации пользователя
    result = admin.register_user(username, password, role)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для получения всех пользователей (только админ)
@app.get("/admin/users")
def get_all_users():
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Получаем всех пользователей через админ-систему
    result = admin.get_all_users()
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для блокировки пользователя (только админ)
@app.post("/admin/users/{user_id}/block")
def block_user(user_id: int):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод блокировки пользователя
    result = admin.block_user(user_id)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для разблокировки пользователя (только админ)
@app.post("/admin/users/{user_id}/unblock")
def unblock_user(user_id: int):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод разблокировки пользователя
    result = admin.unblock_user(user_id)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для удаления пользователя (только админ)
@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод удаления пользователя напрямую из БД
    result = db.delete_user(user_id)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для удаления комментария (только админ)
@app.delete("/admin/idea/{idea_id}/comment/{comment_id}")
def admin_delete_comment(idea_id: int, comment_id: int):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод удаления комментария через админ-систему
    result = admin.delete_comment(idea_id, comment_id)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для получения всех категорий (только админ)
@app.get("/admin/categories")
def get_categories():
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Получаем категории через админ-систему
    result = admin.get_categories()
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для добавления категории (только админ)
@app.post("/admin/categories")
def add_category(category_data: CategoryCreateRequest):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод добавления категории
    result = admin.add_category(category_data.name)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для обновления категории (только админ)
@app.put("/admin/categories")
def update_category(category_data: CategoryUpdateRequest):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод обновления категории
    result = admin.update_category(category_data.old_name, category_data.new_name)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для удаления категории (только админ)
@app.delete("/admin/categories")
def delete_category(category_data: CategoryDeleteRequest):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Вызываем метод удаления категории
    result = admin.delete_category(category_data.name)
    
    # Если операция неуспешна, возвращаем ошибку
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

# Эндпоинт для получения категорий 
@app.get("/categories")
def get_categories_public():
    # Получаем категории напрямую из базы данных
    categories = db.get_categories()
    
    return {"categories": categories}

# Эндпоинт для проверки здоровья сервера
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Server is running"}

# Эндпоинт для поиска идей (только админ)
@app.get("/admin/ideas/search")
def search_ideas_admin(query: str = ""):
    # Устанавливаем текущего пользователя как администратора
    auth.current_user = {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "full_name": "Администратор",
        "has_completed_introduction": True
    }
    
    # Если поисковый запрос пустой, возвращаем все идеи
    if not query:
        result = admin.get_all_ideas_admin()
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    
    # Получаем все идеи для админа
    ideas = db.get_all_ideas_admin()
    filtered_ideas = []
    
    # Фильтруем идеи по заголовку 
    for idea in ideas:
        title = idea.get('title', '').lower()
        if query.lower() in title:
            filtered_ideas.append(idea)
    
    # Возвращаем результат поиска
    return {
        "success": True,
        "ideas": filtered_ideas,
        "search_query": query,
        "total_found": len(filtered_ideas),
        "search_field": "title"
    }

# Точка входа для запуска сервера
if __name__ == "__main__":
    # Выводим сообщение о запуске
    print("Запуск сервера на http://localhost:8000")
    
    # Запускаем сервер Uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0",  # Принимаем соединения с любых IP-адресов
        port=8000,       # Порт сервера
        log_level="warning"  # Уровень логирования
    )