const API_BASE = "/api";

//Функция для авторизации пользователя
export const login = async (username, password) => {
  try {
    //Отправляем POST запрос на эндпоинт /login
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",//Указываем что отправляем JSON
      },
      body: JSON.stringify({ username, password }),//Преобразуем данные в JSON
    });
    
    console.log('Login response status:', response.status);//Логируем статус ответа
    
    //Проверяем успешность ответа
    if (!response.ok) {
      const errorText = await response.text();//Получаем текст ошибки
      console.error('Login error response:', errorText);//Логируем ошибку
      throw new Error(`HTTP error! status: ${response.status}`);//Генерируем ошибку
    }
    
    //Парсим JSON ответ
    const result = await response.json();
    console.log('Login success:', result);//Логируем успешный результат
    return result;//Возвращаем результат
  } catch (error) {
    //Обрабатываем ошибки соединения
    console.error('Login API error:', error);
    return { 
      success: false, 
      message: "Не удалось подключиться к серверу. Проверьте, запущен ли бэкенд на localhost:8000" 
    };
  }
};

//Функция для смены пароля администратора
export const changePassword = async (currentPassword, newPassword) => {
  try {
    //Отправляем POST запрос на эндпоинт /change-password
    const response = await fetch(`${API_BASE}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        current_password: currentPassword,//Текущий пароль
        new_password: newPassword //Новый пароль
      }),
    });
    
    console.log('Change password response status:', response.status);//Логируем статус
    
    //Проверяем успешность ответа
    if (!response.ok) {
      const errorText = await response.text();//Получаем текст ошибки
      console.error('Change password error response:', errorText);
      
      //Пытаемся распарсить JSON ошибки
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || "Ошибка при смене пароля");
      } catch {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    }
    
    //Парсим успешный ответ
    const result = await response.json();
    console.log('Change password success:', result);
    return result;
  } catch (error) {
    //Обрабатываем ошибки
    console.error('Change password API error:', error);
    return { 
      success: false, 
      message: error.message || "Ошибка при смене пароля. Проверьте подключение к серверу." 
    };
  }
};

//Функция для завершения знакомства (ввод ФИО)
export const completeIntroduction = async (fullName) => {
  try {
    //Отправляем POST запрос на эндпоинт /complete-introduction
    const response = await fetch(`${API_BASE}/complete-introduction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ full_name: fullName }),//Отправляем ФИО
    });
    
    //Проверяем успешность ответа
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    //Парсим JSON ответ
    const result = await response.json();
    console.log('Complete introduction result:', result);
    return result;
  } catch (error) {
    //Обрабатываем ошибки
    console.error('Complete introduction error:', error);
    return { 
      success: false, 
      message: "Ошибка при сохранении данных" 
    };
  }
};

