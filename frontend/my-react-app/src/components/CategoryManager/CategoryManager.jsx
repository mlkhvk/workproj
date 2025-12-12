import { useState, useEffect } from "react";
import { getAdminCategories, addCategory, updateCategory, deleteCategory } from "../../api/api";
import styles from "./CategoryManager.module.scss";

//Компонент управления категориями (областями применения)
export default function CategoryManager() {
  //Состояние для хранения списка категорий
  const [categories, setCategories] = useState([]);
  //Состояние для названия новой категории
  const [newCategoryName, setNewCategoryName] = useState("");
  //Состояние для отслеживания редактируемой категории
  const [editingCategory, setEditingCategory] = useState(null);
  //Состояние для редактируемого названия
  const [editName, setEditName] = useState("");
  //Состояние для отслеживания загрузки
  const [loading, setLoading] = useState(false);
  //Состояние для системных сообщений
  const [message, setMessage] = useState("");

  //Функция загрузки категорий с сервера
  const loadCategories = async () => {
    setLoading(true);
    //Запрашиваем категории через API
    const result = await getAdminCategories();
    if (result.success) {
      //Обновляем состояние категорий
      setCategories(result.categories);
    }
    setLoading(false);
  };

  //Эффект загрузки категорий при монтировании компонента
  useEffect(() => {
    loadCategories();
  }, []);

  //Обработчик добавления новой категории
  const handleAddCategory = async (e) => {
    e.preventDefault();
    //Проверяем что название не пустое
    if (!newCategoryName.trim()) {
      setMessage("Введите название категории");
      return;
    }

    setLoading(true);
    //Отправляем запрос на добавление категории
    const result = await addCategory(newCategoryName.trim());
    if (result.success) {
      //Очищаем поле ввода при успехе
      setNewCategoryName("");
      setMessage(result.message);
      //Перезагружаем список категорий
      await loadCategories();
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  };

  //Функция начала редактирования категории
  const startEdit = (category) => {
    setEditingCategory(category);
    setEditName(category);
  };

  //Функция отмены редактирования
  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName("");
  };

  //Обработчик обновления категории
  const handleUpdateCategory = async (oldName) => {
    //Проверяем что новое название не пустое
    if (!editName.trim()) {
      setMessage("Введите новое название категории");
      return;
    }

    setLoading(true);
    //Отправляем запрос на обновление категории
    const result = await updateCategory(oldName, editName.trim());
    if (result.success) {
      setMessage(result.message);
      //Сбрасываем состояние редактирования
      setEditingCategory(null);
      setEditName("");
      //Перезагружаем список категорий
      await loadCategories();
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  };

  //Обработчик удаления категории
  const handleDeleteCategory = async (categoryName) => {
    //Запрашиваем подтверждение удаления
    if (!window.confirm(`Вы уверены, что хотите удалить категорию "${categoryName}"?`)) {
      return;
    }

    setLoading(true);
    //Отправляем запрос на удаление категории
    const result = await deleteCategory(categoryName);
    if (result.success) {
      setMessage(result.message);
      //Перезагружаем список категорий
      await loadCategories();
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  };

  return (
    <div className={styles.manager}>
      {/*Отображение системных сообщений*/}
      {message && (
        <div className={styles.message}>
          {message}
          <button onClick={() => setMessage("")} className={styles.closeMessage}>×</button>
        </div>
      )}

      {/*Форма добавления новой категории*/}
      <form onSubmit={handleAddCategory} className={styles.addForm}>
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Введите название новой области применения"
          disabled={loading}/>
        <button type="submit" disabled={loading}>
          {loading ? "Добавление" : "Добавить"}
        </button>
      </form>

      {/*Список существующих категорий*/}
      <div className={styles.categoriesList}>
        <h4>Существующие области применения:</h4>
        {loading ? (
          <p>Загрузка...</p>
        ) : categories.length === 0 ? (
          <p>Нет категорий</p>
        ) : (
          <ul>
            {categories.map((category) => (
              <li key={category} className={styles.categoryItem}>
                {/*Режим редактирования*/}
                {editingCategory === category ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={loading}/>
                    <button 
                      onClick={() => handleUpdateCategory(category)}
                      disabled={loading}
                      className={styles.saveBtn}>
                      Сохранить
                    </button>
                    <button 
                      onClick={cancelEdit}
                      disabled={loading}
                      className={styles.cancelBtn}>
                      Отмена
                    </button>
                  </div>
                ) : (
                  /*Режим просмотра*/
                  <div className={styles.categoryContent}>
                    <span className={styles.categoryName}>{category}</span>
                    <div className={styles.actions}>
                      <button 
                        onClick={() => startEdit(category)}
                        className={styles.editBtn}>
                        Редактировать
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category)}
                        className={styles.deleteBtn}>
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}