var $$addTodo = document.getElementById('add-todo');
var $$todosContainer = document.getElementById('todos-container');
var collection = {};
var socket;

function initSocketIo () {
	socket = io();

	socket.on('connect', function () {
		console.log('connected', socket.id);
		$$todosContainer.innerHTML = '';
		fetchTodos();
	});

	socket.on('todo:updated', function (todo) {
		console.log('todo:updated', todo);
		collection[todo._id] = todo;
		var container = document.getElementById(todo._id);
		container.querySelector('.todo-text').value = todo.text;
		container.querySelector('.todo-done').checked = todo.done;
	});

	socket.on('todo:deleted', function (todoId) {
		console.log('todo:deleted', todoId);
		delete collection[todoId];
		document.getElementById(todoId).remove();
	});

	socket.on('todo:added', function (todo) {
		console.log('todo:added', todo);
		collection[todo._id] = todo;
		$$todosContainer.appendChild(renderTodo(todo));
	});
}

function checkStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
	return response.json().then(Promise.reject.bind(Promise));
  }
}

function json (response) {
	if (response.ok) {
		return response.json();
	}
}

function resetCollection (todos) {
	collection = {};
	for (let i = 0; i < todos.length; i++) {
		collection[todos[i]._id] = todos[i];
	}
}

function fetchTodos () {
	fetch('/api/todos')
	.then(json)
	.then(function (todos) {
		resetCollection(todos);
		renderTodos(todos);
	});
}


bindEventListeners();
initSocketIo();

function renderTodos (todos) {
	for (let i = 0; i < todos.length; i++){
		$$todosContainer.appendChild(renderTodo(todos[i]));
	}
}

function renderTodo(todo = {}){
	var $todoContainer = document.createElement('div');
	$todoContainer.className = 'todo-container';

	if (todo._id){
		$todoContainer.id = todo._id

		var $todoId = document.createElement('span');
		$todoId.innerText = todo._id;
		$todoContainer.appendChild($todoId);
	}

	var $todoDone = document.createElement('input');
	$todoDone.type = 'checkbox';
	$todoDone.checked = todo.done || false;
	$todoDone.className = 'todo-done';
	$todoContainer.appendChild($todoDone);

	var $todoText = document.createElement('input');
	$todoText.value = todo.text || '';
	$todoText.className = 'todo-text'
	$todoContainer.appendChild($todoText);

	var $saveTodoButton = document.createElement('button');
	$saveTodoButton.innerText = 'Save';
	$saveTodoButton.className = 'save-todo'
	$todoContainer.appendChild($saveTodoButton);

	var $deleteTodoButton = document.createElement('button');
	$deleteTodoButton.innerText = 'Delete';
	$deleteTodoButton.className = 'delete-todo'
	$todoContainer.appendChild($deleteTodoButton);
	return $todoContainer;
}


function bindEventListeners(){

	$$addTodo.addEventListener('click', function(){
		$$todosContainer.appendChild(renderTodo());
	});

	document.addEventListener('click', function (event) {
		if (event.target.className === 'save-todo') {
			var todoContainer = event.target.parentNode;

			let todo = {
				id: todoContainer.id,
				text: todoContainer.querySelector('.todo-text').value,
				done: todoContainer.querySelector('.todo-done').checked
			};

			if (todo.id) {
				sendEditTodoReq(todo)
				.then(checkStatus)
				.then(json)
				.then(function (updatedTodo) {
					collection[updatedTodo._id] = updatedTodo;
				})
				.catch(function (response) {
					var prev = collection[todo.id];
					todoContainer.querySelector('.todo-text').value = prev.text;
					todoContainer.querySelector('.todo-done').checked = prev.done;
					if (response.error) {
						alert(response.error.message);
					}
				});
			} else {
				sendCreateTodoReq(todo)
				.then(checkStatus)
				.then(json)
				.catch(function (response) {
					if (response.error) {
						alert(response.error.message);
					}
				});
				todoContainer.remove();
			}
		} else if (event.target.className === 'delete-todo') {
			var todoContainer = event.target.parentNode;
			var id = todoContainer.id;
			
			sendDeleteTodoReq(id);
		}
	});

}

function sendEditTodoReq (todo) {
	return fetch('/api/todos/' + todo.id, {
		method: 'PUT',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			text: todo.text,
			done: todo.done
		})
	});
}

function sendDeleteTodoReq (id) {
	return fetch('/api/todos/' + id, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

function sendCreateTodoReq (todo) {
	return fetch('/api/todos/', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			text: todo.text,
			done: todo.done
		})
	});
}