//Функция для получения списка идей с фильтрацией
export const getIdeas = async (filter = "open") => {
  try {
    //Отправляем GET запрос на эндпоинт /ideas с параметром фильтра
    const response = await fetch(`${API_BASE}/ideas?filter=${filter}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();//Возвращаем список идей
  } catch (error) {
    console.error('Get ideas error:', error);
    return [];//В случае ошибки возвращаем пустой массив
  }
};

//Функция для получения всех идей (админская версия)
export const getAdminIdeas = async () => {
  try {
    //Отправляем GET запрос на админский эндпоинт /admin/ideas
    const response = await fetch(`${API_BASE}/admin/ideas`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Get admin ideas error:', error);
    return { success: false, ideas: [] };//Возвращаем структуру с ошибкой
  }
};

// НОВАЯ ФУНКЦИЯ: Получение идей с информацией об авторах
export const getAdminIdeasWithAuthors = async () => {
  try {
    // Сначала пробуем новый эндпоинт
    const response = await fetch(`${API_BASE}/admin/ideas-with-authors`);
    
    if (!response.ok) {
      // Если новый эндпоинт не найден, используем старый
      if (response.status === 404) {
        console.log('Эндпоинт с авторами не найден, используем старый метод');
        return await getAdminIdeas();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get admin ideas with authors error:', error);
    // В случае ошибки используем старый метод
    return await getAdminIdeas();
  }
};

//Функция для получения конкретной идеи по ID
export const getIdea = async (id) => {
  try {
    //Отправляем GET запрос на эндпоинт /idea/{id}
    const response = await fetch(`${API_BASE}/idea/${id}`);
    if (!response.ok) throw new Error("Идея не найдена");
    return await response.json();
  } catch (error) {
    console.error('Get idea error:', error);
    throw error;//Пробрасываем ошибку дальше
  }
};

//Функция для создания новой идеи
export const createIdea = async (ideaData) => {
  try {
    //Отправляем POST запрос на эндпоинт /idea
    const response = await fetch(`${API_BASE}/idea`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ideaData),//Отправляем данные идеи
    });
    return await response.json();
  } catch (error) {
    console.error('Create idea error:', error);
    return { success: false, message: "Ошибка создания идеи" };
  }
};

//Функция для голосования за идею (ИСПРАВЛЕННАЯ ВЕРСИЯ)
export const voteIdea = async (ideaId, userId, vote) => {
  try {
    // Проверяем входные данные
    if (!ideaId || !userId || !vote) {
      console.error('Missing parameters for vote:', { ideaId, userId, vote });
      return { success: false, message: "Отсутствуют необходимые параметры для голосования" };
    }
    
    // Преобразуем userId в число, если это строка
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      console.error('Invalid userId:', userId);
      return { success: false, message: "Некорректный ID пользователя" };
    }
    
    console.log('Sending vote request:', {
      ideaId,
      userId: numericUserId,
      vote
    });
    
    //Отправляем POST запрос на эндпоинт /idea/{id}/vote
    const response = await fetch(`${API_BASE}/idea/${ideaId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        user_id: numericUserId, 
        vote: vote 
      }),
    });
    
    console.log('Vote response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vote error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        return { 
          success: false, 
          message: errorData.detail || errorData.message || "Ошибка при голосовании" 
        };
      } catch {
        return { 
          success: false, 
          message: `Ошибка сервера: ${response.status}` 
        };
      }
    }
    
    const result = await response.json();
    console.log('Vote success:', result);
    return result;
  } catch (error) {
    console.error('Vote API error:', error);
    return { 
      success: false, 
      message: "Ошибка при голосовании. Проверьте подключение к серверу." 
    };
  }
};

