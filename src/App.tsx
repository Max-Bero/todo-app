import './App.css'
import { useState, useEffect } from 'react';


function App (){
  const fetchdatasize = 50;

  interface Task{
    userid: number;
    id: string;
    text: string;
    date: number;
    isDone: boolean;
  }

  const [todos, setTodos] = useState<Task[]>([]);
  const [ogtodos, setogTodos] = useState<Task[]>([]);
  const [taskText, setTaskText] = useState<string>("");
  const [completed, setCompleted] = useState<Task[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [visibleCompletedCount, setVisibleCompletedCount] = useState<number>(5);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState('default');
  const [filterUserId, setFilterUserId] = useState<number>(0);

  const displayedTodos = [...ogtodos]
    .filter(task => {
      if (task.isDone) return false;
      if (filterUserId === 0) return true;
      if (filterUserId === -1) return task.userid === 0;
      return task.userid === filterUserId;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.text.localeCompare(b.text);
      if (sortOrder === 'desc') return b.text.localeCompare(a.text);
      return Number(b.id) - Number(a.id); // Default
  });

  useEffect(() => {
    const getTasks = async () => {
      setIsLoading(true); 
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos');
        const data = await response.json();

        const mappedData: Task[] = data.slice(0, fetchdatasize).map((item: any) => ({
          userid: item.userId,
          id: String(item.id),
          text: item.title,
          date: Date.now(),
          isDone: item.completed 
        }));

        const uncompletedTasks = mappedData.filter(task => !task.isDone);
        const completedTasks = mappedData.filter(task => task.isDone);

        setTodos(uncompletedTasks);
        setCompleted(completedTasks);
        setogTodos(uncompletedTasks);

      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setIsLoading(false); 
      }
    };
    getTasks();
  }, []);

  const handleAddTask = (event: React.SubmitEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if (taskText.trim() === "") return;

    console.log("Adding task:", taskText);

    const maxId = ogtodos.length > 0 
    ? Math.max(...ogtodos.map(t => Number(t.id))) 
    : 0;

    const nextId = String(maxId + 1);
  
    const newTask: Task = {
      userid: 0, //0 for local user adding from the form
      id: nextId,
      text: taskText,
      date: Date.now(),
      isDone: false,
    };

    setTodos([newTask, ...todos]);
    setogTodos(prevOg => [newTask, ...prevOg]);
    setTaskText("");
  }

  const deleteTask = (index:number)=>{
    const taskToDelete = completed[index];
    const newCompleted = completed.filter((_, i)=>i!==index);
    setCompleted(newCompleted);
    setogTodos(ogtodos.filter(t => t.id !== taskToDelete.id));
  }

  const completeTask = (id:string)=>{
    const taskToMove = ogtodos.find(t => t.id === id);

    if (taskToMove) {
      const updatedTask = { 
        ...taskToMove, 
        date: Date.now(), 
        isDone: true 
      };

      setogTodos(prev => prev.map(t => t.id === id ? updatedTask : t));

      setCompleted(prev => [updatedTask, ...prev]);
    }
  }

  const undoComplete = (index:number)=>{
    const taskToUndo = completed[index];
      
      if (taskToUndo) {
        const updatedTask = {
          ...taskToUndo,
          isDone: false, 
          date: Date.now() 
        };

        setogTodos(prev => [...prev, updatedTask]);

        setCompleted(prev => prev.filter((_, i) => i !== index));
      }
    }

  const sortTodos = (type:string) => {
    setSortOrder(type);
  }

  const filterByUser = (user: number) => {  
    setFilterUserId(user);
  }

  const countUsers = () => {
    const userIds = ogtodos.map(task => task.userid);
    const uniqueUserIds = new Set(userIds);
    const numberOfUsers = uniqueUserIds.size;
    return numberOfUsers;
  }

  const sortByDate = (type: string) => {
    let sorted = [...completed];
    if (type === 'newest') {
      sorted.sort((a, b) => b.date - a.date);
    } 
    else if (type === 'oldest') {
      sorted.sort((a, b) => a.date - b.date);
    }

    setCompleted(sorted);
  }

  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <>
    <div className="main-container">
      <header>

        <label  className="switch">
          <input  type="checkbox" onChange={toggleTheme}/>
          <span className="slider round"> </span>
        </label>

        <h1> Todo App</h1>

      </header>

      <main>
        <form className='task-form' onSubmit={handleAddTask}>
          <label htmlFor="task-input">Type task: </label>
          <input 
            id="task-input" 
            type="text" 
            value = {taskText} 
            onChange={(e)=>setTaskText(e.target.value)} 
          />
          <button type="submit">Add</button>
        </form>
  
        <div className='left-right'>
          {isLoading ? (<h1 className='loading-message'>Loading tasks please wait...</h1>) : (
          <>
          <div id='left-side'>
            <h2>Uncompleted tasks: </h2>

            Sort by: 
            <select name='Sort' onChange={(e) => sortTodos(e.target.value)}>
                <option value='default'>Default</option>
                <option value='asc'>Alphabetical (asc.)</option>
                <option value='desc'>Alphabetical (desc.)</option>    
            </select>

            Filter:
            <select name='Filter' onChange={(e) => filterByUser(Number(e.target.value))}>
              <option value={0}>All Users</option>
              <option value={-1}>local</option>
  
              {Array.from({ length: countUsers() }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  User {i + 1}
                </option>
                ))}
            </select>


            <ul id='uncompleted-list'>
              {displayedTodos.length === 0 &&(<div className='no-todo'>No todos</div>)}
              {displayedTodos.slice(0, visibleCount).map((task) => (
              <li key={task.id}>
                <div>
                  <strong>{task.text}</strong>
                  <p style={{ fontSize: '12px'}}>
                    Added: {new Date(task.date).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => completeTask(task.id)}>Done</button>
              </li>
              ))}
            </ul> 

            <div className='show-more'>
            {visibleCount < displayedTodos.length && (
              <button onClick={() => setVisibleCount(prev => prev + 5)}>
                Show More
              </button>
            )}
            </div>

          </div>

          <div id="right-side">
            <h2>Completed tasks: </h2>
            Sort by: 
            <select name='Sort' onChange={(e) => sortByDate(e.target.value)}>
                <option value='newest'>Newest</option>
                <option value='oldest'>Oldest</option>  
            </select>

            <ul id='completed-list'>
              {completed.slice(0, visibleCompletedCount).map((task, index)=>(
                <li key={task.id} >
                  <div>
                    <strong style={{textDecoration: 'line-through'}}>{task.text}</strong>
                    <p style={{fontSize: '12px'}}>
                      Completed: {new Date(task.date).toLocaleString()}
                    </p>
                  </div>

                  <div className='undo-del-buttons'>
                    <button className='undo' onClick={()=>undoComplete(index)}>Undo</button>
                    <button className='del' onClick={()=>setTaskToDelete(index)}>Delete</button>
                  </div>
                  
                </li>
              ))}
            </ul>

            <div className='show-more'>
            {visibleCompletedCount < completed.length && (
              <button onClick={() => setVisibleCompletedCount(prev => prev + 5)}>
                Show More
              </button>
            )}
            </div>
            
          </div>
          </>
          )}
        </div>
      </main>
    </div>


     {taskToDelete !== null && (
      <div className="modal-overlay">
        <div className="confirmation-card">
          <div className="icon-warning">⚠️</div>
          <h3>Are you sure?</h3>
          <p>This action cannot be undone. Do you really want to delete this task?</p>
          
          <div className="modal-buttons">
            <button className="confirm-btn" onClick={() => {
              deleteTask(taskToDelete); 
              setTaskToDelete(null);    
            }}>
              Delete
            </button>
            <button className="cancel-btn" onClick={() => setTaskToDelete(null)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )} 
  </> 
  )
}
export default App;
