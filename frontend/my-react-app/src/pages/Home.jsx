import { useEffect, useState } from "react";
import { getIdeas, voteIdea, addComment, getCategories, deleteComment } from "../api/api";
import IdeaCard from "../components/IdeaCard/IdeaCard";
import IdeaForm from "../components/IdeaForm/IdeaForm";
import styles from "./Home.module.scss";

//Главный компонент домашней страницы (список идей)
export default function Home({ user }) {
  //Состояние для хранения списка идей
  const [ideas, setIdeas] = useState([]);
  //Состояние для хранения списка категорий
  const [categories, setCategories] = useState(["all"]);//Начинаем с "all"
  //Состояние для фильтра сортировки (open/approved/popular/new)
  const [filter, setFilter] = useState("open");
  //Состояние для выбранной категории фильтрации
  const [category, setCategory] = useState("all");
  //Состояние для выбранной идеи (для модального окна)
  const [selectedIdea, setSelectedIdea] = useState(null);
  //Состояние для отображения модального окна
  const [showModal, setShowModal] = useState(false);
  //Состояние для текста нового комментария
  const [commentText, setCommentText] = useState("");
  //Состояние для отслеживания отправки комментария
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  //Состояние для отслеживания загрузки категорий
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);

  //Эффект для загрузки категорий при монтировании компонента
  useEffect(() => {
    loadCategories();
  }, []);

  //Функция загрузки категорий с сервера
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const result = await getCategories();
      if (result.categories && Array.isArray(result.categories)) {
        //Добавляем "all" в начало списка категорий
        setCategories(["all", ...result.categories]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      //В случае ошибки используем дефолтные категории
      setCategories(["all", "IT", "Документооборот", "Производство", "HR"]);
    } finally {
      setLoadingCategories(false);
    }
  };

  //Функция обновления списка идей
  const refresh = async () => {
    const data = await getIdeas(filter);
    setIdeas(data);
  };

  //Эффект для обновления идей при изменении фильтра
  useEffect(() => {
    refresh();
  }, [filter]);

  //Функция для сортировки идей по популярности
  const getPopularIdeas = () => {
    return [...ideas].sort((a, b) => {
      const ratingA = (a.votes_for || 0) - (a.votes_against || 0);
      const ratingB = (b.votes_for || 0) - (b.votes_against || 0);
      return ratingB - ratingA;
    });
  };

  // В функции handleOpenModal сбросьте состояние
