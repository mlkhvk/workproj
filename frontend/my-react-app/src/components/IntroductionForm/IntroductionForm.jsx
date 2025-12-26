import { useState } from 'react';
import styles from './IntroductionForm.module.scss';

//Компонент формы представления пользователя (ввод ФИО)
export default function IntroductionForm({ user, onComplete, onCancel }) {
  //Состояние для хранения введенного ФИО
  const [fullName, setFullName] = useState('');
  //Состояние для отслеживания процесса загрузки/сохранения
  const [loading, setLoading] = useState(false);
  //Состояние для хранения ошибок валидации
  const [error, setError] = useState('');

  //Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();//Предотвращаем стандартное поведение формы
    
    //Валидация: проверяем что поле не пустое
    if (!fullName.trim()) {
      setError('Пожалуйста, введите ваше ФИО');
      return;
    }

    //Сбрасываем предыдущие ошибки
    setError('');
    //Устанавливаем состояние загрузки
    setLoading(true);

    try {
      //Вызываем переданный колбэк для завершения представления
      await onComplete(fullName.trim());
    } catch (err) {
      //Обрабатываем ошибки из колбэка
      setError(err.message);
    } finally {
      //Сбрасываем состояние загрузки в любом случае
      setLoading(false);
    }
  };

  //Возвращаем разметку компонента
  return (
    <div className={styles.panel}>
      {/*Заголовок формы*/}
      <h2>Представьтесь, пожалуйста</h2>
      
      {/*Пояснительный текст*/}
      <p className={styles.introText}>
        Для завершения регистрации укажите ваше ФИО
      </p>

      {/*Отображение ошибок валидации*/}
      {error && <div className={styles.error}>{error}</div>}

      {/*Форма для ввода ФИО*/}
      <form onSubmit={handleSubmit}>
        {/*Группа поля ввода*/}
        <div className={styles.formGroup}>
          <label htmlFor="fullName">ФИО:</label>
          <input
            id="fullName"//ID для связи с label
            type="text"//Тип поля - текст
            value={fullName}//Привязка значения к состоянию
            onChange={(e) => setFullName(e.target.value)}//Обновление состояния при изменении
            className={styles.formInput}//CSS класс для стилизации
            placeholder="Введите ваше полное имя"//Подсказка в поле
            required//Обязательное поле
            disabled={loading}/>
        </div>

        {/*Группа кнопок действий*/}
        <div className={styles.btnGroup}>
          {/*Кнопка отмены*/}
          <button 
            type="button"//Тип кнопки (не submit)
            onClick={onCancel}//Обработчик клика
            className={`${styles.btn} ${styles.btnSecondary}`}//CSS классы
            disabled={loading}>
            Отмена
          </button>
          {/*Кнопка сохранения/продолжения*/}
          <button 
            type="submit" //Тип кнопки (submit для формы)
            className={`${styles.btn} ${styles.btnPrimary}`}//CSS классы
            disabled={loading}>
            {loading ? 'Сохранение..' : 'Продолжить'}
          </button>
        </div>
      </form>
    </div>
  );
}