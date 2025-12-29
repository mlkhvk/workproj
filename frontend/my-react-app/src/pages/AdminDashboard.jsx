import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllUsers,
  blockUser,
  unblockUser,
  approveIdea,
  hideIdea,
  unhideIdea,
  getAdminIdeas,
  getAdminIdeasWithAuthors,
  searchIdeas,
  voteIdea,
  addComment,
  deleteComment,
} from "../api/api";
import AdminPanel from "../components/AdminPanel/AdminPanel";
import CategoryManager from "../components/CategoryManager/CategoryManager";
import IdeaCard from "../components/IdeaCard/IdeaCard";
import styles from "./AdminDashboard.module.scss";

//Основной компонент административной панели
export default function AdminDashboard({ user }) {
  //Хук для навигации между страницами
  const navigate = useNavigate();
  //Состояние для хранения списка пользователей
  const [users, setUsers] = useState([]);
  //Состояние для хранения списка идей
  const [ideas, setIdeas] = useState([]);
  //Состояние для активной вкладки (пользователи/идеи/категории)
  const [activeTab, setActiveTab] = useState("users");
  //Состояние для отслеживания загрузки данных
  const [loading, setLoading] = useState(false);
  //Состояние для хранения ошибок
  const [error, setError] = useState("");
  //Состояние для поискового запроса идей
  const [searchQuery, setSearchQuery] = useState("");
  //Состояние для отслеживания процесса поиска
  const [isSearching, setIsSearching] = useState(false);
  //Состояние для выбранной идеи (для модального окна)
  const [selectedIdea, setSelectedIdea] = useState(null);
  //Состояние для отображения модального окна
  const [showModal, setShowModal] = useState(false);
  //Состояние для текста нового комментария
  const [commentText, setCommentText] = useState("");
  //Состояние для отслеживания отправки комментария
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);

  //Функция обновления списка пользователей
  const refreshUsers = async () => {
    try {
      const res = await getAllUsers();
      if (res.success) {
        setUsers(res.users);
        setError("");
      } else {
        setError(res.message || "Ошибка загрузки пользователей");
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError("Ошибка загрузки пользователей");
      setUsers([]);
    }
  };

  //Функция обновления списка идей с информацией об авторах
  const refreshIdeas = async () => {
    setLoading(true);
    setError("");
    try {
      // Используем новый метод с информацией об авторах
      const result = await getAdminIdeasWithAuthors();
      if (result.success) {
        setIdeas(result.ideas);
        setSearchQuery("");
      } else {
        // Если новый метод не работает, используем старый
        console.log("Новый метод с авторами недоступен, используем старый...");
        const fallbackResult = await getAdminIdeas();
        if (fallbackResult.success) {
          setIdeas(fallbackResult.ideas);
        } else {
          setError(fallbackResult.message || "Ошибка загрузки идей");
          setIdeas([]);
        }
      }
    } catch (error) {
      console.error('Error loading admin ideas:', error);
      setError("Ошибка загрузки идей");
      setIdeas([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  //Обработчик поиска идей
  const handleSearchIdeas = async (query) => {
    if (!query.trim()) {
      await refreshIdeas();
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      const result = await searchIdeas(query);
      if (result.success) {
        // Обогащаем результаты поиска информацией об авторах
        const ideasWithAuthors = result.ideas.map(idea => {
          if (idea.author_id) {
            // Ищем автора в списке пользователей
            const author = users.find(u => u.id === idea.author_id);
            if (author) {
              return {
                ...idea,
                author_info: {
                  id: author.id,
                  username: author.username,
                  full_name: author.full_name || ""
                }
              };
            }
          }
          return idea;
        });
        setIdeas(ideasWithAuthors);
        setSearchQuery(query);
        setError("");
      } else {
        setError(result.message || "Ошибка поиска идей");
        setIdeas([]);
      }
    } catch (error) {
      console.error('Error searching ideas:', error);
      setError("Ошибка поиска идей");
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  //Обработчик клика по карточке идеи
  const handleIdeaClick = (idea) => {
    setSelectedIdea(idea);
    setShowModal(true);
    setCommentText("");
    setIsTitleExpanded(false);
  };

  //Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIdea(null);
    setCommentText("");
    setIsTitleExpanded(false);
  };

  //Обработчик голосования за идею
  const handleVote = async (vote) => {
    if (!selectedIdea) return;
    
    //Проверяем можно ли голосовать за одобренную идею
    if (selectedIdea.is_approved) {
      alert("За принятую идею нельзя голосовать");
      return;
    }

    //Проверяем голосовал ли уже пользователь
    const hasVoted = selectedIdea.voted_users && selectedIdea.voted_users.includes(user.id);
    if (hasVoted) {
      alert("Вы уже проголосовали за эту идею");
      return;
    }

    try {
      const result = await voteIdea(selectedIdea.id, user.id, vote);
      if (result.success) {
        await refreshIdeas();
        const result = await getAdminIdeasWithAuthors();
        if (result.success) {
          const updatedIdea = result.ideas.find(idea => idea.id === selectedIdea.id);
          if (updatedIdea) {
            setSelectedIdea(updatedIdea);
          }
        }
      } else {
        alert(result.message || "Ошибка при голосовании");
      }
    } catch (error) {
      alert("Ошибка при голосовании");
      console.error('Vote error:', error);
    }
  };

  //Обработчик одобрения идеи
  const handleApproveIdea = async (ideaId) => {
    const result = await approveIdea(ideaId);
    if (result.success) {
      await refreshIdeas();
      if (selectedIdea && selectedIdea.id === ideaId) {
        const result = await getAdminIdeasWithAuthors();
        if (result.success) {
          const updatedIdea = result.ideas.find(idea => idea.id === ideaId);
          if (updatedIdea) {
            setSelectedIdea(updatedIdea);
          }
        }
      }
    } else {
      alert(result.message || "Ошибка при одобрении идеи");
    }
  };

  //Обработчик скрытия идеи
  const handleHideIdea = async (ideaId) => {
    const result = await hideIdea(ideaId);
    if (result.success) {
      await refreshIdeas();
      if (selectedIdea && selectedIdea.id === ideaId) {
        const result = await getAdminIdeasWithAuthors();
        if (result.success) {
          const updatedIdea = result.ideas.find(idea => idea.id === ideaId);
          if (updatedIdea) {
            setSelectedIdea(updatedIdea);
          }
        }
      }
    } else {
      alert(result.message || "Ошибка при скрытии идеи");
    }
  };

  //Обработчик показа скрытой идеи
  const handleUnhideIdea = async (ideaId) => {
    const result = await unhideIdea(ideaId);
    if (result.success) {
      await refreshIdeas();
      if (selectedIdea && selectedIdea.id === ideaId) {
        const result = await getAdminIdeasWithAuthors();
        if (result.success) {
          const updatedIdea = result.ideas.find(idea => idea.id === ideaId);
          if (updatedIdea) {
            setSelectedIdea(updatedIdea);
          }
        }
      }
    } else {
      alert(result.message || "Ошибка при показе идеи");
    }
  };

  //Обработчик добавления комментария
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedIdea) return;
    
    setIsSubmittingComment(true);
    try {
      const result = await addComment(selectedIdea.id, user.id, commentText);
      if (result.success) {
        setCommentText("");
        await refreshIdeas();
        const result = await getAdminIdeasWithAuthors();
        if (result.success) {
          const updatedIdea = result.ideas.find(idea => idea.id === selectedIdea.id);
          if (updatedIdea) {
            setSelectedIdea(updatedIdea);
          }
        }
      } else {
        alert("Ошибка при добавлении комментария");
      }
    } catch (error) {
      alert("Ошибка при добавлении комментария");
      console.error('Add comment error:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  //Обработчик удаления комментария
  const handleDeleteComment = async (commentId) => {
    if (!selectedIdea || !window.confirm("Вы уверены, что хотите удалить этот комментарий?")) {
      return;
    }

    try {
      const result = await deleteComment(selectedIdea.id, commentId);
      if (result.success) {
        await refreshIdeas();
        const result = await getAdminIdeasWithAuthors();
        if (result.success) {
          const updatedIdea = result.ideas.find(idea => idea.id === selectedIdea.id);
          if (updatedIdea) {
            setSelectedIdea(updatedIdea);
          }
        }
      } else {
        alert(result.message || "Ошибка при удалении комментария");
      }
    } catch (error) {
      alert("Ошибка при удалении комментария");
      console.error('Delete comment error:', error);
    }
  };

  //Обработчик возврата на главную страницу
  const handleBackToMain = () => {
    navigate("/");
  };

  //Эффект для закрытия модального окна по клавише ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.keyCode === 27 && showModal) {
        handleCloseModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showModal]);

  //Эффект для первоначальной загрузки данных
  useEffect(() => {
    refreshUsers();
    refreshIdeas();
  }, []);

  //Вычисляемые значения для голосования
  const hasVoted = selectedIdea?.voted_users?.includes(user.id);
  const totalRating = (selectedIdea?.votes_for || 0) - (selectedIdea?.votes_against || 0);

  return (
    <div className={styles.dashboard}>
      {/*Шапка административной панели*/}
      <div className={styles.header}>
        <h1>Админ-панель</h1>
        <button 
          onClick={handleBackToMain}
          className={styles.backButton}
          title="Назад">
          Назад
        </button>
      </div>

      {/*Отображение ошибок*/}
      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError("")} className={styles.closeError}>×</button>
        </div>
      )}

      {/*Навигационные вкладки*/}
      <div className={styles.tabs}>
        <button 
          className={activeTab === "users" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("users")}>
          Пользователи
        </button>
        <button 
          className={activeTab === "ideas" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("ideas")}>
          Идеи
        </button>
        <button 
          className={activeTab === "categories" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("categories")}>
          Области применения
        </button>
      </div>

      {/*Контент активной вкладки*/}
      <div className={styles.tabContent}>
        {/*Вкладка управления пользователями*/}
        {activeTab === "users" && (
          <section className={styles.section}>
            <h2>Управление пользователями</h2>
            <AdminPanel
              users={users}
              onBlock={async (id) => {
                await blockUser(id);
                refreshUsers();
              }}
              onUnblock={async (id) => {
                await unblockUser(id);
                refreshUsers();
              }}
              onRefresh={refreshUsers}
              onDelete={refreshUsers}
            />
          </section>
        )}

        {/*Вкладка управления идеями*/}
        {activeTab === "ideas" && (
          <section className={styles.section}>
            <div className={styles.ideasHeader}>
              <h2>Управление идеями</h2>
            </div>
            
            {/* Поисковая строка */}
            <div className={styles.ideasSearch}>
              <input
                type="text"
                placeholder="Поиск по названию идеи"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchIdeas(searchQuery)}
                className={styles.searchInput}
                maxLength={50}
              />
              <button 
                onClick={() => handleSearchIdeas(searchQuery)}
                disabled={loading}
                className={styles.searchButton}>
                Найти
              </button>
              {searchQuery && (
                <button 
                  onClick={refreshIdeas}
                  className={styles.clearSearchButton}
                  title="Очистить поиск">
                  ✕
                </button>
              )}
            </div>

            {/*Информация о поиске*/}
            {searchQuery && (
              <div className={styles.searchInfo}>
                <p>
                  {isSearching ? 'Поиск' : `Найдено идей: ${ideas.length}`}
                  {searchQuery && ` по названию: "${searchQuery}"`}
                </p>
                <button 
                  onClick={refreshIdeas}
                  className={styles.clearSearchLink}>
                  Показать все идеи
                </button>
              </div>
            )}

            {/*Состояние загрузки*/}
            {loading ? (
              <div className={styles.loading}>Загрузка идей...</div>
            ) : ideas.length === 0 ? (
              <div className={styles.noIdeas}>
                {searchQuery ? (
                  <>
                    <p>Идеи с названием содержащим "{searchQuery}" не найдены</p>
                    <p>Попробуйте изменить поисковый запрос</p>
                  </>
                ) : (
                  <p>Нет идей для отображения</p>
                )}
              </div>
            ) : (
              /*Сетка карточек идей*/
              <div className={styles.ideasGrid}>
                {ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    showAdminActions={true}
                    showAuthorInfo={true} // Показываем информацию об авторе для админа
                    onApprove={handleApproveIdea}
                    onHide={handleHideIdea}
                    onUnhide={handleUnhideIdea}
                    searchQuery={searchQuery}
                    onIdeaClick={handleIdeaClick}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/*Вкладка управления категориями*/}
        {activeTab === "categories" && (
          <div className={styles.categoriesTab}>
            <CategoryManager />
          </div>
        )}
      </div>

      {/*Модальное окно для детальной информации об идее*/}
      {showModal && selectedIdea && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/*Фиксированный заголовок модального окна*/}
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <h2 
                  className={`${styles.headerTitle} ${isTitleExpanded ? styles.expanded : styles.collapsed}`}
                  onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                >
                  {selectedIdea.title || 'Без названия'}
                </h2>
                {/* Кнопка "раскрыть/свернуть" (опционально) */}
                {selectedIdea.title && selectedIdea.title.length > 100 && (
                  <button 
                    className={styles.expandTitleBtn}
                    onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                    aria-label={isTitleExpanded ? "Свернуть заголовок" : "Раскрыть заголовок"}
                  >
                    {isTitleExpanded ? 'Свернуть ▲' : 'Раскрыть ▼'}
                  </button>
                )}
              </div>
              <button className={styles.modalClose} onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className={styles.modalContent}>
              {/*Информация об авторе (ТОЛЬКО ДЛЯ АДМИНА)*/}
              {selectedIdea.author_info && (
                <div className={styles.authorSection}>
                  <h3>Информация об авторе</h3>
                  <div className={styles.authorDetails}>
                    <div className={styles.authorDetail}>
                      <strong>ФИО:</strong> 
                      <span className={styles.authorValue}>
                        {selectedIdea.author_info.full_name || 'Не указано'}
                      </span>
                    </div>
                    <div className={styles.authorDetail}>
                      <strong>Логин:</strong> 
                      <span className={styles.authorValue}>
                        {selectedIdea.author_info.username || 'Не указан'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/*Секция подробного описания*/}
              <div className={styles.modalSection}>
                <h3>Подробное описание</h3>
                <p>{selectedIdea.full_description || 'Подробное описание отсутствует'}</p>
              </div>

              {/*Секция ожидаемого эффекта*/}
              <div className={styles.modalSection}>
                <h3>Ожидаемый эффект</h3>
                <p>{selectedIdea.expected_effect || 'Ожидаемый эффект не указан'}</p>
              </div>

              {/*Секция голосования*/}
              <div className={styles.votingSection}>
                <h3>Голосование</h3>
                <div className={styles.voteButtons}>
                  <button 
                    onClick={() => handleVote("for")}
                    disabled={hasVoted || selectedIdea.is_approved}
                    className={`${styles.voteBtn} ${styles.voteFor} ${hasVoted ? styles.voted : ''}`}>
                    За ({selectedIdea.votes_for || 0})
                  </button>
                  <button 
                    onClick={() => handleVote("against")}
                    disabled={hasVoted || selectedIdea.is_approved}
                    className={`${styles.voteBtn} ${styles.voteAgainst} ${hasVoted ? styles.voted : ''}`}>
                    Против ({selectedIdea.votes_against || 0})
                  </button>
                </div>
                <div className={styles.votingInfo}>
                  <div className={styles.rating}>Общий рейтинг: {totalRating}</div>
                  {hasVoted && <p className={styles.voteNotice}>Вы уже проголосовали за эту идею</p>}
                  {selectedIdea.is_approved && <p className={styles.voteNotice}>Голосование завершено</p>}
                </div>
              </div>

              {/*Мета-информация об идее*/}
              <div className={styles.modalMeta}>
                <div className={styles.metaItem}>
                  <strong>Категория:</strong> <div className={styles.colorItem}>{selectedIdea.category || 'Не указана'} </div>
                </div>
                <div className={styles.metaItem}>
                  <strong>Дата создания:</strong> <div className={styles.colorItem}> {selectedIdea.created_at ? new Date(selectedIdea.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'} </div>
                </div>
                <div className={styles.metaItem}>
                  <strong>Статус:</strong> 
                  <div className={styles.colorItem}>
                    {selectedIdea.is_approved ? ' Одобрена' : ' На рассмотрении'}
                    {selectedIdea.is_hidden && ' Скрыта'}
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <strong>ID идеи:</strong> 
                  <div className={styles.colorItem}> #{selectedIdea.id} </div>
                </div>
              </div>

              {/*Статистика идеи*/}
              <div className={styles.modalStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{selectedIdea.votes_for || 0}</span>
                  <span className={styles.statLabel}>За</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}> {selectedIdea.votes_against || 0}</span>
                  <span className={styles.statLabel}>Против</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {((selectedIdea.votes_for || 0) - (selectedIdea.votes_against || 0))}
                  </span>
                  <span className={styles.statLabel}>Рейтинг</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}> {Array.isArray(selectedIdea.comments) ? selectedIdea.comments.length : 0}</span>
                  <span className={styles.statLabel}>Комментарии</span>
                </div>
              </div>

              {/*Секция комментариев*/}
              <div className={styles.commentsSection}>
                <h3>Комментарии ({Array.isArray(selectedIdea.comments) ? selectedIdea.comments.length : 0})</h3>
                
                {Array.isArray(selectedIdea.comments) && selectedIdea.comments.length > 0 ? (
                  <div className={styles.commentsList}>
                    {selectedIdea.comments.map((comment) => (
                      <div key={`comment-${comment.id}-${selectedIdea.id}`} className={styles.comment}>
                        <div className={styles.commentMeta}>
                          <div>
                            <span className={styles.commentAuthor}>Пользователь #{comment.user_id}</span>
                            <span className={styles.commentDate}>
                              {comment.created_at ? new Date(comment.created_at).toLocaleDateString('ru-RU') : ''}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className={styles.deleteCommentBtn}
                            title="Удалить комментарий">
                            Удалить
                          </button>
                        </div>
                        <p className={styles.commentText}>{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noComments}>Пока нет комментариев</p>
                )}

                {/*Форма добавления комментария*/}
                <div className={styles.addComment}>
                  <h4>Добавить комментарий</h4>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Оставьте ваш комментарий.."
                    rows="3"
                    className={styles.commentTextarea}/>
                  <button 
                    onClick={handleAddComment} 
                    disabled={!commentText.trim() || isSubmittingComment}
                    className={styles.commentSubmitBtn}>
                    {isSubmittingComment ? 'Отправка..' : 'Отправить комментарий'}
                  </button>
                </div>
              </div>

              {/*Секция административных действий в модальном окне*/}
              <div className={styles.adminActionsModal}>
                <h3>Административные действия</h3>
                <div className={styles.adminActionButtons}>
                  {!selectedIdea.is_approved && (
                    <button 
                      onClick={() => handleApproveIdea(selectedIdea.id)}
                      className={styles.approveBtn}>
                      Одобрить идею
                    </button>
                  )}
                  {!selectedIdea.is_hidden ? (
                    <button 
                      onClick={() => handleHideIdea(selectedIdea.id)}
                      className={styles.hideBtn}>
                      Скрыть идею
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnhideIdea(selectedIdea.id)}
                      className={styles.showBtn}>
                      Показать идею
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}