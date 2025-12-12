import random
import string
from typing import Dict, List
from backend.database import JSONDatabase
from backend.auth import AuthSystem

class AdminSystem:
    def __init__(self, db: JSONDatabase, auth: AuthSystem):
        self.db = db 
        self.auth = auth

    #Проверка прав администратора
    def _check_admin(self):
        user = self.auth.get_current_user() #Получаем текущего пользователи из аутентификации
        if not user: #Если пользователь не найден
            return {"success": False, "message": "Вы не вошли в систему."}
        if user.get("role") != "admin": #Если пользователь не админ
            return {"success": False, "message": "Доступ запрещён. Требуются права администратора."}
        return {"success": True} #Успещный результат, если пользователь админ
    
    #Одобрение идеи администратором
    def approve_idea(self, idea_id: int) -> Dict[str, any]:
        check = self._check_admin() 
        if not check["success"]:
            return check
        ok = self.db.approve_idea(idea_id) #Вызываем метод БД для одобрения идеи
        if not ok:
            return{"success": False, "message": "Идея не найдена."} #Если идея не найдена
        return{"success": True, "message": f"Идея #{idea_id} одобрена."} #Результат удачный
    
    #Скрытие идеи администратором
    def hide_idea(self, idea_id: int) -> Dict[str, any]:
        check = self._check_admin() 
        if not check["success"]:
            return check
        ok = self.db.hide_idea(idea_id) #Вызываем метод БД для скрытия идеи
        if not ok:
            return{"success": False, "message": "Идея не найдена."} #Если идея не найдена
        return{"success": True, "message": f"Идея #{idea_id} скрыта."} #Результат удачный
    
    #Отобразить скрытую идею
    def unhide_idea(self, idea_id: int) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        ok = self.db.unhide_idea(idea_id) #Вызываем метод БД для отображения скрытой идеи
        if not ok:
            return{"success": False, "message": "Идея не найдена."} #Если идея не найдена
        return{"success": True, "message": f"Идея #{idea_id} показана."} #Результат удачный
    
    #Регистрация нового пользователя администратором
    def register_user(self, username: str, password: str, role: str = "user") -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        result = self.db.create_user(username, password, role) #Создаем пользователя через БД
        if not result["success"]: #Если создание не удалось, возвращаем ошибку из БД
            return result
        return {"success": True, "user_id": result["user_id"], "message": f"Пользователь {username} успешно зарегистрирован."}
    
    #Генерация случайных пользователей (оригинальный метод)
    def generate_random_users(self, count: int = 10) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        #Проверка допустимого диапазона кол-ва пользователей
        if count <= 0 or count > 100:
            return{"success": False, "message": "Количество пользователей должно быть от 1 до 100"}

        #Генерирует случайную строку из букв и цифр
        def generate_random_string(length: int = 8) -> str:
            characters = string.ascii_letters + string.digits #Все буквы и цифры
            return ''.join(random.choice(characters) for _ in range(length)) #Генерация строки
        created_users = [] #Список созданных пользователей
        failed_count = 0 #Счетчик неудачных попыток

        #Цикл по запрошенному количеству пользователей
        for i in range(count):
            username = generate_random_string(8) #Генерированный логин из 8 символов
            password = generate_random_string(10) #Генерированный пароль из 10 символов

            result = self.db.create_user(username, password, "user")
            if result["success"]: #Если пользователь создан успешно
                created_users.append({"id": result["user_id"], "username": username})
            else:  #Если не удалось создать
                failed_count += 1 #Увеличиваем счетчик ошибок
                #Если ошибка из-за существующего имени пользователя
                if "уже существует" in result["message"]:
                    username = generate_random_string(10) #Генерируем более длинный логин
                    result = self.db.create_user(username, password, "user") #Пробуем снова

                    if result["success"]: #Если на этот раз удалось
                        created_users.append({"id": result["user_id"], "username": username})
                        failed_count -= 1 #Уменьшаем счетчик ошибок
        return {
                "success": True, 
                "message": f"Успешно создано {len(created_users)} пользователей. Не удалось: {failed_count}.", #Список созданных пользователей
                "total_created": len(created_users), #Общее количество созданных
                "total_failed": failed_count #Общее количество ошибок
                }
    
    #Генерация случайных пользователей с возвратом паролей (новый метод)
    def generate_random_users_with_passwords(self, count: int = 10) -> Dict[str, any]:
        """
        Генерация пользователей с временным сохранением паролей в открытом виде
        Возвращает список пользователей с логинами и паролями для отображения админу
        """
        check = self._check_admin()
        if not check["success"]:
            return check
        
        #Проверка допустимого диапазона кол-ва пользователей
        if count <= 0 or count > 100:
            return {"success": False, "message": "Количество пользователей должно быть от 1 до 100"}

        #Генерирует случайную строку из букв и цифр
        def generate_random_string(length: int = 8) -> str:
            characters = string.ascii_letters + string.digits #Все буквы и цифры
            return ''.join(random.choice(characters) for _ in range(length)) #Генерация строки
        
        created_users = [] #Список созданных пользователей с паролями
        failed_count = 0 #Счетчик неудачных попыток

        #Цикл по запрошенному количеству пользователей
        for i in range(count):
            username = generate_random_string(8) #Генерированный логин из 8 символов
            password = generate_random_string(10) #Генерированный пароль из 10 символов

            # Используем новый метод для создания пользователя с временным паролем
            if hasattr(self.db, 'create_user_temp_password'):
                result = self.db.create_user_temp_password(username, password, "user")
            else:
                # Если метод не существует, используем старый
                result = self.db.create_user(username, password, "user")
                if result["success"]:
                    # Для совместимости с новым форматом
                    result["username"] = username
                    result["password"] = password
            
            if result["success"]: #Если пользователь создан успешно
                created_users.append({
                    "id": result["user_id"], 
                    "username": result.get("username", username),
                    "password": result.get("password", password)  # Пароль в открытом виде
                })
            else:  #Если не удалось создать
                failed_count += 1 #Увеличиваем счетчик ошибок
                #Если ошибка из-за существующего имени пользователя
                if "уже существует" in result["message"]:
                    username = generate_random_string(10) #Генерируем более длинный логин
                    
                    if hasattr(self.db, 'create_user_temp_password'):
                        result = self.db.create_user_temp_password(username, password, "user") #Пробуем снова
                    else:
                        result = self.db.create_user(username, password, "user")
                        if result["success"]:
                            result["username"] = username
                            result["password"] = password
                    
                    if result["success"]: #Если на этот раз удалось
                        created_users.append({
                            "id": result["user_id"], 
                            "username": result.get("username", username),
                            "password": result.get("password", password)
                        })
                        failed_count -= 1 #Уменьшаем счетчик ошибок
        
        return {
            "success": True, 
            "message": f"Успешно создано {len(created_users)} пользователей. Не удалось: {failed_count}.",
            "users": created_users,  # Теперь возвращаем пользователей с паролями
            "total_created": len(created_users),
            "total_failed": failed_count
        }
    
    #Хеширование всех временных паролей
    def hash_all_temp_passwords(self) -> Dict[str, any]:
        """Хеширование всех временных паролей и удаление их открытого вида"""
        check = self._check_admin()
        if not check["success"]:
            return check
        
        if hasattr(self.db, 'hash_temp_passwords'):
            result = self.db.hash_temp_passwords()
            return result
        else:
            return {"success": True, "message": "Метод хеширования временных паролей не доступен"}
    
    #Получение пользователей с временными паролями
    def get_temp_password_users(self) -> Dict[str, any]:
        """Получение списка пользователей с временными (незахешированными) паролями"""
        check = self._check_admin()
        if not check["success"]:
            return check
        
        if hasattr(self.db, 'get_temp_password_users'):
            temp_users = self.db.get_temp_password_users()
            return {
                "success": True,
                "users": temp_users,
                "count": len(temp_users)
            }
        else:
            return {"success": True, "users": [], "count": 0}
    
    #Блокировка пользователей
    def block_user(self, user_id: int) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        result = self.db.block_user(user_id) #Блокируем пользователя в БД
        if not result["success"]: #Если операция не удалась
            return result
        return{"success": True, "message": f"Пользователь #{user_id} заблокирован."}
    
    #Разблокировка пользователя
    def unblock_user(self, user_id: int) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        result = self.db.unblock_user(user_id) #Разблокировка пользователя в БД
        if not result["success"]: #Если операция не удалась
            return result
        return {"success": True, "message": f"Пользователь #{user_id} разблокирован."}
    
    #Получить список всех пользователей
    def get_all_users(self) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]: 
            return check
        users = self.db.get_all_users() #Получаем всех пользователей из БД
        return{"success": True, "users": users} #Возвращаем список пользователей
    
    #Получить список всех идей, включая скрытые (только админ)
    def get_all_ideas_admin(self) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        ideas = self.db.get_all_ideas_admin() #Получаем все идеи из БД
        return{"success": True, "ideas": ideas} #Возвращаем список идей
    
    #Удаление комментариев
    def delete_comment(self, idea_id: int, comment_id: int) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        result = self.db.delete_comment(idea_id, comment_id) #Удаляем комментарий
        if not result["success"]:
            return result
        return{"success": True, "message": f"Комментарий #{comment_id} удалён администратором."}

    #Получить список всех категорий
    def get_categories(self) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        categories = self.db.get_categories() #Получаем категории из БД
        return{"success": True, "categories": categories} #Возвращаем список категорий
    
    #Добавить новую категорию
    def add_category(self, category_name: str) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        result = self.db.add_category(category_name) #Добавляем категорию в БД
        return result #Возвращаем результат операции
    
    #Обновить название категории
    def update_category(self, old_name: str, new_name: str) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        result = self.db.update_category(old_name, new_name) #Обновляем категорию а БД
        return result #Возвращаем результат операции
    
    #Удалить категорию
    def delete_category(self, category_name: str) -> Dict[str, any]:
        check = self._check_admin()
        if not check["success"]:
            return check
        result = self.db.delete_category(category_name) #Удаляем категорию из БД
        return result #Возващаем результат операции