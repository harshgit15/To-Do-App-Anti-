// State Management
let todos = [];
const THEME_KEY = 'todo-app-theme';
const TODOS_KEY = 'todo-app-todos';

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');
const pendingCount = document.getElementById('pending-count');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadTodos();
    renderTodos();
    
    // Event Listeners
    themeToggleBtn.addEventListener('click', toggleTheme);
    todoForm.addEventListener('submit', handleAddTodo);
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
}

// Data Management
function loadTodos() {
    const savedTodos = localStorage.getItem(TODOS_KEY);
    todos = savedTodos ? JSON.parse(savedTodos) : [];
}

function saveTodos() {
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
    updateStats();
}

// Stats Calculator
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;

    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;

    // Toggle Empty State
    if (total === 0) {
        emptyState.style.display = 'flex';
        emptyState.style.opacity = '1';
    } else {
        emptyState.style.display = 'none';
        emptyState.style.opacity = '0';
    }
}

// Add Todo Handler
function handleAddTodo(e) {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        isEditing: false
    };

    todos.push(newTodo);
    saveTodos();
    renderTodos();
    todoInput.value = '';
    todoInput.focus();
}

// Delete Todo with Animation
function handleDeleteTodo(id) {
    const itemElement = document.querySelector(`[data-id="${id}"]`);
    if (itemElement) {
        itemElement.classList.add('deleting');
        // Wait for the CSS fade/slide transition to finish
        itemElement.addEventListener('animationend', () => {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderTodos();
        });
    }
}

// Toggle Complete
function handleToggleComplete(id) {
    todos = todos.map(t => {
        if (t.id === id) {
            return { ...t, completed: !t.completed };
        }
        return t;
    });
    saveTodos();
    renderTodos();
}

// Enable Edit Mode
function handleEditMode(id) {
    todos = todos.map(t => {
        if (t.id === id) {
            return { ...t, isEditing: true };
        }
        return { ...t, isEditing: false }; // Auto-cancel other editing tasks
    });
    renderTodos();
    
    // Focus the editing input
    const editInput = document.querySelector(`[data-id="${id}"] .edit-input`);
    if (editInput) {
        editInput.focus();
        // Place cursor at the end of the text
        const val = editInput.value;
        editInput.value = '';
        editInput.value = val;
    }
}

// Save Edited Todo
function handleSaveEdit(id, newText) {
    const trimmed = newText.trim();
    if (!trimmed) {
        handleDeleteTodo(id);
        return;
    }
    
    todos = todos.map(t => {
        if (t.id === id) {
            return { ...t, text: trimmed, isEditing: false };
        }
        return t;
    });
    saveTodos();
    renderTodos();
}

// Cancel Edit Mode
function handleCancelEdit(id) {
    todos = todos.map(t => {
        if (t.id === id) {
            return { ...t, isEditing: false };
        }
        return t;
    });
    renderTodos();
}

// Render Todo Items
function renderTodos() {
    todoList.innerHTML = '';

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);

        if (todo.isEditing) {
            // Edit Mode Layout
            li.innerHTML = `
                <div class="todo-content-wrapper">
                    <input type="text" class="edit-input" value="${escapeHtml(todo.text)}">
                </div>
                <div class="todo-actions">
                    <button class="btn-action btn-save" aria-label="Save task">
                        <i data-lucide="check"></i>
                    </button>
                    <button class="btn-action btn-delete" aria-label="Cancel edit">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            `;

            // Event Listeners for Editing
            const editInput = li.querySelector('.edit-input');
            const saveBtn = li.querySelector('.btn-save');
            const cancelBtn = li.querySelector('.btn-delete'); // Uses delete class style for X

            saveBtn.addEventListener('click', () => handleSaveEdit(todo.id, editInput.value));
            cancelBtn.addEventListener('click', () => handleCancelEdit(todo.id));
            
            editInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleSaveEdit(todo.id, editInput.value);
                } else if (e.key === 'Escape') {
                    handleCancelEdit(todo.id);
                }
            });
        } else {
            // Normal Mode Layout
            li.innerHTML = `
                <div class="todo-content-wrapper">
                    <label class="checkbox-container">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                        <span class="custom-checkbox">
                            <i data-lucide="check"></i>
                        </span>
                    </label>
                    <span class="todo-text">${escapeHtml(todo.text)}</span>
                </div>
                <div class="todo-actions">
                    <button class="btn-action btn-edit" aria-label="Edit task">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-action btn-delete" aria-label="Delete task">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;

            // Event Listeners for Normal View
            const checkbox = li.querySelector('input[type="checkbox"]');
            const editBtn = li.querySelector('.btn-edit');
            const deleteBtn = li.querySelector('.btn-delete');

            checkbox.addEventListener('change', () => handleToggleComplete(todo.id));
            editBtn.addEventListener('click', () => handleEditMode(todo.id));
            deleteBtn.addEventListener('click', () => handleDeleteTodo(todo.id));
        }

        todoList.appendChild(li);
    });

    // Render stats
    updateStats();

    // Redraw Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Utility function to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
