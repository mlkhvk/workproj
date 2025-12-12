import { useState } from 'react';
import styles from './LoginForm.module.scss';

//Компонент формы входа в систему
export default function LoginForm({ onSubmit, error }) { // Принимаем error напрямую
  //Состояние для хранения введенного логина
  const [username, setUsername] = useState('');
  //Состояние для хранения введенного пароля
  const [password, setPassword] = useState('');
  //Состояние для отслеживания процесса авторизации
  const [loading, setLoading] = useState(false);

  //Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();//Предотвращаем стандартное поведение формы
    setLoading(true);//Устанавливаем состояние загрузки

    try {
      //Вызываем переданный колбэк с введенными данными
      await onSubmit(username, password);
    } catch (err) {
      // Ошибки теперь обрабатываются в компоненте Login.jsx
      console.error('Login error in form:', err);
    } finally {
      //Сбрасываем состояние загрузки в любом случае
      setLoading(false);
    }
  };

  //Возвращаем разметку компонента
  return (
    <div className={styles.panel}>
      {/*Заголовок формы*/}
      <h2>Вход в систему</h2>
      
      {/*Отображение ошибок авторизации - используем переданную ошибку*/}
      {error && <div className={styles.error}>{error}</div>}

      {/*Форма для ввода учетных данных*/}
      <form onSubmit={handleSubmit}>
        {/*Группа поля ввода логина*/}
        <div className={styles.formGroup}>
          <label htmlFor="username">Имя пользователя</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.formInput}
            placeholder="Введите имя пользователя"
            required
            disabled={loading}/>
        </div>

        {/*Группа поля ввода пароля*/}
        <div className={styles.formGroup}>
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.formInput}
            placeholder="Введите пароль"
            required
            disabled={loading}/>
        </div>

        {/*Кнопка отправки формы*/}
        <button 
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}