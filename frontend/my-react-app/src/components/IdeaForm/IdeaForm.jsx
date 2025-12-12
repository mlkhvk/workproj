import { useState, useEffect } from "react";
import { createIdea, getCategories } from "../../api/api";
import styles from "./IdeaForm.module.scss";

//Компонент формы создания новой идеи
export default function IdeaForm({ onCreated }) {
  //Состояние для отображения/скрытия формы
  const [isOpen, setIsOpen] = useState(false);
  //Состояние для хранения списка категорий
  const [categories, setCategories] = useState([]);
  //Состояние для хранения данных формы
  const [formData, setFormData] = useState({
    title: "",
    short_description: "",
    full_description: "",
    expected_effect: "",
    category: ""
  });

  //Эффект для загрузки категорий при открытии формы
  useEffect(() => {
    const loadCategories = async () => {
      //Запрашиваем категории через API
      const result = await getCategories();
      if (result.categories && result.categories.length > 0) {
        setCategories(result.categories);
        //Устанавливаем первую категорию по умолчанию
        setFormData(prev => ({ ...prev, category: result.categories[0] }));
      }
    };
    
    //Загружаем категории только когда форма открыта
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  //Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    //Получаем данные текущего пользователя из localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    
    //Формируем данные для отправки с добавлением ID автора
    const ideaData = {
      ...formData,
      author_id: user.id
    };

    //Отправляем запрос на создание идеи
    const result = await createIdea(ideaData);
    if (result.success) {
      //Очищаем форму после успешного создания
      setFormData({
        title: "",
        short_description: "",
        full_description: "",
        expected_effect: "",
        category: categories[0] || ""
      });
      //Закрываем модальное окно
      setIsOpen(false);
      //Вызываем колбэк для обновления родительского компонента
      onCreated();
      alert("Идея успешно создана!");
    } else {
      alert(result.message || "Ошибка при создании идеи");
    }
  };

  //Если форма закрыта, показываем кнопку для ее открытия
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={styles.openFormBtn}>
        Предложить новую идею
      </button>
    );
  }

  //Возвращаем разметку модального окна с формой
  return (
    //Оверлей для закрытия формы при клике вне ее
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      {/*Модальное окно с остановкой всплытия события*/}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/*Шапка модального окна с заголовком и кнопкой закрытия*/}
        <div className={styles.modalHeader}>
          <h2>Предложить новую идею</h2>
          <button 
            className={styles.modalClose} 
            onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>
        
        {/*Форма для создания идеи*/}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/*Основное содержимое формы*/}
          <div className={styles.formContent}>
            {/*Поле выбора категории*/}
            <div className={styles.formGroup}>
              <label>Область применения:</label>
              <div className={styles.selectWrapper}>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  className={styles.formSelect}>
                  {/*Генерируем опции из списка категорий*/}
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/*Поле ввода названия идеи*/}
            <div className={styles.formGroup}>
              <label>Название идеи:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Краткое и понятное название"
                required
                className={styles.formInput}/>
            </div>

            {/*Поле ввода подробного описания*/}
            <div className={styles.formGroup}>
              <label>Подробное описание:</label>
              <textarea
                value={formData.full_description}
                onChange={(e) => setFormData({...formData, full_description: e.target.value})}
                placeholder="Опишите вашу идею подробно. Что нужно сделать? Как это будет работать?"
                rows="5"
                required
                className={styles.formTextarea}/>
            </div>

            {/*Поле ввода ожидаемого эффекта*/}
            <div className={styles.formGroup}>
              <label>Ожидаемый эффект:</label>
              <textarea
                value={formData.expected_effect}
                onChange={(e) => setFormData({...formData, expected_effect: e.target.value})}
                placeholder="Какой результат ожидаете от реализации? Какие проблемы решит идея?"
                rows="4"
                required
                className={styles.formTextarea}/>
            </div>
          </div>

          {/*Кнопки действий формы*/}
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>
              Создать идею
            </button>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className={styles.cancelBtn}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}