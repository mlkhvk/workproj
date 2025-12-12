import { useState, useEffect } from "react";
import { 
  generateRandomUsers, 
  getAllUsers, 
  blockUser, 
  unblockUser,
  deleteUser,
  generateUsersWithPasswords,  // НОВЫЙ API
  hashTempPasswords            // НОВЫЙ API
} from "../../api/api";
import styles from './AdminPanel.module.scss';
import PasswordModal from "../PasswordModal/PasswordModal"; // НОВЫЙ КОМПОНЕНТ

export default function AdminPanel({ users, onBlock, onUnblock, onDelete }) {
  const [userCount, setUserCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // НОВЫЕ СОСТОЯНИЯ ДЛЯ МОДАЛЬНОГО ОКНА
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedUsers, setGeneratedUsers] = useState([]);
  const [isHashing, setIsHashing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        setAllUsers(result.users);
      } else {
        console.error('Failed to load users:', result.message);
        setAllUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // НОВЫЙ МЕТОД: Генерация пользователей с показом паролей
  const handleGenerateUsersWithPasswords = async () => {
    if (userCount < 1 || userCount > 100) {
      alert("Количество пользователей должно быть от 1 до 100");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Используем новый API метод
      const result = await generateUsersWithPasswords(userCount);
      if (result.success && result.users) {
        // Сохраняем пользователей с паролями
        setGeneratedUsers(result.users);
        // Показываем модальное окно
        setShowPasswordModal(true);
      } else {
        // Если новый метод не работает, используем старый
        console.log("Новый метод не доступен, используем старый...");
        await handleGenerateUsersLegacy();
      }
    } catch (error) {
      console.error('Generate users with passwords error:', error);
      // При ошибке используем старый метод
      await handleGenerateUsersLegacy();
    } finally {
      setIsGenerating(false);
    }
  };

  // СТАРЫЙ МЕТОД: Для совместимости
  const handleGenerateUsersLegacy = async () => {
    try {
      const result = await generateRandomUsers(userCount);
      if (result.success) {
        alert(`Создано ${result.total_created} пользователей`);
        await loadUsers();
        if (onDelete) onDelete();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Ошибка при генерации пользователей");
      console.error('Generate users error:', error);
    }
  };

  // НОВЫЙ МЕТОД: Хеширование паролей после закрытия модального окна
  const handleHashPasswords = async () => {
    setIsHashing(true);
    try {
      const result = await hashTempPasswords();
      if (result.success) {
        // Обновляем список пользователей
        await loadUsers();
        // Очищаем состояние
        setGeneratedUsers([]);
        // Закрываем модальное окно
        setShowPasswordModal(false);
        
        // Показываем сообщение
        if (result.hashed_count > 0) {
          alert(`Пароли успешно сохранены и захешированы (${result.hashed_count} пользователей)`);
        }
      } else {
        alert(result.message || "Ошибка при сохранении паролей");
      }
    } catch (error) {
      console.error('Hash passwords error:', error);
      alert("Ошибка при сохранении паролей");
    } finally {
      setIsHashing(false);
    }
  };

  // Обработчики блокировки/разблокировки/удаления (остаются без изменений)
  const handleBlockUser = async (userId) => {
    try {
      const result = await blockUser(userId);
      if (result.success) {
        await loadUsers();
        if (onBlock) onBlock(userId);
      } else {
        alert(result.message || "Ошибка блокировки пользователя");
      }
    } catch (error) {
      alert("Ошибка при блокировке пользователя");
      console.error('Block user error:', error);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const result = await unblockUser(userId);
      if (result.success) {
        await loadUsers();
        if (onUnblock) onUnblock(userId);
      } else {
        alert(result.message || "Ошибка разблокировки пользователя");
      }
    } catch (error) {
      alert("Ошибка при разблокировке пользователя");
      console.error('Unblock user error:', error);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя "${username}"? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      const result = await deleteUser(userId);
      if (result.success) {
        alert(`Пользователь "${username}" успешно удален`);
        await loadUsers();
        if (onDelete) onDelete(userId);
      } else {
        alert(result.message || "Ошибка удаления пользователя");
      }
    } catch (error) {
      alert("Ошибка при удалении пользователя");
      console.error('Delete user error:', error);
    }
  };

  const getFilteredUsers = (usersList) => {
    if (!searchTerm.trim()) return usersList;
    
    return usersList.filter(user => {
      const fullName = user.full_name || '';
      return fullName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const getDisplayUsers = () => {
    const baseUsers = users && users.length > 0 ? users : allUsers;
    return getFilteredUsers(baseUsers);
  };

  const displayUsers = getDisplayUsers();

  return (
    <div className={styles.panel}>
      {/* Секция генерации тестовых пользователей */}
      <div className={styles.userGeneration}>
        <div className={styles.generationControls}>
          <div className={styles.countControl}>
            <label htmlFor="userCount">Количество пользователей:</label>
            <input
              id="userCount"
              type="number"
              min="1"
              max="100"
              value={userCount}
              onChange={(e) => setUserCount(parseInt(e.target.value) || 1)}
              className={styles.countInput}/>
          </div>
          <button 
            onClick={handleGenerateUsersWithPasswords}  // ИЗМЕНЕН ОБРАБОТЧИК
            disabled={isGenerating}
            className={styles.generateBtn}
            type="button">
            {isGenerating ? 'Создание...' : `Создать ${userCount} пользователей`}
          </button>
        </div>
        <p className={styles.generationHint}>
          Будут созданы случайные пользователи. Пароли будут показаны в модальном окне перед сохранением.
        </p>
      </div>

      {/* Остальной код без изменений */}
      <div className={styles.searchSection}>
        <h4>Поиск пользователей</h4>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск по фамилии..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className={styles.clearSearchBtn}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
        <p className={styles.searchHint}>
          {searchTerm ? `Найдено пользователей: ${displayUsers.length}` : 'Введите фамилию для поиска'}
        </p>
      </div>

      <div className={styles.usersSection}>
        <h4>
          Список пользователей 
          {searchTerm ? ` (найдено ${displayUsers.length})` : ` (${displayUsers.length})`}
        </h4>
        
        {loading ? (
          <div className={styles.loading}>Загрузка пользователей...</div>
        ) : (
          <div className={styles.usersList}>
            {displayUsers.length === 0 ? (
              <div className={searchTerm ? styles.searchNoResults : styles.noUsers}>
                {searchTerm ? (
                  <>
                    <h4>Пользователи по запросу "{searchTerm}" не найдены</h4>
                    <p>Попробуйте изменить поисковый запрос или очистить поиск</p>
                    <button 
                      onClick={() => setSearchTerm("")}
                      className={styles.clearSearchButton}>
                      Очистить поиск
                    </button>
                  </>
                ) : (
                  <>
                    <p>Пользователей нет</p>
                    <p>Используйте форму выше для генерации тестовых пользователей</p>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Имя пользователя</th>
                      <th>ФИО</th>
                      <th>Представился</th>
                      <th>Роль</th>
                      <th>Статус</th>
                      <th>Дата регистрации</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayUsers.map(user => (
                      <tr key={user.id} className={!user.is_active ? styles.blockedUser : ''}>
                        <td className={styles.userId}>{user.id}</td>
                        <td className={styles.username}>{user.username}</td>
                        <td className={styles.fullName}>
                          {searchTerm && user.full_name ? (
                            <span 
                              dangerouslySetInnerHTML={{
                                __html: user.full_name.replace(
                                  new RegExp(`(${searchTerm})`, 'gi'),
                                  '<mark class="' + styles.highlight + '">$1</mark>'
                                )
                              }}/>
                          ) : (
                            user.full_name || 'Не указано'
                          )}
                        </td>
                        <td className={styles.introductionStatus}>
                          <span className={user.has_completed_introduction ? styles.completed : styles.pending}>
                            {user.has_completed_introduction ? 'Да' : 'Нет'}
                          </span>
                        </td>
                        <td className={styles.role}>
                          <span className={user.role === 'admin' ? styles.adminRole : styles.userRole}>
                            {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                          </span>
                        </td>
                        <td className={styles.status}>
                          <span className={user.is_active ? styles.active : styles.blocked}>
                            {user.is_active ? 'Активен' : 'Заблокирован'}
                          </span>
                        </td>
                        <td className={styles.registrationDate}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
                        </td>
                        <td className={styles.actions}>
                          {user.role !== 'admin' ? (
                            <div className={styles.actionButtons}>
                              {user.is_active ? (
                                <button 
                                  onClick={() => handleBlockUser(user.id)}
                                  className={styles.blockBtn}
                                  title="Заблокировать пользователя"
                                  type="button">
                                  Блокировка
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUnblockUser(user.id)}
                                  className={styles.unblockBtn}
                                  title="Разблокировать пользователя"
                                  type="button">
                                  Разблокировка
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className={styles.deleteBtn}
                                title="Удалить пользователя"
                                type="button">
                                Удалить
                              </button>
                            </div>
                          ) : (
                            <span className={styles.noActions}>Действия недоступны</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {!loading && allUsers.length > 0 && (
        <div className={styles.stats}>
          <h4>Статистика</h4>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{allUsers.length}</span>
              <span className={styles.statLabel}>Всего пользователей</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {allUsers.filter(u => u.role === 'admin').length}
              </span>
              <span className={styles.statLabel}>Администраторов</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {allUsers.filter(u => u.is_active).length}
              </span>
              <span className={styles.statLabel}>Активных</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {allUsers.filter(u => u.has_completed_introduction).length}
              </span>
              <span className={styles.statLabel}>Представились</span>
            </div>
            {searchTerm && (
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{displayUsers.length}</span>
                <span className={styles.statLabel}>Найдено по запросу</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно с паролями */}
      {showPasswordModal && generatedUsers.length > 0 && (
        <PasswordModal 
          users={generatedUsers}
          onClose={() => {
            setShowPasswordModal(false);
            // Если модальное окно закрыто без сохранения, спрашиваем
            if (generatedUsers.length > 0 && !isHashing) {
              if (window.confirm("Пароли не сохранены. Хотите сохранить и захешировать пароли?")) {
                handleHashPasswords();
              } else {
                setGeneratedUsers([]);
              }
            }
          }}
          onSave={handleHashPasswords}
          isSaving={isHashing}
        />
      )}
    </div>
  );
}