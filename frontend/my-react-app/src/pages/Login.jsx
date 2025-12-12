import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { login, completeIntroduction, changePassword } from "../api/api";
import LoginForm from "../components/LoginForm/LoginForm";
import IntroductionForm from "../components/IntroductionForm/IntroductionForm";
import PasswordForm from "../components/PasswordForm/PasswordForm";
import styles from "./Login.module.scss";

//Основной компонент страницы авторизации
export default function Login({ onLogin }) {
  //Хук для навигации между страницами
  const navigate = useNavigate();
  //Хук для получения текущего пути
  const location = useLocation();
  //Состояние для отслеживания необходимости представления (ввод ФИО)
  const [needsIntroduction, setNeedsIntroduction] = useState(false);
  //Состояние для отслеживания необходимости смены пароля
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  //Состояние для временного хранения данных пользователя
  const [tempUser, setTempUser] = useState(null);
  //Состояние для хранения ошибок
  const [error, setError] = useState("");
  //Состояние для отображения формы входа
  const [showLoginForm, setShowLoginForm] = useState(true);

  //Обработчик входа в систему
  const handleLogin = async (username, password) => {
    setError("");//Сбрасываем предыдущие ошибки
    try {
      const result = await login(username, password);
      console.log('Login result:', result);
      
      if (result.success) {
        //ВАЖНО: сначала проверяем смену пароля для админа
        if (result.needs_password_change) {
          console.log('Admin needs password change');
          setTempUser(result.user);
          setNeedsPasswordChange(true);
          setShowLoginForm(false);
        } 
        //Затем проверяем представление для обычных пользователей
        else if (result.needs_introduction) {
          console.log('User needs introduction');
          setTempUser(result.user);
          setNeedsIntroduction(true);
          setShowLoginForm(false);
        } 
        //Обычный вход
        else {
          console.log('Regular login successful');
          onLogin(result.user);//Вызываем колбэк с данными пользователя
          
          //Редирект в зависимости от роли
          if (result.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }
      } else {
        setError(result.message || "Неверные учетные данные");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Ошибка подключения к серверу. Проверьте, запущен ли бэкенд на localhost:8000");
    }
  };

  //Обработчик завершения представления (ввод ФИО)
  const handleIntroductionComplete = async (fullName) => {
    try {
      const result = await completeIntroduction(fullName);
      if (result.success) {
        setNeedsIntroduction(false);//Сбрасываем флаг представления
        onLogin(result.user);//Вызываем колбэк с данными пользователя
        
        //Редирект обычного пользователя на главную
        navigate("/");
      } else {
        setError(result.message || "Ошибка при сохранении данных");
      }
    } catch (err) {
      console.error('Introduction error:', err);
      setError(err.message || "Ошибка при сохранении данных");
    }
  };

  //Обработчик смены пароля
  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setNeedsPasswordChange(false);//Сбрасываем флаг смены пароля
        onLogin(result.user);//Вызываем колбэк с данными пользователя
        
        //Редирект админа в админку
        navigate("/admin");
      } else {
        setError(result.message || "Ошибка при смене пароля");
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || "Ошибка при смене пароля");
    }
  };

  //Обработчик отмены смены пароля
  const handleCancelPasswordChange = () => {
    setNeedsPasswordChange(false);
    setTempUser(null);
    setShowLoginForm(true);
    setError("");
  };

  //Обработчик отмены представления
  const handleCancelIntroduction = () => {
    setNeedsIntroduction(false);
    setTempUser(null);
    setShowLoginForm(true);
    setError("");
  };

  //Обработчик возврата к форме входа
  const handleBackToLogin = () => {
    setShowLoginForm(true);
    setNeedsIntroduction(false);
    setNeedsPasswordChange(false);
    setTempUser(null);
    setError("");
  };

  return (
    <div className={styles.container}>
      {/*Отображение соответствующей формы в зависимости от состояния*/}
      {showLoginForm ? (
        <LoginForm 
          onSubmit={handleLogin} 
          error={error}/>
      ) : needsIntroduction ? (
        <IntroductionForm 
          user={tempUser}
          onComplete={handleIntroductionComplete}
          onCancel={handleCancelIntroduction}
          error={error}/>
      ) : (
        <PasswordForm 
          user={tempUser}
          onSubmit={handlePasswordChange}
          onCancel={handleCancelPasswordChange}
          error={error}/>
      )}
    </div>
  );
}