//Функция для добавления комментария к идее
export const addComment = async (ideaId, userId, text) => {
  try {
    // Проверяем входные данные
    if (!ideaId || !userId || !text || !text.trim()) {
      return { success: false, message: "Отсутствует текст комментария" };
    }
    
    //Отправляем POST запрос на эндпоинт /idea/{id}/comment
    const response = await fetch(`${API_BASE}/idea/${ideaId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        user_id: Number(userId), 
        text: text.trim() 
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Add comment error response:', errorText);
      return { success: false, message: "Ошибка при добавлении комментария" };
    }
    
    const result = await response.json();
    return { success: true, comment_id: result.comment_id };
  } catch (error) {
    console.error('Add comment error:', error);
    return { success: false, message: "Ошибка при добавлении комментария" };
  }
};

//Функция для получения всех пользователей (админская)
export const getAllUsers = async () => {
  try {
    //Отправляем GET запрос на админский эндпоинт /admin/users
    const response = await fetch(`${API_BASE}/admin/users`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, users: [] };
  }
};

//Функция для блокировки пользователя
export const blockUser = async (userId) => {
  try {
    //Отправляем POST запрос на эндпоинт /admin/users/{id}/block
    const response = await fetch(`${API_BASE}/admin/users/${userId}/block`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    console.error('Block user error:', error);
    return { success: false, message: "Ошибка блокировки пользователя" };
  }
};

//Функция для разблокировки пользователя
export const unblockUser = async (userId) => {
  try {
    //Отправляем POST запрос на эндпоинт /admin/users/{id}/unblock
    const response = await fetch(`${API_BASE}/admin/users/${userId}/unblock`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    console.error('Unblock user error:', error);
    return { success: false, message: "Ошибка разблокировки пользователя" };
  }
};

//Функция для одобрения идеи (админская)
export const approveIdea = async (ideaId) => {
  try {
    //Отправляем POST запрос на эндпоинт /admin/idea/{id}/approve
    const response = await fetch(`${API_BASE}/admin/idea/${ideaId}/approve`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    console.error('Approve idea error:', error);
    return { success: false, message: "Ошибка одобрения идеи" };
  }
};

//Функция для скрытия идеи (админская)
export const hideIdea = async (ideaId) => {
  try {
    //Отправляем POST запрос на эндпоинт /admin/idea/{id}/hide
    const response = await fetch(`${API_BASE}/admin/idea/${ideaId}/hide`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    console.error('Hide idea error:', error);
    return { success: false, message: "Ошибка скрытия идеи" };
  }
};

//Функция для отображения скрытой идеи (админская)
export const unhideIdea = async (ideaId) => {
  try {
    //Отправляем POST запрос на эндпоинт /admin/idea/{id}/unhide
    const response = await fetch(`${API_BASE}/admin/idea/${ideaId}/unhide`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    console.error('Unhide idea error:', error);
    return { success: false, message: "Ошибка показа идеи" };
  }
};

//Функция для генерации случайных пользователей (админская) - СТАРЫЙ МЕТОД
export const generateRandomUsers = async (count) => {
  try {
    //Отправляем POST запрос на эндпоинт /admin/generate-users с параметром count
    const response = await fetch(`${API_BASE}/admin/generate-users?count=${count}`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    console.error('Generate users error:', error);
    return { success: false, message: "Ошибка генерации пользователей" };
  }
};

// НОВАЯ ФУНКЦИЯ: Генерация пользователей с возвратом паролей
export const generateUsersWithPasswords = async (count) => {
  try {
    // Отправляем POST запрос на новый эндпоинт /admin/generate-users-with-passwords
    const response = await fetch(`${API_BASE}/admin/generate-users-with-passwords?count=${count}`, {
      method: "POST",
    });
    
    if (!response.ok) {
      // Если новый эндпоинт не найден (404), пробуем старый метод
      if (response.status === 404) {
        console.log('Новый эндпоинт не найден, используем старый метод');
        return await generateRandomUsers(count);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Generate users with passwords error:', error);
    
    // В случае ошибки пробуем старый метод
    try {
      console.log('Пробуем использовать старый метод генерации...');
      return await generateRandomUsers(count);
    } catch (fallbackError) {
      console.error('Fallback generation also failed:', fallbackError);
      return { 
        success: false, 
        message: "Ошибка генерации пользователей" 
      };
    }
  }
};

// НОВАЯ ФУНКЦИЯ: Хеширование временных паролей
export const hashTempPasswords = async () => {
  try {
    // Отправляем POST запрос на эндпоинт /admin/hash-temp-passwords
    const response = await fetch(`${API_BASE}/admin/hash-temp-passwords`, {
      method: "POST",
    });
    
    if (!response.ok) {
      // Если эндпоинт не найден, возвращаем успех (нет временных паролей)
      if (response.status === 404) {
        console.log('Эндпоинт хеширования не найден, возможно временных паролей нет');
        return { success: true, message: "Хеширование не требуется" };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Hash temp passwords error:', error);
    return { 
      success: false, 
      message: "Ошибка при хешировании паролей" 
    };
  }
};

// НОВАЯ ФУНКЦИЯ: Получение пользователей с временными паролями
export const getTempPasswordUsers = async () => {
  try {
    // Отправляем GET запрос на эндпоинт /admin/temp-password-users
    const response = await fetch(`${API_BASE}/admin/temp-password-users`);
    
    if (!response.ok) {
      // Если эндпоинт не найден, возвращаем пустой список
      if (response.status === 404) {
        console.log('Эндпоинт временных пользователей не найден');
        return { success: true, users: [], count: 0 };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get temp password users error:', error);
    return { 
      success: false, 
      message: "Ошибка получения пользователей с временными паролями" 
    };
  }
};

//Функция для получения категорий (публичная)
export const getCategories = async () => {
  try {
    //Отправляем GET запрос на эндпоинт /categories
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Get categories error:', error);
    return { categories: [] };
  }
};

//Функция для получения категорий (админская версия)
export const getAdminCategories = async () => {
  try {
    //Отправляем GET запрос на админский эндпоинт /admin/categories
    const response = await fetch(`${API_BASE}/admin/categories`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Get admin categories error:', error);
    return { success: false, categories: [] };
  }
};

//Функция для добавления категории (админская)
export const addCategory = async (categoryName) => {
  try {
    //Отправляем POST запрос на эндпоинт /admin/categories
    const response = await fetch(`${API_BASE}/admin/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: categoryName }),//Отправляем название категории
    });
    return await response.json();
  } catch (error) {
    console.error('Add category error:', error);
    return { success: false, message: "Ошибка добавления категории" };
  }
};

