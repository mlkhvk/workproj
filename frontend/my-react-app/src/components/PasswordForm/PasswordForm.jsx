import { useState } from "react";
import styles from "./PasswordForm.module.scss";

//Компонент формы смены пароля администратора
export default function ChangePasswordForm({ user, onSubmit, onCancel }) {
  //Состояние для хранения данных формы
  const [formData, setFormData] = useState({
    currentPassword: "",//Текущий пароль
    newPassword: "",//Новый пароль
    confirmPassword: ""//Подтверждение нового пароля
  });
  //Состояние для хранения ошибок валидации
  const [error, setError] = useState("");
  //Состояние для отслеживания процесса смены пароля
  const [loading, setLoading] = useState(false);

  //Обработчик изменения значений полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;//Получаем имя поля и его значение
    setFormData(prev => ({
      ...prev,//Сохраняем предыдущие значения
      [name]: value//Обновляем конкретное поле
    }));
    //Очищаем ошибку при изменении любого поля
    if (error) setError("");
  };

  //Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();//Предотвращаем стандартное поведение формы
    setError("");//Сбрасываем предыдущие ошибки

    //Валидация полей формы
    if (!formData.currentPassword) {
      setError("Введите текущий пароль");
      return;
    }

    if (!formData.newPassword) {
      setError("Введите новый пароль");
      return;
    }

    //Проверка минимальной длины нового пароля
    if (formData.newPassword.length < 4) {
      setError("Новый пароль должен содержать минимум 4 символа");
      return;
    }

    //Проверка совпадения нового пароля и его подтверждения
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Новые пароли не совпадают");
      return;
    }

    //Устанавливаем состояние загрузки
    setLoading(true);
    try {
      //Вызываем переданный колбэк с данными формы
      await onSubmit(formData.currentPassword, formData.newPassword);
    } catch (err) {
      //Обрабатываем ошибки из колбэка
      setError(err.message || "Ошибка при смене пароля");
    } finally {
      //Сбрасываем состояние загрузки в любом случае
      setLoading(false);
    }
  };

  //Возвращаем разметку компонента
  return (
    <div className={styles.container}>
      {/*Шапка формы с заголовком и описанием*/}
      <div className={styles.header}>
        <h2>Смена пароля администратора</h2>
        <p className={styles.subtitle}>
          Для пользователя <strong>{user?.username}</strong>
        </p>
        <p className={styles.description}>
          При первом входе в систему администратор должен сменить пароль
        </p>
      </div>

      {/*Форма смены пароля*/}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/*Отображение ошибок валидации*/}
        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {/*Поле для ввода текущего пароля*/}
        <div className={styles.field}>
          <label htmlFor="currentPassword">Текущий пароль *</label>
          <input
            type="password"//Тип поля 
            id="currentPassword"//ID для связи с label
            name="currentPassword"//Имя поля для обработчика
            value={formData.currentPassword}//Привязка значения к состоянию
            onChange={handleChange}//Обработчик изменения
            disabled={loading}//Блокировка при загрузке
            placeholder="Введите текущий пароль"//Подсказка в поле
            className={styles.colorPassword}
            required/>
          <div className={styles.help}>
            Пароль, который вы получили при инициализации системы
          </div>
        </div>

        {/*Поле для ввода нового пароля*/}
        <div className={styles.field}>
          <label htmlFor="newPassword">Новый пароль *</label>
          <input
            type="password"//Тип поля 
            id="newPassword"//ID для связи с label
            name="newPassword"//Имя поля для обработчика
            value={formData.newPassword}//Привязка значения к состоянию
            onChange={handleChange}//Обработчик изменения
            disabled={loading}//Блокировка при загрузке
            placeholder="Введите новый пароль"//Подсказка в поле
            className={styles.colorPassword}
            required/>
          <div className={styles.help}>
            Минимум 4 символа
          </div>
        </div>

        {/*Поле для подтверждения нового пароля*/}
        <div className={styles.field}>
          <label htmlFor="confirmPassword">Подтверждение нового пароля *</label>
          <input
            type="password"//Тип поля 
            id="confirmPassword"//ID для связи с label
            name="confirmPassword"//Имя поля для обработчика
            value={formData.confirmPassword}//Привязка значения к состоянию
            onChange={handleChange}//Обработчик изменения
            disabled={loading}//Блокировка при загрузке
            placeholder="Повторите новый пароль"//Подсказка в поле
            className={styles.colorPassword}
            required/>
        </div>

        {/*Группа кнопок действий*/}
        <div className={styles.buttons}>
          {/*Кнопка смены пароля*/}
          <button
            type="submit"//Тип кнопки submit
            className={styles.submitButton}//CSS класс для стилизации
            disabled={loading}>
            {loading ? "Смена пароля.." : "Сменить пароль"}
          </button>
          
          {/*Кнопка отмены (отображается если передан onCancel)*/}
          {onCancel && (
            <button
              type="button"//Тип кнопки button 
              className={styles.cancelButton}//CSS класс для стилизации
              onClick={onCancel}//Обработчик клика
              disabled={loading}>
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
}