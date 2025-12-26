from typing import Dict, Optional
from database import JSONDatabase

class AuthSystem:
    def __init__(self, db: JSONDatabase):
        self.db = db
        self.current_user: Optional[Dict] = None #Текущий пользователь изначально None

    #Аутентификация пользователя
    def login(self, username: str, password: str) -> Dict[str, any]:
        # Загружаем данные пользователя из файла
        data = self.db._load_json(self.db.users_file)
        users = data.get("users", []) # Получаем список пользователей или пустой список
        
        # Ищем пользователя по логину
        user_found = False
        for user in users:
            if user["username"] == username:
                user_found = True
                
                # ПРОВЕРКА ПАРОЛЯ - ПОДДЕРЖКА ВРЕМЕННЫХ И ХЕШИРОВАННЫХ ПАРОЛЕЙ
                
                # 1. Проверяем временный (открытый) пароль
                if user.get("is_temp_password", False) and "plain_password" in user:
                    if password == user["plain_password"]:
                        # Автоматически хешируем пароль при успешном входе
                        self.__hash_temp_password_on_login(user["id"], password)
                        return self._create_login_success_response(user)
                    else:
                        return {"success": False, "message": "Неверный пароль. Попробуйте снова."}
                
                # 2. Проверяем обычный хешированный пароль
                elif "password" in user:
                    if self.db.verify_password(password, user["password"]):
                        return self._create_login_success_response(user)
                    else:
                        return {"success": False, "message": "Неверный пароль. Попробуйте снова."}
                
                # 3. Если есть password_hash (альтернативное хранение)
                elif "password_hash" in user:
                    if self.db.verify_password(password, user["password_hash"]):
                        return self._create_login_success_response(user)
                    else:
                        return {"success": False, "message": "Неверный пароль. Попробуйте снова."}
                else:
                    return {"success": False, "message": "Ошибка в данных пользователя. Обратитесь к администратору."}
    
        # Если пользователь не найден
        if not user_found:
            return {"success": False, "message": "Пользователь с таким логином не найден."}
        else:
            return {"success": False, "message": "Неверный пароль. Попробуйте снова."}
    
    #Создание успешного ответа при входе
    def _create_login_success_response(self, user: Dict) -> Dict[str, any]:
        """Создание стандартизированного ответа при успешном входе"""
        #Проверяем активность учетной записи (не в блокировке ли она)
        if not user.get("is_active", True):
            return {"success": False, "message": "Учётная запись заблокирована."}
        
        #Проверяем, нужно ли админу сменить пароль
        needs_password_change = (
            user.get("role") == "admin" and user.get("needs_password_change", False)
        )
        
        #Сохраняем информацию о текущем пользователе
        self.current_user = {
            "id": user["id"], #Id пользователя
            "username": user["username"], #Логин
            "role": user["role"], #Роль
            "full_name": user.get("full_name", ""), #ФИО (если есть)
            "has_completed_introduction": user.get("has_completed_introduction", False), #Ввел ли ФИО
            "needs_password_change": needs_password_change #Нужно ли сменить пароль админу
        }
        
        #Если пользователь не ввел ФИО 
        if not user.get("has_completed_introduction", False) and user["role"] != "admin":
            return{
                "success": True,
                "user": self.current_user, #Данные пользователя
                "needs_introduction": True, #Требуется ввести ФИО
                "message": "Пожалуйста, представьтесь - укажите ФИО."
            }
        
        #Если админу нужно сменить пароль
        if needs_password_change:
            return{
                "success": True,
                "user": self.current_user, #Данные пользователя
                "needs_password_change": True, #Требуется смена пароля
                "message": "Пожалуйста, смените пароль для администратора."
            }
        
        #Успешный вход без доп требований
        return{
            "success": True,
            "user": self.current_user, #Данные пользователя
            "needs_introduction": False, #ФИО введено
            "needs_password_change": False, #Смена пароля не нужна
            "message": "Добро пожаловать!"
        }
    
    #Хеширование временного пароля при входе
    def __hash_temp_password_on_login(self, user_id: int, plain_password: str) -> None:
        """Автоматическое хеширование временного пароля при первом входе пользователя"""
        try:
            # Загружаем данные
            data = self.db._load_json(self.db.users_file)
            
            # Находим пользователя
            for user in data.get("users", []):
                if user["id"] == user_id and user.get("is_temp_password", False):
                    # Хешируем пароль
                    password_hash = self.db.hash_password(plain_password)
                    
                    # Обновляем данные пользователя
                    user["password"] = password_hash
                    user["password_hash"] = password_hash
                    
                    # Удаляем открытый пароль
                    if "plain_password" in user:
                        del user["plain_password"]
                    
                    # Снимаем флаг временного пароля
                    user["is_temp_password"] = False
                    
                    # Сохраняем изменения
                    self.db._save_json(self.db.users_file, data)
                    print(f"Пароль пользователя {user['username']} автоматически захеширован")
                    break
                    
        except Exception as e:
            print(f"Ошибка при автоматическом хешировании пароля: {e}")
    
    #Ввод ФИО
    def complete_introduction(self, full_name: str) -> Dict[str, any]:
        #Проверяем, что пользователь вошел в систему
        if not self.current_user:
            return{"success": False, "message": "Вы не вошли в систему."}
        
        #Проверяем, что ФИО уже есть
        if not full_name.strip():
            return{"success": False, "message": "ФИО не может быть пустым."}
        
        #Сохраняем ФИО в БД
        result = self.db.complete_user_introduction(self.current_user["id"], full_name)
        if not result["success"]:
            return result #Возвращаем ошибку из БД
        
        #Обновляем данные текущего пользователя
        self.current_user["full_name"] = full_name.strip() #Сохраняем ФИО
        self.current_user["has_completed_introduction"] = True #Отмечаем, что ФИО введено
        return {
            "success": True,
            "message": "Спасибо за представление!",
            "user": self.current_user #Возвращаем обновленные данные пользователя
        }
    
    #Смена пароля админа
    def change_admin_password(self, current_password: str, new_password: str) -> Dict[str, any]:
        #Проверяем, что пользователь вошел в систему
        if not self.current_user:
            return{"success": False, "message": "Вы не вошли в систему."}
        
        #Проверяем, что пользователь админ
        if self.current_user.get("role") != "admin":
            return{"success": False, "message": "Доступ запрещён. Требуются права администратора."}
        
        #Вызываем метод БД для смены пароля
        result = self.db.change_admin_password(
            self.current_user["id"], #Id пользователя
            current_password, #Текущий пароль
            new_password #Новый пароль
        )
        
        #Проверяем результат смены пароля
        if not result["success"]:
            return result #Возвращаем ошибку из БД
        
        #Обновляем состояние текущего пользователя
        self.current_user["needs_password_change"] = False #Снимаем флаг смены пароля
        return {
            "success": True,
            "message": "Пароль успешно изменён!",
            "user": self.current_user #Возвращаем обновленные данные пользователя
        }
    
    #Выход из системы
    def logout(self) -> Dict[str, any]:
        #Проверяем, что пользователь вошел в систему
        if not self.current_user:
            return{"success": False, "message": "Вы не вошли в систему."}
        
        #Сбрасываем текущего пользователя
        self.current_user = None
        return{"success": True, "message": "Вы успешно вышли."}
    
    #Получение данных текущего пользователя
    def get_current_user(self) -> Optional[Dict]:
        return self.current_user #Возвращаем данные пользователя или None
    
    #Проверка, является ли текущий пользователь админом
    def is_admin(self) -> bool:
        #Проверяем, что пользователь существует и его роль админ
        return bool(self.current_user and self.current_user.get("role") == "admin")
    
    #Регистрация нового пользователя (только для админа)
    def register(self, username: str, password: str, role: str = "user") -> Dict[str, any]:
        #Проверяем, что текущий пользователь админ
        if not self.is_admin():
            return{"success": False, "message": "Требуются права администратора."}
        
        #Создаём пользователя через БД
        result = self.db.create_user(username, password, role)
        return result #Возвращаем результат создания пользователя