//Функция для обновления категории (админская)
export const updateCategory = async (oldName, newName) => {
  try {
    //Отправляем PUT запрос на эндпоинт /admin/categories
    const response = await fetch(`${API_BASE}/admin/categories`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ old_name: oldName, new_name: newName }),//Отправляем старое и новое название
    });
    return await response.json();
  } catch (error) {
    console.error('Update category error:', error);
    return { success: false, message: "Ошибка обновления категории" };
  }
};

//Функция для удаления категории (админская)
export const deleteCategory = async (categoryName) => {
  try {
    //Отправляем DELETE запрос на эндпоинт /admin/categories
    const response = await fetch(`${API_BASE}/admin/categories`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: categoryName }),//Отправляем название категории для удаления
    });
    return await response.json();
  } catch (error) {
    console.error('Delete category error:', error);
    return { success: false, message: "Ошибка удаления категории" };
  }
};

//Функция для проверки здоровья сервера
export const checkServerHealth = async () => {
  try {
    //Отправляем GET запрос на эндпоинт /health
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  } catch (error) {
    console.error('Server health check failed:', error);
    return { status: "error", message: "Server is not responding" };
  }
};

//Функция для удаления пользователя 
export const deleteUser = async (userId) => {
  try {
    //Отправляем DELETE запрос на эндпоинт /admin/users/{id}
    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, message: "Ошибка удаления пользователя" };
  }
};

//Функция для регистрации пользователя 
export const adminRegisterUser = async (username, password, role = "user") => {
  try {
    //Отправляем POST запрос на эндпоинт /admin/register с query параметрами
    const response = await fetch(`${API_BASE}/admin/register?username=${username}&password=${password}&role=${role}`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    console.error('Admin register user error:', error);
    return { success: false, message: "Ошибка регистрации пользователя" };
  }
};

//Функция для поиска идей 
export const searchIdeas = async (query) => {
  try {
    //Отправляем GET запрос на эндпоинт /admin/ideas/search с параметром query
    const response = await fetch(`${API_BASE}/admin/ideas/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Search ideas error:', error);
    return { success: false, ideas: [] };
  }
};

//Функция для удаления комментария 
export const deleteComment = async (ideaId, commentId) => {
  try {
    //Отправляем DELETE запрос на эндпоинт
    const response = await fetch(`${API_BASE}/admin/idea/${ideaId}/comment/${commentId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error('Delete comment error:', error);
    return { success: false, message: "Ошибка удаления комментария" };
  }
};

//Функция для выхода из системы
export const logout = async () => {
  try {
    //Отправляем POST запрос на эндпоинт /logout
    const response = await fetch(`${API_BASE}/logout`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: "Ошибка выхода из системы" };
  }
};