const handleOpenModal = (idea) => {
  setSelectedIdea(idea);
  setIsModalOpen(true);
  setIsTitleExpanded(false); // Сбрасываем при открытии новой идеи
};
  //Функция фильтрации идей в зависимости от выбранного фильтра
  const filteredIdeas = (() => {
    let filtered = category === "all" 
      ? ideas 
      : ideas.filter(idea => idea.category === category);

    //Применяем дополнительную сортировку в зависимости от фильтра
    if (filter === "popular") {
      return getPopularIdeas().filter(idea => 
        category === "all" ? true : idea.category === category
      );
    } else if (filter === "new") {
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filter === "approved") {
      return filtered.filter(idea => idea.is_approved);
    } else { //open (открытые)
      return filtered.filter(idea => !idea.is_approved);
    }
  })();

  //Обработчик клика по карточке идеи
  const handleIdeaClick = (idea) => {
    setSelectedIdea(idea);
    setShowModal(true);
    setCommentText("");
  };

  //Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIdea(null);
    setCommentText("");
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
        await refresh();
        const updatedIdeas = await getIdeas(filter);
        const updatedIdea = updatedIdeas.find(idea => idea.id === selectedIdea.id);
        if (updatedIdea) {
          setSelectedIdea(updatedIdea);
        }
      } else {
        alert(result.message || "Ошибка при голосовании");
      }
    } catch (error) {
      alert("Ошибка при голосовании");
      console.error('Vote error:', error);
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
        await refresh();
        const updatedIdeas = await getIdeas(filter);
        const updatedIdea = updatedIdeas.find(idea => idea.id === selectedIdea.id);
        if (updatedIdea) {
          setSelectedIdea(updatedIdea);
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
        await refresh();
        const updatedIdeas = await getIdeas(filter);
        const updatedIdea = updatedIdeas.find(idea => idea.id === selectedIdea.id);
        if (updatedIdea) {
          setSelectedIdea(updatedIdea);
        }
      } else {
        alert(result.message || "Ошибка при удалении комментария");
      }
    } catch (error) {
      alert("Ошибка при удалении комментария");
      console.error('Delete comment error:', error);
    }
  };

  //Вычисляемые значения для голосования
  const hasVoted = selectedIdea?.voted_users?.includes(user.id);
  const totalRating = (selectedIdea?.votes_for || 0) - (selectedIdea?.votes_against || 0);

  //Обработчик нажатия клавиши ESC для закрытия модального окна
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showModal]);

  return (
    <div className={styles.container}>
      {/*Контейнер кнопки предложения новой идеи*/}
      <div className={styles.proposeButtonContainer}>
        <IdeaForm 
          onCreated={refresh} 
          categories={categories.filter(c => c !== "all")} />
      </div>

      {/*Секция фильтров*/}
      <div className={styles.filters}>
        <div className={styles.filterButtons}>
          <button
            className={filter === "open" ? styles.active : ""}
            onClick={() => setFilter("open")}>
            Открытые
          </button>
          <button
            className={filter === "approved" ? styles.active : ""}
            onClick={() => setFilter("approved")}>
            Принятые
          </button>
          <button
            className={filter === "popular" ? styles.active : ""}
            onClick={() => setFilter("popular")}>
            Самые популярные
          </button>
          <button
            className={filter === "new" ? styles.active : ""}
            onClick={() => setFilter("new")}>
            Сначала новые
          </button>
        </div>

        {/*Фильтр по категориям*/}
        <div className={styles.categoryFilter}>
          <label>Область применения:</label>
          <div className={styles.categorySelect}>
            <div className={styles.selectWrapper}>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                disabled={loadingCategories}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "Все области" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loadingCategories && (
            <span className={styles.loadingText}>Загрузка категорий...</span>
          )}
        </div>
      </div>

      {/*Сетка карточек идей*/}
      <div className={styles.grid}>
        {filteredIdeas.length === 0 ? (
          <p className={styles.noIdeas}>
            {filter === "popular" 
              ? "Пока нет популярных идей." 
              : "Пока нет идей."
            }
          </p>
        ) : (
          filteredIdeas.map((idea) => (
            <IdeaCard 
              key={idea.id} 
              idea={idea} 
              onIdeaClick={() => handleIdeaClick(idea)}
            />
          ))
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
                    {isTitleExpanded ? 'Свернуть' : 'Раскрыть'}
                  </button>
                )}
              </div>
              <button className={styles.modalClose} onClick={handleCloseModal}>✕</button>
            </div>
            
            {/*Прокручиваемый контент модального окна*/}
            <div className={styles.modalContent}>

              {/*Секция подробного описания*/}
              <div className={styles.modalSection}>
                <h3>Подробное описание</h3>
                <p>{selectedIdea.full_description || 'Подробное описание отсутствует'}</p>
              </div>

              {/*Секция ожидаемого эффект*/}
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
                      <div key={comment.id} className={styles.comment}>
                        <div className={styles.commentMeta}>
                          <div>
                            <span className={styles.commentAuthor}>Пользователь #{comment.user_id}</span>
                            <span className={styles.commentDate}>
                              {comment.created_at ? new Date(comment.created_at).toLocaleDateString('ru-RU') : ''}
                            </span>
                          </div>
                          {user.role === "admin" && (
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className={styles.deleteCommentBtn}
                              title="Удалить комментарий">
                              Удалить
                            </button>
                          )}
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
                    placeholder="Оставьте ваш комментарий..."
                    rows="3"
                    className={styles.commentTextarea}/>
                  <button 
                    onClick={handleAddComment} 
                    disabled={!commentText.trim() || isSubmittingComment}
                    className={styles.commentSubmitBtn}>
                    {isSubmittingComment ? 'Отправка...' : 'Отправить комментарий'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}