import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

class JSONDatabase:
    def __init__(self, db_folder: str = None):
        base_dir = os.path.dirname(os.path.abspath(__file__)) #Абсолютный путь к текущему файлу
        self.db_folder = db_folder or os.path.join(base_dir, "data") #Папка для хранения данных
        os.makedirs(self.db_folder, exist_ok=True) #Создание папки, если она не существует
        self.users_file = os.path.join(self.db_folder, "users.json") #Файл пользователей
        self.ideas_file = os.path.join(self.db_folder, "ideas.json") #Файл идей
        self.config_file = os.path.join(self.db_folder, "app_config.json") #Файл с конфигурацией
        self.__init__files() #Инициализация файлов (создание их, если нет)

    #Метод для хеширования пароля
    @staticmethod
    def hash_password(password: str) -> str:
        hash_value = 0
        #Проходим по каждому символу пароля
        for char in password:
            #Простой алгоритм хеширования
            hash_value = (hash_value * 31 + ord(char)) & 0xFFFFFFFF
        return hex(hash_value)[2:].zfill(8) #Возвращаем 8-значное шестнадцатиричное число
    
    #Метод для проверки пароля
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        return JSONDatabase.hash_password(password) == hashed_password #Хешируем введенный пароль и сравниваем с сохраненным хешем
    
    #Метод для сохранения данных в json
    def _save_json(self, file_path: str, data: Dict):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2) #Сохраняем с отступами
    
    #Метод для загрузки  данных из json
    def _load_json(self, file_path: str) -> Dict:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f) #Загружаем Json данные
        except:
            return{} #Есои нет файла или ошибка, то возвращаем пустой словарь
    
    #Метод инициализации файлов БД
    def __init__files(self):
        if not os.path.exists(self.users_file): #Инициализация user.json
            default_password = "12345"
            admin_password_hash = self.hash_password(default_password) #Хешируем пароль
            
            #Структура файла пользователей
            self._save_json(self.users_file, {
                "users": [{
                    "id": 1, #Id
                    "username": "admin", #Логин
                    "password": admin_password_hash, #Хешированный пароль
                    "role": "admin", #Роль администратора
                    "is_active": True, #Активен
                    "full_name": "Администратор", #Полное название
                    "hash_completes_introduction": True, #Прошел представление
                    "needs_password_change": True, #Требуется смена пароля
                    "created_at": datetime.now().isoformat() #Дата создания
                }],
                "last_user_id": 1 #Последний использованный Id
            })
        #Инициализация файла идей (если не существует)
        if not os.path.exists(self.ideas_file):
            self._save_json(self.ideas_file, {
                "ideas": [],  #Пустой массив идей
                "last_idea_id": 0,  #Последний ID идеи
                "last_comment_id": 0  #Последний ID комментария
            })
        #Инициализация файла конфигурации (если не существует)
        if not os.path.exists(self.config_file):
            self._save_json(self.config_file, {
                "categories": ["IT", "Документооборот", "Производство", "HR"],  #Категории по умолчанию
                "settings": {  #Настройки приложения
                    "default_comments_enabled": True,  #Разрешены комментарии по умолчанию
                    "items_per_page": 20  #Элементов на странице
                }
            })
        
    #Получение всех идей
    def get_all_ideas(self) -> List[Dict]:
        return self._load_json(self.ideas_file).get("ideas", []) #Возвращаем список идей
    
    #Получение идеи по Id
    def get_idea_by_id(self, idea_id: int) -> Optional[Dict]:
        data = self._load_json(self.ideas_file) #Загружаем данные
        for idea in data.get("ideas", []): #Ищем идею по Id
            if idea["id"] == idea_id:
                return idea #Возвращаем найденную идею
        return None #Если не нашли, то возвращаем None
    
    #Создание новой идеи
    def create_idea(self, idea_data: Dict) -> int:
        data = self._load_json(self.ideas_file) #Загружаем текущие идеи
        new_id = data.get("last_idea_id", 0) + 1 #Генерируем новый Id
        #Создаем объект идеи
        idea = {
            "id": new_id,  #ID идеи
            "title": idea_data["title"],  #Заголовок 
            "short_description": idea_data.get("short_description", ""),  #Краткое описание
            "full_description": idea_data.get("full_description", ""),  #Полное описание
            "expected_effect": idea_data.get("expected_effect", ""),  #Ожидаемый эффект
            "author_id": idea_data.get("author_id", 0),  #ID автора
            "category": idea_data.get("category", "IT"),  #Категория (по умолчанию IT)
            "is_hidden": False,  #Не скрыта
            "is_approved": False,  #Не одобрена
            "votes_for": 0,  #Голосов "за"
            "votes_against": 0,  #Голосов "против"
            "voted_users": [],  #Список проголосовавших пользователей
            "created_at": datetime.now().isoformat(),  #Дата создания
            "comments": []  #Пустой список комментариев
        }
        data["ideas"].append(idea) #Добавляем идею в список
        data["last_idea_id"] = new_id #Обновляем последний Id
        self._save_json(self.ideas_file, data) #Сохраняем изменения
        return new_id #Возвращаем Id созданной идеи
    #Голосование за идею
    def vote_for_idea(self, idea_id: int, user_id: int, vote: str) -> Dict:
        data = self._load_json(self.ideas_file)  #Загружаем данные
        for idea in data.get("ideas", []):  #Ищем идею
            if idea["id"] == idea_id:
                #Проверяем, не скрыта ли идея
                if idea.get("is_hidden", False):
                    return {"success": False, "message": "Идея скрыта и недоступна для голосования."}
                    
                #Проверяем, не голосовал ли пользователь уже
                if user_id in idea["voted_users"]:
                    return {"success": False, "message": "Пользователь уже голосовал за эту идею."}

                #Обрабатываем голос
                if vote == "for":
                    idea["votes_for"] += 1  #Увеличиваем голоса "за"
                elif vote == "against":
                    idea["votes_against"] += 1  #Увеличиваем голоса "против"
                else:
                    return {"success": False, "message": "Неверный тип голоса. Используйте 'for' или 'against'."}

                idea["voted_users"].append(user_id)  #Добавляем пользователя в список проголосовавших
                self._save_json(self.ideas_file, data)  #Сохраняем изменения
                
                return {
                    "success": True, 
                    "message": "Голос учтён.",
                    "votes_for": idea["votes_for"],  #Новое количество голосов "за"
                    "votes_against": idea["votes_against"]  #Новое количество голосов "против"
                }

        return {"success": False, "message": "Идея не найдена."}  #Если идея не найдена

    #Добавление комментария к идее
    def add_comment(self, idea_id: int, user_id: int, text: str) -> Optional[int]:
        data = self._load_json(self.ideas_file)  #Загружаем данные
        for idea in data.get("ideas", []):  #Ищем идею
            if idea["id"] == idea_id:
                new_comment_id = data.get("last_comment_id", 0) + 1  #Генерируем ID комментария
                
                #Создаем объект комментария
                comment = {
                    "id": new_comment_id,  #ID комментария
                    "user_id": user_id,  #ID пользователя
                    "text": text,  #Текст комментария
                    "created_at": datetime.now().isoformat()  #Дата создания
                }
                
                idea["comments"].append(comment)  #Добавляем комментарий к идее
                data["last_comment_id"] = new_comment_id  #Обновляем последний ID комментария
                self._save_json(self.ideas_file, data)  #Сохраняем изменения
                return new_comment_id  #Возвращаем ID нового комментария
        return None  #Если идея не найдена

    #Одобрение идеи (админ)
    def approve_idea(self, idea_id: int) -> bool:
        data = self._load_json(self.ideas_file)  #Загружаем данные
        for idea in data.get("ideas", []):  #Ищем идею
            if idea["id"] == idea_id:
                idea["is_approved"] = True  #Устанавливаем флаг одобрения
                self._save_json(self.ideas_file, data)  #Сохраняем изменения
                return True  #Успешно
        return False  #Идея не найдена

    #Скрытие идеи (админ)
    def hide_idea(self, idea_id: int) -> bool:
        data = self._load_json(self.ideas_file)  #Загружаем данные
        for idea in data.get("ideas", []):  #Ищем идею
            if idea["id"] == idea_id:
                idea["is_hidden"] = True  #Устанавливаем флаг скрытия
                self._save_json(self.ideas_file, data)  #Сохраняем изменения
                return True  #Успешно
        return False  #Идея не найдена

    #Отображение скрытой идеи (админ)
    def unhide_idea(self, idea_id: int) -> bool:
        data = self._load_json(self.ideas_file)  #Загружаем данные
        for idea in data.get("ideas", []):  #Ищем идею
            if idea["id"] == idea_id:
                idea["is_hidden"] = False  #Снимаем флаг скрытия
                self._save_json(self.ideas_file, data)  #Сохраняем изменения
                return True  #Успешно
        return False  #Идея не найдена

    #Создание пользователя
    def create_user(self, username: str, password: str, role: str = "user") -> Dict[str, any]:
        data = self._load_json(self.users_file)  #Загружаем данные пользователей
        users = data.get("users", [])  #Получаем список пользователей
        
        #Проверяем, не существует ли уже пользователь с таким именем
        for user in users:
            if user["username"] == username:
                return {"success": False, "message": "Пользователь с таким именем уже существует"}
        
        new_id = data.get("last_user_id", 0) + 1  #Генерируем новый ID
        password_hash = self.hash_password(password)  #Хешируем пароль
        
        #Определяем, нужно ли менять пароль (для администратора обязательно)
        needs_password_change = (role == "admin")
        
        #Создаем объект пользователя
        new_user = {
            "id": new_id,  #ID пользователя
            "username": username,  #Логин
            "password": password_hash,  #Хешированный пароль
            "role": role,  #Роль 
            "is_active": True,  #Активен
            "full_name": "",  #Пока нет ФИО
            "has_completed_introduction": False,  #Не прошел представление
            "needs_password_change": needs_password_change,  #Нужно ли сменить пароль
            "created_at": datetime.now().isoformat()  #Дата создания
        }
        
        users.append(new_user)  #Добавляем пользователя в список
        data["users"] = users  #Обновляем список пользователей
        data["last_user_id"] = new_id  #Обновляем последний ID
        self._save_json(self.users_file, data)  #Сохраняем изменения
        
        return {"success": True, "user_id": new_id}  #Возвращаем успешный результат
    
    def get_temp_password_users(self) -> List[Dict]:
        data = self._load_json(self.users_file)
        users = data.get("users", [])
        
        temp_users = []
        for user in users:
            if user.get("is_temp_password", False):
                temp_users.append({
                    "id": user["id"],
                    "username": user["username"],
                    "password": user.get("password", ""),
                    "role": user.get("role", "user"),
                    "created_at": user.get("created_at", "")
                })
        
        return temp_users
    
    #Завершение представления пользователя (ввод ФИО)
    def complete_user_introduction(self, user_id: int, full_name: str) -> Dict[str, any]:
        data = self._load_json(self.users_file)  #Загружаем данные пользователей
        for user in data.get("users", []):  #Ищем пользователя
            if user["id"] == user_id:
                user["full_name"] = full_name.strip()  #Сохраняем ФИО
                user["has_completed_introduction"] = True  #Отмечаем как прошедшего представление
                self._save_json(self.users_file, data)  #Сохраняем изменения
                return {"success": True}  #Успешно
        return {"success": False, "message": "Пользователь не найден"}  #Пользователь не найден


    #Смена пароля администратора
    def change_admin_password(self, user_id: int, current_password: str, new_password: str) -> Dict[str, any]:
        data = self._load_json(self.users_file)  #Загружаем данные пользователей
        for user in data.get("users", []):  #Ищем пользователя
            if user["id"] == user_id:
                #Проверяем, является ли пользователь администратором
                if user.get("role") != "admin":
                    return {"success": False, "message": "Доступ запрещён. Требуются права администратора."}
                
                #Проверяем текущий пароль
                if not self.verify_password(current_password, user["password"]):
                    return {"success": False, "message": "Текущий пароль неверен."}
                
                #Проверяем минимальную длину нового пароля
                if len(new_password) < 4:
                    return {"success": False, "message": "Новый пароль должен содержать минимум 4 символа."}
                
                user["password"] = self.hash_password(new_password)  #Сохраняем новый хешированный пароль
                user["needs_password_change"] = False  #Снимаем флаг необходимости смены пароля
                
                self._save_json(self.users_file, data)  #Сохраняем изменения
                return {"success": True}  #Успешно
        
        return {"success": False, "message": "Пользователь не найден"}  #Пользователь не найден

    #Получение списка всех пользователей (без паролей)
    def get_all_users(self) -> List[Dict]:
        data = self._load_json(self.users_file)  #Загружаем данные пользователей
        users = data.get("users", [])  #Получаем список пользователей
        for user in users:
            if "password" in user:
                del user["password"]  #Удаляем пароли из результата 
        return users  #Возвращаем список пользователей

    #Блокировка пользователя (админ)
    def block_user(self, user_id: int) -> Dict[str, any]:
        data = self._load_json(self.users_file)  #Загружаем данные пользователей
        for user in data.get("users", []):  #Ищем пользователя
            if user["id"] == user_id:
                #Нельзя блокировать администраторов
                if user.get("role") == "admin":
                    return {"success": False, "message": "Нельзя заблокировать администратора"}
                user["is_active"] = False  #Деактивируем пользователя
                self._save_json(self.users_file, data)  #Сохраняем изменения
                return {"success": True}  #Успешно
        return {"success": False, "message": "Пользователь не найден"}  #Пользователь не найден

    #Разблокировка пользователя (админ)
    def unblock_user(self, user_id: int) -> Dict[str, any]:
        data = self._load_json(self.users_file)  #Загружаем данные пользователей
        for user in data.get("users", []):  #Ищем пользователя
            if user["id"] == user_id:
                user["is_active"] = True  #Активируем пользователя
                self._save_json(self.users_file, data)  #Сохраняем изменения
                return {"success": True}  #Успешно
        return {"success": False, "message": "Пользователь не найден"}  #Пользователь не найден


    def create_user_temp_password(self, username: str, password: str, role: str = "user") -> Dict[str, any]:
        data = self._load_json(self.users_file)
        users = data.get("users", [])
        
        # Проверяем существование пользователя
        for user in users:
            if user["username"] == username:
                return {"success": False, "message": "Пользователь с таким именем уже существует"}
        
        new_id = data.get("last_user_id", 0) + 1
        
        # СОХРАНЯЕМ ОТКРЫТЫЙ ПАРОЛЬ ОТДЕЛЬНО ДЛЯ ПОКАЗА АДМИНУ
        needs_password_change = (role == "admin")
        
        new_user = {
            "id": new_id,
            "username": username,
            "password": self.hash_password(password),  # Хешированный пароль для входа
            "plain_password": password,  # Открытый пароль для показа админу
            "is_temp_password": True,  # Флаг, что есть открытый пароль
            "role": role,
            "is_active": True,
            "full_name": "",
            "has_completed_introduction": False,
            "needs_password_change": needs_password_change,
            "created_at": datetime.now().isoformat()
        }
        
        users.append(new_user)
        data["users"] = users
        data["last_user_id"] = new_id
        self._save_json(self.users_file, data)
        
        return {
            "success": True, 
            "user_id": new_id,
            "username": username,
            "password": password  # Возвращаем пароль в открытом виде
        }

    def hash_temp_passwords(self) -> Dict[str, any]:
        data = self._load_json(self.users_file)
        users = data.get("users", [])
        hashed_count = 0
        
        for user in users:
            if user.get("is_temp_password", False) and "plain_password" in user:
                # Удаляем только открытый пароль
                del user["plain_password"]
                user["is_temp_password"] = False
                hashed_count += 1
        
        data["users"] = users
        self._save_json(self.users_file, data)
        
        return {
            "success": True,
            "message": f"Удалено {hashed_count} открытых паролей",
            "hashed_count": hashed_count
        }
    #Удаление пользователя (админ)
    def delete_user(self, user_id: int) -> Dict[str, any]:
        data = self._load_json(self.users_file)  #Загружаем данные пользователей
        users = data.get("users", [])  #Получаем список пользователей
        
        for i, user in enumerate(users):  #Ищем пользователя
            if user["id"] == user_id:
                #Нельзя удалять администраторов
                if user.get("role") == "admin":
                    return {"success": False, "message": "Нельзя удалить администратора"}
                
                users.pop(i)  #Удаляем пользователя из списка
                data["users"] = users  #Обновляем список
                self._save_json(self.users_file, data)  #Сохраняем изменения
                
                #Также удаляем все идеи этого пользователя
                ideas_data = self._load_json(self.ideas_file)  #Загружаем данные идей
                #Фильтруем идеи, оставляем только те, у которых author_id не равен удаляемому пользователю
                data["ideas"] = [idea for idea in ideas_data.get("ideas", []) if idea.get("author_id") != user_id]
                self._save_json(self.ideas_file, data)  #Сохраняем изменения
                
                return {"success": True}  #Успешно
        
        return {"success": False, "message": "Пользователь не найден"}  #Пользователь не найден

    #Получение всех идей (включая скрытые) для администратора
    def get_all_ideas_admin(self) -> List[Dict]:
        return self._load_json(self.ideas_file).get("ideas", [])  #Возвращаем все идеи
    
    #Удаление комментария (админ)
    def delete_comment(self, idea_id: int, comment_id: int) -> Dict[str, any]:
        data = self._load_json(self.ideas_file)  #Загружаем данные идей
        for idea in data.get("ideas", []):  #Ищем идею
            if idea["id"] == idea_id:
                comments = idea.get("comments", [])  #Получаем комментарии идеи
                for i, comment in enumerate(comments):  #Ищем комментарий
                    if comment["id"] == comment_id:
                        comments.pop(i)  #Удаляем комментарий
                        idea["comments"] = comments  #Обновляем список комментариев
                        self._save_json(self.ideas_file, data)  #Сохраняем изменения
                        return {"success": True, "message": f"Комментарий #{comment_id} удалён"}  #Успешно
                return {"success": False, "message": "Комментарий не найден"}  #Комментарий не найден
        return {"success": False, "message": "Идея не найдена"}  #Идея не найдена

    #Получение списка категорий
    def get_categories(self) -> List[str]:
        data = self._load_json(self.config_file)  #Загружаем конфигурацию
        return data.get("categories", [])  #Возвращаем список категорий

    #Добавление новой категории (админ)
    def add_category(self, category_name: str) -> Dict[str, any]:
        #Проверяем, что название не пустое
        if not category_name.strip():
            return {"success": False, "message": "Название категории не может быть пустым"}
        
        data = self._load_json(self.config_file)  #Загружаем конфигурацию
        categories = data.get("categories", [])  #Получаем список категорий
        
        #Проверяем, не существует ли уже такая категория
        if category_name in categories:
            return {"success": False, "message": "Категория с таким названием уже существует"}
        
        categories.append(category_name.strip())  #Добавляем категорию
        data["categories"] = categories  #Обновляем список категорий
        self._save_json(self.config_file, data)  #Сохраняем изменения
        
        return {"success": True, "message": f"Категория '{category_name}' успешно добавлена"}  #Успешно

    #Обновление названия категории (админ)
    def update_category(self, old_name: str, new_name: str) -> Dict[str, any]:
        #Проверяем, что новое название не пустое
        if not new_name.strip():
            return {"success": False, "message": "Новое название категории не может быть пустым"}
        
        data = self._load_json(self.config_file)  #Загружаем конфигурацию
        categories = data.get("categories", [])  #Получаем список категорий
        
        #Проверяем, существует ли старая категория
        if old_name not in categories:
            return {"success": False, "message": "Категория не найдена"}
        
        #Проверяем, не существует ли уже новая категория (если это не переименование той же)
        if new_name in categories and new_name != old_name:
            return {"success": False, "message": "Категория с таким названием уже существует"}
        
        index = categories.index(old_name)  #Находим индекс старой категории
        categories[index] = new_name.strip()  #Заменяем на новое название
        data["categories"] = categories  #Обновляем список
        
        #Обновляем категории во всех идеях
        ideas_data = self._load_json(self.ideas_file)  #Загружаем данные идей
        for idea in ideas_data.get("ideas", []):  #Проходим по всем идеям
            if idea.get("category") == old_name:  #Если идея имеет старую категорию
                idea["category"] = new_name.strip()  #Меняем на новую
        
        self._save_json(self.config_file, data)  # Сохраняем конфигурацию
        self._save_json(self.ideas_file, ideas_data)  # Сохраняем идеи
        
        return {"success": True, "message": f"Категория '{old_name}' успешно изменена на '{new_name}'"}  # Успешно

    #Удаление категории (админ)
    def delete_category(self, category_name: str) -> Dict[str, any]:
        data = self._load_json(self.config_file)  # Загружаем конфигурацию
        categories = data.get("categories", [])  # Получаем список категорий
        
        #Проверяем, существует ли категория
        if category_name not in categories:
            return {"success": False, "message": "Категория не найдена"}
        
        #Проверяем, есть ли идеи с этой категорией
        ideas_data = self._load_json(self.ideas_file)  # Загружаем данные идей
        #Находим идеи с удаляемой категорией
        ideas_with_category = [idea for idea in ideas_data.get("ideas", []) if idea.get("category") == category_name]
        
        #Если есть идеи с этой категорией, то нельзя удалить
        if ideas_with_category:
            return {
                "success": False, 
                "message": f"Невозможно удалить категорию. Существуют идеи ({len(ideas_with_category)}) с этой категорией"
            }
        
        categories.remove(category_name)  #Удаляем категорию из списка
        data["categories"] = categories  #Обновляем список
        self._save_json(self.config_file, data)  #Сохраняем изменения
        
        return {"success": True, "message": f"Категория '{category_name}' успешно удалена"}  #Успешно