document.addEventListener('DOMContentLoaded', function () {
  // Variable declarations and DOM element references
  let timer;
  let startTime = 0;
  let elapsedTime = 0; // Track total elapsed time for the active task
  let running = false;
  let activeTask = null;
  let taskCount = 0; // Counter for task numbers

  const timerElement = document.getElementById('timer');
  const toggleButton = document.getElementById('toggle-timer');
  const resetButton = document.getElementById('reset');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const addTaskButton = document.getElementById('add-task');
  const deleteAllTasksButton = document.getElementById('delete-all-tasks');
  const notificationElement = document.getElementById('notification');
  const totalTimeElement = document.getElementById('total-time');

  // **Modal elements for deleting all tasks**
  const deleteModal = document.getElementById('delete-modal');
  const confirmDeleteButton = document.getElementById('confirm-delete');
  const cancelDeleteButton = document.getElementById('cancel-delete');

  let taskData = {}; // Object to hold tasks

  // **Dark Mode Toggle**
  const darkModeSwitch = document.getElementById('dark-mode-switch');

  // Check if dark mode is enabled in localStorage
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeSwitch.checked = true; // Set the switch to ON position
  } else {
    document.body.classList.remove('dark-mode');
    darkModeSwitch.checked = false; // Set the switch to OFF position
  }

  darkModeSwitch.addEventListener('change', function () {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'enabled');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.removeItem('darkMode');
    }
  });

  // Initialize Sortable on the task list for drag-and-drop functionality
  const sortable = new Sortable(taskList, {
    animation: 150, // Smooth animation when dragging
    onEnd: function () {
      reorderTasks(); // Reorder taskData based on the new order
    },
  });

  // Load saved data when the page loads
  loadTasks();
  updateTotalTime(); // Update total time display on load

  updateDeleteAllButtonVisibility();

  if (Object.keys(taskData).length > 0) {
    activeTask = Object.keys(taskData)[0]; // Set the first task as active by default after reload
    elapsedTime = taskData[activeTask].timeSpent * 1000 || 0; // Load the saved time for the active task
    updateTimer(); // Update the timer display
    highlightSelectedTask(activeTask); // Highlight the first task
    toggleButton.disabled = false; // Enable the play/stop button
  }

  // Add Task Functionality with Button Animation
  addTaskButton.addEventListener('click', () => {
    createNewTask(taskInput.value.trim());

    // Add Task button animation
    addTaskButton.classList.add('button-pressed-task');
    setTimeout(() => {
      addTaskButton.classList.remove('button-pressed-task');
    }, 200); // Duration of the press effect
  });

  function createNewTask(taskName) {
    if (taskName && !(taskName in taskData)) {
      taskData[taskName] = { timeSpent: 0 }; // New task starts at 0
      addTask(taskName, true); // Pass 'true' to indicate it's a new task
      activeTask = taskName; // Automatically select the new task
      resetElapsedTime(); // Reset elapsed time to 0 for the new task
      updateTimer(); // Display 00:00:00.0
      highlightSelectedTask(taskName); // Highlight the new task
      taskInput.value = ''; // Clear input field after adding task
      saveTasks();

      updateDeleteAllButtonVisibility();

      clearInterval(timer); // Stop any running timer
      running = false;
      toggleButton.textContent = '▶'; // Set play button back to play icon
    } else {
      showNotification('Task name cannot be empty or duplicate.');
    }
  }

  // Start/Stop Timer with Button Animation
  toggleButton.addEventListener('click', () => {
    if (!activeTask) {
      createNewTask(`Project ${++taskCount}`);
    }
    if (!running) {
      startTimer();
    } else {
      stopTimer(); // animateButton defaults to true
    }
  });

  function startTimer() {
    running = true;
    toggleButton.textContent = '■'; // Change to stop icon
    startTime = Date.now() - elapsedTime; // Set start time
    timer = setInterval(() => {
      elapsedTime = Date.now() - startTime; // Calculate elapsed time
      updateTimer();
      if (activeTask) {
        taskData[activeTask].timeSpent = elapsedTime / 1000; // Update task time
        updateTaskTimeDisplay(activeTask, elapsedTime / 1000); // Live update task time
      }
      saveTasks(); // Save to localStorage
      updateTotalTime(); // Update total time display
    }, 100); // Update every 100ms
    toggleButton.classList.add('active'); // Add active class for styling
    hideNotification();

    // Play button animation
    toggleButton.classList.add('button-pressed');
    setTimeout(() => {
      toggleButton.classList.remove('button-pressed');
    }, 200); // Duration of the press effect
  }

  function stopTimer(animateButton = true) {
    clearInterval(timer);
    running = false;
    toggleButton.textContent = '▶'; // Change back to play icon
    toggleButton.classList.remove('active'); // Remove active class

    if (animateButton) {
      // Play button animation
      toggleButton.classList.add('button-pressed');
      setTimeout(() => {
        toggleButton.classList.remove('button-pressed');
      }, 200); // Duration of the press effect
    }
  }

  // Reset Button Functionality with Independent Animation
  resetButton.addEventListener('click', () => {
    if (activeTask) {
      stopTimer(false); // Stop any running timer without animating the play button
      resetElapsedTime(); // Reset elapsed time for current task
      taskData[activeTask].timeSpent = 0; // Reset task time to zero
      updateTimer();
      updateTaskTimeDisplay(activeTask, 0); // Update the current task's display
      saveTasks();
      updateTotalTime(); // Update total time for all tasks

      // Reset button animation
      resetButton.classList.add('button-pressed');
      setTimeout(() => {
        resetButton.classList.remove('button-pressed');
      }, 200); // Duration of the press effect
    } else {
      showNotification('No task selected to reset.');
    }
  });

  // Delete All Tasks Functionality Using Custom Modal
  deleteAllTasksButton.addEventListener('click', () => {
    openModal('delete-modal'); // Open custom delete confirmation modal

    // Delete All Tasks button animation
    deleteAllTasksButton.classList.add('button-pressed');
    setTimeout(() => {
      deleteAllTasksButton.classList.remove('button-pressed');
    }, 200); // Duration of the press effect
  });

  // Confirm Delete Action in Modal with Button Animation
  confirmDeleteButton.addEventListener('click', () => {
    const tasks = document.querySelectorAll('#task-list li');

    // Animate all tasks at once
    tasks.forEach((task) => {
      task.classList.add('removed');
    });

    setTimeout(() => {
      taskData = {}; // Clear task data
      taskList.innerHTML = ''; // Clear the task list in the UI
      stopTimer(false); // Stop any running timer without animating the play button
      resetElapsedTime(); // Reset elapsed time to 0
      updateTimer(); // Update the timer display to 00:00:00.0
      updateTotalTime(); // Update the total time display
      activeTask = null; // Clear the active task
      saveTasks(); // Save the cleared state to localStorage

      updateDeleteAllButtonVisibility();

      closeModal('delete-modal'); // Close modal after deleting
    }, 500); // Reduced delay to match the animation duration

    // Confirm Delete button animation
    confirmDeleteButton.classList.add('button-pressed');
    setTimeout(() => {
      confirmDeleteButton.classList.remove('button-pressed');
    }, 200);
  });

  // Cancel Delete Action in Modal with Button Animation
  cancelDeleteButton.addEventListener('click', () => {
    closeModal('delete-modal'); // Close the delete modal without deleting tasks

    // Cancel button animation
    cancelDeleteButton.classList.add('button-pressed');
    setTimeout(() => {
      cancelDeleteButton.classList.remove('button-pressed');
    }, 200);
  });

  // Event Listener for Selecting a Task
  taskList.addEventListener('click', (e) => {
    if (e.target.closest('li') && !e.target.classList.contains('delete-task')) {
      const selectedTask = e.target.closest('li').dataset.task;
      if (activeTask !== selectedTask) {
        activeTask = selectedTask;
        elapsedTime = taskData[selectedTask].timeSpent * 1000 || 0; // Load time for the selected task
        if (running) {
          startTime = Date.now() - elapsedTime; // Adjust start time for the new task
        }
        updateTimer(); // Update the timer with the new task's time
        highlightSelectedTask(selectedTask); // Highlight the selected task
        toggleButton.disabled = false; // Enable the play/stop button
      }
    }
  });

  // Event Listener for Deleting Tasks with Animation
  taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-task')) {
      const taskToDelete = e.target.closest('li').dataset.task;
      if (taskToDelete) {
        const taskElement = e.target.closest('li');

        // Animate task removal
        taskElement.classList.add('removed');

        let transitionEnded = false;

        // Listen for the transition to end before removing the element
        taskElement.addEventListener('transitionend', function handler(event) {
          if (event.propertyName === 'opacity' && event.target === taskElement) {
            transitionEnded = true;
            taskElement.remove();
            taskElement.removeEventListener('transitionend', handler);
            finalizeTaskDeletion(taskToDelete);
          }
        });

        // Fallback in case transitionend doesn't fire
        setTimeout(() => {
          if (!transitionEnded) {
            taskElement.remove();
            finalizeTaskDeletion(taskToDelete);
          }
        }, 600); // Slightly longer than the CSS transition duration
      }
    }
  });

  function finalizeTaskDeletion(taskToDelete) {
    if (running && activeTask === taskToDelete) {
      stopTimer(false); // Stop timer without animating the play button
      resetElapsedTime();
      updateTimer();
      toggleButton.disabled = true;
    }
    delete taskData[taskToDelete];
    updateTotalTime();

    updateDeleteAllButtonVisibility();

    if (activeTask === taskToDelete) {
      activeTask = null;
    }
    saveTasks();
  }

  // Editable Task Name (Inline Renaming)
  taskList.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('task-name')) {
      const taskItem = e.target.closest('li');
      const taskName = taskItem.dataset.task;
      const span = e.target;

      // Disable Sortable
      sortable.option('disabled', true);

      // Add editing class for styling
      taskItem.classList.add('editing');

      // Create Input for Editing Name
      const input = document.createElement('input');
      input.type = 'text';
      input.value = taskName;
      input.className = 'name-input task-name';

      span.replaceWith(input);
      input.focus();

      input.addEventListener('blur', () => {
        updateTaskName(input, taskItem);
        sortable.option('disabled', false);
        taskItem.classList.remove('editing');
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          updateTaskName(input, taskItem);
          sortable.option('disabled', false);
          taskItem.classList.remove('editing');
        }
      });
    }
  });

  function updateTaskName(input, taskItem) {
    const newTaskName = input.value.trim();
    const oldTaskName = taskItem.dataset.task;

    if (newTaskName && !(newTaskName in taskData)) {
      taskData[newTaskName] = taskData[oldTaskName];
      delete taskData[oldTaskName];
      taskItem.dataset.task = newTaskName;

      const newSpan = document.createElement('span');
      newSpan.className = 'task-name';
      newSpan.textContent = newTaskName;

      input.replaceWith(newSpan);

      if (activeTask === oldTaskName) {
        activeTask = newTaskName;
      }
      saveTasks();
    } else {
      showNotification('Task name already exists or is invalid.');
      const originalSpan = document.createElement('span');
      originalSpan.className = 'task-name';
      originalSpan.textContent = oldTaskName;
      input.replaceWith(originalSpan);
    }
  }

  // Editable Task Time with Visual Feedback
  taskList.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('task-time')) {
      const taskItem = e.target.closest('li');
      const taskName = taskItem.dataset.task;
      const span = e.target;

      // Disable Sortable
      sortable.option('disabled', true);

      // Add editing class for styling
      taskItem.classList.add('editing-time');

      // Create Input for Editing Time
      const input = document.createElement('input');
      input.type = 'text';
      input.value = span.textContent;
      input.className = 'time-input task-time';

      span.replaceWith(input);
      input.focus();

      input.addEventListener('blur', () => {
        updateTaskTime(input, taskName, taskItem);
        sortable.option('disabled', false);
        taskItem.classList.remove('editing-time');
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          updateTaskTime(input, taskName, taskItem);
          sortable.option('disabled', false);
          taskItem.classList.remove('editing-time');
        }
      });
    }
  });

  function updateTaskTime(input, taskName, taskItem) {
    const newTime = input.value.trim();
    const timeParts = newTime.split(':');
    if (timeParts.length === 3) {
      const [hours, minutes, seconds] = timeParts.map(Number);
      if (
        !isNaN(hours) &&
        hours >= 0 &&
        !isNaN(minutes) &&
        minutes >= 0 &&
        minutes < 60 &&
        !isNaN(seconds) &&
        seconds >= 0 &&
        seconds < 60
      ) {
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        taskData[taskName].timeSpent = totalSeconds;
        updateTaskTimeDisplay(taskName, totalSeconds);
        saveTasks();
        updateTotalTime();

        if (activeTask === taskName) {
          elapsedTime = totalSeconds * 1000;
          if (running) {
            startTime = Date.now() - elapsedTime; // Adjust start time
          }
          updateTimer();
        }

        const newSpan = document.createElement('span');
        newSpan.className = 'task-time';
        newSpan.textContent = formatTime(totalSeconds);

        input.replaceWith(newSpan);
      } else {
        showNotification('Invalid time format. Please use HH:MM:SS.');
        const originalSpan = document.createElement('span');
        originalSpan.className = 'task-time';
        originalSpan.textContent = formatTime(taskData[taskName].timeSpent);
        input.replaceWith(originalSpan);
      }
    } else {
      showNotification('Invalid time format. Please use HH:MM:SS.');
      const originalSpan = document.createElement('span');
      originalSpan.className = 'task-time';
      originalSpan.textContent = formatTime(taskData[taskName].timeSpent);
      input.replaceWith(originalSpan);
    }
  }

  function resetElapsedTime() {
    elapsedTime = 0;
  }

  function updateTimer() {
    const totalSeconds = elapsedTime / 1000;
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
    const ms = String(Math.floor((elapsedTime % 1000) / 100));
    timerElement.textContent = `${hours}:${minutes}:${seconds}.${ms}`;
  }

  function updateTaskTimeDisplay(taskName, timeSpent) {
    const taskItem = document.querySelector(`li[data-task="${taskName}"] .task-time`);
    if (taskItem) {
      taskItem.textContent = formatTime(timeSpent);
    }
  }

  function updateTotalTime() {
    const totalTime = Object.values(taskData).reduce(
      (total, task) => total + (task.timeSpent || 0),
      0
    );
    totalTimeElement.textContent = `${formatTime(totalTime)}`;
  }

  function formatTime(timeInSeconds) {
    const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(Math.floor(timeInSeconds % 60)).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(taskData));
  }

  function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      taskData = JSON.parse(savedTasks);
      for (const task in taskData) {
        addTask(task, false);
      }

      updateDeleteAllButtonVisibility();
    }
  }

  function addTask(taskName, isNew) {
    const li = document.createElement('li');
    li.dataset.task = taskName;

    if (isNew) {
      li.classList.add('new-task');
    }

    li.innerHTML = `
      <span class="task-name">${taskName}</span>
      <span class="task-time">${formatTime(taskData[taskName].timeSpent || 0)}</span>
      <button class="delete-task">Delete</button>
    `;
    taskList.appendChild(li);

    if (isNew) {
      // Force reflow
      void li.offsetWidth;

      li.classList.remove('new-task');
      li.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function highlightSelectedTask(selectedTask) {
    Array.from(taskList.children).forEach((li) => {
      li.classList.remove('selected-task');
    });
    const selectedLi = document.querySelector(`li[data-task="${selectedTask}"]`);
    if (selectedLi) {
      selectedLi.classList.add('selected-task');
    }
  }

  function showNotification(message) {
    notificationElement.textContent = message;
    notificationElement.style.display = 'block';

    // Fade out notification after 3 seconds
    setTimeout(() => {
      hideNotification();
    }, 3000);
  }

  function hideNotification() {
    notificationElement.style.opacity = '1';
    notificationElement.style.transition = 'opacity 0.5s ease';
    notificationElement.style.opacity = '0';
    setTimeout(() => {
      notificationElement.style.display = 'none';
      notificationElement.style.opacity = '1';
    }, 500);
  }

  // Open and Close Modals (if you have modals for confirmation)
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';

    // Fade in modal
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.transition = 'opacity 0.3s ease';
      modal.style.opacity = '1';
    }, 10);
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.opacity = '1';
    modal.style.transition = 'opacity 0.3s ease';
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }

  function reorderTasks() {
    const reorderedTasks = {};
    document.querySelectorAll('#task-list li').forEach((li) => {
      const taskName = li.dataset.task;
      reorderedTasks[taskName] = taskData[taskName]; // Keep task data in the new order
    });
    taskData = reorderedTasks;
    saveTasks();
  }

  function updateDeleteAllButtonVisibility() {
    const numberOfTasks = Object.keys(taskData).length;

    if (numberOfTasks > 2) {
      deleteAllTasksButton.style.display = 'block';
    } else {
      deleteAllTasksButton.style.display = 'none';
    }
  }
});
